"""Loads an earlier SQLite-era export (ios-apps-*.csv.gz / android-apps-*.csv.gz) into Postgres.

Existing apps are left untouched, so importing never overwrites fresher data. Imported apps
keep next_refresh_at NULL and are therefore refreshed first.
"""

import csv
import gzip
import sys

import psycopg

MAPPINGS = {
    "ios": """
      INSERT INTO apps (platform, store_id, slug, discovered_via, first_seen_at, status, refreshed_at, refresh_country,
                        name, developer_id, developer_name, category_id, category, genre_ids, price, currency,
                        rating_avg, rating_count, released_at, store_updated_at, version, content_rating, icon_url,
                        bundle_id, seller_name, size_bytes, min_os, languages)
      SELECT 'ios', store_id, NULLIF(slug, ''), discovered_via, first_seen_at::timestamptz,
             CASE enrich_status WHEN 'ok' THEN 'active' WHEN 'not_found' THEN 'not_found' ELSE 'pending' END,
             NULLIF(fetched_at, '')::timestamptz, NULLIF(country, ''),
             NULLIF(name, ''), NULLIF(artist_id, ''), NULLIF(artist_name, ''), NULLIF(primary_genre_id, ''),
             NULLIF(primary_genre, ''),
             CASE WHEN genre_ids LIKE '[%' THEN ARRAY(SELECT json_array_elements_text(genre_ids::json)) END,
             NULLIF(price, '')::numeric, NULLIF(currency, ''), NULLIF(rating_avg, '')::real,
             NULLIF(rating_count, '')::bigint, left(NULLIF(released_at, ''), 10)::date,
             NULLIF(current_version_released_at, '')::timestamptz, NULLIF(version, ''), NULLIF(content_rating, ''),
             NULLIF(icon_url, ''), NULLIF(bundle_id, ''), NULLIF(seller_name, ''), NULLIF(size_bytes, '')::bigint,
             NULLIF(min_os, ''),
             CASE WHEN languages LIKE '[%' THEN ARRAY(SELECT json_array_elements_text(languages::json)) END
      FROM import_rows
      ON CONFLICT (platform, store_id) DO NOTHING""",
    "android": """
      INSERT INTO apps (platform, store_id, discovered_via, first_seen_at, status, refreshed_at, refresh_country,
                        name, developer_id, developer_name, developer_domain, category_id, category, price, currency,
                        rating_avg, rating_count, released_at, store_updated_at, version, content_rating, icon_url,
                        installs_bucket, installs_exact, review_count, offers_iap, iap_price_range, contains_ads)
      SELECT 'android', store_id, discovered_via, first_seen_at::timestamptz,
             CASE enrich_status WHEN 'ok' THEN 'active' WHEN 'not_found' THEN 'not_found' ELSE 'pending' END,
             NULLIF(fetched_at, '')::timestamptz, NULLIF(country, ''),
             NULLIF(name, ''), NULLIF(developer_id, ''), NULLIF(developer, ''), NULLIF(developer_domain, ''),
             NULLIF(genre_id, ''), NULLIF(genre, ''), NULLIF(price, '')::numeric, NULLIF(currency, ''),
             NULLIF(rating_avg, '')::real, NULLIF(rating_count, '')::bigint,
             to_date(NULLIF(released, ''), 'Mon DD, YYYY'), NULLIF(updated_at, '')::timestamptz,
             NULLIF(version, ''), NULLIF(content_rating, ''), NULLIF(icon_url, ''),
             NULLIF(installs_bucket, '')::bigint, NULLIF(installs_exact, '')::bigint, NULLIF(review_count, '')::bigint,
             NULLIF(offers_iap, '')::int::boolean, NULLIF(iap_price_range, ''), NULLIF(contains_ads, '')::int::boolean
      FROM import_rows
      ON CONFLICT (platform, store_id) DO NOTHING""",
}


def import_csv(connection: psycopg.Connection, platform: str, path: str) -> None:
    with gzip.open(path, "rt", newline="", encoding="utf-8") as handle:
        header = next(csv.reader(handle))
        columns = ", ".join(f'"{c}" text' for c in header)
        with connection.transaction():
            connection.execute(f"CREATE TEMP TABLE import_rows ({columns}) ON COMMIT DROP")
            with connection.cursor().copy("COPY import_rows FROM STDIN (FORMAT csv)") as copy:
                while chunk := handle.read(1 << 20):
                    copy.write(chunk)
            staged = connection.execute("SELECT COUNT(*) FROM import_rows").fetchone()[0]
            inserted = connection.execute(MAPPINGS[platform]).rowcount
    print(f"{platform}: {staged:,} rows read, {inserted:,} new apps imported from {path}", file=sys.stderr)
