# Datensicherung vom 26.10.2026

Nur Daten, kein Code. Der Code liegt auf dem Branch `claude/appkittie-research`.

| Datei | Inhalt |
|---|---|
| `apps-ios-2026-10-26-teil1.csv.gz`, `…-teil2.csv.gz` | 1.890.449 iOS-Apps (zwei Hälften, je eine vollständige CSV) |
| `apps-android-2026-10-26-postgres.csv.gz` | 6.813 Android-Apps (Stichprobe) |
| `charts-2026-10-26.csv.gz` | 619.571 Chart-Plätze, 3.277 Charts, 40 Länder |
| `metrics-2026-10-26.csv.gz` | 87.118 tägliche Messwerte |

## Auf dem Server einspielen

```bash
cd app-check
git fetch origin data-backup
git worktree add ../app-check-backup origin/data-backup
cd crawler
B=../../app-check-backup/backup-2026-10-26
.venv/bin/python -m appcrawl import-csv ios     $B/apps-ios-2026-10-26-teil1.csv.gz
.venv/bin/python -m appcrawl import-csv ios     $B/apps-ios-2026-10-26-teil2.csv.gz
.venv/bin/python -m appcrawl import-csv android $B/apps-android-2026-10-26-postgres.csv.gz
.venv/bin/python -m appcrawl import-csv charts  $B/charts-2026-10-26.csv.gz
.venv/bin/python -m appcrawl import-csv metrics $B/metrics-2026-10-26.csv.gz
```

Ein doppelter Import erzeugt keine Dubletten; die Reihenfolge ist egal.
