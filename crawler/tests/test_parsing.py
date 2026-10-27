import json
import unittest
from decimal import Decimal

from appcrawl.charts import CHART_URL, parse_chart_page, parse_grossing_rss
from appcrawl.discover import parse_apple_urlset, parse_locs, parse_play_urlset, sitemap_indexes
from appcrawl.calibrate import anchor_range, fit_scale
from appcrawl.estimates import curve, net_factor, rpd
from appcrawl.iap import classify, parse_app_page, parse_page_extras, parse_price
from appcrawl.refresh_android import _domain, _released
from appcrawl.refresh_ios import app_fields

APPLE_ROBOTS = """User-agent: *
Disallow: /api/*
Sitemap: https://apps.apple.com/sitemaps_apps_index_chart_1.xml
Sitemap: https://apps.apple.com/sitemaps_apps_index_app_1.xml
Sitemap: https://apps.apple.com/sitemaps_apps_index_new-app_1.xml
Sitemap: https://apps.apple.com/sitemaps_apps_index_story_1.xml
"""

PLAY_ROBOTS = """Disallow: /store/search
Sitemap: https://play.google.com/sitemaps/sitemaps-index-0.xml
Sitemap: https://play.google.com/sitemaps/sitemaps-index-1.xml
"""

APPLE_URLSET = b"""<urlset>
<url><loc>https://apps.apple.com/mx/app/readlang-watchlang/id1602114377</loc>
<xhtml:link rel="alternate" hreflang="de-CH" href="https://apps.apple.com/ch/app/readlang-watchlang/id1602114377" />
</url>
<url><loc>https://apps.apple.com/us/app/readlang-watch-us/id1602114377</loc></url>
<url><loc>https://apps.apple.com/de/app/id570060128</loc></url>
<url><loc>https://apps.apple.com/us/iphone/charts/6017</loc></url>
</urlset>"""

PLAY_URLSET = b"""<urlset>
<url><loc>https://play.google.com/store/apps/details?id=site.chiyan.stackclear</loc>
<xhtml:link rel='alternate' hreflang='hu-hu' href='https://play.google.com/store/apps/details?id=site.chiyan.stackclear'/></url>
<url><loc>https://play.google.com/store/books/details/Some_Book?id=kXH_YQ8fnF0C</loc></url>
<url><loc>https://play.google.com/store/apps/details?id=com.duolingo</loc></url>
</urlset>"""


def chart_page(segments: list) -> bytes:
    data = {"data": [{"data": {"title": "Top Charts", "segments": segments}}]}
    return (
        b'<html><script type="application/json" id="serialized-server-data">'
        + json.dumps(data).encode()
        + b"</script></html>"
    )


CHART_PAGE = chart_page([
    {
        "chart": "top-free",
        "shelves": [{"items": [{"adamId": "570060128", "title": "Duolingo"}, {"adamId": "1", "title": "One"}]}],
        "nextPage": {"remainingContent": [{"id": "2", "type": "apps"}, {"id": "3", "type": "apps"}]},
    },
    {"chart": "top-paid", "shelves": [{"items": [{"adamId": "373493387", "title": "AnkiMobile"}]}], "nextPage": None},
])

GROSSING_RSS = json.dumps({"feed": {"entry": [
    {"im:name": {"label": "MONOPOLY GO!"}, "id": {"attributes": {"im:id": "1621328561"}}},
    {"im:name": {"label": "Royal Match"}, "id": {"attributes": {"im:id": "1482155847"}}},
]}}).encode()


class SitemapParsing(unittest.TestCase):
    def test_indexes_from_robots(self):
        self.assertEqual(
            sitemap_indexes("ios", APPLE_ROBOTS),
            {
                "https://apps.apple.com/sitemaps_apps_index_app_1.xml": "app",
                "https://apps.apple.com/sitemaps_apps_index_new-app_1.xml": "new-app",
            },
        )
        self.assertEqual(
            sitemap_indexes("ios", APPLE_ROBOTS, ("chart",)),
            {"https://apps.apple.com/sitemaps_apps_index_chart_1.xml": "chart"},
        )
        self.assertEqual(len(sitemap_indexes("android", PLAY_ROBOTS)), 2)

    def test_apple_urlset_counts_storefronts_and_prefers_us_slug(self):
        locs, apps = parse_apple_urlset(APPLE_URLSET)
        self.assertEqual(locs, 4)
        self.assertEqual(apps["1602114377"], ("readlang-watch-us", 2))
        self.assertEqual(apps["570060128"], (None, 1))
        self.assertEqual(len(apps), 2)

    def test_play_urlset_keeps_only_apps(self):
        locs, apps = parse_play_urlset(PLAY_URLSET)
        self.assertEqual(locs, 3)
        self.assertEqual(set(apps), {"site.chiyan.stackclear", "com.duolingo"})

    def test_alternates_are_not_locs(self):
        self.assertEqual(len(parse_locs(APPLE_URLSET)), 4)


