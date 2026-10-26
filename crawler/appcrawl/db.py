"""SQLite storage for the catalog extract.

SQLite keeps the extract self-contained and resumable on any machine. The tables mirror
the Postgres schema in docs/research/03-datenbank-aufbau.md §10 closely enough that
`export` produces CSV files for a later `COPY` into Postgres.
"""

import sqlite3
from datetime import datetime, timezone

SCHEMA = """
CREATE TABLE IF NOT EXISTS sitemap_files (
  url         TEXT PRIMARY KEY,
  platform    TEXT NOT NULL,              -- 'ios' | 'android'
  kind        TEXT NOT NULL,              -- 'app' | 'new-app' | 'play'
  status      INTEGER,                    -- HTTP status, NULL = pending
  bytes       INTEGER,                    -- uncompressed size
  urls        INTEGER,                    -- <loc> entries in the file
  apps        INTEGER,                    -- distinct apps found
  fetched_at  TEXT,
  error       TEXT
);

CREATE TABLE IF NOT EXISTS app_keys (
  platform       TEXT NOT NULL,
  store_id       TEXT NOT NULL,           -- iOS trackId, Android package name
  slug           TEXT,                    -- iOS URL slug (readable name hint)
  storefronts    INTEGER,                 -- iOS: storefront URLs in the sitemap (a hint, not availability)
  discovered_via TEXT NOT NULL,           -- 'sitemap:app', 'sitemap:new-app', 'sitemap:play'
  first_seen_at  TEXT NOT NULL,
  last_seen_at   TEXT NOT NULL,
  enrich_status  TEXT,                    -- NULL = pending, 'ok', 'not_found', 'error'
  enriched_at    TEXT,
  PRIMARY KEY (platform, store_id)
);
CREATE INDEX IF NOT EXISTS app_keys_enrich ON app_keys (platform, enrich_status);

CREATE TABLE IF NOT EXISTS ios_apps (
  track_id                     INTEGER PRIMARY KEY,
  country                      TEXT NOT NULL,
  name                         TEXT,
  bundle_id                    TEXT,
  artist_id                    INTEGER,
  artist_name                  TEXT,
  seller_name                  TEXT,
  primary_genre_id             INTEGER,
  primary_genre                TEXT,
  genre_ids                    TEXT,      -- JSON array
  price                        REAL,
  currency                     TEXT,
  rating_avg                   REAL,
  rating_count                 INTEGER,
  released_at                  TEXT,
  current_version_released_at  TEXT,
  version                      TEXT,
  content_rating               TEXT,
  size_bytes                   INTEGER,
  min_os                       TEXT,
  languages                    TEXT,      -- JSON array
  icon_url                     TEXT,
  seller_url                   TEXT,
  store_url                    TEXT,
  fetched_at                   TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS android_apps (
  package             TEXT PRIMARY KEY,
  country             TEXT NOT NULL,
  name                TEXT,
  developer           TEXT,
  developer_id        TEXT,
  developer_domain    TEXT,               -- domain only; no e-mail/address (GDPR minimisation)
  genre_id            TEXT,
  genre               TEXT,
  free                INTEGER,
  price               REAL,
  currency            TEXT,
  offers_iap          INTEGER,
  iap_price_range     TEXT,
  contains_ads        INTEGER,
  installs_bucket     INTEGER,            -- minInstalls
  installs_exact      INTEGER,            -- realInstalls
  rating_avg          REAL,
  rating_count        INTEGER,
  review_count        INTEGER,
  released            TEXT,
  updated_at          TEXT,
  version             TEXT,
  content_rating      TEXT,
  icon_url            TEXT,
  fetched_at          TEXT NOT NULL
);
"""


def now() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def connect(path: str) -> sqlite3.Connection:
    connection = sqlite3.connect(path, timeout=60)  # discovery and enrichment may run side by side
    connection.execute("PRAGMA journal_mode=WAL")
    connection.execute("PRAGMA synchronous=NORMAL")
    connection.executescript(SCHEMA)
    return connection


def upsert_app_keys(connection: sqlite3.Connection, platform: str, source: str, apps: dict) -> None:
    """apps maps store_id -> (slug, storefronts)."""
    seen = now()
    connection.executemany(
        """INSERT INTO app_keys (platform, store_id, slug, storefronts, discovered_via, first_seen_at, last_seen_at)
           VALUES (?, ?, ?, ?, ?, ?, ?)
           ON CONFLICT (platform, store_id) DO UPDATE SET
             last_seen_at = excluded.last_seen_at,
             slug = COALESCE(app_keys.slug, excluded.slug),
             storefronts = MAX(COALESCE(app_keys.storefronts, 0), COALESCE(excluded.storefronts, 0))""",
        [(platform, store_id, slug, storefronts, source, seen, seen) for store_id, (slug, storefronts) in apps.items()],
    )
