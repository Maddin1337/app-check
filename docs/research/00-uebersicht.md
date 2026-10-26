# AppKittie-Analyse und Bauplan für unseren Nachbau – Übersicht

> **Stand:** 26.10.2026 · **Ziel:** ein Produkt wie [appkittie.com](https://www.appkittie.com) unter eigenem Namen bauen.
> **Phase:** Recherche und Dokumentation abgeschlossen, noch kein Produktcode.
> **Keine Rechtsberatung.** Rechtliche Aussagen sind Leitplanken und vor dem Start anwaltlich zu prüfen.

---

## Dokumente

| Nr. | Dokument | Inhalt |
|---|---|---|
| 00 | **diese Übersicht** | Kernaussagen, Leseführung |
| 01 | [Produkt, UX & Design](01-produkt-ux-design.md) | Alle öffentlichen Seiten, Dashboard-Struktur, Filter, Funnel, Preise, Design-System, 13 Screenshots |
| 02 | [Technik-Stack](02-technik-stack.md) | REA-Analyse des Client-Codes: Hosting, Frontend, tRPC-API (89 Prozeduren), Drittanbieter, MCP, Datenmodell |
| 03 | [Datenbank-Aufbau](03-datenbank-aufbau.md) | **Kernfrage:** Millionen Apps aus App Store und Google Play, tägliche Updates, Architektur, Kosten, Schema, 6–8-Wochen-Plan |
| 04 | [Schätzmodelle](04-schaetzmodelle.md) | Downloads, Umsatz, Wachstum, Ad-Spend, Keyword-Popularität, Sentiment, Genauigkeit |
| 05 | [Ads, Videos, Onboardings](05-ads-videos-onboardings.md) | Datenquellen und Pipelines für Werbeanzeigen, virale Videos und Onboarding-Flows |
| 06 | [Markt, Wettbewerb, Recht](06-markt-wettbewerb-recht.md) | Firma hinter AppKittie, Traktion, Terms, Wettbewerber, rechtliche Leitplanken, Pricing-Vorschlag |
| 07 | [Architektur & Roadmap](07-architektur-roadmap.md) | **Unser Bauplan:** Systemarchitektur, Tech-Stack, Datenmodell, Quellen-Ampel, Phasen, Budget, offene Entscheidungen |

Screenshots liegen in [`assets/`](assets/). Jedes Fachdokument kennzeichnet, was **beobachtet** (mit Quelle) und
was **abgeleitet** ist.

---

## AppKittie in zehn Punkten

1. **Was es ist:** App-Marktdaten für iOS und Android. Geschätzter Umsatz und Downloads, Werbeanzeigen mit
   geschätzten Ausgaben, virale Videos, ASO-Keywords, Onboarding-Flows, Reviews, Rankings. Zielgruppe:
   Indie-Gründer und App-Studios, die „erfolgreiche Apps finden und nachbauen“ wollen [01 §0].
2. **Preis:** ein Plan, $79/Monat oder $49/Monat jährlich, 3 Seats, 5.000 API-Credits, 3-Tage-Trial mit Karte
   [01 §6].
3. **Sehr jung:** Domain seit 25.11.2025, Launch Anfang 2026, Wyoming-LLC. Similarweb schätzt ~70K Besuche in
   3 Monaten, 19 % davon aus Deutschland [06 §1].
4. **Technik:** Next.js 16 + tRPC + Auth.js + Stripe, selbst gehostet hinter Cloudflare, Medien auf Cloudflare
   R2. Der MCP-Server läuft separat als Python-Dienst [02 §0].
5. **Gäste sehen das Dashboard:** komplette Navigation und Filter, Ergebnisse hinter einer Inline-Paywall.
   Öffentliche App-Seiten unter `/app/<slug>` mit maskierten Kennzahlen, aber ohne Sitemap [01 §0].
6. **Schätzungen basieren stark auf Reviews:** Felder wie `downloads_per_review` und `revenue_per_review`;
   „Growth“ ist laut eigener Doku das **Wachstum der Review-Anzahl**, obwohl die Website „MRR growth“ sagt
   [01 §0, 02 §0].
7. **Ads aus EU-Transparenzdaten:** Meta Ad Library (EU-Reichweite), Apple Ads. US-Spend wird aus EU-Daten per
   Multiplikator hochgerechnet [02 §0, 06 §1].
8. **Creator-Daten** stammen laut MCP-Code aus dem Schwesterprodukt TopYappers. App-Details enthalten außerdem
   Kontaktfelder (`emails`, `decision_makers`), die in der EU datenschutzrechtlich heikel sind [06 §1].
9. **KI-Kanal:** MCP-Server für Claude, ChatGPT & Co. (14–15 Tools, je nach Quelle), Agent-Skills auf GitHub,
   REST-API mit Credits [01 §4.12, 02, 06].
10. **Schwächen, die wir nutzen können:** intransparente Schätzungen, Abrechnungsbeschwerden beim Trial, keine
    SEO-Erschließung der App-Seiten, Pixel vor der Einwilligung, kein Impressum/EU-Vertreter [01, 02, 06].

---

## Die Antwort auf die Kernfrage: Wie bauen wir schnell eine riesige Datenbank?

**Kurz:** Beide Stores veröffentlichen ihren kompletten Katalog selbst. Der eigentliche Aufwand liegt nicht im
Finden der Apps, sondern in **täglichen Zeitreihen** und guten **Schätzmodellen**. Details: [03], [04].

1. **Discovery über Sitemaps, die in den robots.txt der Stores verlinkt sind:**
   - Apple: 1.392 Sitemap-Dateien → **≈ 2,0 Mio. iOS-Apps**, dazu eine eigene Sitemap für neue Apps.
   - Google Play: 86.927 Sitemap-Dateien → **≈ 4 Mio. App-URLs** (inklusive nicht mehr verfügbarer Apps).
   - Beides selbst im Container getestet [03 §0, §5].
2. **iOS-Metadaten über die offizielle iTunes Lookup API:** 200 Apps pro Request, der ganze Katalog passt
   täglich in das offizielle Limit einer einzigen IP (~20 Requests/Minute) [03 §0 Nr. 2].
3. **Zusatzdaten von den öffentlichen Store-Seiten:** IAP-Preise, Ratings-Histogramm, Privacy-Labels,
   Versionshistorie (iOS) und bei Google Play die **exakte Installationszahl** (`realInstalls`). Deren tägliche
   Differenz ist eine echte Download-Messung für Android [03 §0 Nr. 3–4].
4. **Charts als Fundament der Schätzungen:** Apple Top 200 Free/Paid pro Kategorie und Land, Top Grossing über
   RSS, Play-Kategorieseiten. **Ab Tag 1 mehrmals täglich sammeln**, weil sich Historie nicht nachholen lässt
   [03 §11, 04 §9.1].
5. **Engpass ist Google Play:** ein HTML-Request pro App, ≈ 680 GB für einen Vollpass, ~1 Woche mit IP-Pool.
   Charts und Reviews laufen bei Play über Endpunkte, die die robots.txt verbietet. Das entscheiden wir erst nach
   Anwaltsgespräch [03 §0 Nr. 5].
6. **Architektur:** Python-Crawler mit Postgres-Queue, Postgres für Stammdaten, ClickHouse für Zeitreihen,
   Cloudflare R2 für Rohdaten und Medien, später Typesense für die Suche [03 §8, 07 §3–4].
7. **Zeitplan:**
   - Woche 1: Seed mit ~6 Mio. IDs, Chart-Zeitreihen laufen.
   - Woche 2: iOS-Vollkatalog.
   - Wochen 3–4: Google-Play-Vollkatalog, tägliche Updates.
   - Wochen 5–8: Suche/Filter und Schätzmodelle v0.

   Details in [03 §11] und [07 §7].
8. **Kosten:** etwa **€500–700/Monat** Infrastruktur (Spanne €330–1.000). Kommerzielle Datenlizenzen kosten
   dagegen 5- bis 6-stellig pro Jahr [03 §9.4].
9. **Ads, Videos, Onboardings:**
   - Ads aus den EU-Transparenz-Archiven: Apples Ad Repository API ist öffentlich und liefert direkt die App-ID;
     dazu die Meta Ad Library API.
   - Videos über die YouTube-API und TikTok/Instagram-Metadaten, angezeigt nur als Embed.
   - Onboardings über Freelancer mit echten iPhones plus KI-Auswertung (~$5–12 pro Flow).

   Details in [05 §7].
10. **Schätzgenauigkeit realistisch:**
    - Top-Apps: Faktor 1,3–1,5;
    - Kategorie-Charts: Faktor 1,5–2;
    - Long Tail: Faktor 2–4.

    Deshalb zeigen wir Spannen und Konfidenz statt Scheingenauigkeit [04 §0 Nr. 9].

---

## Wie wir besser werden als das Original

- **Offene Methodik und Konfidenzbänder** zu jeder Schätzung, statt „Growth“ falsch zu benennen [04, 06 §3].
- **Watchlists und Alerts** (Rang-, Preis-, Ad-Änderungen) statt nur Stöbern [06 §3].
- **Echte Vorschau für Gäste** und **öffentliche App-Seiten mit Sitemap** als SEO-Kanal [01 §8].
- **EU/DACH-Fokus mit sauberer Compliance:** Consent vor Pixeln, Impressum, Datenschutz, DE/EN-Oberfläche, Preise
  in EUR [01 §8, 06 §5].
- **Faire Trial-Abrechnung** mit Erinnerung vor der ersten Zahlung [06 §1].
- **KI-Zugang (MCP) mit echtem OAuth** und Gratis-Credits als Akquisekanal [02, 06 §5].

---

## Rechtliche Leitplanken (Kurzfassung, Details in [06 §4])

- **Daten von AppKittie oder anderen Anbietern sind tabu.** Wir erheben alles selbst aus Primärquellen.
- **Eigener Name, eigenes Design.** Muster übernehmen ist erlaubt, eine 1:1-Kopie von UI, Texten oder Grafiken
  nicht (EU-Design schützt seit Mai 2025 auch Benutzeroberflächen).
- **robots.txt und Store-ToS respektieren**, Last begrenzen; Grauzonen erst nach Anwaltsfreigabe.
- **Keine personenbezogenen Kontaktdaten** sammeln oder anzeigen; Reviewer nur gehasht.
- **Fremde Videos und Creatives** nicht selbst hosten, sondern einbetten bzw. als Thumbnail mit Link; Takedown-
  Prozess einrichten.

---

## Was du jetzt entscheiden solltest

Ausführlich in [07 §9–10]:

1. **Name und Marke** für unser Produkt.
2. **Länderfokus:** global oder Start mit USA + EU/DACH.
3. **Anwaltstermin** (ein Tag) für Datenbank-Recht, Store-ToS, DSGVO und Hosting von Creatives.
4. **Zugänge mit Vorlauf beantragen:** Meta Ad Library (Identitätsprüfung), TikTok Commercial Content API,
   Apple-Ads-Account, Google-Cloud-Projekt für YouTube.
5. **Startschuss für das erste Code-Paket:** Chart-Collector + Sitemap-Import, damit die Historie sofort wächst.

---

## Methodik dieser Recherche

- **Werkzeuge:** REA (Reverse Engineer Anything) für die Analyse des öffentlichen Client-Codes, Headless-Chromium
  mit Playwright, Websuche, kleine Machbarkeitstests gegen App Store und Google Play.
- **Vorgehen:** sechs parallele Recherche-Agenten mit gemeinsamen Spielregeln, danach Konsolidierung in 00 und 07.
- **Spielregeln:** nur öffentliche Seiten von appkittie.com, kein Login, kein Account, kein Checkout, keine
  Paywall-Umgehung, wenige und langsame Requests, keine AppKittie-Daten übernommen.
- **Grenzen:**
  - Eingeloggte Inhalte sind nur aus Marketing-Screenshots, JS-Texten und Doku abgeleitet.
  - Einige Seiten waren für den Proxy dieser Umgebung gesperrt (u. a. x.com, Reddit, GitHub-API).
  - Die Lücken stehen in den Abschnitten „Offene Fragen“ und „Was nicht ging“ der Fachdokumente.
- **Persönliche Daten:** Angaben zu Personen hinter AppKittie beschränken sich auf das geschäftlich Relevante.
