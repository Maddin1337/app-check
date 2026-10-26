"""Model v0: downloads per day and revenue per month as ranges (docs/research/04-schaetzmodelle.md §2–3, §9).

Downloads, best available signal per app:
  chart           US iPhone Top Free/Paid, all apps: a rank curve with literature priors (04 §2.2, Sensor Tower 2022:
                  rank 1 ≈ 156k/day, top 10 ≈ 52k/day). Median rank of the last 3 chart days.
  chart-category  US category charts, scaled per category by the apps that also stand in the all-apps chart.
  ratings         iOS rating growth (app_trends, US store) × downloads per new rating, calibrated on charted apps.
  installs        Android: the exact install counter's growth, a measurement.
Revenue (gross, USD per month) = downloads × 30 × revenue per download (RPD) by monetization model, with RPD priors
from RevenueCat 2026 (04 §3.2–3.3). Net subtracts the store fee (04 §3.4).

Every value is the median of a log-normal; P10/P90 come from the method's spread (sigma, natural log). These are
uncalibrated priors: the UI marks all v0 numbers as early estimates. Apps without a usable signal get no estimate.
"""

import math
import statistics
import sys
from collections import defaultdict
from datetime import date

import psycopg

from . import db

MODEL_VERSION = "v0"
Z90 = 1.2816  # P90 of the standard normal
ALL_APPS = "36"

# Rank curves, downloads per day in the US iPhone store. Free: steep flattening at the top (β≈0.5), steeper below.
FREE_TOP, FREE_BETA_TOP, FREE_BETA_TAIL = 156_000, 0.5, 0.8
PAID_TOP, PAID_BETA = 4_000, 0.95
SIGMA = {"chart": 0.5, "chart-category": 0.75, "ratings": 1.0, "installs": 0.25}
CONFIDENCE = {"chart": "medium", "installs": "medium", "chart-category": "low", "ratings": "low"}

DOWNLOADS_PER_RATING_PRIOR = 67  # 1 / 1.5 % ratings per install (04 §0 Nr. 4)
MIN_CALIBRATION_APPS = 20
CATEGORY_SCALE_PRIOR = 0.25
MIN_OVERLAP_APPS = 3

# Revenue per download (gross USD, lifetime value realised in steady state), US iOS. Android earns less per install.
RPD = {"subscription": 1.2, "iap": 0.5}
RPD_SIGMA = {"subscription": 0.9, "iap": 1.0, "paid": 0.2, "free": 0.0}
ANDROID_RPD_FACTOR = 0.35
SMALL_BUSINESS_MONTHLY = 1_000_000 / 12  # Apple/Google reduced fee below ~$1M proceeds a year


def free_curve(rank: float) -> float:
    if rank <= 10:
        return FREE_TOP * rank ** -FREE_BETA_TOP
    return FREE_TOP * 10 ** -FREE_BETA_TOP * (rank / 10) ** -FREE_BETA_TAIL


def paid_curve(rank: float) -> float:
    return PAID_TOP * rank ** -PAID_BETA


def curve(chart: str, rank: float) -> float:
    return free_curve(rank) if chart == "top-free" else paid_curve(rank)


def rpd(platform: str, model: str | None, price: float, annual: float | None, typical: float | None) -> float | None:
    """Gross revenue per download for one app, None when the model is unknown."""
    if model is None:
        return None
    if model == "free":
        return 0.0
    if model == "paid":
        value = price
    elif model == "subscription":
        value = RPD["subscription"] * min(2.5, max(0.5, math.sqrt((annual or 35) / 35)))
    else:
        value = RPD["iap"] * min(2.0, max(0.5, ((typical or 5) / 5) ** 0.3))
    return value * (ANDROID_RPD_FACTOR if platform == "android" and model != "paid" else 1)


def net_factor(model: str, gross_month: float) -> float:
    if gross_month < SMALL_BUSINESS_MONTHLY or model == "subscription":
        return 0.85
    return 0.70


def chart_downloads(connection: psycopg.Connection) -> dict[int, tuple[float, str]]:
    """app_id -> (downloads/day, method) from US iPhone charts of the last 3 captured days."""
    rows = connection.execute(
        """SELECT app_id, chart, genre_id, percentile_cont(0.5) WITHIN GROUP (ORDER BY rank) AS rank
           FROM chart_ranks
           WHERE country = 'us' AND device = 'iphone' AND chart IN ('top-free', 'top-paid')
             AND captured_on > (SELECT MAX(captured_on) FROM chart_ranks WHERE country = 'us') - 3
           GROUP BY app_id, chart, genre_id"""
    ).fetchall()
    overall: dict[int, float] = {}
    by_genre: dict[tuple[str, str], list[tuple[int, float]]] = defaultdict(list)
    for app_id, chart, genre, rank in rows:
        if genre == ALL_APPS:
            overall[app_id] = max(overall.get(app_id, 0), curve(chart, rank))
        else:
            by_genre[(chart, genre)].append((app_id, rank))

    result = {app_id: (d, "chart") for app_id, d in overall.items()}
    candidates: dict[int, list[float]] = defaultdict(list)
    for (chart, genre), ranked in by_genre.items():
        ratios = [overall[a] / curve(chart, r) for a, r in ranked if a in overall]
        scale = statistics.median(ratios) if len(ratios) >= MIN_OVERLAP_APPS else CATEGORY_SCALE_PRIOR
        for app_id, rank in ranked:
            if app_id not in overall:
                candidates[app_id].append(scale * curve(chart, rank))
    for app_id, values in candidates.items():
        result[app_id] = (statistics.median(values), "chart-category")
    return result


