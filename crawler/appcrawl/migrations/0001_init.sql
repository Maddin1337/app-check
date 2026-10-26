-- Catalog, crawl state and daily time series. Postgres 15+.
-- Design notes: docs/research/03-datenbank-aufbau.md §10 and 07-architektur-roadmap.md §5.

CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Child sitemaps of both stores and how far discovery got through them.
CREATE TABLE sitemap_files (
  url         text PRIMARY KEY,
  platform    text NOT NULL CHECK (platform IN ('ios', 'android')),
  kind        text NOT NULL,                     -- 'app' | 'new-app' | 'play' | 'chart'
  status      smallint,                          -- HTTP status, NULL = pending
  bytes       bigint,                            -- uncompressed size
  urls        integer,                           -- <loc> entries
  apps        integer,                           -- distinct apps found
  fetched_at  timestamptz,
  error       text
);
CREATE INDEX sitemap_files_pending ON sitemap_files (platform, kind) WHERE status IS NULL;

-- One row per app and platform: current state used by search and filters.
CREATE TABLE apps (
  id                bigserial PRIMARY KEY,
  platform          text NOT NULL CHECK (platform IN ('ios', 'android')),
  store_id          text NOT NULL,               -- iOS trackId, Android package name
  status            text NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending', 'active', 'not_found', 'error')),
  tier              smallint NOT NULL DEFAULT 2,  -- 0 hot … 3 dead, see tiers.py

  -- discovery
  slug              text,                        -- iOS URL slug, a name hint before the first refresh
  discovered_via    text NOT NULL,               -- 'sitemap:app', 'sitemap:new-app', 'sitemap:play', 'chart', 'import'
  first_seen_at     timestamptz NOT NULL DEFAULT now(),
  last_seen_at      timestamptz NOT NULL DEFAULT now(),

  -- refresh scheduling
  refreshed_at      timestamptz,
  next_refresh_at   timestamptz,                 -- NULL = never refreshed, picked first
  refresh_country   text,                        -- storefront the metadata below comes from

  -- metadata, both platforms
  name              text,
  developer_id      text,
  developer_name    text,
  developer_domain  text,                        -- for iOS/Android matching; no personal contact data
  category_id       text,
  category          text,
  genre_ids         text[],
  price             numeric(10, 2),
  currency          text,
  rating_avg        real,
  rating_count      bigint,                      -- iOS: refresh_country storefront; Android: global
  released_at       date,
  store_updated_at  timestamptz,
  version           text,
  content_rating    text,
  icon_url          text,

  -- iOS
  bundle_id         text,
  seller_name       text,
  size_bytes        bigint,
  min_os            text,
  languages         text[],

  -- Android
  installs_bucket   bigint,                      -- public bucket, e.g. 1,000,000+
  installs_exact    bigint,                      -- exact counter from the detail page
  review_count      bigint,
  offers_iap        boolean,
  iap_price_range   text,
  contains_ads      boolean,

  UNIQUE (platform, store_id)
);
CREATE INDEX apps_refresh_due ON apps (platform, next_refresh_at NULLS FIRST, tier);
CREATE INDEX apps_category ON apps (platform, category_id) WHERE status = 'active';
CREATE INDEX apps_released ON apps (released_at) WHERE status = 'active';
CREATE INDEX apps_rating_count ON apps (rating_count DESC NULLS LAST) WHERE status = 'active';
CREATE INDEX apps_installs ON apps (installs_exact DESC NULLS LAST) WHERE platform = 'android' AND status = 'active';
CREATE INDEX apps_bundle ON apps (bundle_id) WHERE bundle_id IS NOT NULL;
CREATE INDEX apps_name_trgm ON apps USING gin (name gin_trgm_ops);

-- Chart positions, one snapshot per chart and day (the latest capture of the day wins).
CREATE TABLE chart_ranks (
  captured_on  date NOT NULL,
  captured_at  timestamptz NOT NULL,
  platform     text NOT NULL,
  country      text NOT NULL,
  device       text NOT NULL,                    -- 'iphone' | 'ipad' | 'mac'
  chart        text NOT NULL,                    -- 'top-free' | 'top-paid' | 'top-grossing'
  genre_id     text NOT NULL,                    -- '36' = all apps
  rank         smallint NOT NULL,
  app_id       bigint NOT NULL,
  source       text NOT NULL,                    -- 'apple_web' | 'apple_rss'
  PRIMARY KEY (captured_on, platform, country, device, chart, genre_id, rank)
) PARTITION BY RANGE (captured_on);
CREATE INDEX chart_ranks_app ON chart_ranks (app_id, captured_on);
CREATE TABLE chart_ranks_default PARTITION OF chart_ranks DEFAULT;

-- Daily counters per app and storefront: the basis for downloads, growth and estimates.
CREATE TABLE app_metrics_daily (
  day              date NOT NULL,
  app_id           bigint NOT NULL,
  country          text NOT NULL,                -- iOS storefront; 'ww' for Android's global counters
  rating_count     bigint,
  rating_avg       real,
  installs_exact   bigint,
  installs_bucket  bigint,
  review_count     bigint,
  price            numeric(10, 2),
  version          text,
  fetched_at       timestamptz NOT NULL,
  PRIMARY KEY (app_id, country, day)
) PARTITION BY RANGE (day);
CREATE TABLE app_metrics_daily_default PARTITION OF app_metrics_daily DEFAULT;
