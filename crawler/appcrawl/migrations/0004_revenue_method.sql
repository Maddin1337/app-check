-- Which signal the revenue estimate rests on, next to download_method (appcrawl/estimates.py):
-- 'grossing' | 'grossing-category' (Top Grossing rank, path A), 'rpd' (downloads × revenue per download, path B/C),
-- 'combined' (both, weighted by their spread).
-- Apps that only stand in a Top Grossing chart get revenue without a download estimate.
ALTER TABLE app_estimates_daily ADD COLUMN revenue_method text;
ALTER TABLE app_estimates_daily ALTER COLUMN downloads_p10 DROP NOT NULL;
ALTER TABLE app_estimates_daily ALTER COLUMN downloads_p50 DROP NOT NULL;
ALTER TABLE app_estimates_daily ALTER COLUMN downloads_p90 DROP NOT NULL;
ALTER TABLE app_estimates_daily ALTER COLUMN download_method DROP NOT NULL;
