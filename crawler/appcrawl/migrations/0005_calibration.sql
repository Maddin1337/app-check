-- Ground truth for the estimate model and the parameters fitted from it (appcrawl/calibrate.py).

-- Reported revenue of real apps, with the assumptions that turn it into US App Store store-billed revenue.
-- Loaded from appcrawl/data/ground_truth.csv; every row keeps its source.
CREATE TABLE ground_truth (
  platform            text NOT NULL,
  store_id            text NOT NULL,
  period_start        date NOT NULL,
  app                 text NOT NULL,
  period_end          date NOT NULL,
  reported_month_usd  numeric NOT NULL,          -- as reported: usually worldwide, all platforms, gross of store fees
  us_low              real NOT NULL,             -- share of it that is US …
  us_high             real NOT NULL,
  ios_low             real NOT NULL,             -- … paid on iOS …
  ios_high            real NOT NULL,
  store_low           real NOT NULL,             -- … through Apple's in-app purchase rather than the web
  store_high          real NOT NULL,
  source_url          text NOT NULL,
  note                text,
  PRIMARY KEY (platform, store_id, period_start)
);

-- Fitted model parameters; estimates.py falls back to its priors for keys missing here.
CREATE TABLE model_calibration (
  key          text PRIMARY KEY,                 -- e.g. 'grossing_top'
  value        double precision NOT NULL,
  prior        double precision NOT NULL,
  anchors      integer NOT NULL,
  spread       double precision,                 -- residual spread of the anchors (natural log)
  computed_at  timestamptz NOT NULL DEFAULT now()
);
