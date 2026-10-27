"""In-app purchase prices from App Store pages, and each app's monetization model.

The app page (apps.apple.com/<country>/app/id<N>, allowed by robots.txt) embeds its data as
serialized-server-data. The "Information" shelf lists up to ten in-app purchases with name and price,
which is what bottom-up revenue estimates need (docs/research/04-schaetzmodelle.md §3.2).

Pages are ~0.9 MB, so only apps that matter are read: charted in the last 7 days or ≥1,000 ratings,
charted ones first, each at most weekly. Android has no IAP list; its detail page only gives a price
range (apps.iap_price_range), which classify_android() turns into the same monetization row.
"""

import json
import re
import statistics
import sys
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime, timezone
from decimal import Decimal, InvalidOperation

import psycopg

from .charts import SERVER_DATA
from .http import FetchError, RateLimiter, fetch

APP_PAGE = "https://apps.apple.com/{country}/app/id{store_id}"
REFETCH_DAYS = 7
MIN_RATINGS = 1000

PRICE = re.compile(r"([^\d\s.,]*)\s*([\d.,]+)\s*([^\d\s.,]*)")
CURRENCY = re.compile(r"[$€£¥₹₩₺₽₪฿₫]|\b[A-Z]{3}\b|^[A-Z]{1,2}\$$")
SYMBOLS = {"$": "USD", "US$": "USD", "€": "EUR", "£": "GBP", "¥": "JPY"}
PERIODS = (
    (re.compile(r"(?i)\b(week|weekly|wöchentlich|7[ -]?days?)\b"), 52),
    (re.compile(r"(?i)\b(month|monthly|monatlich|1[ -]?months?|30[ -]?days?)\b"), 12),
    (re.compile(r"(?i)\b(3[ -]?months?|quarter|quarterly)\b"), 4),
    (re.compile(r"(?i)\b(6[ -]?months?|half[ -]?year)\b"), 2),
    (re.compile(r"(?i)\b(year|yearly|annual|annually|jährlich|12[ -]?months?)\b"), 1),
)
CONSUMABLE_WORDS = re.compile(
    r"(?i)\b(offer|bundle|pack|deal|sale|special|starter|gems?|coins?|diamonds?|gold|chest|crystals?|tokens?|credits?"
    r"|lives|energy|points|cash|bucks|stars?|hearts?|tickets?|keys?)\b"
)
SUBSCRIPTION_WORDS = re.compile(
    r"(?i)\b(premium|pro|plus|subscription|subscribe|membership|member|vip|unlimited|access|abo|abonnement)\b"
)


def parse_price(text: str) -> tuple[Decimal, str] | None:
    """'$4.99' -> (4.99, 'USD'); thousands separators are dropped. Returns None for non-prices."""
    match = PRICE.fullmatch(text.strip())
    if not match:
        return None
    symbol = (match.group(1) or match.group(3)).strip()
    if not CURRENCY.search(symbol):  # "4+" (age rating) or "312 MB" are not prices
        return None
    digits = match.group(2)
    if "," in digits and "." in digits:
        digits = digits.replace(",", "") if digits.rfind(".") > digits.rfind(",") else digits.replace(".", "").replace(",", ".")
    elif "," in digits:
        digits = digits.replace(",", ".") if len(digits.rsplit(",", 1)[1]) == 2 else digits.replace(",", "")
    try:
        return Decimal(digits), SYMBOLS.get(symbol, symbol or "USD")
    except InvalidOperation:
        return None


def parse_app_page(body: bytes) -> list[tuple[str, Decimal, str]] | None:
    """[(name, price, currency), …] as listed; [] when the page shows no IAPs; None when unparseable."""
    match = SERVER_DATA.search(body)
    if not match:
        return None
    try:
        information = json.loads(match.group(1))["data"][0]["data"]["shelfMapping"]["information"]
    except (KeyError, IndexError, TypeError, ValueError):
        return None
    for annotation in information.get("items", []):
        pairs = [i for i in annotation.get("items") or [] if i.get("$kind") == "textPair"]
        prices = [(p.get("leadingText") or "", parse_price(p.get("trailingText") or "")) for p in pairs]
        # The IAP annotation is the one whose rows are all name/price pairs; its title is localized.
        if prices and all(price for _, price in prices):
            return [(name.strip(), price[0], price[1]) for name, price in prices]
    return []


def _annualize(prices: set[float]) -> float:
    """Yearly price of one subscription: its yearly-looking prices (≥ $25) if any, else the cheapest × 12."""
    yearly = [p for p in prices if p >= 25]
    return statistics.median(yearly) if yearly else min(prices) * 12


def parse_page_extras(body: bytes) -> dict | None:
    """Star histogram (5 → 1) and iPhone screenshot templates from the same page data, None when unparseable."""
    match = SERVER_DATA.search(body)
    if not match:
        return None
    try:
        shelves = json.loads(match.group(1))["data"][0]["data"]["shelfMapping"]
    except (KeyError, IndexError, TypeError, ValueError):
        return None
    counts = None
    for item in (shelves.get("productRatings") or {}).get("items") or []:
        if isinstance(item.get("ratingCounts"), list) and len(item["ratingCounts"]) == 5:
            counts = [int(c) for c in item["ratingCounts"]]
    screenshots = [
        {"template": shot["template"], "width": shot.get("width"), "height": shot.get("height")}
        for item in (shelves.get("product_media_phone_") or {}).get("items") or []
        if (shot := item.get("screenshot") or {}).get("template")
    ]
    return {"rating_counts": counts, "screenshots": screenshots[:10]}


