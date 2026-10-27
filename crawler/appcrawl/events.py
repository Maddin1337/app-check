"""Daily events per app: what changed between the latest observation and the previous one (docs/research/09 §3).

Chart events compare the latest captured chart day with the one before it (all-apps charts, iPhone, every storefront):
  rank_up / rank_down  moved at least RANK_JUMP places
  top100_entry         now in the Top 100, before outside it or absent
Metric events compare each app's latest daily row with its previous row in the same storefront (at most 35 days back):
  ratings_spike        iOS ratings added per day above the thresholds below
  installs_spike       Android exact installs added per day above the thresholds below
  price_change         price differs
  new_version          version string differs
Each group replaces its own rows for the day, so the job can run again after a refresh finished (it runs nightly after
the estimates).
"""

import psycopg

RANK_JUMP = 20
RATINGS_PER_DAY, RATINGS_PER_DAY_MIN, RATINGS_RELATIVE = 1_000, 100, 0.02
INSTALLS_PER_DAY, INSTALLS_PER_DAY_MIN, INSTALLS_RELATIVE = 50_000, 1_000, 0.02

CHART_KINDS = ("rank_up", "rank_down", "top100_entry")
METRIC_KINDS = ("ratings_spike", "installs_spike", "price_change", "new_version")


def chart_events(connection: psycopg.Connection) -> int:
    days = connection.execute(
        "SELECT DISTINCT captured_on FROM chart_ranks ORDER BY captured_on DESC LIMIT 2"
    ).fetchall()
    if len(days) < 2:
        return 0
    (day,), (previous,) = days
    connection.execute("DELETE FROM app_events WHERE day = %s AND kind = ANY(%s)", (day, list(CHART_KINDS)))
    cursor = connection.execute(
        """WITH now AS (
             SELECT app_id, country, chart, MIN(rank) AS rank FROM chart_ranks
             WHERE captured_on = %(day)s AND genre_id = '36' AND device = 'iphone' GROUP BY 1, 2, 3
           ), before AS (
             SELECT app_id, country, chart, MIN(rank) AS rank FROM chart_ranks
             WHERE captured_on = %(previous)s AND genre_id = '36' AND device = 'iphone' GROUP BY 1, 2, 3
           ), pairs AS (
             SELECT n.app_id, n.country, n.chart, b.rank AS old_rank, n.rank AS new_rank
             FROM now n LEFT JOIN before b USING (app_id, country, chart)
           )
           INSERT INTO app_events (day, app_id, kind, country, chart, old_value, new_value, magnitude, previous_day)
           SELECT %(day)s, app_id, kind, country, chart, old_rank::text, new_rank::text, magnitude, %(previous)s
           FROM (
             SELECT *, 'rank_up' AS kind, (old_rank - new_rank)::real AS magnitude FROM pairs
               WHERE old_rank - new_rank >= %(jump)s
             UNION ALL
             SELECT *, 'rank_down', (new_rank - old_rank)::real FROM pairs WHERE new_rank - old_rank >= %(jump)s
             UNION ALL
             SELECT *, 'top100_entry', (101 - new_rank)::real FROM pairs
               WHERE new_rank <= 100 AND (old_rank IS NULL OR old_rank > 100)
           ) e""",
        {"day": day, "previous": previous, "jump": RANK_JUMP},
    )
    return cursor.rowcount


def metric_events(connection: psycopg.Connection) -> int:
    day = connection.execute("SELECT MAX(day) FROM app_metrics_daily").fetchone()[0]
    if day is None:
        return 0
    connection.execute("DELETE FROM app_events WHERE day = %s AND kind = ANY(%s)", (day, list(METRIC_KINDS)))
    cursor = connection.execute(
        """WITH pairs AS (
             SELECT m.app_id, m.country, a.platform, p.day AS previous_day, (%(day)s - p.day) AS days,
                    p.rating_count AS old_ratings, m.rating_count AS new_ratings,
                    p.installs_exact AS old_installs, m.installs_exact AS new_installs,
                    p.price AS old_price, m.price AS new_price, p.version AS old_version, m.version AS new_version
             FROM app_metrics_daily m
             JOIN apps a ON a.id = m.app_id
             JOIN LATERAL (
               SELECT day, rating_count, installs_exact, price, version FROM app_metrics_daily
               WHERE app_id = m.app_id AND country = m.country AND day < m.day AND day >= m.day - 35
               ORDER BY day DESC LIMIT 1
             ) p ON TRUE
             WHERE m.day = %(day)s
           )
           INSERT INTO app_events (day, app_id, kind, country, chart, old_value, new_value, magnitude, previous_day)
           SELECT %(day)s, app_id, kind, country, '', old_value, new_value, magnitude, previous_day
           FROM (
             SELECT app_id, country, previous_day, 'ratings_spike' AS kind, old_ratings::text AS old_value,
                    new_ratings::text AS new_value, ((new_ratings - old_ratings)::real / days) AS magnitude
             FROM pairs
             WHERE platform = 'ios' AND new_ratings > old_ratings
               AND ((new_ratings - old_ratings)::real / days >= %(r_abs)s
                    OR ((new_ratings - old_ratings)::real / days >= %(r_min)s
                        AND (new_ratings - old_ratings)::real / days / GREATEST(old_ratings, 1) >= %(r_rel)s))
             UNION ALL
             SELECT app_id, country, previous_day, 'installs_spike', old_installs::text, new_installs::text,
                    (new_installs - old_installs)::real / days
             FROM pairs
             WHERE platform = 'android' AND new_installs > old_installs
               AND ((new_installs - old_installs)::real / days >= %(i_abs)s
                    OR ((new_installs - old_installs)::real / days >= %(i_min)s
                        AND (new_installs - old_installs)::real / days / GREATEST(old_installs, 1) >= %(i_rel)s))
             UNION ALL
             SELECT app_id, country, previous_day, 'price_change', old_price::text, new_price::text,
                    (abs(new_price - old_price) / GREATEST(old_price, 0.01))::real
             FROM pairs WHERE new_price IS DISTINCT FROM old_price AND new_price IS NOT NULL AND old_price IS NOT NULL
             UNION ALL
             SELECT app_id, country, previous_day, 'new_version', old_version, new_version, 1
             FROM pairs
             WHERE new_version IS DISTINCT FROM old_version AND new_version IS NOT NULL AND old_version IS NOT NULL
           ) e
           ON CONFLICT DO NOTHING""",
        {"day": day, "r_abs": RATINGS_PER_DAY, "r_min": RATINGS_PER_DAY_MIN, "r_rel": RATINGS_RELATIVE,
         "i_abs": INSTALLS_PER_DAY, "i_min": INSTALLS_PER_DAY_MIN, "i_rel": INSTALLS_RELATIVE},
    )
    return cursor.rowcount


def compute_events(connection: psycopg.Connection) -> dict:
    result = {"chart": chart_events(connection), "metric": metric_events(connection)}
    connection.commit()
    day = connection.execute("SELECT MAX(day) FROM app_events").fetchone()[0]
    if day:
        result.update(dict(connection.execute(
            "SELECT kind, COUNT(*) FROM app_events WHERE day = %s GROUP BY 1 ORDER BY 1", (day,)).fetchall()))
    return result
