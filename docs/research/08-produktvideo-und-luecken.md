# 08 – Produktvideo, offene Fragen und was uns noch fehlt

> **Stand:** 26.10.2026 · **Status:** Nachtrag zu 01 und 02, Abgleich mit unserem Prototyp in `web/`
> **Keine Rechtsberatung.** Es gelten die Leitplanken aus [06 §4]: Muster ja, 1:1-Kopie nein.

---

## 0. Kurzfassung

1. Das **37-Sekunden-Produktvideo** von AppKittie (offene Frage in [01 §9]) ist jetzt Bild für Bild gesichtet. Es
   zeigt **neun Bereiche**: App-Explorer, Rising, Meta-Ads-Bibliothek, Meta-Ad-Spend-Dashboard, virale Videos,
   Keyword-Explorer, Onboarding-Bibliothek, App-Detail mit Schätzungen und eine **KI-Abfrage in natürlicher Sprache**.
2. Unser Prototyp deckt davon den **Explorer in einfacher Form, Rankings und das App-Detail ohne Schätzungen** ab.
   Die größten Lücken: **Umsatz- und Download-Schätzungen**, **Wachstum mit Sparkline**, **Rising/Trending**,
   **Ads**, **Keywords**, **Videos**, **Onboardings**, **Login/Abo**.
3. Fünf offene Code-Fragen aus [01 §9] und [02 §12] sind geklärt: Hot Ideas sind **KI-generierte HTML-Mockups**
   als Pro-Feature, der Abbruch-Checkout bietet **$20 Rabatt für 15 Minuten**, der Screenshot-Generator ist
   **im Code noch vorhanden, aber ohne Route**, das Free-Tier hat **keine Ads/Creators/Videos/Screenshots und
   0 API-Credits**.

---

## 1. Methode

| # | Schritt | Werkzeug | Ergebnis | Evidence |
|---|---|---|---|---|
| 1 | Produktvideo laden (1 GET, öffentliche R2-URL `pub-5fd76a8c….r2.dev/0824(1).mp4`) | `curl` | 38,4 MB, HEVC 1920×1080, 30 fps, AAC-Ton, 37,2 s, erstellt 24.08.2026 | SHA-256 `cca50e91…6b12` |
| 2 | Frames extrahieren (1 fps, Kontaktbögen) | ffmpeg 7.0.2 (statisch über `imageio-ffmpeg`) | 37 Frames, 11 Bögen, nur lokal im Scratch | – |
| 3 | Prerender-HTML von 8 Routen (je 1 GET, 1,5 s Pause) | `curl` | 5× 200, 3× 404 (`/dashboard/screenshots`, `/dashboard/app-ideas`, `/dashboard/ideas`) | – |
| 4 | 35 referenzierte JS-Chunks (je 1 GET, 0,5 s Pause, Cloudflare-Cache) | `curl` | 1,8 MB | – |
| 5 | Statische Analyse der 4 relevanten Chunks | REA `analyze_javascript_application` (`source_paths`, 44.419 AST-Knoten, 0 Parse-Fehler) | vollständige Syntax für die 4 Dateien; die übrigen 31 bewusst nicht analysiert | `ev_8d333a18…fd3` |
| 6 | Fundstellen lesen (Konstanten, JSX-Texte) | Textauszug um die Treffer, nichts ausgeführt | siehe §3 | Chunks `26086ee0…` (`5320bca0…`), `e4a744c1…` (`53addc4a…`), `1b30b35d…` (`4783597b…`) |

**Spielregeln wie in [02 §1]:** nur öffentliche Seiten, kein Login, kein Checkout, keine Paywall-Umgehung, keine
Datenzeilen geladen. Video-Frames und Chunks liegen nur im Scratch und **nicht im Repo**. Ein Versuch, alle 35
Chunks am Stück zu analysieren, lief bei einem großen Vendor-Chunk in das REA-Zeitlimit (600 s); deshalb die
gezielte Auswahl.

---

## 2. Das Produktvideo

### 2.1 Ablauf

