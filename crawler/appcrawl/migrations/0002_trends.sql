-- Growth per app over the last 7 and 30 days, recomputed daily by `appcrawl trends` (trends.py).
-- iOS measures rating count growth in one storefront, Android the exact install counter.

CREATE TABLE app_trends (
  app_id        bigint NOT NULL,
  window_days   smallint NOT NULL,                -- 7 | 30
  platform      text NOT NULL,
  metric        text NOT NULL,                    -- 'ratings' | 'installs'
  country       text NOT NULL,                    -- storefront of the series; 'ww' for Android
  start_day     date NOT NULL,                    -- first measurement inside the window
  end_day       date NOT NULL,                    -- latest measurement
  start_value   bigint NOT NULL,
  end_value     bigint NOT NULL,
  delta         bigint NOT NULL,
  per_day       real NOT NULL,                    -- delta / days between start and end
  growth        real,                             -- delta / start_value, NULL when start_value = 0
  points        smallint NOT NULL,                -- measurements inside the window
  computed_at   timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (app_id, window_days)
);
CREATE INDEX app_trends_per_day ON app_trends (window_days, platform, per_day DESC);
CREATE INDEX app_trends_growth ON app_trends (window_days, platform, growth DESC NULLS LAST);
