"""Stage 2 (iOS): metadata for every discovered app via the official iTunes Lookup API.

One request covers up to 200 IDs. Apple documents roughly 20 calls per minute, which is
still ~5.7 million app lookups per day from a single IP. Apps missing from the chosen
storefront are marked 'not_found' and can be retried with another --country.
"""

import json
import sqlite3
import sys
from concurrent.futures import ThreadPoolExecutor, as_completed

from . import db
from .http import FetchError, RateLimiter, fetch

LOOKUP = "https://itunes.apple.com/lookup?id={ids}&country={country}&entity=software"
BATCH = 200


def row_from_result(result: dict, country: str, fetched_at: str) -> tuple:
    return (
        result["trackId"],
        country,
        result.get("trackName"),
        result.get("bundleId"),
        result.get("artistId"),
        result.get("artistName"),
        result.get("sellerName"),
        int(result["primaryGenreId"]) if result.get("primaryGenreId") else None,
        result.get("primaryGenreName"),
        json.dumps(result.get("genreIds", [])),
        result.get("price"),
        result.get("currency"),
        result.get("averageUserRating"),
        result.get("userRatingCount"),
        result.get("releaseDate"),
        result.get("currentVersionReleaseDate"),
        result.get("version"),
        result.get("contentAdvisoryRating"),
        int(result["fileSizeBytes"]) if result.get("fileSizeBytes") else None,
        result.get("minimumOsVersion"),
        json.dumps(result.get("languageCodesISO2A", [])),
        result.get("artworkUrl512"),
        result.get("sellerUrl"),
        result.get("trackViewUrl"),
        fetched_at,
    )


def _lookup(ids: list[str], country: str, limiter: RateLimiter) -> list[dict]:
    status, body = fetch(LOOKUP.format(ids=",".join(ids), country=country), limiter)
    if status != 200:
        raise FetchError("lookup", f"HTTP {status}")
    return [r for r in json.loads(body).get("results", []) if r.get("wrapperType") == "software"]


def enrich_ios(
    connection: sqlite3.Connection, country: str, rate: float, workers: int, limit: int | None, retry_not_found: bool
) -> None:
    status_filter = "enrich_status = 'not_found'" if retry_not_found else "enrich_status IS NULL"
    ids = [
        store_id
        for (store_id,) in connection.execute(
            f"SELECT store_id FROM app_keys WHERE platform = 'ios' AND {status_filter} ORDER BY store_id"
            + (" LIMIT ?" if limit else ""),
            (limit,) if limit else (),
        )
    ]
    batches = [ids[i : i + BATCH] for i in range(0, len(ids), BATCH)]
    print(f"ios: {len(ids):,} apps in {len(batches):,} lookup requests (country={country})", file=sys.stderr)

    limiter = RateLimiter(rate)
    found_total = done = 0
    with ThreadPoolExecutor(max_workers=workers) as pool:
        futures = {pool.submit(_lookup, batch, country, limiter): batch for batch in batches}
        for future in as_completed(futures):
            batch = futures[future]
            fetched_at = db.now()
            try:
                results = future.result()
            except FetchError as failure:
                print(f"lookup failed ({failure.reason}), batch left pending", file=sys.stderr)
                continue
            rows = [row_from_result(r, country, fetched_at) for r in results]
            connection.executemany(
                f"INSERT OR REPLACE INTO ios_apps VALUES ({','.join('?' * 25)})",
                rows,
            )
            found = {str(r["trackId"]) for r in results}
            connection.executemany(
                "UPDATE app_keys SET enrich_status = ?, enriched_at = ? WHERE platform = 'ios' AND store_id = ?",
                [("ok" if i in found else "not_found", fetched_at, i) for i in batch],
            )
            connection.commit()
            found_total += len(found)
            done += 1
            if done % 10 == 0 or done == len(batches):
                print(f"ios: {done}/{len(batches)} requests, {found_total:,} apps found", file=sys.stderr)