def store_page_extras(connection: psycopg.Connection, app_id: int, country: str, extras: dict) -> None:
    connection.execute(
        """INSERT INTO app_store_page (app_id, country, fetched_at, rating_counts, screenshots)
           VALUES (%s, %s, now(), %s, %s)
           ON CONFLICT (app_id) DO UPDATE SET country = excluded.country, fetched_at = excluded.fetched_at,
             rating_counts = excluded.rating_counts, screenshots = excluded.screenshots""",
        (app_id, country, extras["rating_counts"], json.dumps(extras["screenshots"])),
    )


def classify(app_price: Decimal | float | None, items: list[tuple[str, Decimal, str]]) -> dict:
    """Monetization model and price levels from the app price and its IAP list."""
    prices = [float(p) for _, p, _ in items]
    annual, yearly = [], []
    by_name: dict[str, set[float]] = {}
    for name, price, _ in items:
        by_name.setdefault(name.lower(), set()).add(float(price))
        for pattern, per_year in PERIODS:
            if pattern.search(name):
                annual.append(float(price) * per_year)
                if per_year == 1:
                    yearly.append(float(price))
                break
    # An explicit yearly plan is what the app charges per year; monthly × 12 overstates it (ESPN+: $139.99 vs 12 × $13.99).
    if yearly:
        annual = yearly
    # One product name at several prices is a subscription with several periods or tiers ("Super Duolingo",
    # "Calm Premium"), unless the name is a generic consumable ("Special Offer", "Pouch of Gems").
    groups = [ps for name, ps in by_name.items() if len(ps) > 1 and not CONSUMABLE_WORDS.search(name)]
    groups += [{float(p)} for name, p, _ in items
               if SUBSCRIPTION_WORDS.search(name) and not CONSUMABLE_WORDS.search(name)] if not groups else []
    if not annual and groups:
        annual = [_annualize(ps) for ps in groups]
    if annual:
        model = "subscription"
    elif items:
        model = "iap"
    elif app_price and float(app_price) > 0:
        model = "paid"
    else:
        model = "free"
    return {
        "model": model,
        "iap_count": len(items),
        "iap_min": min(prices) if prices else None,
        "iap_max": max(prices) if prices else None,
        "iap_typical": statistics.median(prices) if prices else None,
        "sub_annual_price": round(statistics.median(annual), 2) if annual else None,
        "currency": items[0][2] if items else None,
    }


def store_iap(connection: psycopg.Connection, app_id: int, country: str, app_price, items) -> dict:
    result = classify(app_price, items)
    connection.execute("DELETE FROM iap_products WHERE app_id = %s AND country = %s", (app_id, country))
    with connection.cursor() as cursor:
        cursor.executemany(
            "INSERT INTO iap_products (app_id, country, position, name, price, currency) VALUES (%s, %s, %s, %s, %s, %s)",
            [(app_id, country, i, name, price, currency) for i, (name, price, currency) in enumerate(items, start=1)],
        )
    connection.execute(
        """INSERT INTO app_monetization (app_id, country, fetched_at, model, iap_count, iap_min, iap_max, iap_typical,
                                         sub_annual_price, currency)
           VALUES (%(app_id)s, %(country)s, now(), %(model)s, %(iap_count)s, %(iap_min)s, %(iap_max)s, %(iap_typical)s,
                   %(sub_annual_price)s, %(currency)s)
           ON CONFLICT (app_id) DO UPDATE SET country = excluded.country, fetched_at = excluded.fetched_at,
             model = excluded.model, iap_count = excluded.iap_count, iap_min = excluded.iap_min,
             iap_max = excluded.iap_max, iap_typical = excluded.iap_typical,
             sub_annual_price = excluded.sub_annual_price, currency = excluded.currency""",
        {"app_id": app_id, "country": country, **result},
    )
    connection.commit()
    return result


