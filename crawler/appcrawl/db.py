"""Postgres access: connection, migrations, partitions and the app-key upsert.

Connection string: DATABASE_URL (default: local socket, database 'appcrawl').
"""

import os
from datetime import date
from pathlib import Path

import psycopg

DEFAULT_DSN = "postgresql:///appcrawl"
MIGRATIONS = Path(__file__).with_name("migrations")


def connect(dsn: str | None = None) -> psycopg.Connection:
    return psycopg.connect(dsn or os.environ.get("DATABASE_URL", DEFAULT_DSN))


def migrate(connection: psycopg.Connection) -> list[str]:
    """Applies pending migrations/*.sql in order, each in its own transaction."""
    connection.execute(
        "CREATE TABLE IF NOT EXISTS schema_migrations (version text PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT now())"
    )
    connection.commit()
    applied = {v for (v,) in connection.execute("SELECT version FROM schema_migrations")}
    connection.commit()
    done = []
    for path in sorted(MIGRATIONS.glob("*.sql")):
        if path.stem in applied:
            continue
        try:
            connection.execute(path.read_text())
            connection.execute("INSERT INTO schema_migrations (version) VALUES (%s)", (path.stem,))
            connection.commit()
        except Exception:
            connection.rollback()
            raise
        done.append(path.stem)
    return done


def ensure_month_partition(connection: psycopg.Connection, table: str, day: date) -> None:
    """Creates the monthly partition holding `day` (rows already in the default partition stay there)."""
    start = day.replace(day=1)
    end = start.replace(year=start.year + 1, month=1) if start.month == 12 else start.replace(month=start.month + 1)
    name = f"{table}_{start:%Y_%m}"
    try:
        with connection.transaction():
            connection.execute(
                f"CREATE TABLE IF NOT EXISTS {name} PARTITION OF {table} FOR VALUES FROM ('{start}') TO ('{end}')"
            )
    except psycopg.errors.CheckViolation:
        pass  # the default partition already holds rows of this month


def upsert_app_keys(connection: psycopg.Connection, platform: str, source: str, apps: dict) -> None:
    """apps maps store_id -> (slug, name). Existing apps only get last_seen_at and missing hints filled."""
    with connection.cursor() as cursor:
        cursor.executemany(
            """INSERT INTO apps (platform, store_id, slug, name, discovered_via)
               VALUES (%s, %s, %s, %s, %s)
               ON CONFLICT (platform, store_id) DO UPDATE SET
                 last_seen_at = now(),
                 slug = COALESCE(apps.slug, excluded.slug),
                 name = COALESCE(apps.name, excluded.name)""",
            [(platform, store_id, slug, name, source) for store_id, (slug, name) in apps.items()],
        )


def app_ids(connection: psycopg.Connection, platform: str, store_ids: list[str]) -> dict[str, int]:
    rows = connection.execute(
        "SELECT store_id, id FROM apps WHERE platform = %s AND store_id = ANY(%s)", (platform, store_ids)
    )
    return dict(rows.fetchall())
