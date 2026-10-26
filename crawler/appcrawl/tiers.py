"""Refresh tiers: how often each app is re-fetched (docs/research/03-datenbank-aufbau.md §8.3).

T0 hot   – charted in the last 7 days, big (iOS ≥10k ratings, Android ≥1M installs) or new (<30 days)
T1 warm  – iOS ≥100 ratings, Android ≥10k installs
T2 cold  – every other active app
T3 dead  – not found in the store; re-checked rarely

iOS lookups are cheap (200 apps per request), so all active iOS apps refresh daily.
Android needs one page per app, so its long tail refreshes weekly to monthly.
"""

import psycopg

INTERVAL_DAYS = {
    "ios": {0: 1, 1: 1, 2: 1, 3: 30},
    "android": {0: 1, 1: 7, 2: 30, 3: 90},
}


def interval_sql(platform: str) -> str:
    """SQL expression for the refresh interval of the row's tier."""
    days = INTERVAL_DAYS[platform]
    cases = " ".join(f"WHEN {tier} THEN {d}" for tier, d in days.items())
    return f"make_interval(days => CASE tier {cases} END)"


def plan_tiers(connection: psycopg.Connection) -> dict:
    """Recomputes every app's tier from its latest signals and pulls promoted apps forward."""
    connection.execute(
        """UPDATE apps a SET tier = t.tier FROM (
             SELECT a.id,
               CASE
                 WHEN a.status = 'not_found' THEN 3
                 WHEN EXISTS (SELECT 1 FROM chart_ranks c WHERE c.app_id = a.id
                              AND c.captured_on >= current_date - 7)
                   OR (a.platform = 'ios' AND a.rating_count >= 10000)
                   OR (a.platform = 'android' AND a.installs_exact >= 1000000)
                   OR a.released_at >= current_date - 30 THEN 0
                 WHEN (a.platform = 'ios' AND a.rating_count >= 100)
                   OR (a.platform = 'android' AND a.installs_exact >= 10000) THEN 1
                 ELSE 2
               END AS tier
             FROM apps a) t
           WHERE a.id = t.id AND a.tier IS DISTINCT FROM t.tier"""
    )
    # A promoted app should not wait out the long interval of its old tier.
    for platform in INTERVAL_DAYS:
        connection.execute(
            f"""UPDATE apps SET next_refresh_at = refreshed_at + {interval_sql(platform)}
                WHERE platform = %s AND refreshed_at IS NOT NULL
                  AND next_refresh_at > refreshed_at + {interval_sql(platform)}""",
            (platform,),
        )
    connection.commit()
    return dict(
        connection.execute("SELECT platform || ' T' || tier, COUNT(*) FROM apps GROUP BY 1 ORDER BY 1").fetchall()
    )
