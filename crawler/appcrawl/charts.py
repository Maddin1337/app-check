"""Daily chart snapshots: the time series that ranks-based estimates need from day one.

iOS: the App Store's own chart pages (listed in its chart sitemap, allowed by robots.txt)
carry Top Free and Top Paid, 200 deep, per storefront, device and genre.

Top Grossing only exists in the legacy iTunes RSS feeds (100 deep). itunes.apple.com's
robots.txt disallows /*/rss/*; the project owner decided on 26.10.2026 to collect the feed
anyway (once a day, --grossing-rss) while the legal review in
docs/research/07-architektur-roadmap.md §9 is pending. --grossing-only reads just the feeds.

Android has no chart lists outside the robots-disallowed batchexecute endpoint; its exact
install counters (refresh-android) measure downloads directly instead.
"""

import json
import re
import sys
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime, timezone

import psycopg

from . import db
from .discover import child_sitemaps, parse_locs
from .http import FetchError, RateLimiter, fetch

# Largest App Store markets first; --countries all takes every storefront in the chart sitemap.
DEFAULT_COUNTRIES = (
    "us,gb,de,fr,jp,kr,cn,ca,au,it,es,nl,se,no,dk,fi,ch,at,be,ie,"
    "pt,pl,br,mx,in,id,th,vn,ph,my,sg,tw,hk,tr,sa,ae,il,za,nz,cz"
).split(",")

CHART_URL = re.compile(rb"^https://apps\.apple\.com/([a-z]{2})/(iphone|ipad|mac)/charts/(\d+)(?:\?.*)?$")
SERVER_DATA = re.compile(rb'<script type="application/json" id="serialized-server-data">(.*?)</script>', re.S)
RSS = "https://itunes.apple.com/{country}/rss/topgrossing{ipad}applications/limit=100{genre}/json"
ALL_APPS = "36"


def chart_targets(limiter: RateLimiter, countries: list[str] | None, devices: list[str]) -> list[tuple[str, str, str]]:
    """(country, device, genre) for every chart page Apple lists, filtered."""
    targets = set()
    for url in child_sitemaps("ios", ("chart",), limiter):
        status, body = fetch(url, limiter)
        if status != 200:
            raise FetchError(url, f"HTTP {status}")
        for loc in parse_locs(body):
            match = CHART_URL.match(loc)
            if match:
                targets.add(tuple(part.decode() for part in match.groups()))
    return sorted(
        t for t in targets if (countries is None or t[0] in countries) and t[1] in devices
    )


def parse_chart_page(body: bytes) -> dict[str, list[tuple[str, str | None]]]:
    """chart -> [(adamId, title or None), …] in rank order, from serialized-server-data."""
    match = SERVER_DATA.search(body)
    if not match:
        return {}
    data = json.loads(match.group(1))
    page = data["data"][0]["data"]
    charts = {}
    for segment in page.get("segments", []):
        ranked = [
            (str(item["adamId"]), item.get("title"))
            for shelf in segment.get("shelves", [])
            for item in shelf.get("items", [])
            if item.get("adamId")
        ]
        ranked += [(str(r["id"]), None) for r in (segment.get("nextPage") or {}).get("remainingContent", [])]
        charts[segment["chart"]] = ranked
    return charts


def parse_grossing_rss(body: bytes) -> list[tuple[str, str | None]]:
    entries = json.loads(body).get("feed", {}).get("entry", [])
    if isinstance(entries, dict):  # a feed with one entry is not a list
        entries = [entries]
    return [(e["id"]["attributes"]["im:id"], e.get("im:name", {}).get("label")) for e in entries]


def _fetch_target(target, limiter: RateLimiter, grossing_rss: bool, grossing_only: bool = False) -> dict:
    country, device, genre = target
    charts = {}
    if not grossing_only:
        status, body = fetch(f"https://apps.apple.com/{country}/{device}/charts/{genre}", limiter)
        charts = {c: (r, "apple_web") for c, r in parse_chart_page(body).items()} if status == 200 else {}
    if grossing_rss and device in ("iphone", "ipad"):
        url = RSS.format(
            country=country, ipad="ipad" if device == "ipad" else "", genre="" if genre == ALL_APPS else f"/genre={genre}"
        )
        status, body = fetch(url, limiter)
        if status == 200:
            charts["top-grossing"] = (parse_grossing_rss(body), "apple_rss")
    return charts


def store_charts(connection: psycopg.Connection, target, charts: dict) -> int:
    country, device, genre = target
    ranked_apps = {app: title for ranked, _ in charts.values() for app, title in ranked}
    db.upsert_app_keys(connection, "ios", "chart", {app: (None, title) for app, title in ranked_apps.items()})
    ids = db.app_ids(connection, "ios", list(ranked_apps))
    rows = [
        (country, device, chart, genre, rank, ids[app], source)
        for chart, (ranked, source) in charts.items()
        for rank, (app, _) in enumerate(ranked, start=1)
    ]
    with connection.cursor() as cursor:
        cursor.executemany(
            """INSERT INTO chart_ranks (captured_on, captured_at, platform, country, device, chart, genre_id, rank, app_id, source)
               VALUES (current_date, now(), 'ios', %s, %s, %s, %s, %s, %s, %s)
               ON CONFLICT (captured_on, platform, country, device, chart, genre_id, rank) DO UPDATE SET
                 app_id = excluded.app_id, captured_at = excluded.captured_at, source = excluded.source""",
            rows,
        )
    connection.commit()
    return len(rows)


def collect_charts(
    connection: psycopg.Connection,
    countries: list[str] | None,
    devices: list[str],
    rate: float,
    workers: int,
    grossing_rss: bool,
    limit: int | None,
    grossing_only: bool = False,
) -> None:
    grossing_rss = grossing_rss or grossing_only
    if grossing_rss:
        print("note: --grossing-rss reads itunes.apple.com/*/rss/*, which its robots.txt disallows", file=sys.stderr)
    db.ensure_month_partition(connection, "chart_ranks", datetime.now(timezone.utc).date())
    limiter = RateLimiter(rate)
    targets = chart_targets(limiter, countries, devices)
    if grossing_only:  # the feeds exist for iPhone and iPad only
        targets = [t for t in targets if t[1] in ("iphone", "ipad")]
    targets = targets[:limit]
    print(f"charts: {len(targets)} chart pages ({len(set(t[0] for t in targets))} storefronts)", file=sys.stderr)

    rows = done = failed = 0
    with ThreadPoolExecutor(max_workers=workers) as pool:
        futures = {pool.submit(_fetch_target, t, limiter, grossing_rss, grossing_only): t for t in targets}
        for future in as_completed(futures):
            target = futures[future]
            try:
                charts = future.result()
            except (FetchError, ValueError, KeyError) as failure:
                print(f"{'/'.join(target)}: {failure!r}", file=sys.stderr)
                failed += 1
                if done + failed == len(targets):
                    print(f"charts: {done}/{len(targets)} pages, {rows:,} ranks, {failed} failed", file=sys.stderr)
                continue
            if charts:
                rows += store_charts(connection, target, charts)
            done += 1
            if done % 25 == 0 or done + failed == len(targets):
                print(f"charts: {done}/{len(targets)} pages, {rows:,} ranks, {failed} failed", file=sys.stderr)