class ChartParsing(unittest.TestCase):
    def test_chart_page_ranks_include_remaining_content(self):
        charts = parse_chart_page(CHART_PAGE)
        self.assertEqual(
            charts["top-free"], [("570060128", "Duolingo"), ("1", "One"), ("2", None), ("3", None)]
        )
        self.assertEqual(charts["top-paid"], [("373493387", "AnkiMobile")])

    def test_page_without_server_data(self):
        self.assertEqual(parse_chart_page(b"<html></html>"), {})

    def test_grossing_rss(self):
        self.assertEqual(
            parse_grossing_rss(GROSSING_RSS), [("1621328561", "MONOPOLY GO!"), ("1482155847", "Royal Match")]
        )

    def test_chart_urls_ignore_language_variants(self):
        match = CHART_URL.match(b"https://apps.apple.com/dz/ipad/charts/7009?l=ar")
        self.assertEqual(match.groups(), (b"dz", b"ipad", b"7009"))


class FieldMapping(unittest.TestCase):
    def test_ios_lookup_fields(self):
        fields = app_fields({
            "trackName": "Duolingo", "artistId": 570060151, "primaryGenreId": 6017, "genreIds": ["6017", "6005"],
            "releaseDate": "2012-11-13T08:00:00Z", "fileSizeBytes": "514648064", "userRatingCount": 5531166,
        })
        self.assertEqual(fields["developer_id"], "570060151")
        self.assertEqual(fields["category_id"], "6017")
        self.assertEqual(str(fields["released_at"]), "2012-11-13")
        self.assertEqual(fields["size_bytes"], 514648064)

    def test_android_helpers(self):
        self.assertEqual(_domain("https://www.duolingo.com/help"), "duolingo.com")
        self.assertEqual(_domain("example.org"), "example.org")
        self.assertIsNone(_domain(None))
        self.assertEqual(str(_released("May 29, 2013")), "2013-05-29")
        self.assertIsNone(_released("29. Mai 2013"))


def app_page(annotations: list) -> bytes:
    data = {"data": [{"data": {"shelfMapping": {"information": {"items": annotations}}}}]}
    return b'<script type="application/json" id="serialized-server-data">' + json.dumps(data).encode() + b"</script>"


def pairs(*rows):
    return [{"$kind": "textPair", "leadingText": name, "trailingText": value} for name, value in rows]