def classify_android(connection: psycopg.Connection) -> int:
    """Monetization rows for refreshed Android apps from price and the 'per item' price range."""
    rows = connection.execute(
        """SELECT a.id, a.price, a.offers_iap, a.iap_price_range FROM apps a
           LEFT JOIN app_monetization m ON m.app_id = a.id
           WHERE a.platform = 'android' AND a.status = 'active'
             AND (m.fetched_at IS NULL OR m.fetched_at < a.refreshed_at)"""
    ).fetchall()
    for app_id, price, offers_iap, price_range in rows:
        bounds = [p for p in (parse_price(part) for part in re.findall(r"[^\d\s]*\s*[\d.,]+", price_range or "")) if p]
        items = [("range", p, c) for p, c in bounds] if offers_iap else []
        result = classify(price, [])
        if items:
            low, high = float(items[0][1]), float(items[-1][1])
            result.update(model="iap", iap_count=0, iap_min=low, iap_max=high,
                          iap_typical=round((low * high) ** 0.5, 2), currency=items[0][2])
        connection.execute(
            """INSERT INTO app_monetization (app_id, country, fetched_at, model, iap_count, iap_min, iap_max,
                                             iap_typical, sub_annual_price, currency)
               VALUES (%(app_id)s, 'ww', now(), %(model)s, %(iap_count)s, %(iap_min)s, %(iap_max)s, %(iap_typical)s,
                       NULL, %(currency)s)
               ON CONFLICT (app_id) DO UPDATE SET fetched_at = excluded.fetched_at, model = excluded.model,
                 iap_min = excluded.iap_min, iap_max = excluded.iap_max, iap_typical = excluded.iap_typical,
                 currency = excluded.currency""",
            {"app_id": app_id, **result},
        )
    connection.commit()
    return len(rows)


def reclassify_stored(connection: psycopg.Connection) -> int:
    """Re-runs classify() on the stored iOS IAP lists, e.g. after a rule change; fetch dates stay as they are."""
    rows = connection.execute(
        """SELECT m.app_id, m.country, a.price,
                  COALESCE(array_agg(i.name ORDER BY i.position) FILTER (WHERE i.name IS NOT NULL), '{}'),
                  COALESCE(array_agg(i.price ORDER BY i.position) FILTER (WHERE i.name IS NOT NULL), '{}'),
                  COALESCE(array_agg(i.currency ORDER BY i.position) FILTER (WHERE i.name IS NOT NULL), '{}')
           FROM app_monetization m JOIN apps a ON a.id = m.app_id
           LEFT JOIN iap_products i ON i.app_id = m.app_id AND i.country = m.country
           WHERE m.country <> 'ww'
           GROUP BY m.app_id, m.country, a.price"""
    ).fetchall()
    with connection.cursor() as cursor:
        cursor.executemany(
            """UPDATE app_monetization SET model = %(model)s, iap_count = %(iap_count)s, iap_min = %(iap_min)s,
                 iap_max = %(iap_max)s, iap_typical = %(iap_typical)s, sub_annual_price = %(sub_annual_price)s,
                 currency = %(currency)s
               WHERE app_id = %(app_id)s""",
            [{"app_id": app_id, **classify(price, list(zip(names, prices, currencies)))}
             for app_id, _, price, names, prices, currencies in rows],
        )
    connection.commit()
    return len(rows)


def due_apps(connection: psycopg.Connection, limit: int) -> list[tuple[int, str, Decimal | None]]:
    return connection.execute(
        f"""SELECT a.id, a.store_id, a.price FROM apps a
            LEFT JOIN app_monetization m ON m.app_id = a.id
            WHERE a.platform = 'ios' AND a.status = 'active'
              AND (m.fetched_at IS NULL OR m.fetched_at < now() - interval '{REFETCH_DAYS} days')
              AND (a.rating_count >= {MIN_RATINGS}
                   OR EXISTS (SELECT 1 FROM chart_ranks c WHERE c.app_id = a.id AND c.captured_on >= current_date - 7))
            ORDER BY m.fetched_at NULLS FIRST,
                     EXISTS (SELECT 1 FROM chart_ranks c WHERE c.app_id = a.id AND c.captured_on >= current_date - 7) DESC,
                     a.rating_count DESC NULLS LAST
            LIMIT %s""",
        (limit,),
    ).fetchall()


def refresh_iap(connection: psycopg.Connection, country: str, rate: float, workers: int, limit: int) -> None:
    android = classify_android(connection)
    apps = due_apps(connection, limit)
    print(f"iap: {len(apps):,} iOS pages due ({country}), {android:,} Android apps classified", file=sys.stderr)
    limiter = RateLimiter(rate)
    done = failed = 0
    models: dict[str, int] = {}

    def load(app):
        status, body = fetch(APP_PAGE.format(country=country, store_id=app[1]), limiter)
        if status != 200:
            return status, None, None
        return status, parse_app_page(body), parse_page_extras(body)

    with ThreadPoolExecutor(max_workers=workers) as pool:
        futures = {pool.submit(load, app): app for app in apps}
        for future in as_completed(futures):
            app_id, store_id, price = futures.pop(future)  # drop the finished future: it holds the whole response
            try:
                status, items, extras = future.result()
            except FetchError as failure:
                print(f"iap {store_id}: {failure}", file=sys.stderr)
                failed += 1
                continue
            if items is None:  # 404 or a page layout we cannot read: retry next week, do not store a guess
                failed += 1
                continue
            if extras:
                store_page_extras(connection, app_id, country, extras)  # committed together with the IAP list
            model = store_iap(connection, app_id, country, price, items)["model"]
            models[model] = models.get(model, 0) + 1
            done += 1
            if done % 250 == 0:
                print(f"iap: {done:,}/{len(apps):,} pages, {failed} failed, {models}", file=sys.stderr)
    print(f"iap: {done:,}/{len(apps):,} pages, {failed} failed, {models} "
          f"({datetime.now(timezone.utc):%H:%M} UTC)", file=sys.stderr)
