# appcrawl – App-Datenbank aus App Store und Google Play

Baut und pflegt unsere App-Datenbank aus Primärquellen: **alle** iOS- und Android-Apps, ihre Metadaten,
**tägliche Charts** und **tägliche Messwerte** (Bewertungen, exakte Android-Installationen) als Zeitreihe.
Speicher ist **PostgreSQL**. Hintergrund und Quellen:
[`docs/research/03-datenbank-aufbau.md`](../docs/research/03-datenbank-aufbau.md).

## Was gesammelt wird

| Job | Quelle | Ergebnis |
|---|---|---|
| `discover ios` | App-Store-Sitemaps aus `robots.txt` (1.392 + ~360 Neu-Apps-Dateien) | alle ~1,9 Mio. iOS-App-IDs |
| `discover android` | Play-Sitemaps aus `robots.txt` (~87.000 Dateien) | alle ~4 Mio. Android-App-URLs |
| `charts` | Apples Chart-Seiten (aus der Chart-Sitemap) | Top 200 Free + Paid pro Land × Kategorie (× Gerät), täglich |
| `charts --grossing-rss` | Legacy-iTunes-RSS | Top 100 Grossing. **Opt-in:** `itunes.apple.com/robots.txt` sperrt `/*/rss/*`, Freigabe nach Anwaltsgespräch |
| `refresh-ios` | Offizielle iTunes Lookup API, 200 Apps pro Request | Metadaten + tägliche Bewertungszahl pro Store |
| `refresh-android` | Play-Detailseite (laut robots.txt erlaubt) | Metadaten + **exakte Installationszahl** täglich |
| `plan-tiers` | eigene Daten | Wie oft jede App aktualisiert wird (T0 täglich … T3 selten) |

**Android hat keine Charts:** Die Ranglisten lädt Google Play nur über die gesperrte interne Schnittstelle
(`batchexecute`). Dafür misst die tägliche Differenz der exakten Installationszahl Downloads direkt; das ist
besser als jeder Rang.

## Datenbank

Schema: [`appcrawl/migrations/0001_init.sql`](appcrawl/migrations/0001_init.sql)

| Tabelle | Inhalt |
|---|---|
| `apps` | eine Zeile pro App und Plattform: Stammdaten, aktueller Stand, Tier, nächster Aktualisierungstermin |
| `chart_ranks` | Rang pro Tag × Land × Gerät × Chart × Kategorie (monatlich partitioniert) |
| `app_metrics_daily` | Bewertungen, Installationen, Preis, Version pro App × Store × Tag (monatlich partitioniert) |
| `sitemap_files` | Fortschritt der Discovery |

## Einrichtung

```bash
# Postgres 15+ mit pg_trgm (Ubuntu: apt install postgresql)
sudo -u postgres createuser --superuser $USER && createdb appcrawl

cd crawler
python3 -m venv .venv
.venv/bin/pip install -e ".[android]"
export DATABASE_URL=postgresql:///appcrawl
.venv/bin/python -m appcrawl migrate
```

## Benutzung

```bash
PY=.venv/bin/python

# Katalog
$PY -m appcrawl discover ios                       # ~30 min, ~1,9 Mio. Apps
$PY -m appcrawl discover android --rate 2          # ~12 h
$PY -m appcrawl discover ios --only-new --rescan   # täglich: nur neue Apps
$PY -m appcrawl import-csv ios ios-apps-2026-10-26.csv.gz   # früheren Export übernehmen (auch SQLite-Format)

# Zeitreihen
$PY -m appcrawl charts                             # 40 Märkte, iPhone; --countries all, --devices iphone,ipad
$PY -m appcrawl plan-tiers
$PY -m appcrawl refresh-ios                        # fällige Apps im US-Store
$PY -m appcrawl refresh-ios --missing --country de # nicht gefundene Apps im Chart-Store bzw. in DE
$PY -m appcrawl refresh-android --limit 20000

# Überblick, Export, Tests
$PY -m appcrawl stats
$PY -m appcrawl export ios --out ios.csv.gz
TEST_DATABASE_URL=postgresql:///appcrawl_test $PY -m unittest discover -s tests
```

Optionen überall: `--limit N`, `--rate` (Requests pro Sekunde über alle Threads), `--workers`. Jeder Job lässt
sich abbrechen und mit demselben Aufruf fortsetzen. Den User-Agent setzt `CRAWLER_USER_AGENT` (für den Betrieb
mit Kontaktadresse versehen).

## Daten sichern und umziehen

