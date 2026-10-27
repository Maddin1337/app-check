# Web-Prototyp: App-Explorer

Erster Prototyp der Oberfläche auf unseren echten Daten aus [`crawler/`](../crawler/README.md).
Arbeitstitel „app-check“, eigenes Design (Iris-Violett, Geist), bewusst anders als AppKittie.

| Seite | Inhalt |
|---|---|
| `/explore` | Suche und Filter über den ganzen Katalog: Plattform, Kategorie (ein- und ausschließen), Sprache, Veröffentlichung, Bewertungen und Ø-Bewertung, Preis, In-App-Käufe, geschätzter Umsatz, Publisher, „nur in Charts“; Sortierung nach Bewertungen, geschätztem Umsatz bzw. Downloads, Wachstum (30 Tage, mit Verlaufskurve), bestem Chart-Platz, Neuheit. Die Trefferzahl wird ab 10.000 nicht mehr exakt gezählt. Filter stehen in der URL und sind teilbar |
| `/app/[platform]/[storeId]` | App-Detail: Kennzahlen (inkl. Tage in den Top 100, Länder mit Chartplatz, Spitzenumsatz pro Tag, beobachtete Versionen), geschätzte Downloads und Umsatz (Spanne, Methode, Konfidenz), In-App-Käufe mit Preisen, Chart-Platzierungen des letzten Tages, tägliche Messwerte, Verweis auf die andere Plattform |
| `/charts` | Rankings pro Land, Chart, Kategorie und Gerät |
| `/methodik` | Was gemessen und was geschätzt wird, Methoden mit Konfidenz, Eichstand und Vergleichswerte (berichtete Umsätze gegen unsere Schätzung, live aus der Datenbank), Grenzen, Zeitplan |
| `/feed` | Ereignisse des letzten Tages (Aufstieg, Abstieg, neu in den Top 100, Bewertungs-/Installations-Sprung, Preis, Version), Filter Art und Land; auch als Karte auf der App-Seite |
| `/publishers` | Publisher nach geschätztem Monatsumsatz ihrer Apps (Summe der Mediane), stärkste Apps, Filter Plattform/Kategorie; Klick filtert den Explorer auf den Publisher |
| `/rising` | Aufsteiger: Zuwachs über 7/30 Tage (iOS Bewertungen, Android Installationen) mit Sparkline, absolut oder in %; dazu Chart-Aufsteiger gegenüber vor 7 Tagen. Liest `app_trends` (Crawler-Job `trends`) |

## Starten

```bash
npm install
export DATABASE_URL=postgres://USER:PASSWORT@127.0.0.1:5432/appcrawl   # dieselbe DB wie der Crawler
npm run dev          # Entwicklung auf http://localhost:3000
npm run build && npm start   # Produktion
```

Technik: Next.js 16 (App Router, Cache Components, Partial Prefetching), Tailwind CSS v4, `postgres` als
Datenbank-Client. Datenzugriff in `lib/queries.ts`, alle Datenbank-Lesezugriffe laufen in Suspense-Grenzen
und werden pro Request frisch gerendert.

## Bekannte Grenzen des Prototyps

- Noch kein Login, keine Bezahlung. Schätzungen für Downloads und Umsatz sind Modell v0 (früh, unkalibriert, iOS nur US-Store).
- „Bester Chart-Platz“ kommt aus `app_chart_summary`, die der Crawler nach jedem Chart-Lauf neu befüllt.
- Katalog-Übersicht und Kategorienliste sind eine Stunde zwischengespeichert (`'use cache'`).
- Die Suche nutzt den Trigramm-Index auf dem Namen; mit „Inkl. ohne Metadaten“ wird zusätzlich der Slug
  durchsucht, das ist langsamer.
