"""Stage 2 (Android): metadata and daily counters from each app's Play detail page.

The detail page (/store/apps/details, allowed by Play's robots.txt) embeds the exact
install counter next to the public bucket. Its daily difference measures downloads, which
is why Android needs no chart ranks. One HTML request per app makes this the slow part:
keep the rate low per IP, let the tiers decide what is due, and spread a full pass over
days or several egress IPs (docs/research/03-datenbank-aufbau.md §4.7).

Parsing reuses google-play-scraper's maintained field map; fetching stays ours.
"""

import ssl
import sys
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime, timezone
from urllib.parse import urlparse

import psycopg

from . import db
from .http import FetchError, RateLimiter, fetch
from .tiers import interval_sql

DETAIL = "https://play.google.com/store/apps/details?id={package}&hl=en&gl={country}"


def _parser():
    try:
        from google_play_scraper.features.app import parse_dom
    except ImportError:
        sys.exit("refresh-android needs: pip install google-play-scraper")
    # google-play-scraper disables TLS verification process-wide on import. Restore it:
    # we never use its network code, only parse_dom.
    ssl._create_default_https_context = ssl.create_default_context
    return parse_dom


def _domain(url: str | None) -> str | None:
    if not url:
        return None
    host = urlparse(url if "://" in url else f"https://{url}").hostname or ""
    return host.removeprefix("www.") or None


def _released(value: str | None):
    try:
        return datetime.strptime(value, "%b %d, %Y").date() if value else None
    except ValueError:
        return None


def _bool(value):
    return None if value is None else bool(value)


def app_fields(d: dict) -> dict:
    updated = d.get("updated")
    return {
        "name": d.get("title"),
        "developer_id": d.get("developerId"),
        "developer_name": d.get("developer"),
        "developer_domain": _domain(d.get("developerWebsite")),  # no e-mail/address: GDPR minimisation
        "category_id": d.get("genreId"),
        "category": d.get("genre"),
        "price": d.get("price"),
        "currency": d.get("currency"),
        "rating_avg": d.get("score"),
        "rating_count": d.get("ratings"),
        "released_at": _released(d.get("released")),
        "store_updated_at": datetime.fromtimestamp(updated, timezone.utc) if updated else None,
        "version": d.get("version"),
        "content_rating": d.get("contentRating"),
        "icon_url": d.get("icon"),
        "installs_bucket": d.get("minInstalls"),
        "installs_exact": d.get("realInstalls"),
        "review_count": d.get("reviews"),
        "offers_iap": _bool(d.get("offersIAP")),
        "iap_price_range": d.get("inAppProductPrice"),
        "contains_ads": _bool(d.get("containsAds")),
    }


def _details(package: str, country: str, limiter: RateLimiter, parse_dom) -> dict | None:
    url = DETAIL.format(package=package, country=country)
    status, body = fetch(url, limiter)
    if status != 200:
        return None
    return parse_dom(dom=body.decode("utf-8", "replace"), app_id=package, url=url)


def store_result(connection: psycopg.Connection, package: str, details: dict | None, status: str, country: str) -> None:
    interval = interval_sql("android")
    if details:
        fields = app_fields(details)
        assignments = ", ".join(f"{c} = %({c})s" for c in fields)
        connection.execute(
            f"""UPDATE apps SET {assignments}, status = 'active', refreshed_at = now(), refresh_country = %(country)s,
                  next_refresh_at = now() + {interval}
                WHERE platform = 'android' AND store_id = %(package)s""",
            {**fields, "country": country, "package": package},
        )
        connection.execute(
            """INSERT INTO app_metrics_daily
                 (day, app_id, country, rating_count, rating_avg, installs_exact, installs_bucket, review_count,
                  price, version, fetched_at)
               SELECT current_date, id, 'ww', %s, %s, %s, %s, %s, %s, %s, now()
               FROM apps WHERE platform = 'android' AND store_id = %s
               ON CONFLICT (app_id, country, day) DO UPDATE SET
                 rating_count = excluded.rating_count, rating_avg = excluded.rating_avg,
                 installs_exact = excluded.installs_exact, installs_bucket = excluded.installs_bucket,
                 review_count = excluded.review_count, price = excluded.price, version = excluded.version,
                 fetched_at = excluded.fetched_at""",
            (fields["rating_count"], fields["rating_avg"], fields["installs_exact"], fields["installs_bucket"],
             fields["review_count"], fields["price"], fields["version"], package),
        )
    else:
        # Errors retry within the hour; a missing app waits out the dead-tier interval.
        connection.execute(
            f"""UPDATE apps SET status = CASE WHEN %s = 'error' AND status = 'active' THEN status ELSE %s END,
                  refreshed_at = now(),
                  next_refresh_at = CASE WHEN %s = 'error' THEN now() + interval '1 hour' ELSE now() + {interval} END
                WHERE platform = 'android' AND store_id = %s""",
            (status, status, status, package),
        )
    connection.commit()


def refresh_android(connection: psycopg.Connection, country: str, rate: float, workers: int, limit: int | None) -> None:
    parse_dom = _parser()
    db.ensure_month_partition(connection, "app_metrics_daily", datetime.now(timezone.utc).date())
    packages = [
        store_id
        for (store_id,) in connection.execute(
            "SELECT store_id FROM apps WHERE platform = 'android' "
            "AND (next_refresh_at IS NULL OR next_refresh_at <= now()) "
            "ORDER BY next_refresh_at NULLS FIRST, tier LIMIT %s",
            (limit,),
        )
    ]
    print(f"android: {len(packages):,} detail pages due (country={country})", file=sys.stderr)

    limiter = RateLimiter(rate)
    found = done = 0
    with ThreadPoolExecutor(max_workers=workers) as pool:
        futures = {pool.submit(_details, p, country, limiter, parse_dom): p for p in packages}
        for future in as_completed(futures):
            package = futures[future]
            try:
                details = future.result()
                status = "active" if details else "not_found"
            except FetchError as failure:
                print(f"{package}: {failure.reason}", file=sys.stderr)
                details, status = None, "error"
            except Exception as failure:  # a page the parser cannot read must not stop the run
                print(f"{package}: parse error {failure!r}", file=sys.stderr)
                details, status = None, "error"
            store_result(connection, package, details, status, country)
            found += bool(details)
            done += 1
            if done % 50 == 0 or done == len(packages):
                print(f"android: {done}/{len(packages)} pages, {found:,} apps parsed", file=sys.stderr)