def compute_estimates(connection: psycopg.Connection, day: date | None = None) -> dict:
    """Writes today's estimates to app_estimates_daily (replacing an earlier run of the day)."""
    day = day or date.today()
    db.ensure_month_partition(connection, "app_estimates_daily", day)
    charted = chart_downloads(connection)

    trends = connection.execute(
        """SELECT DISTINCT ON (t.app_id) t.app_id, t.platform, t.country, t.per_day, a.category_id
           FROM app_trends t JOIN apps a ON a.id = t.app_id
           WHERE t.per_day > 0
           ORDER BY t.app_id, t.window_days DESC"""
    ).fetchall()

    # Downloads per new rating, calibrated on charted apps whose US rating growth is known.
    ratios: dict[str | None, list[float]] = defaultdict(list)
    for app_id, platform, country, per_day, category in trends:
        if platform == "ios" and country == "us" and charted.get(app_id, (0, ""))[1] == "chart":
            ratio = charted[app_id][0] / per_day
            ratios[category].append(ratio)
            ratios[None].append(ratio)

    def per_rating(category: str | None) -> float:
        for key in (category, None):
            if len(ratios[key]) >= MIN_CALIBRATION_APPS:
                return min(1000.0, max(10.0, statistics.median(ratios[key])))
        return DOWNLOADS_PER_RATING_PRIOR

    downloads: dict[int, tuple[float, str, str, str]] = {
        app_id: (d, method, "ios", "us") for app_id, (d, method) in charted.items()
    }
    for app_id, platform, country, per_day, category in trends:
        if platform == "android":
            downloads[app_id] = (per_day, "installs", "android", "ww")
        elif app_id not in downloads and country == "us":
            downloads[app_id] = (per_day * per_rating(category), "ratings", "ios", "us")

    monetization = {
        row[0]: row[1:]
        for row in connection.execute(
            """SELECT a.id, m.model, COALESCE(a.price, 0)::float8, m.sub_annual_price::float8, m.iap_typical::float8
               FROM apps a LEFT JOIN app_monetization m ON m.app_id = a.id
               WHERE a.id = ANY(%s)""",
            (list(downloads),),
        )
    }

    rows = []
    for app_id, (d, method, platform, scope) in downloads.items():
        model, price, annual, typical = monetization.get(app_id, (None, 0.0, None, None))
        if model is None and price > 0:
            model = "paid"
        sigma_d = SIGMA[method]
        d_lo, d_hi = d * math.exp(-Z90 * sigma_d), d * math.exp(Z90 * sigma_d)
        value = rpd(platform, model, price, annual, typical)
        if value is None:
            revenue = (None, None, None, None)
        else:
            gross = d * 30 * value
            sigma = math.hypot(sigma_d, RPD_SIGMA[model])
            revenue = (gross * math.exp(-Z90 * sigma), gross, gross * math.exp(Z90 * sigma), gross * net_factor(model, gross))
        rows.append((day, app_id, platform, scope, d_lo, d, d_hi, *revenue, method, model, CONFIDENCE[method], MODEL_VERSION))

    connection.execute("DELETE FROM app_estimates_daily WHERE day = %s", (day,))
    with connection.cursor().copy(
        """COPY app_estimates_daily (day, app_id, platform, scope, downloads_p10, downloads_p50, downloads_p90,
                                     revenue_p10, revenue_p50, revenue_p90, revenue_net_p50, download_method,
                                     monetization, confidence, model_version) FROM STDIN"""
    ) as copy:
        for row in rows:
            copy.write_row(row)
    connection.commit()
    counts: dict[str, int] = defaultdict(int)
    for row in rows:
        counts[row[11]] += 1
    calibration = len(ratios[None])
    print(f"estimates: downloads per rating from {calibration} charted apps "
          f"({per_rating(None):.0f} overall{'' if calibration >= MIN_CALIBRATION_APPS else ', prior'})", file=sys.stderr)
    return {"apps": len(rows), "with revenue": sum(1 for r in rows if r[8] is not None), **counts}
