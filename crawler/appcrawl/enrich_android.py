"""Stage 2 (Android): metadata for every discovered package from its Play detail page.

The detail page (/store/apps/details, allowed by Play's robots.txt) embeds the exact
install counter ("realInstalls") next to the public bucket. This is one HTML request per
app, so it is the slow part of the extract: keep the rate low per IP and spread a full
pass over days or several egress IPs (see docs/research/03-datenbank-aufbau.md §4.7).

Parsing reuses google-play-scraper's maintained field map; fetching stays ours.
"""

import sqlite3
import ssl
import sys
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime, timezone
from urllib.parse import urlparse

from . import db
from .http import FetchError, RateLimiter, fetch

DETAIL = "https://play.google.com/store/apps/details?id={package}&hl=en&gl={country}"


def _parser():
    try:
        from google_play_scraper.features.app import parse_dom
    except ImportError:
        sys.exit("enrich-android needs: pip install google-play-scraper")
    # google-play-scraper disables TLS verification process-wide on import. Restore it:
    # we never use its network code, only parse_dom.
    ssl._create_default_https_context = ssl.create_default_context
    return parse_dom


def _domain(url: str | None) -> str | None:
    if not url:
        return None
    host = urlparse(url if "://" in url else f"https://{url}").hostname or ""
    return host.removeprefix("www.") or None


def row_from_details(package: str, d: dict, country: str, fetched_at: str) -> tuple:
    updated = d.get("updated")
    return (
        package,
        country,
        d.get("title"),
        d.get("developer"),
        d.get("developerId"),
        _domain(d.get("developerWebsite")),
        d.get("genreId"),
        d.get("genre"),
        int(bool(d.get("free"))) if d.get("free") is not None else None,
        d.get("price"),
        d.get("currency"),
        int(bool(d.get("offersIAP"))) if d.get("offersIAP") is not None else None,
        d.get("inAppProductPrice"),
        int(bool(d.get("containsAds"))) if d.get("containsAds") is not None else None,
        d.get("minInstalls"),
        d.get("realInstalls"),
        d.get("score"),
        d.get("ratings"),
        d.get("reviews"),
        d.get("released"),
        datetime.fromtimestamp(updated, timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ") if updated else None,
        d.get("version"),
        d.get("contentRating"),
        d.get("icon"),
        fetched_at,
    )


def _details(package: str, country: str, limiter: RateLimiter, parse_dom) -> dict | None:
    url = DETAIL.format(package=package, country=country)
    status, body = fetch(url, limiter)
    if status != 200:
        return None
    return parse_dom(dom=body.decode("utf-8", "replace"), app_id=package, url=url)


def enrich_android(
    connection: sqlite3.Connection, country: str, rate: float, workers: int, limit: int | None
) -> None:
    parse_dom = _parser()
    packages = [
        store_id
        for (store_id,) in connection.execute(
            "SELECT store_id FROM app_keys WHERE platform = 'android' "
            "AND (enrich_status IS NULL OR enrich_status = 'error') ORDER BY store_id"
            + (" LIMIT ?" if limit else ""),
            (limit,) if limit else (),
        )
    ]
    print(f"android: {len(packages):,} detail pages to fetch (country={country})", file=sys.stderr)

    limiter = RateLimiter(rate)
    found = done = 0
    with ThreadPoolExecutor(max_workers=workers) as pool:
        futures = {pool.submit(_details, p, country, limiter, parse_dom): p for p in packages}
        for future in as_completed(futures):
            package = futures[future]
            fetched_at = db.now()
            try:
                details = future.result()
                status = "ok" if details else "not_found"
            except FetchError as failure:
                print(f"{package}: {failure.reason}", file=sys.stderr)
                details, status = None, "error"
            except Exception as failure:  # a page the parser cannot read must not stop the run
                print(f"{package}: parse error {failure!r}", file=sys.stderr)
                details, status = None, "error"
            if details:
                connection.execute(
                    f"INSERT OR REPLACE INTO android_apps VALUES ({','.join('?' * 25)})",
                    row_from_details(package, details, country, fetched_at),
                )
                found += 1
            connection.execute(
                "UPDATE app_keys SET enrich_status = ?, enriched_at = ? WHERE platform = 'android' AND store_id = ?",
                (status, fetched_at, package),
            )
            connection.commit()
            done += 1
            if done % 50 == 0 or done == len(packages):
                print(f"android: {done}/{len(packages)} pages, {found:,} apps parsed", file=sys.stderr)