`export` schreibt gzip-CSV-Dateien; Charts und Messwerte enthalten Store-IDs statt interner IDs und lassen sich
deshalb in jede neue Datenbank einspielen. `import-csv` überschreibt nie vorhandene Daten, ein doppelter Import
erzeugt keine Dubletten, und die Reihenfolge der Dateien ist egal.

```bash
# alter Rechner
$PY -m appcrawl export ios --out apps-ios.csv.gz
$PY -m appcrawl export android --out apps-android.csv.gz
$PY -m appcrawl export charts --out charts.csv.gz
$PY -m appcrawl export metrics --out metrics.csv.gz

# neuer Server (nach migrate)
$PY -m appcrawl import-csv ios apps-ios.csv.gz
$PY -m appcrawl import-csv android apps-android.csv.gz
$PY -m appcrawl import-csv charts charts.csv.gz
$PY -m appcrawl import-csv metrics metrics.csv.gz
```

Gemessen: 1,89 Mio. Apps importieren in ~65 s, 620.000 Chart-Plätze in ~30 s.

## Betrieb auf dem Server

Zeitplan als Vorlage: [`deploy/crontab.example`](deploy/crontab.example).

| Uhrzeit (UTC) | Job | Dauer |
|---|---|---|
| 00:40 | `discover ios --only-new --rescan` (sonntags voller Rescan) | Minuten (voll ~30 min) |
| 01:05 | `charts` + `plan-tiers` | ~30 min für 40 Märkte |
| 02:15 | `refresh-ios`, danach `--missing` | ~8–9 h für den ganzen Katalog |
| alle 30 min | `refresh-android --limit 20000` | läuft durch, solange etwas fällig ist |
| So 03:00 | `discover android` | ~24 h bei 1/s |

**Engpass ist Android.** Ein Vollpass über ~4 Mio. Detailseiten braucht bei 0,5 Requests/s auf einer IP rund
90 Tage. Die Tiers sorgen dafür, dass wichtige Apps täglich drankommen und der Long Tail monatlich. Für den
ersten Vollpass mehrere Server-IPs einplanen (z. B. 15–20 → etwa eine Woche) und die Blocking-Schwelle von
Google vorsichtig ausmessen.

## Gemessen am 26.10.2026 (Cloud-Container, eine IP)

| Schritt | Messung |
|---|---|
| iOS Discovery | alle 1.745 Sitemaps in 29 min, 0 Fehler → **1.878.379 iOS-Apps** |
| Android Discovery | Stichprobe 150 von 86.990 Sitemaps: 45,4 Apps pro Datei → **~3,95 Mio. App-URLs** |
| Import nach Postgres | 1.878.379 Apps in 62 s |
| Charts US + DE + GB | 126 Chart-Seiten in 2:15 min → **49.158 Ränge**, 42 Kategorien, je 200 tief |
| refresh-ios | 4.000 Apps in 72 s (20 Requests); im Chart-Store nachgeschlagen: 402 von 560 fehlenden gefunden |
| refresh-android | 30 Detailseiten in 59 s, alle mit exakter Installationszahl |

## Wichtige Hinweise

- **Sitemaps kommen doppelt gzip-komprimiert** (Transport-Kompression plus `.gz`-Datei). `http.fetch`
  entpackt beides.
- **`google-play-scraper` schaltet beim Import global die TLS-Zertifikatsprüfung ab.** Wir nutzen nur den
  Parser, machen die Requests selbst und stellen die sichere Prüfung sofort wieder her
  (`refresh_android._parser`). Die Netzwerkfunktionen der Bibliothek bitte nicht verwenden.
- **Play erzeugt die Sitemaps täglich neu** (Datum im Dateiname). `discover android` übernimmt jeweils den
  aktuellen Index; ein Lauf sollte möglichst innerhalb eines Tages durch sein (`--rate 2`).
- **Ratings auf iOS gelten pro Store.** `apps.rating_count` stammt aus `refresh_country`; die Zeitreihe in
  `app_metrics_daily` hält den Store mit.
- **Datensparsamkeit:** Von Android-Entwicklern speichern wir nur die Website-Domain (für das Matching mit
  iOS), keine E-Mail-Adressen oder Postanschriften (DSGVO, siehe 06 §4).
- **Nur erlaubte Pfade:** Sitemaps, Lookup API, Detail- und Chart-Seiten. Keine Suche, kein `batchexecute`;
  der RSS-Grossing-Feed nur nach Freigabe. Apples Lookup-API-Bedingungen („promote store content“) sind vor
  dem Produktivbetrieb anwaltlich zu klären (03 §7).
