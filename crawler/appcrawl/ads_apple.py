"""Apple Search Ads in the EU from Apple's public Ad Repository API (docs/research/05-ads-videos-onboardings.md §2.5).

https://adrepository.apple.com/api/v1/ad-repository-ads lists the App Store ads Apple delivered in 25 EU storefronts in
the last 90 days, with the advertised app's ID, placement, format, first and last impression and the creative's assets.
Apple offers the API "for large volume queries"; robots.txt only disallows the /ads web pages. Data lag about 7 days,
so each app is asked about once a week: apps with an estimate or a chart place first, the most valuable first.
"""

import json
import sys
import urllib.parse
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime, timezone

import psycopg

from .http import FetchError, RateLimiter, fetch

API = "https://adrepository.apple.com/api/v1/ad-repository-ads"
PAGE_SIZE = 100
REFETCH_DAYS = 7
HEADERS = {"Accept": "application/json"}  # Apple rejects the default */*


def _date(value: str | None):
    return datetime.strptime(value[:10], "%Y-%m-%d").date() if value else None


def parse_ad(ad: dict) -> dict:
    assets = [
        {k: asset.get(k) for k in ("pictureUrl", "videoUrl", "width", "height", "orientation") if asset.get(k)}
        for asset in ad.get("adAssets") or []
    ]
    return {
        "ad_id": ad["adId"],
        "country": ad.get("countryOrRegion") or "",
        "store_id": str(ad["appId"]),
        "placement": ad.get("placement"),
        "format": ad.get("format"),
        "first_impression": _date(ad.get("firstImpressionDate")),
        "last_impression": _date(ad.get("lastImpressionDate")),
        "language": ad.get("defaultLanguageTag"),
        "audience": json.dumps(ad.get("audienceRefinement")),
        "assets": json.dumps([a for a in assets if a]),
    }


def app_ads(store_id: str, limiter: RateLimiter) -> tuple[list[dict], str | None]:
    """All ads of one app in the last 90 days, following the pagination; (ads, dataEndDate)."""
    ads, page_index, data_end = [], 0, None
    while True:
        # `offset` is a page number, not an item offset (offset=1 returns items 100-199 at limit 100).
        query = urllib.parse.urlencode(
            {"ql": f"type==APP;id=={store_id};datePreset==LAST_90_DAYS", "offset": page_index, "limit": PAGE_SIZE},
            safe="=;,()",
        )
        status, body = fetch(f"{API}?{query}", limiter, headers=HEADERS)
        if status != 200:
            raise FetchError(store_id, f"HTTP {status}")
        page = json.loads(body)
        data_end = page.get("dataEndDate")
        ads += [parse_ad(ad) for ad in page.get("data") or []]
        total = (page.get("pagination") or {}).get("totalResults") or 0
        page_index += 1
        if page_index * PAGE_SIZE >= total or not page.get("data"):
            return ads, data_end


def store_app_ads(connection: psycopg.Connection, app_id: int, ads: list[dict], data_end: str | None) -> None:
    connection.execute("DELETE FROM apple_ads WHERE app_id = %s", (app_id,))  # the API returns the full 90-day window
    with connection.cursor() as cursor:
        cursor.executemany(
            """INSERT INTO apple_ads (ad_id, country, app_id, placement, format, first_impression, last_impression,
                                      language, audience, assets, fetched_at)
               VALUES (%(ad_id)s, %(country)s, %(app_id)s, %(placement)s, %(format)s, %(first_impression)s,
                       %(last_impression)s, %(language)s, %(audience)s, %(assets)s, now())
               ON CONFLICT (ad_id, country) DO NOTHING""",
            [{**ad, "app_id": app_id} for ad in ads],
        )
    connection.execute(
        """INSERT INTO apple_ads_fetch (app_id, fetched_at, ads, data_end) VALUES (%s, now(), %s, %s)
           ON CONFLICT (app_id) DO UPDATE SET fetched_at = excluded.fetched_at, ads = excluded.ads,
             data_end = excluded.data_end""",
        (app_id, len(ads), _date(data_end)),
    )
    connection.commit()


def due_apps(connection: psycopg.Connection, limit: int) -> list[tuple[int, str]]:
    return connection.execute(
        f"""SELECT a.id, a.store_id FROM apps a
            LEFT JOIN apple_ads_fetch f ON f.app_id = a.id
            LEFT JOIN app_estimates_daily e ON e.app_id = a.id AND e.day = (SELECT MAX(day) FROM app_estimates_daily)
            LEFT JOIN app_chart_summary s ON s.app_id = a.id
            WHERE a.platform = 'ios' AND (e.app_id IS NOT NULL OR s.app_id IS NOT NULL)
              AND (f.fetched_at IS NULL OR f.fetched_at < now() - interval '{REFETCH_DAYS} days')
            ORDER BY f.fetched_at NULLS FIRST, e.revenue_p50 DESC NULLS LAST, s.best_rank NULLS LAST
            LIMIT %s""",
        (limit,),
    ).fetchall()


def refresh_apple_ads(connection: psycopg.Connection, rate: float, workers: int, limit: int) -> None:
    apps = due_apps(connection, limit)
    print(f"apple ads: {len(apps):,} apps due", file=sys.stderr)
    limiter = RateLimiter(rate)
    done = failed = with_ads = ads_total = 0
    with ThreadPoolExecutor(max_workers=workers) as pool:
        futures = {pool.submit(app_ads, store_id, limiter): (app_id, store_id) for app_id, store_id in apps}
        for future in as_completed(futures):
            app_id, store_id = futures.pop(future)
            try:
                ads, data_end = future.result()
            except (FetchError, ValueError, KeyError) as failure:
                print(f"apple ads {store_id}: {failure!r}", file=sys.stderr)
                failed += 1
                continue
            store_app_ads(connection, app_id, ads, data_end)
            done += 1
            with_ads += bool(ads)
            ads_total += len(ads)
            if done % 250 == 0:
                print(f"apple ads: {done:,}/{len(apps):,} apps, {with_ads:,} advertising, {ads_total:,} ads, "
                      f"{failed} failed", file=sys.stderr)
    print(f"apple ads: {done:,}/{len(apps):,} apps, {with_ads:,} advertising, {ads_total:,} ads, {failed} failed "
          f"({datetime.now(timezone.utc):%H:%M} UTC)", file=sys.stderr)
