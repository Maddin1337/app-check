-- In-app purchase prices and model v0 estimates for downloads and revenue.
-- Methods and caveats: docs/research/04-schaetzmodelle.md §2–3 and §9, appcrawl/estimates.py.

-- The in-app purchases an app's store page lists, in the order shown (Apple lists its top IAPs).
CREATE TABLE iap_products (
  app_id      bigint NOT NULL,
  country     text NOT NULL,
  position    smallint NOT NULL,
  name        text NOT NULL,
  price       numeric(10, 2) NOT NULL,
  currency    text NOT NULL,
  PRIMARY KEY (app_id, country, position)
);

-- How an app makes money, derived from price and IAP list. One row per app.
CREATE TABLE app_monetization (
  app_id            bigint PRIMARY KEY,
  country           text NOT NULL,              -- storefront of the IAP list; 'ww' for Android
  fetched_at        timestamptz NOT NULL,
  model             text NOT NULL CHECK (model IN ('subscription', 'iap', 'paid', 'free')),
  iap_count         smallint NOT NULL DEFAULT 0,
  iap_min           numeric(10, 2),
  iap_max           numeric(10, 2),
  iap_typical       numeric(10, 2),             -- median listed price
  sub_annual_price  numeric(10, 2),             -- annualised subscription price, NULL if not a subscription
  currency          text
);

-- Daily estimates per app. 'us' = US App Store only (iOS), 'ww' = worldwide (Android installs).
-- Revenue is gross (what customers pay, excl. VAT), USD per month; net applies the store fee.
CREATE TABLE app_estimates_daily (
  day                 date NOT NULL,
  app_id              bigint NOT NULL,
  platform            text NOT NULL,
  scope               text NOT NULL,
  downloads_p10       real NOT NULL,           -- per day
  downloads_p50       real NOT NULL,
  downloads_p90       real NOT NULL,
  revenue_p10         real,                    -- per month, gross USD; NULL while monetization is unknown
  revenue_p50         real,
  revenue_p90         real,
  revenue_net_p50     real,
  download_method     text NOT NULL,           -- 'chart' | 'chart-category' | 'ratings' | 'installs'
  monetization        text,                    -- app_monetization.model, NULL = not yet known
  confidence          text NOT NULL CHECK (confidence IN ('low', 'medium', 'high')),
  model_version       text NOT NULL,
  PRIMARY KEY (app_id, day)
) PARTITION BY RANGE (day);
CREATE TABLE app_estimates_daily_default PARTITION OF app_estimates_daily DEFAULT;
CREATE INDEX app_estimates_day_revenue ON app_estimates_daily (day, platform, revenue_p50 DESC NULLS LAST);
