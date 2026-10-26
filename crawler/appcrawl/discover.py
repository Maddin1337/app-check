"""Stage 1: discover every app ID from the sitemaps both stores link in their robots.txt.

- App Store: sitemaps_apps_index_app_1.xml (~1,400 files) and the new-app index for fresh apps.
- Google Play: sitemaps-index-0/1.xml (~87,000 files; only ~12% of URLs are apps, the rest are books).

Only <loc> entries are read; the hreflang alternates repeat the same app.
"""

import re
import sqlite3
import sys
from concurrent.futures import ThreadPoolExecutor, as_completed

from . import db
from .http import FetchError, RateLimiter, fetch

ROBOTS = {"ios": "https://apps.apple.com/robots.txt", "android": "https://play.google.com/robots.txt"}

LOC = re.compile(rb"<loc>\s*([^<\s]+)\s*</loc>")
APPLE_APP = re.compile(rb"^https://apps\.apple\.com/([a-z]{2})/app/(?:([^/]*)/)?id(\d+)")
PLAY_APP = re.compile(rb"^https://play\.google\.com/store/apps/details\?id=([A-Za-z0-9._]+)$")


def sitemap_indexes(platform: str, robots: str) -> dict[str, str]:
    """Maps index URL -> kind for the sitemap indexes we use, as listed in robots.txt."""
    indexes = {}
    for line in robots.splitlines():
        if not line.lower().startswith("sitemap:"):
            continue
        url = line.split(":", 1)[1].strip()
        if platform == "ios" and "_index_app_" in url:
            indexes[url] = "app"
        elif platform == "ios" and "_index_new-app_" in url:
            indexes[url] = "new-app"
        elif platform == "android" and "/sitemaps-index-" in url:
            indexes[url] = "play"
    return indexes


def parse_locs(body: bytes) -> list[bytes]:
    return LOC.findall(body)


def parse_apple_urlset(body: bytes) -> tuple[int, dict]:
    """Returns (loc count, {track_id: (slug, storefront count)}). Prefers the US slug."""
    locs = parse_locs(body)
    apps: dict[str, list] = {}
    for loc in locs:
        match = APPLE_APP.match(loc)
        if not match:
            continue
        country, slug, track_id = match.group(1), match.group(2), match.group(3).decode()
        entry = apps.setdefault(track_id, [None, 0])
        entry[1] += 1
        if slug and (entry[0] is None or country == b"us"):
            entry[0] = slug.decode("utf-8", "replace")
    return len(locs), {track_id: (slug, count) for track_id, (slug, count) in apps.items()}


def parse_play_urlset(body: bytes) -> tuple[int, dict]:
    """Returns (loc count, {package: (None, None)})."""
    locs = parse_locs(body)
    apps = {}
    for loc in locs:
        match = PLAY_APP.match(loc)
        if match:
            apps[match.group(1).decode()] = (None, None)
    return len(locs), apps


def refresh_file_list(connection: sqlite3.Connection, platform: str, limiter: RateLimiter, include_new: bool) -> None:
    """Reads robots.txt and the sitemap indexes, and registers child sitemaps as pending."""
    status, robots = fetch(ROBOTS[platform], limiter)
    if status != 200:
        raise FetchError(ROBOTS[platform], f"HTTP {status}")
    indexes = sitemap_indexes(platform, robots.decode("utf-8", "replace"))
    if not include_new:
        indexes = {url: kind for url, kind in indexes.items() if kind != "new-app"}
    if not indexes:
        raise FetchError(ROBOTS[platform], "no sitemap index found in robots.txt")

    current = set()
    for index_url, kind in indexes.items():
        status, body = fetch(index_url, limiter)
        if status != 200:
            raise FetchError(index_url, f"HTTP {status}")
        children = [loc.decode() for loc in parse_locs(body)]
        current.update(children)
        connection.executemany(
            "INSERT OR IGNORE INTO sitemap_files (url, platform, kind) VALUES (?, ?, ?)",
            [(url, platform, kind) for url in children],
        )
        print(f"{index_url}: {len(children)} sitemaps ({kind})", file=sys.stderr)

    # Play regenerates its sitemaps under dated names; pending URLs from an older index would 404.
    stale = [
        (url,)
        for (url,) in connection.execute(
            "SELECT url FROM sitemap_files WHERE platform = ? AND status IS NULL", (platform,)
        )
        if url not in current
    ]
    connection.executemany("DELETE FROM sitemap_files WHERE url = ?", stale)
    connection.commit()
    if stale:
        print(f"dropped {len(stale)} pending sitemaps no longer listed in the index", file=sys.stderr)


def pending_files(connection: sqlite3.Connection, platform: str, limit: int | None, sample: int | None) -> list:
    rows = connection.execute(
        "SELECT url, kind FROM sitemap_files WHERE platform = ? AND (status IS NULL OR status NOT IN (200, 404)) "
        "ORDER BY url",
        (platform,),
    ).fetchall()
    if sample and sample < len(rows):
        step = len(rows) / sample
        rows = [rows[int(i * step)] for i in range(sample)]
    if limit:
        rows = rows[:limit]
    return rows


def _process(platform: str, url: str, limiter: RateLimiter):
    status, body = fetch(url, limiter)
    if status != 200:
        return status, 0, 0, {}
    parse = parse_apple_urlset if platform == "ios" else parse_play_urlset
    locs, apps = parse(body)
    return status, len(body), locs, apps


def discover(
    connection: sqlite3.Connection,
    platform: str,
    rate: float,
    workers: int,
    limit: int | None = None,
    sample: int | None = None,
    include_new: bool = True,
) -> None:
    limiter = RateLimiter(rate)
    refresh_file_list(connection, platform, limiter, include_new)
    files = pending_files(connection, platform, limit, sample)
    total = connection.execute("SELECT COUNT(*) FROM sitemap_files WHERE platform = ?", (platform,)).fetchone()[0]
    print(f"{platform}: {len(files)} of {total} sitemaps to fetch", file=sys.stderr)

    done = 0
    with ThreadPoolExecutor(max_workers=workers) as pool:
        futures = {pool.submit(_process, platform, url, limiter): (url, kind) for url, kind in files}
        for future in as_completed(futures):
            url, kind = futures[future]
            try:
                status, size, locs, apps = future.result()
                error = None
            except FetchError as failure:
                status, size, locs, apps, error = None, None, None, {}, failure.reason
            if apps:
                db.upsert_app_keys(connection, platform, f"sitemap:{kind}", apps)
            connection.execute(
                "UPDATE sitemap_files SET status = ?, bytes = ?, urls = ?, apps = ?, fetched_at = ?, error = ? "
                "WHERE url = ?",
                (status, size, locs, len(apps), db.now(), error, url),
            )
            connection.commit()
            done += 1
            if done % 25 == 0 or done == len(files):
                keys = connection.execute(
                    "SELECT COUNT(*) FROM app_keys WHERE platform = ?", (platform,)
                ).fetchone()[0]
                print(f"{platform}: {done}/{len(files)} sitemaps, {keys:,} distinct apps", file=sys.stderr)
