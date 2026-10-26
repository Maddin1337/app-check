# appcrawl – kompletter Auszug aller Apps aus App Store und Google Play

Erste Stufe unserer Datenbank: **alle** iOS- und Android-Apps aus Primärquellen, fortsetzbar, ohne externe
Abhängigkeiten (Python 3.10+, nur Standardbibliothek; für Android-Details zusätzlich `google-play-scraper`).
Hintergrund und Quellen: [`docs/research/03-datenbank-aufbau.md`](../docs/research/03-datenbank-aufbau.md).

## Wie der Auszug funktioniert

| Stufe | iOS | Android |
|---|---|---|
| **1. Discovery** (alle IDs) | Sitemaps aus `apps.apple.com/robots.txt`: `sitemaps_apps_index_app_1.xml` (1.392 Dateien) + `…new-app…` (353 Dateien) | Sitemaps aus `play.google.com/robots.txt`: `sitemaps-index-0/1.xml` (~87.000 Dateien, nur ~12 % der URLs sind Apps) |
| **2. Metadaten** | Offizielle **iTunes Lookup API**, 200 Apps pro Request | **Play-Detailseite** (laut robots.txt erlaubt), inkl. exakter Installationszahl |

Alles landet in einer SQLite-Datei (`app_keys`, `ios_apps`, `android_apps`, `sitemap_files`). Jeder Befehl
kann abgebrochen und mit demselben Aufruf fortgesetzt werden.

## Benutzung

```bash
cd crawler
export APPCRAWL_DB=data/appcrawl.sqlite3        # Standard, liegt in .gitignore

# Stufe 1: alle IDs
python3 -m appcrawl discover ios                 # ~30 min
python3 -m appcrawl discover android             # ~24 h bei 1 Request/s (--rate 2 halbiert das)
python3 -m appcrawl discover android --sample 150   # Stichprobe + Hochrechnung in ~3 min

# Stufe 2: Metadaten
python3 -m appcrawl enrich-ios                   # US-Store, ~20 Requests/min
python3 -m appcrawl enrich-ios --country de --retry-not-found   # Apps, die es im US-Store nicht gibt
pip install google-play-scraper
python3 -m appcrawl enrich-android --rate 0.5    # pro IP vorsichtig bleiben

# Fortschritt, Hochrechnung, Export für Postgres
python3 -m appcrawl stats
python3 -m appcrawl export ios --out data/ios.csv.gz
python3 -m appcrawl export android --out data/android.csv.gz

# Tests
python3 -m unittest discover -s tests
```

Optionen: `--limit N` (nur N Einträge), `--rate` (Requests pro Sekunde, gilt über alle Threads), `--workers`.
Den User-Agent setzt `CRAWLER_USER_AGENT` (für den Betrieb mit Kontaktadresse versehen).

## Gemessen am 26.10.2026 (Cloud-Container, eine IP)

| Schritt | Messung | Hochgerechnet auf den Vollauszug |
|---|---|---|
| iOS Discovery | ~1 Sitemap/s, ~1.100–1.300 Apps pro Datei | **~2 Mio. iOS-Apps in ~30 min** |
| Android Discovery | 150 Stichproben-Sitemaps in 152 s, 45,4 Apps pro Datei | **~3,95 Mio. Android-URLs**, ~24 h bei 1/s |
| iOS Lookup | 2.000 Apps in 10 Requests / 33 s; 93 % im US-Store gefunden | 2 Mio. Apps ≈ 10.000 Requests ≈ **8–9 h pro IP** |
| Android Details | 80 Seiten in 158 s (0,5/s); 89 % verfügbar; exakte Installationszahl bei allen | 3,95 Mio. Seiten ≈ **90 Tage bei 0,5/s auf einer IP** |

## Was das für den Vollauszug heißt

- **iOS ist schnell erledigt:** Discovery in einer halben Stunde, Metadaten über Nacht, mit einer IP.
- **Android-Discovery** braucht einen Tag (oder einen halben bei 2 Requests/s).
- **Android-Details sind der Engpass.** Ein Vollpass braucht mehrere IPs (z. B. 20 IPs × 0,5/s ≈ 4–5 Tage)
  oder eine höhere Rate pro IP. Die Schwelle, ab der Google blockt, ist noch nicht gemessen. Außerdem:
  - **Priorisieren:** zuerst Apps aus Kategorie-/Chart-Seiten und mit Signalen, den Long Tail danach.
  - **Laufend:** Top-Apps täglich, Rest wöchentlich bzw. monatlich (Tier-Modell in 03 §8.3).
- **Daher für den Betrieb:** ein Server mit mehreren ausgehenden IPs, später der Scheduler aus 03 §8.

## Wichtige Hinweise

- **Sitemaps kommen doppelt gzip-komprimiert** (Transport-Kompression plus `.gz`-Datei). `http.fetch`
  entpackt beides.
- **`google-play-scraper` schaltet beim Import global die TLS-Zertifikatsprüfung ab.** Wir nutzen nur den
  Parser, machen die Requests selbst und stellen die sichere Prüfung sofort wieder her (`enrich_android._parser`).
  Die Netzwerkfunktionen der Bibliothek bitte nicht verwenden.
- **Play erzeugt die Sitemaps täglich neu** (Datum im Dateinamen). `discover android` verwirft deshalb
  ausstehende Dateien, die nicht mehr im aktuellen Index stehen. Ein Vollscan sollte innerhalb eines Tages
  durchlaufen oder bei Bedarf neu gestartet werden.
- **Datensparsamkeit:** Von Android-Entwicklern speichern wir nur die Website-Domain (für das Matching mit iOS),
  keine E-Mail-Adressen oder Postanschriften (DSGVO, siehe 06 §4).
- **Nur erlaubte Pfade:** Sitemaps, Lookup API, Detailseiten. Keine Suche, kein `batchexecute`
  (siehe 03 §4.1 und §7). Die Lookup-API steht unter Apples API-Bedingungen („promote store content“); das
  ist vor dem Produktivbetrieb anwaltlich zu klären (03 §7).
