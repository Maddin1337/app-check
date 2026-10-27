"""Command line: python -m appcrawl <command> ..."""

import argparse
import gzip
import sys

from . import db
from .charts import DEFAULT_COUNTRIES, collect_charts
from .calibrate import calibrate
from .discover import discover
from .estimates import compute_estimates
from .events import compute_events
from .iap import reclassify_stored, refresh_iap
from .import_csv import import_csv
from .refresh_android import refresh_android
from .refresh_ios import refresh_ios
from .tiers import plan_tiers
from .trends import compute_trends


def stats(connection) -> None:
    for platform in ("ios", "android"):
        total, ok, missing, pending, errors, avg_apps = (
            v or 0
            for v in connection.execute(
                """SELECT COUNT(*), COUNT(*) FILTER (WHERE status = 200), COUNT(*) FILTER (WHERE status = 404),
                          COUNT(*) FILTER (WHERE status IS NULL), COUNT(*) FILTER (WHERE error IS NOT NULL),
                          AVG(apps) FILTER (WHERE status = 200)
                   FROM sitemap_files WHERE platform = %s AND kind <> 'chart'""",
                (platform,),
            ).fetchone()
        )
        by_status = dict(connection.execute(
            "SELECT status, COUNT(*) FROM apps WHERE platform = %s GROUP BY 1 ORDER BY 1", (platform,)).fetchall())
        by_tier = dict(connection.execute(
            "SELECT 'T' || tier, COUNT(*) FROM apps WHERE platform = %s GROUP BY 1 ORDER BY 1", (platform,)).fetchall())
        due = connection.execute(
            "SELECT COUNT(*) FROM apps WHERE platform = %s AND (next_refresh_at IS NULL OR next_refresh_at <= now())",
            (platform,),
        ).fetchone()[0]
        metrics = connection.execute(
            "SELECT COUNT(*) FROM app_metrics_daily m JOIN apps a ON a.id = m.app_id "
            "WHERE a.platform = %s AND m.day = current_date",
            (platform,),
        ).fetchone()[0]
        print(f"[{platform}]")
        print(f"  sitemaps: {total:,} known, {ok:,} done, {pending:,} pending, {missing:,} gone (404), {errors:,} errors")
        if ok and pending:
            print(f"  projection for all sitemaps: ~{round(float(avg_apps) * total):,} apps ({float(avg_apps):.1f} per file)")
        print(f"  apps: {sum(by_status.values()):,} {by_status}")
        print(f"  tiers: {by_tier}, due for refresh: {due:,}")
        print(f"  metric rows today: {metrics:,}")
    charts = connection.execute(
        "SELECT COUNT(*), COUNT(DISTINCT (country, device, chart, genre_id)), COUNT(DISTINCT country) "
        "FROM chart_ranks WHERE captured_on = current_date"
    ).fetchone()
    days = connection.execute("SELECT COUNT(DISTINCT captured_on) FROM chart_ranks").fetchone()[0]
    print(f"[charts] today: {charts[0]:,} ranks in {charts[1]:,} charts across {charts[2]} storefronts; {days} day(s) of history")


EXPORTS = {
    "charts": """SELECT c.captured_on, c.captured_at, c.platform, c.country, c.device, c.chart, c.genre_id, c.rank,
                        a.store_id, c.source
                 FROM chart_ranks c JOIN apps a ON a.id = c.app_id
                 ORDER BY c.captured_on, c.country, c.device, c.chart, c.genre_id, c.rank""",
    "metrics": """SELECT m.day, a.platform, a.store_id, m.country, m.rating_count, m.rating_avg, m.installs_exact,
                         m.installs_bucket, m.review_count, m.price, m.version, m.fetched_at
                  FROM app_metrics_daily m JOIN apps a ON a.id = m.app_id
                  ORDER BY m.day, a.platform, a.store_id, m.country""",
}


def export(connection, kind: str, out: str) -> None:
    """Charts and metrics carry store IDs instead of internal app IDs, so they import into any database."""
    select = EXPORTS.get(kind) or f"SELECT * FROM apps WHERE platform = '{kind}' ORDER BY id"
    with gzip.open(out, "wb") as handle, connection.cursor().copy(f"COPY ({select}) TO STDOUT (FORMAT csv, HEADER)") as copy:
        for chunk in copy:
            handle.write(chunk)
    print(f"{kind} -> {out}", file=sys.stderr)