| Zeit | Szene | Was zu sehen ist |
|---|---|---|
| 0–2 s | Text „Discover the apps / Winning right now“ | App-Icons fliegen ein (Duolingo, Cal AI u. a.) |
| 2–5 s | **Explore Apps** | Tabelle: App, Kategorie, **Downloads** (mit Δ %), **Revenue** (mit Δ %), **Growth 30D mit Sparkline**, Rating mit Review-Zahl, Released, Last update. Filterzeile: Time, Store, In-app purchases, Price, Min revenue, Min downloads, Min reviews, Min rating, Growth, **Marketing Signals**, **Meta Ads Spend**, Contacts; aktive Filter-Chips „Released after …“, „Exclude genre: Games/Entertainment/Productivity“, „Exclude primary language: ZH-CN“ |
| 5–6 s | Sidebar | Explore: Apps, Ads, Organic, Onboardings, Trending, Rising · Favorites (Apps, Ads, Organic) · ASO Tracking: Keyword Explorer, Your Apps, Add App · Tools: Review Analytics |
| 6–7 s | **Rising Apps** | Rangliste mit Zeitraum-Umschalter, Store-Filter, Sprach-/Genre-Ausschluss, Umsatz und Wachstum pro App |
| 7–8 s | Text „Then see exactly / What's driving their growth“ | – |
| 9–11 s | **Meta Ads Library** (pro App) | 290 Creatives, Tabs All/Videos/Images, Karten mit Anzeigentext, Video-Vorschau, Plattform-Icons, „Published Jun 22, 2026“ |
| 11–12 s | **Viral videos library** | Hochformat-Kacheln mit Views (1,2M–4,2M), TikTok-/Instagram-Logo |
| 12–14 s | **Total Meta Ads Spend** | Reach by country (Donut, 53,3M), Spend by country ($829K), Audience Overview (Geschlecht, Altersgruppen), KPI-Kacheln Reach / Spend / **Avg. CPM $15,54** / Ads Count 637, Weltkarte „Spend by country“ mit Top-Ländern |
| 15–17 s | **Keyword Explorer** | Workspace mit Keyword-Liste, Kacheln Opportunity 15–74 / Popularity 13–90 / Difficulty 8–36 / Ranking apps 210, Tabs Ideas / Opportunities / Low Difficulty / Tracked, Buttons „Get keyword ideas“, „Add Keyword“, Tabelle mit Balken je Kennzahl und App-Icons |
| 18–21 s | **Onboarding Library** | Pro App eine Reihe Screens (Brainrot 35 Steps, PushScroll 26, Lightly 33), horizontal scrollbar |
| 21–24 s | Text „Everything you need / To see what's working“ | Logo |
| 24–27 s | **App-Detail** (BitePal) | **Est. Monthly Downloads 203K**, **Est. Monthly Revenue $712K**, Creators 86 (319 Videos), Meta Ads 649, Apple Ads 2.337, Größe, Plattform, Rating, **Sentiment positiv/negativ in %**, Store-Screenshots |
| 27–30 s | **KI-Abfrage** | Eingabefeld „Which apps hit $100K MRR after launching under a year ago?“ mit Chip „appkittie“, Ergebniskarten mit MRR, Wachstum in % und Kurve. Das entspricht der MCP-Anbindung aus [02] |
| 30–37 s | Text „Replicate the … / Grow faster“, Explorer, Logo | – |

### 2.2 Was das Video über die Positionierung sagt **[abgeleitet]**

- **Umsatz steht im Mittelpunkt.** Revenue ist die vorsortierte, hervorgehobene Spalte; das App-Detail zeigt
  Umsatz und Downloads als größte Zahlen. Methodik oder Spannen sind nirgends zu sehen [04].
- **„Was treibt das Wachstum“** wird mit Ads, Ad-Spend und viralen Videos beantwortet, nicht mit
  Store-Daten. Ads und Videos sind also Kernnutzen, keine Beigabe.
- **Der KI-Zugang wird als Feature verkauft**, nicht als Entwickler-Schnittstelle.

---

## 3. Geklärte Fragen aus 01 §9 und 02 §12

