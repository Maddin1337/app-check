"""Model v0: downloads per day and revenue per month as ranges (docs/research/04-schaetzmodelle.md §2–3, §9).

Downloads, best available signal per app:
  chart           US iPhone Top Free/Paid, all apps: a rank curve with literature priors (04 §2.2, Sensor Tower 2022:
                  rank 1 ≈ 156k/day, top 10 ≈ 52k/day). Median rank of the last 3 chart days.
  chart-category  US category charts, scaled per category by the apps that also stand in the all-apps chart.
  ratings         iOS rating growth (app_trends, US store) × downloads per new rating, calibrated on charted apps.
  installs        Android: the exact install counter's growth, a measurement.

Revenue (gross, USD per month), two paths:
  A  grossing         US iPhone Top Grossing rank (legacy RSS, 100 deep) on a rank curve; category charts scaled like
                      the download charts. The curve's anchors are assumptions to be calibrated (see GROSSING_*).
  B  rpd              downloads × 30 × revenue per download (RPD) by monetization model. RPD priors come from
                      RevenueCat 2026 (04 §3.2–3.3) and are pulled towards what the Top Grossing apps show.
An app with a Top Grossing rank takes path A: on 26.10.2026 the charted subscription apps earned a median $20 per
download against the $1.20 prior, so averaging in path B (04 §3.6) would pull exactly these apps down. Path B then only
checks: if it comes out more than DISAGREEMENT times higher than path A, the downloads or the monetization model are
likely off and the confidence drops (path B being lower is expected for top earners). Apps outside the all-apps Top Grossing chart are
capped at its last rank. Net subtracts the store fee (04 §3.4).

Every value is the median of a log-normal; P10/P90 come from the method's spread (sigma, natural log). These are
uncalibrated priors: the UI marks all v0 numbers as early estimates. Apps without a usable signal get no estimate.
"""

import math
import statistics
import sys
from collections import defaultdict
from datetime import date
from typing import Callable

import psycopg

from . import db

MODEL_VERSION = "v0"
Z90 = 1.2816  # P90 of the standard normal
ALL_APPS = "36"

# Rank curves, downloads per day in the US iPhone store. Free: steep flattening at the top (β≈0.5), steeper below.
FREE_TOP, FREE_BETA_TOP, FREE_BETA_TAIL = 156_000, 0.5, 0.8
PAID_TOP, PAID_BETA = 4_000, 0.95
# Top Grossing, gross USD per day in the US iPhone store. ASSUMPTION from public orders of magnitude (rank 1 ≈ $2.5M a
# day, rank 10 ≈ $450k, rank 100 ≈ $80k), not yet fitted to ground truth (04 §2.7); calibrate before trusting levels.
GROSSING_TOP, GROSSING_BETA = 2_500_000, 0.75

SIGMA = {"chart": 0.5, "chart-category": 0.75, "ratings": 1.0, "installs": 0.25}
REVENUE_SIGMA = {"grossing": 0.6, "grossing-category": 0.85}
CONFIDENCE = {"chart": "medium", "installs": "medium", "chart-category": "low", "ratings": "low"}

DOWNLOADS_PER_RATING_PRIOR = 67  # 1 / 1.5 % ratings per install (04 §0 Nr. 4)
MIN_CALIBRATION_APPS = 20
CATEGORY_SCALE_PRIOR = 0.25
MIN_OVERLAP_APPS = 3

# Revenue per download (gross USD, lifetime value realised in steady state), US iOS. Android earns less per install.
RPD = {"subscription": 1.2, "iap": 0.5}
RPD_SIGMA = {"subscription": 0.9, "iap": 1.0, "paid": 0.2, "free": 0.0}
ANDROID_RPD_FACTOR = 0.35
MIN_RPD_CALIBRATION_APPS = 10
MAX_RPD_CALIBRATION_FACTOR = 2.0  # Top Grossing apps monetise far above average; never move a prior more than 2×
DISAGREEMENT = 3.0  # path B above path A by more than this factor lowers the confidence
SMALL_BUSINESS_MONTHLY = 1_000_000 / 12  # Apple/Google reduced fee below ~$1M proceeds a year


def free_curve(rank: float) -> float:
    if rank <= 10:
        return FREE_TOP * rank ** -FREE_BETA_TOP
    return FREE_TOP * 10 ** -FREE_BETA_TOP * (rank / 10) ** -FREE_BETA_TAIL


def paid_curve(rank: float) -> float:
    return PAID_TOP * rank ** -PAID_BETA


