# 09 – Wettbewerber Peekly (peekly.app)

> **Stand:** 26.10.2026 · **Status:** Analyse der öffentlichen Seiten und des Client-Codes, Abgleich mit uns und AppKittie
> **Keine Rechtsberatung.** Muster übernehmen ja, Texte, Design und Daten nein [06 §4].

---

## 0. Kurzfassung

1. **Peekly ist ein direkter Wettbewerber zu AppKittie** mit fast gleichem Funktionsumfang (Apps, Trending, Ads,
   Paywalls, Onboardings, organische Videos, Keywords, MCP mit Skills), aber **deutlich billiger: Pro für 19 € im
   Monat** (AppKittie: $79). Betrieben von einem Einzelunternehmer in Toulouse, gehostet auf Vercel, Zahlung über Stripe.
2. **Eigenständige Ideen**, die AppKittie so nicht hat:
   - **Ereignis-Feed und App Tracker:** datierte Events pro App („fällt 64 Plätze“, „+1,4K Reviews in 24 h“, „Preis
     12,99 → 14,99 $“, „neue Paywall“, „Top-100-Einstieg“) mit Alerts.
   - **Paywall-Bibliothek:** datierte Screenshots von Paywalls, sortiert nach Modell (Hard, Soft, Trial, Lifetime, Abo).
   - **Öffentliche SEO-Reports:** Top Grossing, am schnellsten wachsend, meiste Downloads, Publisher- und
     Kategorie-Rankings.
   - **Studio Leaderboard:** Publisher nach geschätztem Gesamtumsatz.
   - **Methodik-Seite** mit klarer Trennung von Fakten und Schätzungen.
3. **Schätzungen stützen sich ausdrücklich auf Sensor Tower:** „Our estimates draw notably on Sensor Tower figures,
   the industry reference.“ Die Methodik-Seite spricht von „available third-party market-intelligence estimates“ plus
   eigenem Modell; die AGB von „our own models from public data“ **[beobachtet; Widerspruch zwischen den Seiten]**.
   Für uns bleibt das tabu [00, 06 §4]. Zugleich ist es ein Argument für unsere eigene Methodik mit Spannen.
4. **Katalog kleiner:** 400.000–440.000 Apps laut Marketing, 270.000 laut Upgrade-Dialog. Wir haben 1,9 Mio. iOS-IDs
   und bald ~4 Mio. Android-URLs, mit Metadaten aber erst einen Teil.

---

## 1. Methode

| Schritt | Werkzeug | Ergebnis |
|---|---|---|
| `robots.txt`, Startseite, Sitemap per `curl` | `curl` | `robots.txt` 200; Startseite und Sitemap **429 mit Vercel-Bot-Challenge** (`x-vercel-mitigated: challenge`) |
| Startseite und 13 öffentliche Seiten einmal im normalen Headless-Chromium, 3 s Pause | Playwright (ohne Tarnung, kein Captcha nötig) | Texte, Screenshots, 34 JS-Dateien (nur lokal im Scratch) |
| Statische Analyse von 9 JS-Dateien | REA `analyze_javascript_application`, Routen-Ansicht | 32 statische Routen (`ev_c2ff661d…`), nichts ausgeführt |
| Texte aus dem Bundle | Auszug um Fundstellen | Preise, Plan-Grenzen, Kennzahlen im App-Detail |

**Nicht aufgerufen:** alles, was `robots.txt` sperrt (`/dashboard`, `/explorer`, `/app/`, `/ads`, `/paywalls`,
`/onboardings`, `/trending`, `/apptracker`, `/publishers`, `/api/` …), kein Login, kein Checkout. `/pricing` ließ sich
im Headless-Browser nicht laden (Absturz); die Preise stammen aus dem Client-Code.

---

## 2. Produkt

