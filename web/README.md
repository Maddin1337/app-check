# Web-Prototyp: App-Explorer

Erster Prototyp der Oberfläche auf unseren echten Daten aus [`crawler/`](../crawler/README.md).
Arbeitstitel „app-check“, eigenes Design (Iris-Violett, Geist), bewusst anders als AppKittie.

| Seite | Inhalt |
|---|---|
| `/explore` | Suche und Filter über den ganzen Katalog: Plattform, Kategorie, Veröffentlichung, Bewertungen, Preis, „nur in Charts“, Sortierung nach Bewertungen, bestem Chart-Platz, Neuheit. Filter stehen in der URL und sind teilbar |
| `/app/[platform]/[storeId]` | App-Detail: Kennzahlen, Chart-Platzierungen des letzten Tages, tägliche Messwerte, Verweis auf die andere Plattform |
| `/charts` | Rankings pro Land, Chart, Kategorie und Gerät |

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

- Noch kein Login, keine Bezahlung, keine Schätzungen für Downloads und Umsatz.
- „Bester Chart-Platz“ wird pro Request aus `chart_ranks` aggregiert. Bei vielen Märkten und Tagen gehört das in
  eine täglich berechnete Tabelle.
- Die Suche nutzt den Trigramm-Index auf dem Namen; mit „Inkl. ohne Metadaten“ wird zusätzlich der Slug
  durchsucht, das ist langsamer.