def main(argv: list[str] | None = None) -> None:
    parser = argparse.ArgumentParser(prog="appcrawl", description="App Store / Google Play catalog and time series")
    parser.add_argument("--dsn", help="Postgres connection string (default: $DATABASE_URL or postgresql:///appcrawl)")
    sub = parser.add_subparsers(dest="command", required=True)

    sub.add_parser("migrate", help="create or update the database schema")

    p = sub.add_parser("discover", help="all app IDs from the store sitemaps")
    p.add_argument("platform", choices=["ios", "android"])
    p.add_argument("--rate", type=float, default=1.0, help="sitemap requests per second (default 1)")
    p.add_argument("--workers", type=int, default=2)
    p.add_argument("--limit", type=int, help="fetch at most N pending sitemaps")
    p.add_argument("--sample", type=int, help="fetch N evenly spread sitemaps (for a projection)")
    p.add_argument("--no-new", action="store_true", help="iOS: skip the new-app sitemaps")
    p.add_argument("--only-new", action="store_true", help="iOS: only the new-app sitemaps (daily new apps)")
    p.add_argument("--rescan", action="store_true", help="read already scanned sitemaps again (finds added apps)")

    p = sub.add_parser("charts", help="today's iOS chart ranks (Top Free/Paid 200, optional Top Grossing 100)")
    p.add_argument("--countries", default=",".join(DEFAULT_COUNTRIES), help="comma list or 'all' (default: 40 markets)")
    p.add_argument("--devices", default="iphone", help="comma list of iphone, ipad, mac")
    p.add_argument("--rate", type=float, default=1.0)
    p.add_argument("--workers", type=int, default=2)
    p.add_argument("--grossing-rss", action="store_true", help="also read the legacy RSS Top Grossing feeds")
    p.add_argument("--grossing-only", action="store_true", help="only the Top Grossing feeds, not the chart pages")
    p.add_argument("--limit", type=int, help="at most N chart pages")

    p = sub.add_parser("refresh-ios", help="metadata + daily counters via iTunes Lookup, 200 apps per request")
    p.add_argument("--country", default="us")
    p.add_argument("--rate", type=float, default=0.33, help="requests per second (Apple: ~20/min)")
    p.add_argument("--workers", type=int, default=1)
    p.add_argument("--limit", type=int, help="at most N apps")
    p.add_argument("--missing", action="store_true", help="retry apps not found in other storefronts")

    p = sub.add_parser("refresh-android", help="metadata + daily counters from Play detail pages")
    p.add_argument("--country", default="US")
    p.add_argument("--rate", type=float, default=0.5, help="requests per second for this IP (default 0.5)")
    p.add_argument("--workers", type=int, default=2)
    p.add_argument("--limit", type=int, help="at most N apps")

    sub.add_parser("plan-tiers", help="recompute refresh tiers from charts, size and age")
    sub.add_parser("trends", help="recompute 7- and 30-day growth from the daily metrics")
    sub.add_parser("estimates", help="today's downloads and revenue estimates (model v0, ranges)")
    sub.add_parser("calibrate", help="fit the Top Grossing curve on ground truth (appcrawl/data/ground_truth.csv)")
    sub.add_parser("events", help="today's app events: rank jumps, Top 100 entries, spikes, price and version changes")

    p = sub.add_parser("refresh-iap", help="in-app purchase prices from App Store pages, monetization model per app")
    p.add_argument("--country", default="us")
    p.add_argument("--rate", type=float, default=0.5, help="pages per second (default 0.5)")
    p.add_argument("--workers", type=int, default=2)
    p.add_argument("--limit", type=int, default=8000, help="at most N pages (default 8000, ~4.5 h)")
    p.add_argument("--reclassify", action="store_true", help="only re-run the monetization rules on stored IAP lists")
    sub.add_parser("stats", help="progress, tiers and time series coverage")

    p = sub.add_parser("export", help="gzip CSV of apps (per platform), charts or metrics")
    p.add_argument("kind", choices=["ios", "android", "charts", "metrics"])
    p.add_argument("--out", required=True)

    p = sub.add_parser("import-csv", help="load a CSV export (apps, charts or metrics), e.g. on a new server")
    p.add_argument("kind", choices=["ios", "android", "charts", "metrics"])
    p.add_argument("path")

    args = parser.parse_args(argv)
    connection = db.connect(args.dsn)
    try:
        if args.command == "migrate":
            print(f"applied: {db.migrate(connection) or 'nothing, schema is current'}", file=sys.stderr)
        elif args.command == "discover":
            discover(connection, args.platform, args.rate, args.workers, args.limit, args.sample, not args.no_new,
                     args.only_new, args.rescan)
        elif args.command == "charts":
            countries = None if args.countries == "all" else args.countries.split(",")
            collect_charts(connection, countries, args.devices.split(","), args.rate, args.workers, args.grossing_rss,
                           args.limit, args.grossing_only)
        elif args.command == "refresh-ios":
            refresh_ios(connection, args.country, args.rate, args.workers, args.limit, args.missing)
        elif args.command == "refresh-android":
            refresh_android(connection, args.country, args.rate, args.workers, args.limit)
        elif args.command == "plan-tiers":
            print(plan_tiers(connection), file=sys.stderr)
        elif args.command == "trends":
            print(compute_trends(connection), file=sys.stderr)
        elif args.command == "events":
            print(compute_events(connection), file=sys.stderr)
        elif args.command == "calibrate":
            print(calibrate(connection), file=sys.stderr)
        elif args.command == "estimates":
            print(compute_estimates(connection), file=sys.stderr)
        elif args.command == "refresh-iap" and args.reclassify:
            print(f"reclassified {reclassify_stored(connection):,} apps", file=sys.stderr)
        elif args.command == "refresh-iap":
            refresh_iap(connection, args.country, args.rate, args.workers, args.limit)
        elif args.command == "stats":
            stats(connection)
        elif args.command == "export":
            export(connection, args.kind, args.out)
        elif args.command == "import-csv":
            import_csv(connection, args.kind, args.path)
    except KeyboardInterrupt:
        print("interrupted; progress is saved, run the same command to resume", file=sys.stderr)
    finally:
        connection.close()
