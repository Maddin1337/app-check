"""Stage 2 (iOS): metadata and daily counters via the official iTunes Lookup API.

One request covers up to 200 IDs. Apple documents roughly 20 calls per minute, which is
still ~5.7 million app lookups per day from a single IP, so the whole catalog refreshes
daily. Every refresh updates `apps` and writes the day's row in `app_metrics_daily`
(ratings are per storefront). Apps missing from the storefront become 'not_found' and can
be retried in another storefront with --missing.
"""

import json
import sys
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime, timezone

import psycopg

from . import db
from .http import FetchError, RateLimiter, fetch
from .tiers import interval_sql

LOOKUP = "https://itunes.apple.com/lookup?id={ids}&country={country}&entity=software"
BATCH = 200


def _date(value: str | None):
    return datetime.fromisoformat(value.replace("Z", "+00:00")) if value else None


def app_fields(result: dict) -> dict:
    released = _date(result.get("releaseDate"))
    return {
        "name": result.get("trackName"),
        "developer_id": str(result["artistId"]) if result.get("artistId") else None,
        "developer_name": result.get("artistName"),
        "category_id": str(result["primaryGenreId"]) if result.get("primaryGenreId") else None,
        "category": result.get("primaryGenreName"),
        "genre_ids": result.get("genreIds") or None,
        "price": result.get("price"),
        "currency": result.get("currency"),
        "rating_avg": result.get("averageUserRating"),
        "rating_count": result.get("userRatingCount"),
        "released_at": released.date() if released else None,
        "store_updated_at": _date(result.get("currentVersionReleaseDate")),
        "version": result.get("version"),
        "content_rating": result.get("contentAdvisoryRating"),
        "icon_url": result.get("artworkUrl512"),
        "bundle_id": result.get("bundleId"),
        "seller_name": result.get("sellerName"),
        "size_bytes": int(result["fileSizeBytes"]) if result.get("fileSizeBytes") else None,
        "min_os": result.get("minimumOsVersion"),
        "languages": result.get("languageCodesISO2A") or None,
    }


def _lookup(ids: list[str], country: str, limiter: RateLimiter) -> list[dict]:
    status, body = fetch(LOOKUP.format(ids=",".join(ids), country=country), limiter)
    if status != 200:
        raise FetchError("lookup", f"HTTP {status}")
    return [r for r in json.loads(body).get("results", []) if r.get("wrapperType") == "software"]


def due_ids(connection: psycopg.Connection, country: str, missing: bool, limit: int | None) -> list[tuple[str, str]]:
    """(storefront, store_id) of due apps.

    Normal runs take this storefront's apps (apps found elsewhere refresh in their own storefront's
    run). --missing retries due not-found apps in the storefront where they last charted, else `country`.
    """
    if missing:
        query = """SELECT COALESCE((SELECT c.country FROM chart_ranks c WHERE c.app_id = a.id
                                    ORDER BY c.captured_on DESC LIMIT 1), %s), a.store_id
                   FROM apps a WHERE a.platform = 'ios' AND a.status = 'not_found'
                     -- includes apps the storefront run just missed (due again tomorrow)
                     AND (a.next_refresh_at IS NULL OR a.next_refresh_at <= now() + interval '1 day')
                   ORDER BY a.tier LIMIT %s"""
        params = (country, limit)
    else:
        query = """SELECT %s, store_id FROM apps
                   WHERE platform = 'ios' AND status <> 'not_found' AND COALESCE(refresh_country, %s) = %s
                     AND (next_refresh_at IS NULL OR next_refresh_at <= now())
                   ORDER BY next_refresh_at NULLS FIRST, tier LIMIT %s"""
        params = (country, country, country, limit)
    return connection.execute(query, params).fetchall()


def store_batch(connection: psycopg.Connection, batch: list[str], results: list[dict], country: str) -> int:
    today = datetime.now(timezone.utc).date()
    found = {str(r["trackId"]): r for r in results}
    columns = list(app_fields({}).keys())
    assignments = ", ".join(f"{c} = %({c})s" for c in columns)
    with connection.cursor() as cursor:
        cursor.executemany(
            f"""UPDATE apps SET {assignments}, status = 'active', refreshed_at = now(), refresh_country = %(country)s,
                  next_refresh_at = now() + {interval_sql('ios')}
                WHERE platform = 'ios' AND store_id = %(store_id)s""",
            [{**app_fields(r), "country": country, "store_id": store_id} for store_id, r in found.items()],
        )
        missing = [i for i in batch if i not in found]
        cursor.execute(
            f"""UPDATE apps SET status = CASE WHEN status = 'pending' OR refresh_country = %s THEN 'not_found' ELSE status END,
                  refreshed_at = now(), next_refresh_at = now() + {interval_sql('ios')}
                WHERE platform = 'ios' AND store_id = ANY(%s)""",
            (country, missing),
        )
        ids = db.app_ids(connection, "ios", list(found))
        cursor.executemany(
            """INSERT INTO app_metrics_daily (day, app_id, country, rating_count, rating_avg, price, version, fetched_at)
               VALUES (%s, %s, %s, %s, %s, %s, %s, now())
               ON CONFLICT (app_id, country, day) DO UPDATE SET
                 rating_count = excluded.rating_count, rating_avg = excluded.rating_avg,
                 price = excluded.price, version = excluded.version, fetched_at = excluded.fetched_at""",
            [
                (today, ids[i], country, r.get("userRatingCount"), r.get("averageUserRating"), r.get("price"), r.get("version"))
                for i, r in found.items()
            ],
        )
    connection.commit()
    return len(found)


def refresh_ios(
    connection: psycopg.Connection, country: str, rate: float, workers: int, limit: int | None, missing: bool
) -> None:
    db.ensure_month_partition(connection, "app_metrics_daily", datetime.now(timezone.utc).date())
    due = due_ids(connection, country, missing, limit)
    by_country: dict[str, list[str]] = {}
    for storefront, store_id in due:
        by_country.setdefault(storefront, []).append(store_id)
    jobs = [(c, ids[i : i + BATCH]) for c, ids in by_country.items() for i in range(0, len(ids), BATCH)]
    print(f"ios: {len(due):,} apps due in {len(jobs):,} lookup requests ({', '.join(sorted(by_country))})",
          file=sys.stderr)

    limiter = RateLimiter(rate)
    found_total = done = 0
    with ThreadPoolExecutor(max_workers=workers) as pool:
        futures = {pool.submit(_lookup, batch, storefront, limiter): (storefront, batch) for storefront, batch in jobs}
        for future in as_completed(futures):
            storefront, batch = futures[future]
            try:
                results = future.result()
            except FetchError as failure:
                print(f"lookup failed ({failure.reason}), batch stays due", file=sys.stderr)
                continue
            found_total += store_batch(connection, batch, results, storefront)
            done += 1
            if done % 10 == 0 or done == len(jobs):
                print(f"ios: {done}/{len(jobs)} requests, {found_total:,} apps found", file=sys.stderr)