def grossing_curve(rank: float) -> float:
    """Gross USD per day."""
    return GROSSING_TOP * rank ** -GROSSING_BETA


def curve(chart: str, rank: float) -> float:
    return {"top-free": free_curve, "top-paid": paid_curve, "top-grossing": grossing_curve}[chart](rank)


def rpd(platform: str, model: str | None, price: float, annual: float | None, typical: float | None,
        base: dict[str, float] = RPD) -> float | None:
    """Gross revenue per download for one app, None when the model is unknown."""
    if model is None:
        return None
    if model == "free":
        return 0.0
    if model == "paid":
        value = price
    elif model == "subscription":
        value = base["subscription"] * min(2.5, max(0.5, math.sqrt((annual or 35) / 35)))
    else:
        value = base["iap"] * min(2.0, max(0.5, ((typical or 5) / 5) ** 0.3))
    return value * (ANDROID_RPD_FACTOR if platform == "android" and model != "paid" else 1)


def net_factor(model: str | None, gross_month: float) -> float:
    if gross_month < SMALL_BUSINESS_MONTHLY or model == "subscription":
        return 0.85
    return 0.70


def ranked_estimates(
    connection: psycopg.Connection, charts: tuple[str, ...]
) -> tuple[dict[int, tuple[float, bool]], float | None]:
    """(app_id -> (value per day, from all-apps chart?), value at the all-apps chart's last rank) from US iPhone
    charts of the last 3 captured days.

    Category charts are scaled by the median ratio between the all-apps curve and the category curve over the apps
    that stand in both; an app only in category charts gets the median of its category values. Not standing in the
    all-apps chart is itself a measurement: such an app is capped at the value of the all-apps chart's last rank.
    """
    rows = connection.execute(
        """SELECT app_id, chart, genre_id, percentile_cont(0.5) WITHIN GROUP (ORDER BY rank) AS rank
           FROM chart_ranks
           WHERE country = 'us' AND device = 'iphone' AND chart = ANY(%s)
             AND captured_on > (SELECT MAX(captured_on) FROM chart_ranks WHERE country = 'us' AND chart = ANY(%s)) - 3
           GROUP BY app_id, chart, genre_id""",
        (list(charts), list(charts)),
    ).fetchall()
    overall: dict[int, float] = {}
    by_genre: dict[tuple[str, str], list[tuple[int, float]]] = defaultdict(list)
    depth: dict[str, float] = {}
    for app_id, chart, genre, rank in rows:
        if genre == ALL_APPS:
            overall[app_id] = max(overall.get(app_id, 0), curve(chart, rank))
            depth[chart] = max(depth.get(chart, 0), rank)
        else:
            by_genre[(chart, genre)].append((app_id, rank))
    # The lowest value the all-apps charts still show: any app outside them earns or downloads less.
    floor = max((curve(chart, rank) for chart, rank in depth.items()), default=None)

    result = {app_id: (value, True) for app_id, value in overall.items()}
    candidates: dict[int, list[float]] = defaultdict(list)
    for (chart, genre), ranked in by_genre.items():
        ratios = [overall[a] / curve(chart, r) for a, r in ranked if a in overall]
        scale = statistics.median(ratios) if len(ratios) >= MIN_OVERLAP_APPS else CATEGORY_SCALE_PRIOR
        for app_id, rank in ranked:
            if app_id not in overall:
                candidates[app_id].append(scale * curve(chart, rank))
    for app_id, values in candidates.items():
        value = statistics.median(values)
        result[app_id] = (min(value, floor) if floor else value, False)
    return result, floor


def calibrated_rpd(grossing: dict, downloads: dict, monetization: dict, log: Callable[[str], None]) -> dict[str, float]:
    """Pulls the RPD priors halfway (in log space) towards what US Top Grossing apps with chart downloads earn.

    Top Grossing apps monetise better than the average app, so their RPD is an upper reference, not a replacement.
    """
    observed: dict[str, list[float]] = defaultdict(list)
    for app_id, (revenue_day, in_overall) in grossing.items():
        d = downloads.get(app_id)
        model = monetization.get(app_id, (None,))[0]
        if in_overall and d and d[1] == "chart" and model in RPD:
            observed[model].append(revenue_day / d[0])
    base = dict(RPD)
    for model, values in observed.items():
        if len(values) >= MIN_RPD_CALIBRATION_APPS:
            median = statistics.median(values)
            factor = min(MAX_RPD_CALIBRATION_FACTOR, max(1 / MAX_RPD_CALIBRATION_FACTOR, math.sqrt(median / RPD[model])))
            base[model] = RPD[model] * factor
            log(f"RPD {model}: prior {RPD[model]:.2f}, Top Grossing median {median:.2f} from {len(values)} apps "
                f"-> {base[model]:.2f}")
    return base


