"""Stage 1: discover every app ID from the sitemaps both stores link in their robots.txt.

- App Store: sitemaps_apps_index_app_1.xml (~1,400 files) and the new-app index for fresh apps.
- Google Play: sitemaps-index-0/1.xml (~87,000 files; only ~12% of URLs are apps, the rest are books).

Only <loc> entries are read; the hreflang alternates repeat the same app.
"""

import re
import sys
from concurrent.futures import ThreadPoolExecutor, as_completed

import psycopg

from . import db
from .http import FetchError, RateLimiter, fetch

ROBOTS = {"ios": "https://apps.apple.com/robots.txt", "android": "https://play.google.com/robots.txt"}

LOC = re.compile(rb"<loc>\s*([^<\s]+)\s*</loc>")
APPLE_APP = re.compile(rb"^https://apps\.apple\.com/([a-z]{2})/app/(?:([^/]*)/)?id(\d+)")
PLAY_APP = re.compile(rb"^https://play\.google\.com/store/apps/details\?id=([A-Za-z0-9._]+)$")


def sitemap_indexes(platform: str, robots: str, kinds: tuple[str, ...] = ("app", "new-app", "play")) -> dict[str, str]:
    """Maps index URL -> kind for the sitemap indexes listed in robots.txt."""
    patterns = {"app": "_index_app_", "new-app": "_index_new-app_", "chart": "_index_chart_", "play": "/sitemaps-index-"}
    wanted = {"ios": ("app", "new-app", "chart"), "android": ("play",)}[platform]
    indexes = {}
    for line in robots.splitlines():
        if not line.lower().startswith("sitemap:"):
            continue
        url = line.split(":", 1)[1].strip()
        for kind in wanted:
            if kind in kinds and patterns[kind] in url:
                indexes[url] = kind
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


def child_sitemaps(platform: str, kinds: tuple[str, ...], limiter: RateLimiter) -> dict[str, str]:
    """Reads robots.txt and the matching sitemap indexes; returns child sitemap URL -> kind."""
    status, robots = fetch(ROBOTS[platform], limiter)
    if status != 200:
        raise FetchError(ROBOTS[platform], f"HTTP {status}")
    indexes = sitemap_indexes(platform, robots.decode("utf-8", "replace"), kinds)
    if not indexes:
        raise FetchError(ROBOTS[platform], f"no {'/'.join(kinds)} sitemap index in robots.txt")
    children = {}
    for index_url, kind in indexes.items():
        status, body = fetch(index_url, limiter)
        if status != 200:
            raise FetchError(index_url, f"HTTP {status}")
        found = [loc.decode() for loc in parse_locs(body)]
        children.update(dict.fromkeys(found, kind))
        print(f"{index_url}: {len(found)} sitemaps ({kind})", file=sys.stderr)
    return children


def refresh_file_list(
    connection: psycopg.Connection, platform: str, kinds: tuple[str, ...], limiter: RateLimiter, rescan: bool
) -> None:
    """Registers the current child sitemaps and forgets those no longer listed.

    Play regenerates its sitemaps daily under dated names, so every new index is a fresh scan.
    Apple keeps its file names; --rescan marks them pending again to pick up apps added since.
    """
    children = child_sitemaps(platform, kinds, limiter)
    with connection.cursor() as cursor:
        cursor.executemany(
            "INSERT INTO sitemap_files (url, platform, kind) VALUES (%s, %s, %s) ON CONFLICT DO NOTHING",
            [(url, platform, kind) for url, kind in children.items()],
        )
    dropped = connection.execute(
        "DELETE FROM sitemap_files WHERE platform = %s AND kind = ANY(%s) AND NOT url = ANY(%s)",
        (platform, list(kinds), list(children)),
    ).rowcount
    if rescan:
        connection.execute(
            "UPDATE sitemap_files SET status = NULL, error = NULL WHERE platform = %s AND kind = ANY(%s)",
            (platform, list(kinds)),
        )
    connection.commit()
    if dropped:
        print(f"forgot {dropped} sitemaps no longer listed in the index", file=sys.stderr)


def pending_files(
    connection: psycopg.Connection, platform: str, kinds: tuple[str, ...], limit: int | None, sample: int | None
) -> list:
    rows = connection.execute(
        "SELECT url, kind FROM sitemap_files WHERE platform = %s AND kind = ANY(%s) "
        "AND (status IS NULL OR status NOT IN (200, 404)) ORDER BY url",
        (platform, list(kinds)),
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
    connection: psycopg.Connection,
    platform: str,
    rate: float,
    workers: int,
    limit: int | None = None,
    sample: int | None = None,
    include_new: bool = True,
    only_new: bool = False,
    rescan: bool = False,
) -> None:
    if platform == "android":
        kinds: tuple[str, ...] = ("play",)
    else:
        kinds = ("new-app",) if only_new else ("app", "new-app") if include_new else ("app",)
    limiter = RateLimiter(rate)
    refresh_file_list(connection, platform, kinds, limiter, rescan)
    files = pending_files(connection, platform, kinds, limit, sample)
    total = connection.execute(
        "SELECT COUNT(*) FROM sitemap_files WHERE platform = %s AND kind = ANY(%s)", (platform, list(kinds))
    ).fetchone()[0]
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
                db.upsert_app_keys(connection, platform, f"sitemap:{kind}", {k: (slug, None) for k, (slug, _) in apps.items()})
            connection.execute(
                "UPDATE sitemap_files SET status = %s, bytes = %s, urls = %s, apps = %s, fetched_at = now(), error = %s "
                "WHERE url = %s",
                (status, size, locs, len(apps), error, url),
            )
            connection.commit()
            done += 1
            if done % 25 == 0 or done == len(files):
                keys = connection.execute("SELECT COUNT(*) FROM apps WHERE platform = %s", (platform,)).fetchone()[0]
                print(f"{platform}: {done}/{len(files)} sitemaps, {keys:,} distinct apps", file=sys.stderr)
