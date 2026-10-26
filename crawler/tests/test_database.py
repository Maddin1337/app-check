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

from test_parsing import CHART_PAGE

DSN = os.environ.get("TEST_DATABASE_URL")


@unittest.skipUnless(DSN, "TEST_DATABASE_URL not set")
class DatabaseFlow(unittest.TestCase):
    def setUp(self):
        self.connection = db.connect(DSN)
        self.connection.execute("DROP SCHEMA public CASCADE")
        self.connection.execute("CREATE SCHEMA public")
        self.connection.commit()
        self.assertEqual(db.migrate(self.connection), ["0001_init"])
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


if __name__ == "__main__":
    unittest.main()