def compute_estimates(connection: psycopg.Connection, day: date | None = None) -> dict:
    """Writes today's estimates to app_estimates_daily (replacing an earlier run of the day)."""
    day = day or date.today()

    def log(message: str) -> None:
        print(f"estimates: {message}", file=sys.stderr)

    db.ensure_month_partition(connection, "app_estimates_daily", day)
    ranked, _ = ranked_estimates(connection, ("top-free", "top-paid"))
    charted = {app_id: (value, "chart" if overall else "chart-category") for app_id, (value, overall) in ranked.items()}
    grossing, grossing_floor = ranked_estimates(connection, ("top-grossing",))
    # A US iOS app outside the all-apps Top Grossing chart earns less than its last rank (per month).
    revenue_cap = grossing_floor * 30 if grossing_floor else None

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
            (list(set(downloads) | set(grossing)),),
        )
    }
    base_rpd = calibrated_rpd(grossing, downloads, monetization, log)

    rows = []
    for app_id in set(downloads) | set(grossing):
        model, price, annual, typical = monetization.get(app_id, (None, 0.0, None, None))
        if model is None and price > 0:
            model = "paid"
        if app_id in downloads:
            d, method, platform, scope = downloads[app_id]
            sigma_d = SIGMA[method]
            confidence = CONFIDENCE[method]
        else:  # only in a Top Grossing chart: revenue without a download estimate
            d, method, platform, scope, sigma_d, confidence = None, None, "ios", "us", None, "low"

        value = rpd(platform, model, price, annual, typical, base_rpd) if d is not None else None
        path_b = (d * 30 * value, math.hypot(sigma_d, RPD_SIGMA[model])) if value else None
        if app_id in grossing:
            revenue_day, in_overall = grossing[app_id]
            revenue_method = "grossing" if in_overall else "grossing-category"
            gross, sigma = revenue_day * 30, REVENUE_SIGMA[revenue_method]
            confidence = "medium" if in_overall else "low"
            if path_b and path_b[0] > DISAGREEMENT * gross:
                confidence = "low"
        elif path_b:
            (gross, sigma), revenue_method = path_b, "rpd"
        else:
            gross = sigma = revenue_method = None

        if gross is not None:
            low, high = gross * math.exp(-Z90 * sigma), gross * math.exp(Z90 * sigma)
            if revenue_cap and platform == "ios" and not grossing.get(app_id, (0, False))[1]:
                gross, high, low = min(gross, revenue_cap), min(high, revenue_cap), min(low, revenue_cap)
            revenue = (low, gross, high, gross * net_factor(model, gross))
        elif value == 0:  # free without IAPs: no store revenue
            revenue, revenue_method = (0.0, 0.0, 0.0, 0.0), "rpd"
        else:
            revenue, revenue_method = (None, None, None, None), None

        if d is None:
            downloads_range = (None, None, None)
        else:
            downloads_range = (d * math.exp(-Z90 * sigma_d), d, d * math.exp(Z90 * sigma_d))
        rows.append((day, app_id, platform, scope, *downloads_range, *revenue, method, model, confidence,
                     MODEL_VERSION, revenue_method))

    connection.execute("DELETE FROM app_estimates_daily WHERE day = %s", (day,))
    with connection.cursor().copy(
        """COPY app_estimates_daily (day, app_id, platform, scope, downloads_p10, downloads_p50, downloads_p90,
                                     revenue_p10, revenue_p50, revenue_p90, revenue_net_p50, download_method,
                                     monetization, confidence, model_version, revenue_method) FROM STDIN"""
    ) as copy:
        for row in rows:
            copy.write_row(row)
    connection.commit()

    counts: dict[str, int] = defaultdict(int)
    for row in rows:
        counts[row[11] or "no downloads"] += 1
        counts[f"revenue {row[15] or 'unknown'}"] += 1
    calibration = len(ratios[None])
    log(f"downloads per rating from {calibration} charted apps "
        f"({per_rating(None):.0f} overall{'' if calibration >= MIN_CALIBRATION_APPS else ', prior'})")
    return {"apps": len(rows), **counts}