class IapParsing(unittest.TestCase):
    def test_finds_the_price_list_whatever_its_title(self):
        page = app_page([
            {"title": "Age Rating", "items": pairs(("Age", "4+"))},
            {"title": "In-App-Käufe", "items": pairs(("Super Duolingo", "$9.99"), ("Super Duolingo", "$83.99"))
             + [{"$kind": "button"}]},
        ])
        self.assertEqual(parse_app_page(page), [("Super Duolingo", Decimal("9.99"), "USD"),
                                                ("Super Duolingo", Decimal("83.99"), "USD")])

    def test_page_extras(self):
        data = {"data": [{"data": {"shelfMapping": {
            "productRatings": {"items": [{"ratingCounts": [50, 20, 5, 2, 3]}]},
            "product_media_phone_": {"items": [
                {"screenshot": {"template": "https://x/a.jpg/{w}x{h}{c}.{f}", "width": 1242, "height": 2688}},
                {"other": True}]}}}}]}
        page = b'<script type="application/json" id="serialized-server-data">' + json.dumps(data).encode() + b"</script>"
        extras = parse_page_extras(page)
        self.assertEqual(extras["rating_counts"], [50, 20, 5, 2, 3])
        self.assertEqual(extras["screenshots"], [{"template": "https://x/a.jpg/{w}x{h}{c}.{f}", "width": 1242, "height": 2688}])
        self.assertIsNone(parse_page_extras(b"<html></html>"))

    def test_no_iaps_and_unreadable_pages(self):
        self.assertEqual(parse_app_page(app_page([{"title": "Seller", "items": []}])), [])
        self.assertIsNone(parse_app_page(b"<html></html>"))

    def test_prices(self):
        self.assertEqual(parse_price("$1,299.99"), (Decimal("1299.99"), "USD"))
        self.assertEqual(parse_price("1.299,99 €"), (Decimal("1299.99"), "EUR"))
        self.assertIsNone(parse_price("4+"))
        self.assertIsNone(parse_price("312.4 MB"))

    def test_monetization_models(self):
        def items(*rows):
            return [(name, Decimal(price), "USD") for name, price in rows]
        calm = classify(0, items(("Calm Premium", "79.99"), ("Calm Premium", "14.99"), ("Calm Premium", "69.99")))
        self.assertEqual((calm["model"], calm["sub_annual_price"]), ("subscription", 74.99))
        weekly = classify(0, items(("Pro Weekly", "4.99"), ("Pro Monthly", "9.99")))
        self.assertEqual(weekly["sub_annual_price"], round((4.99 * 52 + 9.99 * 12) / 2, 2))
        # An explicit yearly plan wins over monthly × 12.
        espn = classify(0, items(("ESPN+ Monthly", "13.99"), ("ESPN+ Monthly", "13.99"), ("ESPN+ Yearly", "139.99")))
        self.assertEqual(espn["sub_annual_price"], 139.99)
        game = classify(0, items(("Special Offer", "4.99"), ("Special Offer", "9.99"), ("Pouch of Gems", "0.99")))
        self.assertEqual((game["model"], game["iap_typical"]), ("iap", 4.99))
        self.assertEqual(classify(Decimal("5.99"), [])["model"], "paid")
        self.assertEqual(classify(0, [])["model"], "free")


class EstimateModel(unittest.TestCase):
    def test_rank_curves_fall_with_rank(self):
        self.assertAlmostEqual(curve("top-free", 1), 156_000)
        self.assertGreater(curve("top-free", 10), 45_000)  # Sensor Tower 2022: top-10 threshold ≈ 52k/day
        self.assertLess(curve("top-free", 200), curve("top-free", 11))
        self.assertLess(curve("top-paid", 1), curve("top-free", 200))
        self.assertAlmostEqual(curve("top-grossing", 1), 2_500_000)
        self.assertLess(curve("top-grossing", 100), curve("top-grossing", 10))

    def test_revenue_per_download(self):
        self.assertIsNone(rpd("ios", None, 0, None, None))
        self.assertEqual(rpd("ios", "free", 0, None, None), 0)
        self.assertEqual(rpd("ios", "paid", 5.99, None, None), 5.99)
        self.assertGreater(rpd("ios", "subscription", 0, 120, None), rpd("ios", "subscription", 0, 20, None))
        self.assertLess(rpd("android", "iap", 0, None, 5), rpd("ios", "iap", 0, None, 5))
        self.assertEqual(net_factor("iap", 1_000_000), 0.70)
        self.assertEqual(net_factor("iap", 10_000), 0.85)


class Calibration(unittest.TestCase):
    def test_anchor_range_multiplies_the_shares(self):
        row = {"reported_month_usd": 100.0, "us_low": 0.5, "us_high": 0.5, "ios_low": 0.5, "ios_high": 1.0,
               "store_low": 1.0, "store_high": 1.0}
        self.assertEqual(anchor_range(row), (25.0, 50.0))

    def test_fit_recovers_a_known_scale(self):
        def month(rank):
            return 4_000_000 * rank ** -0.75 * 30
        anchors = [(r, month(r) / 1.2, month(r) * 1.2) for r in (10, 30, 80)]
        scale, spread = fit_scale(anchors)
        self.assertAlmostEqual(scale, 4_000_000, delta=1)
        self.assertAlmostEqual(spread, 0, places=6)


if __name__ == "__main__":
    unittest.main()
