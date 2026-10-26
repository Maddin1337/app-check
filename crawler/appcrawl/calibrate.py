"""Calibrates the Top Grossing rank curve on ground truth (docs/research/04-schaetzmodelle.md §2.7).

Ground truth comes from public company reports (appcrawl/data/ground_truth.csv), mostly worldwide revenue over all
platforms. Each row carries ranges for the US share, the iOS share and the share billed through Apple; their product
gives a US App Store range per app. Its geometric middle is the anchor, its width the anchor's uncertainty.

With the slope β fixed (GROSSING_BETA), every anchor at US Top Grossing rank r implies a curve scale
A = revenue_per_day × r^β. The fitted scale is the inverse-variance weighted geometric mean of those implied scales.
β itself is not fitted: a handful of anchors between rank 20 and 75 cannot tell a slope from noise.
"""

import csv
import math
import sys
from pathlib import Path

import psycopg

from .estimates import GROSSING_BETA, GROSSING_TOP, Z90

GROUND_TRUTH = Path(__file__).with_name("data") / "ground_truth.csv"
CURVE_SIGMA = 0.3  # scatter of real apps around a rank curve, added to each anchor's own uncertainty


def load_ground_truth(connection: psycopg.Connection, path: Path = GROUND_TRUTH) -> int:
    with path.open(newline="") as handle:
        rows = list(csv.DictReader(handle))
    columns = ["platform", "store_id", "period_start", "app", "period_end", "reported_month_usd", "us_low", "us_high",
               "ios_low", "ios_high", "store_low", "store_high", "source_url", "note"]
    with connection.cursor() as cursor:
        cursor.executemany(
            f"""INSERT INTO ground_truth ({", ".join(columns)}) VALUES ({", ".join(["%s"] * len(columns))})
                ON CONFLICT (platform, store_id, period_start) DO UPDATE SET
                  {", ".join(f"{c} = excluded.{c}" for c in columns[3:])}""",
            [[row[c] or None for c in columns] for row in rows],
        )
    connection.commit()
    return len(rows)


def anchor_range(row: dict) -> tuple[float, float]:
    """US App Store revenue per month as (low, high) from a ground-truth row."""
    value = float(row["reported_month_usd"])
    low = value * row["us_low"] * row["ios_low"] * row["store_low"]
    high = value * row["us_high"] * row["ios_high"] * row["store_high"]
    return low, high


def fit_scale(anchors: list[tuple[float, float, float]], beta: float = GROSSING_BETA) -> tuple[float, float]:
    """anchors = [(rank, low, high) per month] -> (scale per day at rank 1, residual spread in natural log)."""
    implied, weights = [], []
    for rank, low, high in anchors:
        sigma = math.hypot(math.log(high / low) / (2 * Z90), CURVE_SIGMA)
        implied.append(math.log(math.sqrt(low * high) / 30 * rank**beta))
        weights.append(1 / sigma**2)
    mean = sum(w * x for w, x in zip(weights, implied)) / sum(weights)
    spread = math.sqrt(sum((x - mean) ** 2 for x in implied) / len(implied))
    return math.exp(mean), spread


def calibrate(connection: psycopg.Connection) -> dict:
    """Fits the grossing scale on every ground-truth app with a recent US Top Grossing rank and stores it."""
    load_ground_truth(connection)
    rows = connection.execute(
        """SELECT g.app, g.reported_month_usd, g.us_low, g.us_high, g.ios_low, g.ios_high, g.store_low, g.store_high,
                  r.rank
           FROM ground_truth g
           JOIN apps a ON a.platform = g.platform AND a.store_id = g.store_id
           JOIN LATERAL (
             SELECT percentile_cont(0.5) WITHIN GROUP (ORDER BY rank) AS rank FROM chart_ranks c
             WHERE c.app_id = a.id AND c.country = 'us' AND c.device = 'iphone' AND c.chart = 'top-grossing'
               AND c.genre_id = '36'
               AND c.captured_on > (SELECT MAX(captured_on) FROM chart_ranks WHERE chart = 'top-grossing') - 3
           ) r ON r.rank IS NOT NULL
           ORDER BY r.rank"""
    ).fetchall()
    keys = ["app", "reported_month_usd", "us_low", "us_high", "ios_low", "ios_high", "store_low", "store_high", "rank"]
    anchors = [dict(zip(keys, row)) for row in rows]
    if not anchors:
        print("calibrate: no ground-truth app with a current US Top Grossing rank; priors stay", file=sys.stderr)
        return {}

    scale, spread = fit_scale([(a["rank"], *anchor_range(a)) for a in anchors])
    for a in anchors:
        low, high = anchor_range(a)
        prior, fitted = (GROSSING_TOP * a["rank"] ** -GROSSING_BETA * 30, scale * a["rank"] ** -GROSSING_BETA * 30)
        print(f"calibrate: {a['app']:<10} rank {a['rank']:>5.1f}  truth ${low / 1e6:6.1f}M–{high / 1e6:6.1f}M  "
              f"prior ${prior / 1e6:6.1f}M  fitted ${fitted / 1e6:6.1f}M", file=sys.stderr)
    best_rank = min(a["rank"] for a in anchors)
    with connection.cursor() as cursor:
        cursor.executemany(
            """INSERT INTO model_calibration (key, value, prior, anchors, spread) VALUES (%s, %s, %s, %s, %s)
               ON CONFLICT (key) DO UPDATE SET value = excluded.value, prior = excluded.prior,
                 anchors = excluded.anchors, spread = excluded.spread, computed_at = now()""",
            [("grossing_top", scale, GROSSING_TOP, len(anchors), spread),
             # Above the best-ranked anchor the curve is extrapolated; estimates.py widens the range there.
             ("grossing_anchor_rank", best_rank, 1, len(anchors), None)],
        )
    connection.commit()
    return {"grossing_top": round(scale), "prior": GROSSING_TOP, "factor": round(scale / GROSSING_TOP, 2),
            "anchors": len(anchors), "spread": round(spread, 2), "best_anchor_rank": best_rank}
