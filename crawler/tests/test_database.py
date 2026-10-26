"""Integration tests against a real Postgres. Set TEST_DATABASE_URL to an empty, disposable database."""

import csv
import gzip
import os
import tempfile
import unittest

from appcrawl import db
from appcrawl.charts import parse_chart_page, store_charts
from appcrawl.import_csv import import_csv
from appcrawl.refresh_ios import store_batch
from appcrawl.tiers import plan_tiers
from appcrawl.trends import compute_trends
from appcrawl.estimates import compute_estimates
from appcrawl.iap import store_iap

from test_parsing import CHART_PAGE

DSN = os.environ.get("TEST_DATABASE_URL")


@unittest.skipUnless(DSN, "TEST_DATABASE_URL not set")
class DatabaseFlow(unittest.TestCase):
    def setUp(self):
        self.connection = db.connect(DSN)
        self.connection.execute("DROP SCHEMA public CASCADE")
        self.connection.execute("CREATE SCHEMA public")
        self.connection.commit()
        self.assertEqual(db.migrate(self.connection), ["0001_init", "0002_trends", "0003_estimates", "0004_revenue_method"])
        self.connection.close()
        self.connection = db.connect(DSN)  # the schema must survive a new connection
        self.assertEqual(db.migrate(self.connection), [])

    def tearDown(self):
        self.connection.close()

    def scalar(self, query, *params):
        return self.connection.execute(query, params).fetchone()[0]

    def test_discovery_charts_refresh_and_tiers(self):
        from datetime import date

        db.ensure_month_partition(self.connection, "chart_ranks", date.today())
        db.ensure_month_partition(self.connection, "app_metrics_daily", date.today())
        db.upsert_app_keys(self.connection, "ios", "sitemap:app", {"570060128": ("duolingo", None), "9": (None, None)})
        self.connection.commit()

        ranks = store_charts(self.connection, ("us", "iphone", "6017"), {
            chart: (ranked, "apple_web") for chart, ranked in parse_chart_page(CHART_PAGE).items()
        })
        self.assertEqual(ranks, 5)
        self.assertEqual(self.scalar("SELECT COUNT(*) FROM apps"), 6)  # 2 from sitemaps + 4 new from the chart
        self.assertEqual(self.scalar("SELECT discovered_via FROM apps WHERE store_id = '570060128'"), "sitemap:app")
        self.assertEqual(self.scalar("SELECT name FROM apps WHERE store_id = '373493387'"), "AnkiMobile")
        # The same chart captured again today replaces, not duplicates.
        store_charts(self.connection, ("us", "iphone", "6017"), {
            chart: (ranked, "apple_web") for chart, ranked in parse_chart_page(CHART_PAGE).items()
        })
        self.assertEqual(self.scalar("SELECT COUNT(*) FROM chart_ranks"), 5)

        found = store_batch(self.connection, ["570060128", "9"], [{
            "trackId": 570060128, "trackName": "Duolingo", "userRatingCount": 5531166, "averageUserRating": 4.7,
            "releaseDate": "2012-11-13T08:00:00Z", "price": 0.0, "version": "7.145.1",
        }], "us")
        self.assertEqual(found, 1)
        self.assertEqual(self.scalar("SELECT status FROM apps WHERE store_id = '570060128'"), "active")
        self.assertEqual(self.scalar("SELECT status FROM apps WHERE store_id = '9'"), "not_found")
        self.assertEqual(self.scalar("SELECT rating_count FROM app_metrics_daily"), 5531166)

        tiers = plan_tiers(self.connection)
        self.assertEqual(self.scalar("SELECT tier FROM apps WHERE store_id = '570060128'"), 0)
        self.assertEqual(self.scalar("SELECT tier FROM apps WHERE store_id = '9'"), 3)
        self.assertIn("ios T0", tiers)

    def test_export_import_round_trip(self):
        from datetime import date

        from appcrawl.cli import export

        db.ensure_month_partition(self.connection, "chart_ranks", date.today())
        db.ensure_month_partition(self.connection, "app_metrics_daily", date.today())
        store_charts(self.connection, ("de", "iphone", "36"), {
            chart: (ranked, "apple_web") for chart, ranked in parse_chart_page(CHART_PAGE).items()
        })
        store_batch(self.connection, ["570060128"], [{"trackId": 570060128, "trackName": "Duolingo",
                                                      "userRatingCount": 5, "languages": None}], "de")
        directory = tempfile.mkdtemp()
        files = {kind: os.path.join(directory, f"{kind}.csv.gz") for kind in ("ios", "charts", "metrics")}
        for kind, path in files.items():
            export(self.connection, kind, path)

        self.connection.execute("DROP SCHEMA public CASCADE")
        self.connection.execute("CREATE SCHEMA public")
        self.connection.commit()
        db.migrate(self.connection)
        for kind in ("charts", "ios", "metrics"):  # order must not matter
            import_csv(self.connection, kind, files[kind])

        self.assertEqual(self.scalar("SELECT COUNT(*) FROM chart_ranks"), 5)
        self.assertEqual(self.scalar("SELECT COUNT(*) FROM app_metrics_daily"), 1)
        self.assertEqual(self.scalar("SELECT COUNT(*) FROM apps"), 5)
        # The placeholder the chart import created was completed by the apps file.
        self.assertEqual(self.scalar("SELECT status FROM apps WHERE store_id = '570060128'"), "active")
        self.assertEqual(self.scalar("SELECT name FROM apps WHERE store_id = '570060128'"), "Duolingo")
        self.assertEqual(self.scalar("SELECT discovered_via FROM apps WHERE store_id = '570060128'"), "chart")

    def test_import_keeps_existing_apps(self):
        db.upsert_app_keys(self.connection, "ios", "sitemap:app", {"1": ("kept", None)})
        self.connection.commit()
        header = ["store_id", "slug", "discovered_via", "first_seen_at", "enrich_status", "track_id", "country", "name",
                  "bundle_id", "artist_id", "artist_name", "seller_name", "primary_genre_id", "primary_genre",
                  "genre_ids", "price", "currency", "rating_avg", "rating_count", "released_at",
                  "current_version_released_at", "version", "content_rating", "size_bytes", "min_os", "languages",
                  "icon_url", "seller_url", "store_url", "fetched_at"]
        rows = [
            ["1", "replaced", "sitemap:app", "2026-10-26T09:00:00Z", "", *[""] * 25],
            ["2", "two", "sitemap:app", "2026-10-26T09:00:00Z", "ok", "2", "us", "Two", "com.two", "7", "Dev", "Dev",
             "6017", "Education", '["6017"]', "0.0", "USD", "4.5", "120", "2015-10-03T09:08:06Z",
             "2026-01-01T00:00:00Z", "1.0", "4+", "1000", "15.0", '["EN"]', "", "", "", "2026-10-26T09:30:00Z"],
        ]
        with tempfile.NamedTemporaryFile(suffix=".csv.gz", delete=False) as handle:
            path = handle.name
        with gzip.open(path, "wt", newline="") as out:
            writer = csv.writer(out)
            writer.writerow(header)
            writer.writerows(rows)
        import_csv(self.connection, "ios", path)
        os.unlink(path)
        self.assertEqual(self.scalar("SELECT slug FROM apps WHERE store_id = '1'"), "kept")
        self.assertEqual(self.scalar("SELECT rating_count FROM apps WHERE store_id = '2'"), 120)
        self.assertEqual(self.scalar("SELECT languages FROM apps WHERE store_id = '2'"), ["EN"])
        self.assertEqual(self.scalar("SELECT status FROM apps WHERE store_id = '2'"), "active")

    def test_trends(self):
        from datetime import date, timedelta

        today = date.today()
        db.ensure_month_partition(self.connection, "app_metrics_daily", today)
        db.ensure_month_partition(self.connection, "app_metrics_daily", today - timedelta(days=40))
        db.upsert_app_keys(self.connection, "ios", "sitemap:app", {"1": (None, None), "2": (None, None)})
        db.upsert_app_keys(self.connection, "android", "sitemap:play", {"com.a": (None, None)})
        ids = {store_id: id_ for store_id, id_ in self.connection.execute("SELECT store_id, id FROM apps")}
        rows = [
            # iOS app 1: US series with three points, a single DE point that must not win
            (today - timedelta(days=20), ids["1"], "us", 1000, None),
            (today - timedelta(days=5), ids["1"], "us", 1300, None),
            (today, ids["1"], "us", 1400, None),
            (today, ids["1"], "de", 50000, None),
            # iOS app 2: only one measurement, no trend
            (today, ids["2"], "us", 10, None),
            # Android: installs, the point outside the 30-day window is ignored
            (today - timedelta(days=35), ids["com.a"], "ww", None, 1),
            (today - timedelta(days=10), ids["com.a"], "ww", None, 0),
            (today, ids["com.a"], "ww", None, 5000),
        ]
        self.connection.cursor().executemany(
            """INSERT INTO app_metrics_daily (day, app_id, country, rating_count, installs_exact, fetched_at)
               VALUES (%s, %s, %s, %s, %s, now())""", rows)
        self.connection.commit()

        self.assertEqual(compute_trends(self.connection), {"android 30d": 1, "ios 7d": 1, "ios 30d": 1})
        ios = self.connection.execute(
            "SELECT country, start_value, end_value, delta, per_day, growth, points FROM app_trends "
            "WHERE app_id = %s AND window_days = 30", (ids["1"],)).fetchone()
        self.assertEqual(ios[:4], ("us", 1000, 1400, 400))
        self.assertAlmostEqual(ios[4], 20.0)
        self.assertAlmostEqual(ios[5], 0.4)
        self.assertEqual(ios[6], 3)
        self.assertEqual(self.scalar("SELECT delta FROM app_trends WHERE app_id = %s AND window_days = 7", ids["1"]), 100)
        android = self.connection.execute(
            "SELECT metric, start_value, delta, growth FROM app_trends WHERE app_id = %s", (ids["com.a"],)).fetchone()
        self.assertEqual(android, ("installs", 0, 5000, None))
        # Recomputing replaces the rows instead of adding to them.
        compute_trends(self.connection)
        self.assertEqual(self.scalar("SELECT COUNT(*) FROM app_trends"), 3)

    def test_estimates(self):
        from datetime import date, timedelta
        from decimal import Decimal

        today = date.today()
        for table in ("chart_ranks", "app_metrics_daily"):
            db.ensure_month_partition(self.connection, table, today)
            db.ensure_month_partition(self.connection, table, today - timedelta(days=10))
        # 25 apps in the US all-apps chart and the Education chart, with US rating growth for calibration
        charted = {str(n): (f"app{n}", None) for n in range(1, 26)}
        db.upsert_app_keys(self.connection, "ios", "chart",
                           {**charted, "100": (None, None), "200": (None, None), "300": (None, None)})
        db.upsert_app_keys(self.connection, "android", "sitemap:play", {"com.a": (None, None)})
        ids = {s: i for s, i in self.connection.execute("SELECT store_id, id FROM apps")}
        self.connection.execute("UPDATE apps SET category_id = '6017', status = 'active'")
        ranks, metrics = [], []
        for n in range(1, 26):
            ranks += [("36", n, ids[str(n)]), ("6017", n, ids[str(n)])]
            metrics += [(today - timedelta(days=10), ids[str(n)], "us", 1000, None),
                        (today, ids[str(n)], "us", 1000 + 100 * (26 - n), None)]
        ranks.append(("6017", 30, ids["100"]))  # only in the category chart
        grossing = [("36", 1, ids["1"]), ("36", 50, ids["300"])]  # app 300: revenue rank only, no download signal
        metrics += [(today - timedelta(days=10), ids["200"], "us", 0, None),  # not charted: ratings only
                    (today, ids["200"], "us", 50_000, None),  # fast grower without a chart place
                    (today - timedelta(days=10), ids["com.a"], "ww", None, 1000),
                    (today, ids["com.a"], "ww", None, 21000)]
        self.connection.cursor().executemany(
            """INSERT INTO chart_ranks (captured_on, captured_at, platform, country, device, chart, genre_id, rank,
                                        app_id, source)
               VALUES (current_date, now(), 'ios', 'us', 'iphone', 'top-free', %s, %s, %s, 'apple_web')""", ranks)
        self.connection.cursor().executemany(
            """INSERT INTO chart_ranks (captured_on, captured_at, platform, country, device, chart, genre_id, rank,
                                        app_id, source)
               VALUES (current_date, now(), 'ios', 'us', 'iphone', 'top-grossing', %s, %s, %s, 'apple_rss')""", grossing)
        self.connection.cursor().executemany(
            """INSERT INTO app_metrics_daily (day, app_id, country, rating_count, installs_exact, fetched_at)
               VALUES (%s, %s, %s, %s, %s, now())""", metrics)
        self.connection.commit()
        compute_trends(self.connection)
        store_iap(self.connection, ids["1"], "us", Decimal(0), [("Pro", Decimal("9.99"), "USD"),
                                                                 ("Pro", Decimal("59.99"), "USD")])
        store_iap(self.connection, ids["200"], "us", Decimal(0), [("Premium Yearly", Decimal("499.99"), "USD")])

        result = compute_estimates(self.connection)
        self.assertEqual(result["apps"], 29)
        self.assertEqual((result["chart"], result["chart-category"], result["ratings"], result["installs"]), (25, 1, 1, 1))
        self.assertEqual(result["no downloads"], 1)
        # Apps 1 and 300 take their Top Grossing rank, app 200 downloads × RPD, the rest no known monetization.
        self.assertEqual((result["revenue grossing"], result["revenue rpd"], result["revenue unknown"]), (2, 1, 26))
        top = self.connection.execute(
            """SELECT downloads_p10, downloads_p50, downloads_p90, revenue_p10, revenue_p50, revenue_p90, monetization,
                      confidence, revenue_method
               FROM app_estimates_daily WHERE app_id = %s""", (ids["1"],)).fetchone()
        self.assertAlmostEqual(top[1], 156_000, delta=1)
        self.assertTrue(top[0] < top[1] < top[2])
        # Rank 1 in Top Grossing: $2.5M a day. The RPD path is far lower, which is expected for a top earner.
        self.assertAlmostEqual(top[4], 2_500_000 * 30, delta=1)
        self.assertTrue(top[3] < top[4] < top[5])
        self.assertEqual(top[6:], ("subscription", "medium", "grossing"))
        only_grossing = self.connection.execute(
            "SELECT downloads_p50, revenue_p50, revenue_method FROM app_estimates_daily WHERE app_id = %s",
            (ids["300"],)).fetchone()
        self.assertIsNone(only_grossing[0])
        self.assertAlmostEqual(only_grossing[1], 2_500_000 * 50 ** -0.75 * 30, delta=1)
        self.assertEqual(only_grossing[2], "grossing")
        # The ratings-only app is scaled by the downloads per rating learned from the 25 charted apps.
        ratings_only = self.connection.execute(
            "SELECT downloads_p50, revenue_p50, revenue_p90 FROM app_estimates_daily WHERE app_id = %s",
            (ids["200"],)).fetchone()
        self.assertGreater(ratings_only[0], 5 * 67)
        # Outside the all-apps Top Grossing chart (50 deep here), revenue stays below its last rank.
        self.assertAlmostEqual(ratings_only[2], 2_500_000 * 50 ** -0.75 * 30, delta=1)
        self.assertLessEqual(ratings_only[1], ratings_only[2])
        android = self.scalar("SELECT downloads_p50 FROM app_estimates_daily WHERE app_id = %s", ids["com.a"])
        self.assertAlmostEqual(android, 2000, delta=1)
        # A second run on the same day replaces its rows.
        compute_estimates(self.connection)
        self.assertEqual(self.scalar("SELECT COUNT(*) FROM app_estimates_daily"), 29)


if __name__ == "__main__":
    unittest.main()