| Frage | Antwort | Beleg |
|---|---|---|
| **Was ist ein „Hot idea“?** [01 §9] | Eine Seite „**Hot app ideas** – AI mockups and concepts from fast-growing apps“. Jede Idee hat `idea_title`, `idea_category`, `app_slug` und ein **`mockup_html`**, das in einem iPhone-Rahmen (390×844, `<iframe sandbox="">`) gerendert wird. Filter: Suche, App-Kategorien, „Idea category“ (kommagetrennte Labels), **Blueprint**: Needs backend / Needs database / Needs AI; Sortierung nach Created, Released, Reviews, Downloads, Revenue, Rating, Price. Detailseite `/dashboard/hot-ideas/<slug>`. **Pro-Feature**: Gäste sehen „Curated app concepts with AI HTML mockups – sign in“, Free-Nutzer „Hot idea blueprints are a Pro feature“ | `e4a744c1…` @62379, @66131, @67688, @70129, @71716 |
| **AppIdea-Feature** (`ideaCategories`, `needsBackend` …) [02 §12 Nr. 9] | Dasselbe Feature wie Hot Ideas, die Felder sind die Blueprint-Filter. Die Ideen sind von erfolgreichen Apps abgeleitete Konzepte; die Mockups sind laut UI-Text KI-generiert. Wie die Ideen erzeugt werden (Modell, Prompt), ist serverseitig und **unbekannt** | wie oben |
| **Ist der Screenshot-Generator noch aktiv?** [01 §9] | **Teilweise.** `/dashboard/screenshots` liefert 404, im Menü und im Video taucht er nicht auf. Das Feature-Flag `screenshots` existiert aber in allen Plänen (Free: aus, Pro: an), und nach einem Upgrade aus dem Trial lädt der Client die Rate-Limits von `screenshots.crud` und `screenshotTranslations` neu („Starting your request now“). Einschätzung: Backend und Abrechnung vorhanden, Oberfläche versteckt oder an anderer Stelle **[abgeleitet]** | `e4a744c1…` @43683; Route-404 |
| **Was zeigt `/checkout/cancel`?** [01 §9] | Ein „Rescue“-Angebot: **$20 Rabatt** (`CHECKOUT_RESCUE_DISCOUNT_USD = 20`), gültig **15 Minuten** (`CHECKOUT_RESCUE_WINDOW_MS = 900000`), Angebots-Schlüssel `checkout_rescue`. Die verbleibende Zeit kommt vom Server (`offerRemainingMs`); der Client zählt im 250-ms-Takt herunter und zeigt ein Ticket mit „Expires in mm:ss“ und Fortschrittsbalken. Texte: „Still deciding? Here's $20 off.“ / „Claim $20 off“; nach Ablauf „This offer has ended.“; ohne Angebot (Direktaufruf, `offerRemainingMs: null`) „Ready when you are.“ | `26086ee0…` @22405, Modul `375764`; Prerender-Payload der Seite |
| **Wann kommt der Trial-Prompt?** [01 §9] | Der Client entscheidet es nicht selbst: `showDashboardTrialPrompt` kommt als fertiges Flag aus `settings.getSubscription`; ohne Session ist es immer `false`. Die Regel liegt auf dem Server und bleibt **unbekannt** | `1b30b35d…` @20277 (`useSubscription`) |
| **Kontingente Gast/Free** [01 §9] | Im Client gibt es **keine Suchkontingente**. `PLAN_TIERS` legt nur fest: Free = keine Ads, Creators, Videos, Screenshots; 0 Tracked Keywords, 0 ASO-Apps, 0 Review-Apps, 0 API-Credits. Pro (auch „starter“ und „enterprise“ heißen „Pro“) = alles an, unbegrenzte Keywords/Apps, **5.000 API-Credits/Monat**, $79/Monat bzw. $588/Jahr. Die „5 searches/day“ aus [02 §1.2] werden also **nur serverseitig** durchgesetzt | `1b30b35d…` Modul `486501` |

**Weiter offen** (nicht aus dem Client zu klären): Origin-Hoster, Datenbanken, Rate-Limit-Speicher,
Scraper-Infrastruktur, Herkunft des Keyword-„traffic score“, Auth.js-Konfiguration [02 §12 Nr. 1–7], die Regel
hinter dem Trial-Prompt und die Erzeugung der Hot Ideas.

---

## 4. Was bei uns noch fehlt

Abgleich der Video-Funktionen mit dem Prototyp in `web/` (Stand dieses Branches: `/explore`, `/app/[platform]/[storeId]`,
`/charts`) und dem Crawler in `crawler/`.

