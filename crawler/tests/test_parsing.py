import unittest

from appcrawl.discover import parse_apple_urlset, parse_locs, parse_play_urlset, sitemap_indexes
from appcrawl.enrich_android import _domain

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


class SitemapParsing(unittest.TestCase):
    def test_indexes_from_robots(self):
        self.assertEqual(
            sitemap_indexes("ios", APPLE_ROBOTS),
            {
                "https://apps.apple.com/sitemaps_apps_index_app_1.xml": "app",
                "https://apps.apple.com/sitemaps_apps_index_new-app_1.xml": "new-app",
            },
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

    def test_developer_domain(self):
        self.assertEqual(_domain("https://www.duolingo.com/help"), "duolingo.com")
        self.assertEqual(_domain("example.org"), "example.org")
        self.assertIsNone(_domain(None))


if __name__ == "__main__":
    unittest.main()
