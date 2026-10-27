-- Apple Search Ads shown in the EU, from Apple's public Ad Repository API (appcrawl/ads_apple.py, docs/research/05 §2.5).
-- One row per ad and storefront; data lag about 7 days behind.
CREATE TABLE apple_ads (
  ad_id               text NOT NULL,
  country             text NOT NULL,
  app_id              bigint NOT NULL,
  placement           text,                     -- APPSTORE_SEARCH_RESULTS | APPSTORE_TODAY_TAB | APPSTORE_SEARCH_TAB …
  format              text,                     -- 'Icon Ad' | 'Icon + Asset Ad' …
  first_impression    date,
  last_impression     date,
  language            text,
  audience            jsonb,                    -- which refinements the advertiser used (age, gender, location, customer type)
  assets              jsonb,                    -- picture/video URLs of the creative (store assets)
  fetched_at          timestamptz NOT NULL,
  PRIMARY KEY (ad_id, country)
);
CREATE INDEX apple_ads_app ON apple_ads (app_id, last_impression DESC);

-- When each app was last looked up, so every app is asked about once a week.
CREATE TABLE apple_ads_fetch (
  app_id       bigint PRIMARY KEY,
  fetched_at   timestamptz NOT NULL,
  ads          integer NOT NULL,
  data_end     date                             -- the repository's dataEndDate at that time
);
