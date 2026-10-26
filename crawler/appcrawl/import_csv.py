"""Loads CSV exports back into Postgres, e.g. to move the data to a new server.

Supported files (gzip CSV with header):
- apps:    `appcrawl export` output (all columns of `apps`), or the earlier SQLite-era export
           (ios-apps-*.csv.gz / android-apps-*.csv.gz)
- charts:  chart_ranks with store IDs (captured_on, …, rank, store_id, source)
- metrics: app_metrics_daily with store IDs (day, platform, store_id, country, …)

Existing rows are left untouched, so importing never overwrites fresher data. Apps that charts or
metrics refer to but the database lacks are added as pending keys. SQLite-era apps keep
next_refresh_at NULL and are therefore refreshed first.
"""

import csv
import gzip
import sys
from datetime import date

import psycopg

from . import db

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


CHARTS = """
  INSERT INTO chart_ranks (captured_on, captured_at, platform, country, device, chart, genre_id, rank, app_id, source)
  SELECT r.captured_on::date, r.captured_at::timestamptz, r.platform, r.country, r.device, r.chart, r.genre_id,
         r.rank::smallint, a.id, r.source
  FROM import_rows r JOIN apps a ON a.platform = r.platform AND a.store_id = r.store_id
  ON CONFLICT DO NOTHING"""

METRICS = """
  INSERT INTO app_metrics_daily (day, app_id, country, rating_count, rating_avg, installs_exact, installs_bucket,
                                 review_count, price, version, fetched_at)
  SELECT r.day::date, a.id, r.country, NULLIF(r.rating_count, '')::bigint, NULLIF(r.rating_avg, '')::real,
         NULLIF(r.installs_exact, '')::bigint, NULLIF(r.installs_bucket, '')::bigint,
         NULLIF(r.review_count, '')::bigint, NULLIF(r.price, '')::numeric, NULLIF(r.version, ''),
         r.fetched_at::timestamptz
  FROM import_rows r JOIN apps a ON a.platform = r.platform AND a.store_id = r.store_id
  ON CONFLICT DO NOTHING"""


def _native_apps_insert(connection: psycopg.Connection, header: list[str]) -> str:
    """INSERT … SELECT that casts every exported `apps` column back to its type (id is reassigned)."""
    types = dict(connection.execute(
        "SELECT attname, format_type(atttypid, atttypmod) FROM pg_attribute "
        "WHERE attrelid = 'apps'::regclass AND attnum > 0 AND NOT attisdropped"
    ).fetchall())
    columns = [c for c in header if c != "id" and c in types]
    select = ", ".join(f'NULLIF("{c}", \'\')::{types[c]}' for c in columns)
    names = ", ".join(columns)
    # Placeholders that a chart or metrics import created take the full row; real data is never overwritten.
    updates = ", ".join(f"{c} = excluded.{c}" for c in columns if c not in ("platform", "store_id"))
    return (f"INSERT INTO apps ({names}) SELECT {select} FROM import_rows ON CONFLICT (platform, store_id) "
            f"DO UPDATE SET {updates} WHERE apps.discovered_via = 'import' AND apps.refreshed_at IS NULL")


def _add_missing_keys(connection: psycopg.Connection) -> int:
    return connection.execute(
        """INSERT INTO apps (platform, store_id, discovered_via)
           SELECT DISTINCT platform, store_id, 'import' FROM import_rows
           ON CONFLICT (platform, store_id) DO NOTHING"""
    ).rowcount


def import_csv(connection: psycopg.Connection, kind: str, path: str) -> None:
    with gzip.open(path, "rt", newline="", encoding="utf-8") as handle:
        header = next(csv.reader(handle))
        columns = ", ".join(f'"{c}" text' for c in header)
        with connection.transaction():
            connection.execute(f"CREATE TEMP TABLE import_rows ({columns}) ON COMMIT DROP")
            with connection.cursor().copy("COPY import_rows FROM STDIN (FORMAT csv)") as copy:
                while chunk := handle.read(1 << 20):
                    copy.write(chunk)
            staged = connection.execute("SELECT COUNT(*) FROM import_rows").fetchone()[0]
            added = 0
            if kind in ("charts", "metrics"):
                day_column = "captured_on" if kind == "charts" else "day"
                table = "chart_ranks" if kind == "charts" else "app_metrics_daily"
                for (month,) in connection.execute(
                    f"SELECT DISTINCT date_trunc('month', {day_column}::date)::date FROM import_rows"
                ).fetchall():
                    db.ensure_month_partition(connection, table, month if isinstance(month, date) else date.fromisoformat(month))
                added = _add_missing_keys(connection)
                inserted = connection.execute(CHARTS if kind == "charts" else METRICS).rowcount
            elif "status" in header and "platform" in header:
                inserted = connection.execute(_native_apps_insert(connection, header)).rowcount
            else:
                inserted = connection.execute(MAPPINGS[kind]).rowcount
    extra = f", {added:,} missing apps added as pending" if added else ""
    print(f"{kind}: {staged:,} rows read, {inserted:,} new rows imported{extra} from {path}", file=sys.stderr)
