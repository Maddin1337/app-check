import json
import unittest

from appcrawl.charts import CHART_URL, parse_chart_page, parse_grossing_rss
from appcrawl.discover import parse_apple_urlset, parse_locs, parse_play_urlset, sitemap_indexes
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


if __name__ == "__main__":
    unittest.main()
