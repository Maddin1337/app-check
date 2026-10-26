# Web-Prototyp: App-Explorer

Erster Prototyp der Oberfläche auf unseren echten Daten aus [`crawler/`](../crawler/README.md).
Arbeitstitel „app-check“, eigenes Design (Iris-Violett, Geist), bewusst anders als AppKittie.

| Seite | Inhalt |
|---|---|
| `/explore` | Suche und Filter über den ganzen Katalog: Plattform, Kategorie, Veröffentlichung, Bewertungen, Preis, geschätzter Umsatz, „nur in Charts“, Sortierung nach Bewertungen, geschätztem Umsatz bzw. Downloads, bestem Chart-Platz, Neuheit. Filter stehen in der URL und sind teilbar |
| `/app/[platform]/[storeId]` | App-Detail: Kennzahlen, geschätzte Downloads und Umsatz (Spanne, Methode, Konfidenz), In-App-Käufe mit Preisen, Chart-Platzierungen des letzten Tages, tägliche Messwerte, Verweis auf die andere Plattform |
| `/charts` | Rankings pro Land, Chart, Kategorie und Gerät |
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
- „Bester Chart-Platz“ wird pro Request aus `chart_ranks` aggregiert. Bei vielen Märkten und Tagen gehört das in
  eine täglich berechnete Tabelle.
- Die Suche nutzt den Trigramm-Index auf dem Namen; mit „Inkl. ohne Metadaten“ wird zusätzlich der Slug
  durchsucht, das ist langsamer.