| Bereich (Video) | AppKittie | Wir heute | Lücke | Datenbasis bei uns | Phase [07 §7] |
|---|---|---|---|---|---|
| Explorer-Tabelle | Downloads, Revenue, Growth 30D + Sparkline, Rating, Released, Last update | Bewertungen, bester Chart-Platz, Veröffentlichung, Preis | **Schätzspalten, Wachstum, Sparkline** | `app_metrics_daily` (Ratings, `realInstalls`) + Charts; Schätzmodell fehlt | 3 |
| Explorer-Filter | Min revenue/downloads/reviews/rating, Growth, IAP, Marketing Signals, Meta Ads Spend, Contacts, Genre- und Sprach-Ausschluss | Plattform, Kategorie, Veröffentlichung, Mindestbewertungen, Preis, „nur in Charts“ | Ausschluss-Filter, IAP, Wachstum, Mindest-Rating, Sprache; später Schätz- und Ads-Filter | IAP und Sprache aus Lookup/Detailseite; Rest abhängig von Schätzungen/Ads | 2–3 |
| **Rising / Trending** | eigene Seiten mit Zeitraum | – | **ganz** | Δ Ratings und Δ `realInstalls` aus `app_metrics_daily`, Rangsprünge aus `chart_ranks` | 2 (einfach) |
| App-Detail | Est. Downloads/Revenue, Ads-/Creator-Zähler, Sentiment, Screenshots | Kennzahlen, Chart-Platzierungen, tägliche Messwerte | **Schätzungen mit Spanne**, Screenshots, Sentiment, Ads-Zähler | Screenshots-URLs aus Lookup; Sentiment braucht Reviews | 2–4 |
| Meta Ads Library | Creatives pro App, Video/Bild, Laufzeit | – | **ganz** | Meta Ad Library API (Zugang mit Vorlauf) [05 §2] | 3 |
| Ad-Spend-Dashboard | Reach/Spend nach Land, Alter/Geschlecht, CPM, Weltkarte | – | **ganz** | EU-Reichweite aus der Ad Library × CPM-Modell, als Spanne [04 §4] | 3–4 |
| Apple Ads | Zähler pro App | – | ganz | Apple Ad Repository API (öffentlich, mit `appId`) [05 §2] | 3 |
| Virale Videos | TikTok/IG-Kacheln mit Views | – | ganz | YouTube API offiziell, TikTok/IG nur Metadaten + Embed [05 §3] | 4 |
| Keyword-Explorer | Opportunity, Popularity, Difficulty, Ranking apps, Ideen, Tracking | – | ganz | Apple Ads Platform API (Popularity), eigene Positionsmessung [04 §5] | 3–4 |
| Onboarding-Bibliothek | Screen-Folgen pro App | – | ganz | Freelancer-Aufnahmen + Vision-LLM [05 §4] | 4 |
| Review Analytics | Tools-Menü | – | ganz | iOS-Reviews-RSS, LLM-Klassifikation [04 §6] | 4 |
| Your Apps / ASO-Tracking | eigene Apps + Keywords beobachten | – | ganz | Login + Watchlists | 3 |
| Favoriten/Ordner | Apps, Ads, Organic, Hot ideas | – | ganz | Login | 2 |
| Hot ideas | KI-Mockups als HTML | – | ganz, **optional** | LLM über eigene Daten; Mockups selbst erzeugen | später |
| KI-Abfrage / MCP | natürliche Sprache über die Datenbank | – | ganz | MCP-Server + Text-to-SQL über `apps`, Metriken, Schätzungen | 4 |
| Login, Abo, Trial | Auth.js, Stripe, Rescue-Rabatt | – | ganz | Better Auth/Auth.js, Stripe | 2 |

### 4.1 Empfohlene Reihenfolge der nächsten Pakete

1. **Rising und Trending aus eigenen Zeitreihen.** *Umgesetzt am 26.10.2026: Crawler-Job `trends` + Tabelle `app_trends`, Seite `/rising` mit Wachstum und Chart-Aufsteigern.* Geht sofort mit vorhandenen Daten: Δ Bewertungen pro Tag,
   Δ `realInstalls` (Android, sobald der Vollpass läuft) und Rangsprünge. Braucht eine täglich berechnete Tabelle
   statt Aggregation pro Request (bekannte Grenze in `web/README.md`).
2. **Explorer erweitern:** Ausschluss-Filter (Genre, Sprache), Mindest-Rating, IAP ja/nein, Wachstumsspalte mit
   Sparkline aus `app_metrics_daily`.
3. **App-Detail:** Store-Screenshots und IAP-Preise anzeigen (Daten aus Lookup bzw. Detailseite).
4. **Schätzmodell v0** mit Spannen [04 §9]; erst danach Umsatz-/Download-Spalten und -Filter. Spannen und Konfidenz
   bleiben unser Unterschied zu den Punktwerten im Video.
5. **Apple Ad Repository** als erste Ads-Quelle (öffentlich, liefert `appId`), danach Meta Ad Library.

---

## 5. Abgrenzung

- Aus dem Video übernehmen wir **Funktionsumfang und Informationsarchitektur**, nicht Layout, Farben, Texte oder
  Grafiken [06 §4]. Unser Prototyp hat ein eigenes Design (siehe `web/README.md`).
- Der Rescue-Rabatt ist ein dokumentiertes Muster. Ob wir so etwas einsetzen, ist eine Produktentscheidung; die
  faire Trial-Abrechnung aus [00] hat Vorrang.
- Hot Ideas zeigen **KI-Nachbauten fremder Apps**. Das ist rechtlich und für die Marke heikler als reine
  Marktdaten und gehört vor einer Umsetzung in das Anwaltsgespräch [06 §4].