| Bereich | Was Peekly zeigt | Beleg |
|---|---|---|
| Apps-Datenbank | geschätzter Umsatz und Downloads, Bewertungen, Preis, IAP, Werbeaktivität; Filter nach Nische, Land, Store, Umsatz, Bewertung, „Marketing-Signalen“ | `/features/apps` |
| App-Profil | Ranking-Historie, Review-Velocity, In-App-Preise, aktive Ads, Paywalls, ähnliche Apps; Kennzahlen **Peak-Umsatz pro Tag, Tage in den Top 100, Anzahl Länder mit Ranking, Update-Takt („1 / n Tage“), Downloads gewonnen pro Monat** | Bundle `359twjqq…` |
| Trending | größte Rangsprünge nach Kategorie und Land, mit Bewegung und Kurven | `/features/trending` |
| Ads Library + Feed | Meta-Creatives mit Laufzeit, Plattformen, Reichweite, Zielländern; TikTok-artiger Feed „eine App pro Bildschirm“ mit Monatsumsatz | `/features/ads`, `/features/feed` |
| Paywalls | „Exclusive to Peekly“: datierte Screens, sortiert nach Hard/Soft Paywall, Free Trial, Lifetime, Abo | `/features/paywalls` |
| Onboardings, Organic | Onboarding-Screens und -Aufnahmen; TikTok/Reels/Shorts pro App nach Views | `/features/onboardings`, Route `/features/organic` |
| App Tracker | Watchlist mit Timeline und Alerts für neue Ads, Preis- und Paywall-Änderungen, Updates, Rangbewegungen | `/features/apptracker` |
| Publisher | Studio-Leaderboard nach geschätztem Umsatz, Portfolio pro Publisher | Startseite, Route `/features/publishers` |
| Reports (öffentlich, SEO) | Top Grossing (gesamt, App Store, Google Play), am schnellsten wachsend (7-Tage-Beschleunigung der Review-Velocity), meiste Downloads, Top-Publisher, profitabelste und am schnellsten wachsende Kategorien | `/reports` |
| MCP & API | MCP über HTTP mit OAuth, **48 Tools** mit Credit-Preisen (z. B. 1 Credit pro App, 10 pro Keyword-Analyse), 11 Agent-Skills (`peekly-app/peekly-mcp`) | `/mcp` |
| Vergleichsseiten | eigene „Alternative“-Seiten zu AppKittie, AppMagic, Apptopia, Sensor Tower, data.ai, Appfigures, AppTweak, MobileAction | `/alternatives` |

**Preise und Pläne** (Bundle): Gratis-Plan mit gekürzten Listen („The free plan only shows the first apps“); Pro mit
allen Apps, Filtern, Umsatzschätzungen, Paywalls, Onboardings, Videos, Keyword Explorer, AppTracker, Favoriten und
**MCP & API mit 10.000 Credits/Monat**; **19 €/Monat**, günstiger bei vierteljährlicher und jährlicher Zahlung;
Affiliate-Programm 30 % lebenslang. Oberfläche zweisprachig (FR/EN).

**Technik:** Next.js (Turbopack), Supabase, Sentry, Stripe, Vercel mit Bot-Schutz; Auth über `/api/auth/*`.

---

## 3. Was wir übernehmen (als Muster, mit eigener Umsetzung)

| Idee | Warum | Unsere Datenbasis | Aufwand |
|---|---|---|---|
| **Ereignis-Feed + Watchlist-Alerts** | stärkstes Bindungs-Feature, zugleich unser geplanter Unterschied zu AppKittie [06 §3] | alles vorhanden: tägliche Ränge, Bewertungen, Installationen, Preise, Versionen, IAP-Listen. Events per Tagesvergleich | mittel |
| **Kennzahlen im App-Detail:** Tage in den Top 100, Länder mit Chartplatz, Update-Takt, Peak-Umsatz | billig, sofort aus vorhandenen Tabellen | `chart_ranks`, `app_metrics_daily`, `app_estimates_daily` | klein |
| **Publisher-Ranking** | „Wer dominiert eine Nische?“ | `developer_id` + Schätzungen | klein |
| **Öffentliche Reports als SEO-Seiten** | Peekly und AppKittie haben es nicht sauber gelöst [01 §8]; unser geplanter Kanal | Schätzungen, Trends, Charts | mittel |
| **Paywall-Bibliothek** | stark nachgefragt, verbindet sich mit Weg B der Umsatzschätzung [04 §3.2] | wie Onboardings: eigene Aufnahmen [05 §4] | groß |
| **Methodik-Seite** | Vertrauen; Peekly zeigt, dass Kunden danach fragen | Dok. 04, `crawler/README.md` | klein |

**Nicht übernehmen:** Schätzungen auf Basis fremder Anbieterdaten (Sensor Tower); Formulierungen wie „Copy the paywalls
that convert“ ohne Rechtsprüfung der Screenshot-Nutzung [06 §4].

---

## 4. Einordnung für Preis und Positionierung

- Der Preisdruck ist real: **19 € (Peekly) gegenüber $49–79 (AppKittie)** für sehr ähnlichen Umfang. Unser
  Pricing-Vorschlag in [06 §5] sollte das berücksichtigen.
- Unterschiede, die wir glaubhaft machen können: **eigene Erhebung mit offener Methodik und Spannen** (Peekly mischt
  Sensor-Tower-Zahlen ein, AppKittie zeigt Punktwerte), **gemessene Android-Installationen**, **größerer Katalog**,
  **EU-Compliance**.
