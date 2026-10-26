"""Growth over the last 7 and 30 days from app_metrics_daily, for the rising list and growth columns.

iOS: rating count of one storefront (the one with the most measurements in the window). Ratings are a proxy for
downloads, not a download count; the UI labels them as ratings. Android: the exact install counter, a direct measure.
An app needs two measurements on different days inside the window; the window ends at the latest measured day.
"""

import psycopg

WINDOWS = (7, 30)


def compute_trends(connection: psycopg.Connection, windows: tuple[int, ...] = WINDOWS) -> dict:
    """Replaces app_trends for each window in one transaction; returns rows per window and platform."""
    result = {}
    for window in windows:
        connection.execute("DELETE FROM app_trends WHERE window_days = %s", (window,))
        connection.execute(
            """INSERT INTO app_trends (app_id, window_days, platform, metric, country, start_day, end_day,
                                       start_value, end_value, delta, per_day, growth, points)
               SELECT app_id, %(window)s, platform, metric, country, start_day, end_day, start_value, end_value,
                      end_value - start_value,
                      (end_value - start_value)::real / (end_day - start_day),
                      (end_value - start_value)::real / NULLIF(start_value, 0),
                      points
               FROM (
                 SELECT DISTINCT ON (s.app_id) s.*
                 FROM (
                   SELECT m.app_id, a.platform,
                          CASE a.platform WHEN 'android' THEN 'installs' ELSE 'ratings' END AS metric,
                          m.country,
                          MIN(m.day) AS start_day, MAX(m.day) AS end_day, COUNT(*) AS points,
                          (array_agg(v.value ORDER BY m.day))[1] AS start_value,
                          (array_agg(v.value ORDER BY m.day DESC))[1] AS end_value
                   FROM app_metrics_daily m
                   JOIN apps a ON a.id = m.app_id
                   CROSS JOIN LATERAL (SELECT CASE a.platform WHEN 'android' THEN m.installs_exact
                                                              ELSE m.rating_count END AS value) v
                   WHERE m.day >= (SELECT MAX(day) FROM app_metrics_daily) - %(window)s
                     AND v.value IS NOT NULL
                   GROUP BY m.app_id, a.platform, m.country
                 ) s
                 WHERE s.end_day > s.start_day
                 ORDER BY s.app_id, s.points DESC, s.end_value DESC
               ) t""",
            {"window": window},
        )
        for platform, count in connection.execute(
            "SELECT platform, COUNT(*) FROM app_trends WHERE window_days = %s GROUP BY 1 ORDER BY 1", (window,)
        ):
            result[f"{platform} {window}d"] = count
    connection.commit()
    return result
