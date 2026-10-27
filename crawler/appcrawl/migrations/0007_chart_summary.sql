-- Best chart position per app on the latest captured chart day, refreshed after every chart collection
-- (charts.refresh_chart_summary). Aggregating chart_ranks per request cost seconds in the explorer once the catalog grew.
CREATE TABLE app_chart_summary (
  app_id         bigint PRIMARY KEY,
  day            date NOT NULL,
  best_rank      smallint NOT NULL,
  chart_entries  integer NOT NULL
);
CREATE INDEX app_chart_summary_rank ON app_chart_summary (best_rank);
