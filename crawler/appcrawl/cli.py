"""Command line: python -m appcrawl <command> ..."""

import argparse
import csv
import gzip
import os
import sys

from . import db
from .discover import discover
from .enrich_android import enrich_android
from .enrich_ios import enrich_ios

EXPORTS = {
    "ios": """SELECT k.store_id, k.slug, k.discovered_via, k.first_seen_at, k.enrich_status, a.*
              FROM app_keys k LEFT JOIN ios_apps a ON a.track_id = CAST(k.store_id AS INTEGER)
              WHERE k.platform = 'ios' ORDER BY k.store_id""",
    "android": """SELECT k.store_id, k.discovered_via, k.first_seen_at, k.enrich_status, a.*
                  FROM app_keys k LEFT JOIN android_apps a ON a.package = k.store_id
                  WHERE k.platform = 'android' ORDER BY k.store_id""",
}


def stats(connection) -> None:
    for platform in ("ios", "android"):
        files = connection.execute(
            "SELECT COUNT(*), SUM(status = 200), SUM(status = 404), SUM(status IS NULL), SUM(error IS NOT NULL), "
            "AVG(CASE WHEN status = 200 THEN apps END) FROM sitemap_files WHERE platform = ?",
            (platform,),
        ).fetchone()
        total, ok, missing, pending, errors, avg_apps = (v or 0 for v in files)
        keys = connection.execute("SELECT COUNT(*) FROM app_keys WHERE platform = ?", (platform,)).fetchone()[0]
        enriched = dict(
            connection.execute(
                "SELECT COALESCE(enrich_status, 'pending'), COUNT(*) FROM app_keys WHERE platform = ? GROUP BY 1",
                (platform,),
            ).fetchall()
        )
        print(f"[{platform}]")
        print(f"  sitemaps: {total:,} known, {ok:,} done, {pending:,} pending, {missing:,} gone (404), {errors:,} errors")
        print(f"  distinct apps: {keys:,}")
        if ok and pending:
            print(f"  projection for all sitemaps: ~{round(avg_apps * total):,} apps ({avg_apps:.1f} per file)")
        print(f"  enrichment: {enriched}")


def export(connection, platform: str, out: str) -> None:
    cursor = connection.execute(EXPORTS[platform])
    with gzip.open(out, "wt", newline="", encoding="utf-8") as handle:
        writer = csv.writer(handle)
        writer.writerow([c[0] for c in cursor.description])
        rows = 0
        for row in cursor:
            writer.writerow(row)
            rows += 1
    print(f"{rows:,} rows -> {out}", file=sys.stderr)


def main(argv: list[str] | None = None) -> None:
    parser = argparse.ArgumentParser(prog="appcrawl", description="Complete App Store / Google Play catalog extract")
    parser.add_argument("--db", default=os.environ.get("APPCRAWL_DB", "data/appcrawl.sqlite3"), help="SQLite file")
    sub = parser.add_subparsers(dest="command", required=True)

    p = sub.add_parser("discover", help="stage 1: all app IDs from the store sitemaps")
    p.add_argument("platform", choices=["ios", "android"])
    p.add_argument("--rate", type=float, default=1.0, help="sitemap requests per second (default 1)")
    p.add_argument("--workers", type=int, default=2)
    p.add_argument("--limit", type=int, help="fetch at most N pending sitemaps")
    p.add_argument("--sample", type=int, help="fetch N evenly spread sitemaps (for a projection)")
    p.add_argument("--no-new", action="store_true", help="iOS: skip the new-app sitemaps")

    p = sub.add_parser("enrich-ios", help="stage 2: iTunes Lookup metadata, 200 apps per request")
    p.add_argument("--country", default="us")
    p.add_argument("--rate", type=float, default=0.33, help="requests per second (Apple: ~20/min)")
    p.add_argument("--workers", type=int, default=1)
    p.add_argument("--limit", type=int, help="enrich at most N apps")
    p.add_argument("--retry-not-found", action="store_true", help="retry apps missing in an earlier storefront")

    p = sub.add_parser("enrich-android", help="stage 2: Play detail pages incl. exact install counts")
    p.add_argument("--country", default="US")
    p.add_argument("--rate", type=float, default=0.5, help="requests per second for this IP (default 0.5)")
    p.add_argument("--workers", type=int, default=2)
    p.add_argument("--limit", type=int, help="enrich at most N apps")

    sub.add_parser("stats", help="progress and projections")

    p = sub.add_parser("export", help="CSV (gzip) for loading into Postgres")
    p.add_argument("platform", choices=["ios", "android"])
    p.add_argument("--out", required=True)

    args = parser.parse_args(argv)
    os.makedirs(os.path.dirname(os.path.abspath(args.db)), exist_ok=True)
    connection = db.connect(args.db)
    try:
        if args.command == "discover":
            discover(connection, args.platform, args.rate, args.workers, args.limit, args.sample, not args.no_new)
        elif args.command == "enrich-ios":
            enrich_ios(connection, args.country, args.rate, args.workers, args.limit, args.retry_not_found)
        elif args.command == "enrich-android":
            enrich_android(connection, args.country, args.rate, args.workers, args.limit)
        elif args.command == "stats":
            stats(connection)
        elif args.command == "export":
            export(connection, args.platform, args.out)
    except KeyboardInterrupt:
        print("interrupted; progress is saved, run the same command to resume", file=sys.stderr)
    finally:
        connection.close()
