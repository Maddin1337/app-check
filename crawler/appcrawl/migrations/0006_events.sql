-- Dated events per app, derived daily by comparing the latest observation with the previous one (appcrawl/events.py).
-- The feed, the app page and later watchlist alerts read from here.

CREATE TABLE app_events (
  day          date NOT NULL,                   -- day of the newer observation
  app_id       bigint NOT NULL,
  kind         text NOT NULL,                   -- 'rank_up' | 'rank_down' | 'top100_entry' | 'ratings_spike'
                                                -- | 'installs_spike' | 'price_change' | 'new_version'
  country      text NOT NULL DEFAULT '',        -- storefront ('ww' for Android counters, '' if not applicable)
  chart        text NOT NULL DEFAULT '',        -- for rank events: 'top-free' | 'top-paid' | 'top-grossing'
  old_value    text,                            -- previous rank / count / price / version
  new_value    text,
  magnitude    real NOT NULL,                   -- for sorting: places moved, added count, relative price change …
  previous_day date,                            -- day of the older observation
  PRIMARY KEY (day, app_id, kind, country, chart)
);
CREATE INDEX app_events_app ON app_events (app_id, day DESC);
CREATE INDEX app_events_feed ON app_events (day DESC, kind, magnitude DESC);
