-- Extra facts from the App Store page that refresh-iap already loads (no extra requests): the star histogram and the
-- iPhone screenshots. One row per app, replaced on each fetch.
CREATE TABLE app_store_page (
  app_id         bigint PRIMARY KEY,
  country        text NOT NULL,
  fetched_at     timestamptz NOT NULL,
  rating_counts  bigint[],                       -- ratings with 5, 4, 3, 2, 1 stars (in this order)
  screenshots    jsonb                           -- [{"template": ".../{w}x{h}{c}.{f}", "width": 1242, "height": 2688}, …]
);
