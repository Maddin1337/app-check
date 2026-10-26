# 03 – Datenbank-Aufbau: Millionen iOS- und Android-Apps in Wochen, täglich aktuell

> **Agent-Prefix:** `db` · **Stand:** 25.10.2026 · **Status:** Recherche + Machbarkeitstests (kein Produktcode)
> **Kennzeichnung:** **[beobachtet]** = selbst getestet (Befehl/URL angegeben, Rohdaten im Scratch) ·
> **[extern]** = aus einer verlinkten Quelle · **[abgeleitet]** = eigene Rechnung/Schlussfolgerung/Vermutung.
> **Keine Rechtsberatung.** Rechtliche Hinweise sind eine technische Risikoeinschätzung und müssen von einer
> Anwältin oder einem Anwalt für IT-Recht geprüft werden.

---

## 0. Das Wichtigste in Kürze

1. **Den Vollkatalog legen beide Stores selbst offen.** Beide verweisen in ihrer `robots.txt` auf XML-Sitemaps:
   - **Apple:** `apps.apple.com/sitemaps_apps_index_app_1.xml` → **1.392 Kind-Sitemaps** → hochgerechnet
     **≈ 2,0 Mio. iOS-Apps** **[beobachtet + abgeleitet]**. Zusätzlich gibt es einen eigenen
     **„new-app“-Sitemap-Index** (353 Dateien) für neue Apps und einen **Chart-Sitemap-Index**.
   - **Google Play:** `play.google.com/sitemaps/sitemaps-index-0.xml` und `-1.xml` → **86.927 Kind-Sitemaps**.
     Das Datum steht im Dateinamen (2026-10-24), sie werden also offenbar regelmäßig neu erzeugt. Hochgerechnet
     enthalten sie **≈ 4,0 Mio. App-URLs**; der Rest sind Bücher und Hörbücher **[beobachtet + abgeleitet]**.
   - Ein „Snowball-Crawling“ über Suche oder ähnliche Apps braucht es **für die Discovery also nicht**. Es
     ergänzt nur.
2. **iOS-Metadaten sind günstig und offiziell zu haben.** Die **iTunes Lookup API** liefert pro Request bis zu
   **~200 Apps** **[beobachtet: 400 IDs angefragt → 201 Treffer]**. Für 2,0 Mio. Apps sind das
   ≈ **10.000 Requests**. Apples dokumentiertes Limit ist „~20 Calls/Minute“, also bis zu 28.800 Requests am Tag.
   **Damit passt der ganze iOS-Katalog täglich in das offizielle Limit einer einzigen IP** **[abgeleitet]**.
3. **Die öffentliche App-Store-Webseite liefert, was die API nicht hat.** Im JSON-Block
   `serialized-server-data` stehen die **In-App-Käufe mit Preisen** (Top 10), das **Ratings-Histogramm**
   (5→1 Sterne), die **Privacy-Labels**, die **Versionshistorie**, der **Chart-Platz** und
   **„You Might Also Like“** **[beobachtet]**. Die **Web-Chart-Seiten** (stehen in Apples eigener Sitemap)
   enthalten **Top 200 Free und Top 200 Paid pro Kategorie und Storefront** **[beobachtet]**.
   **Top Grossing** gibt es weiterhin über den Legacy-RSS-Feed, maximal 100 Einträge pro Genre **[beobachtet]**.
4. **Google Play liefert die exakte Installationszahl.** Im HTML der Detailseite steht neben dem Bucket
   „500,000,000+“ die genaue Zahl: `["500,000,000+",500000000,988861573,"500M+"]` **[beobachtet]**.
   **Die tägliche Differenz ist eine echte Download-Messgröße für Android.** Das ist das wertvollste einzelne
   Feld für die Schätzungen.
5. **Engpass ist Google Play, nicht Apple.** Jede Play-App braucht einen eigenen HTML-Request
   (~165–212 KB gzip). Ein Vollpass über ~4 Mio. URLs bedeutet ≈ 680 GB Transfer, also rund 1 Woche mit
   IP-Pool **[abgeleitet]**. Charts, Reviews, Suche und Data Safety laufen bei Play über Pfade, die die
   `robots.txt` **verbietet** (`/_/…batchexecute`, `/store/search`, `/store/getreviews`,
   `/store/apps/datasafety`). Google verbietet in seinen ToS ausdrücklich automatisierten Zugriff entgegen der
   robots.txt **[extern]**. Hier müssen wir uns bewusst entscheiden.
6. **Machbarer Zeitplan [abgeleitet]:**
   - **Woche 1:** Seed mit ~6 Mio. Kandidaten-IDs, Chart-Zeitreihen starten.
   - **Woche 2:** iOS-Vollkatalog.
   - **Wochen 3–4:** Play-Vollkatalog, tägliche Updates laufen.
   - **Wochen 5–8:** Suche/Filter, Schätzmodelle v0/v1.
   - **Laufende Kosten:** grob **€ 400–900 pro Monat** (Server, Proxies, Storage). Zum Vergleich: kommerzielle
     Datenlizenzen kosten 5- bis 6-stellig pro Jahr.
7. **Historie lässt sich nicht nachträglich crawlen.** Für „MRR growth 12 Monate“ braucht man 12 Monate eigene
   Zeitreihe oder einen lizenzierten Backfill. **Deshalb startet der Chart- und Metrik-Collector an Tag 1.**

---

## 1. Anforderungen (aus AppKittie abgeleitet)

Laut Briefing bietet AppKittie: „4,500,000+“ Apps, Filter nach Umsatz, Downloads, Kategorie, Launch-Datum und
Werbung aktiv/organisch. Dazu kommen Est. Monthly Downloads/Revenue, MRR growth (12 Monate),
IAP-Preisspanne, Global Rankings, Review-Tracker und „Updated daily“.

Daraus ergeben sich für die Datenbank **[abgeleitet]**:

| Produkt-Feature | Benötigte Rohdaten | Primärquelle (Details unten) |
|---|---|---|
| App-Verzeichnis 4,5 Mio. | Vollständige ID-Liste iOS + Android | Apple-/Play-Sitemaps |
| Kategorie, Entwickler, Launch-Datum, Preis | Stammdaten | iTunes Lookup; Play-Detail-HTML |
| IAP-Preisspanne | IAP-Liste/-Spanne | iOS: Web-Detail (Top-10-IAP mit Preis); Play: `inAppProductPrice` („$0.99 – $239.99 per item“) |
| Est. Monthly Downloads | Zeitreihen: Installs (Android exakt), Ratings-Count, Ränge | Play-HTML (`realInstalls`), Lookup (`userRatingCount`), Charts |
| Est. Monthly Revenue, MRR-Wachstum | Grossing-Ränge, IAP-Preise, Download-Schätzung, Historie | Legacy-RSS Top Grossing (iOS); Play Grossing-Charts (Grauzone, s. § 4.5) |
| Global Rankings | Tägliche Charts pro Land/Kategorie | Apple Web-Charts (Top 200) + RSS; Play-Kategorieseiten bzw. batchexecute |
| Review-Tracker, Sentiment | Reviews | iOS Customer-Reviews-RSS (max. 500 je App und Land); Play: nur Grauzone |
| „Updated daily“ | Scheduler mit Prioritäts-Tiers | eigene Crawling-Architektur (§ 8) |
| Ads aktiv vs. organisch, Videos | Ad-Libraries, Social | **nicht Teil dieses Dokuments** (siehe Media-/Ads-Recherche) |

---

## 2. Wie groß ist der Markt wirklich?

| Quelle | iOS App Store | Google Play | Stand | Art |
|---|---|---|---|---|
| 42matters Store Stats ([42matters.com/stats](https://42matters.com/stats)) | **2.753.330** | **2.656.908** | 25.10.2026 | [extern] |
| 42matters (Vorjahr, laut Suchergebnis-Zusammenfassung) | 2.022.143 | 2.096.933 | 31.10.2025 | [extern, sekundär] |
| AppBrain ([appbrain.com/stats/number-of-android-apps](https://www.appbrain.com/stats/number-of-android-apps)) | – | **2.043.583** | 25.10.2026 | [extern] |
| AppBrain: neue bzw. entfernte Apps pro Monat (Sept. 2026) | – | +53,4 Tsd. / −28,5 Tsd. | 09/2026 | [extern] |
| 42matters: neue Apps in den letzten 30 Tagen | 144.738 | 89.472 | 10/2026 | [extern] |
| **Eigene Hochrechnung aus Apple-Sitemaps** (10 von 1.392 Dateien, Ø 1.436 eindeutige IDs) | **≈ 2,0 Mio.** (σ der Dateien 460, also grob 1,7–2,3 Mio.) | – | 25.10.2026 | [beobachtet + abgeleitet] |
| **Eigene Hochrechnung aus Play-Sitemaps** (13 von 86.927 Dateien, Ø 45,8 Apps) | – | **≈ 4,0 Mio. App-URLs** | Sitemap vom 24.10.2026 | [beobachtet + abgeleitet] |

**Interpretation [abgeleitet]:**
- Für **iOS** passen Sitemap (~2,0 Mio.) und 42matters (2,75 Mio.) ungefähr zusammen. 42matters zählt
  vermutlich auch reine iPad-, Mac- und tvOS-Apps oder Apps, die nur in einzelnen Storefronts verfügbar sind.
- Für **Play** enthalten die Sitemaps mit ~4 Mio. deutlich mehr als die Tracker (2,0–2,7 Mio.). Das spricht
  dafür, dass sie auch **Apps mit sehr wenigen Installationen, regional eingeschränkte Apps oder bereits
  entfernte Apps** enthalten. Stichprobe: 8 zufällige Sitemap-Apps ergaben 7× HTTP 200 und 1× 404 (mit
  `gl=US`). Installs lagen zwischen „1+“ und „1,000+“ **[beobachtet]**.
- **Woher AppKitties „4,500,000+“ vermutlich kommt [abgeleitet, nicht verifiziert]:** iOS (~2,0–2,7 Mio.) plus
  Android (~2,0–2,6 Mio.) ergibt 4,0–5,3 Mio. Die Zahl entspricht also dem **Gesamtbestand beider Stores**. Sie
  ist mit Sitemap-Discovery plus einem Vollpass bei beiden Stores realistisch erreichbar.
- AppKitties öffentliche Startseite liefert im SSR-HTML keine Zahlen (client-rendered), deshalb ließ sich das
  nicht direkt belegen **[beobachtet: `curl https://www.appkittie.com/` → 31 KB HTML ohne Zahlen]**.

---

## 3. Apple App Store – alle Datenwege

### 3.1 Übersicht

| # | Quelle | Liefert | Limits | robots.txt / Nutzungsbedingungen | Test |
|---|---|---|---|---|---|
| A1 | **App-Sitemaps** `apps.apple.com/sitemaps_apps_index_app_1.xml` | Alle App-IDs + Slugs + Storefront-Alternates | keine bekannten; ~0,65 GB gz für alle 1.392 Dateien | in robots.txt **als Sitemap deklariert** | ✅ 200 |
| A2 | **New-App-Sitemaps** `…index_new-app_1.xml` | Neue Apps (IDs um 68xxxxxxxx) | 353 Dateien | deklariert | ✅ 200 |
| A3 | **Chart-Sitemaps** `…index_chart_1.xml` | URLs der Web-Chart-Seiten pro Land/Kategorie/Gerät | 7 Dateien | deklariert | ✅ 200 |
| A4 | **iTunes Lookup API** `itunes.apple.com/lookup?id=…` | Stammdaten, Preis, Rating pro Storefront, Version, Release-Daten, Beschreibung, Screenshots | ~20 Calls/min (offiziell), ~200 Ergebnisse/Call | offizielle API, Nutzungsbedingungen „promote store content“ | ✅ 200 |
| A5 | **iTunes Search API** `itunes.apple.com/search?term=…` | Suche (max. 200 Treffer) | ~20 Calls/min | offizielle API; robots: `Disallow: /search*` (gilt für Crawler) | ✅ 200 |
| A6 | **Web-Detailseite** `apps.apple.com/{cc}/app/{slug}/id{ID}` | + IAP-Top-10 mit Preisen, Ratings-Histogramm, Privacy-Labels, Versionshistorie, Chart-Platz, „You Might Also Like“ | ~110 KB gz pro Seite | Pfad nicht disallowed; Apple-Website-AGB verbieten „robots/spider“ pauschal | ✅ 200 |
| A7 | **Web-Chart-Seite** `apps.apple.com/{cc}/iphone/charts/{genreId}` | **Top 200 Free + Top 200 Paid** (25 gerendert + 175 IDs in `nextPage`) | ~51 KB gz | in Apple-Sitemap gelistet | ✅ 200 |
| A8 | **Marketing-Tools-RSS v2** `rss.marketingtools.apple.com/api/v2/{cc}/apps/top-free/100/apps.json` | Top Free/Paid gesamt, max. 100, ohne Kategorie | 200 → HTTP 500; sporadisch 502/504 | offiziell, robots leer | ✅ 200 (mit Aussetzern) |
| A9 | **Legacy-iTunes-RSS** `itunes.apple.com/{cc}/rss/topgrossingapplications/limit=100/genre={id}/json` | **Top Grossing**/Free/Paid/New, iPhone und iPad, pro Genre, max. 100 | `limit=200` liefert trotzdem 100 | robots: `Disallow: /*/rss/*` (Feed ist aber offiziell angeboten) | ✅ 200 |
| A10 | **Customer-Reviews-RSS** `itunes.apple.com/{cc}/rss/customerreviews/page={1..10}/id={ID}/sortby=mostrecent/json` | Neueste Reviews, 50 pro Seite, **max. 10 Seiten = 500** | Seite 11 → HTTP 400 | wie A9 | ✅ 200 |
| A11 | **amp-api (inoffiziell)** `amp-api-edge.apps.apple.com/v1/catalog/{cc}/apps/{id}?…` | Alles aus A6 strukturiert + Reviews-Paging, „customers-also-bought“, IAP | Bearer-Token aus Web-Bundle | **nicht öffentlich dokumentiert**; Token-Nutzung = Grauzone | ⚠️ nicht aufgerufen (bewusst) |
| A12 | **Enterprise Partner Feed (EPF)** | Bulk-Dump (wöchentlich voll, täglich inkrementell), Tabelle `application` u. a. | Zugang nur für „Performance Partners“ | Lizenz: nur für Links in den Store; KI-/ML-Training verboten | ❓ Zugang unklar |

### 3.2 A1–A3: App-Store-Sitemaps (Discovery-Grundlage)

**robots.txt [beobachtet]** (`curl -s https://apps.apple.com/robots.txt`):

```
User-agent: *
Disallow: /WebObjects/*
Disallow: /api/*
Disallow: /includes/*
Disallow: /v1/*
Disallow: */search?*

Sitemap: https://apps.apple.com/sitemaps_apps_index_chart_1.xml
Sitemap: https://apps.apple.com/sitemaps_apps_index_app_1.xml
Sitemap: https://apps.apple.com/sitemaps_apps_index_new-app_1.xml
Sitemap: https://apps.apple.com/sitemaps_apps_index_story_1.xml
Sitemap: https://apps.apple.com/sitemaps_apps_index_grouping_1.xml
Sitemap: https://apps.apple.com/sitemaps_apps_index_static-url_1.xml
```

**Struktur [beobachtet]:**
- Der Index `sitemaps_apps_index_app_1.xml` (4,3 KB gz) listet **1.392** Dateien nach dem Muster
  `sitemaps_apps_app_{1..100}_{1..15}.xml.gz`. `…index_app_2.xml` liefert 404.
- Eine Kind-Sitemap ist ~460–520 KB gz bzw. ~42 MB entpackt und enthält ~11.000–12.700 `<url>`.
  Darunter sind nur **857–2.352 eindeutige App-IDs**, weil jede App einmal pro Storefront als `<loc>`
  auftaucht, jeweils mit bis zu 52 `hreflang`-Alternates.
- Es gibt **kein `<lastmod>`**. Änderungen sind über die Sitemap also nicht erkennbar; die Sitemap dient nur
  der Discovery.
- Zwischen Dateien gibt es **keine Überschneidung** (geprüft für 3 Paare: 0 gemeinsame IDs).
- Die Storefront-Angaben in der Sitemap sind **keine verlässliche Verfügbarkeitsliste**. Nur 62 % der Apps
  einer Datei haben einen `us`-Eintrag, die Lookup-API fand aber 86 % in `us` **[beobachtet]**.

Beispiel-`<url>` (gekürzt):

```xml
<url>
<loc>https://apps.apple.com/mx/app/readlang-watchlang/id1602114377</loc>
<xhtml:link rel="alternate" hreflang="de-CH" href="https://apps.apple.com/ch/app/readlang-watchlang/id1602114377" />
<xhtml:link rel="alternate" hreflang="ja-JP" href="https://apps.apple.com/jp/app/readlang-watchlang/id1602114377" />
…
```

- **New-App-Index:** 353 Dateien. Eine Probe (`sitemaps_apps_new-app_4_1.xml.gz`, 365 KB) enthielt 233
  eindeutige IDs, Median-ID 6809314001. Das sind ganz frische Apps; der Index ist ideal für die **tägliche
  Neuerkennung** (~130 MB/Tag) **[beobachtet + abgeleitet]**.
- **Chart-Index:** 7 Dateien mit URLs wie `https://apps.apple.com/us/iphone/charts/6017` bzw.
  `/ipad/charts/…` und `/mac/charts/…` für alle Länder.

**Mengengerüst Discovery iOS [abgeleitet]:**
- Vollscan: 1.392 + 353 Dateien ≈ 1.750 Requests, ≈ 0,8 GB gz, ≈ 60 GB entpackt. Streaming-Parsing ist nötig;
  nicht alles in den RAM laden.
- Bei 1 Request/s in < 1 h erledigt.
- **Rhythmus:** wöchentlich voll, New-App-Index täglich.

### 3.3 A4/A5: iTunes Search & Lookup API (offiziell)

**Doku [extern]:** [Search API – Apple Performance Partners](https://performance-partners.apple.com/resources/documentation/itunes-store-web-service-search-api/)
- „The Search API is limited to approximately **20 calls per minute** (subject to change).“
- „If you require heavier usage, we suggest you consider using our **Enterprise Partner Feed (EPF)**.“
- „Large websites should set up **caching logic**…“
- `limit`: 1–200 (Search).
- **Nutzungsbedingungen:** Inhalte „only to promote store content“, nicht für „independent entertainment value“.
  Eine Analytics-Datenbank fällt **nicht klar** unter „promote“ → Vertragsrisiko (siehe § 7).
- Entwickler berichten von 403 nach ~25–75 schnellen Requests pro IP
  ([Apple Dev Forums](https://developer.apple.com/forums/thread/66399)) **[extern, anekdotisch]**.

**Tests [beobachtet]:**

| Request | Ergebnis |
|---|---|
| `GET https://itunes.apple.com/lookup?id=570060128&country=us&entity=software` | 200, 12,8 KB, 0,86 s, `cache-control: max-age=49819` (≈ 14 h CDN-Cache!) |
| Lookup mit **200 IDs** (aus Sitemap) `country=us` | 200, 1,44 MB (230 KB gz), 3,8 s, **173 Treffer** |
| dieselben 200 IDs `country=de` | 147 Treffer → **Verfügbarkeit ist storefront-abhängig** |
| Lookup mit **400 IDs** | 200, **201 Treffer** aus Positionen 0–250 → **effektiver Cap ≈ 200 Ergebnisse pro Request** |
| `lookup?id=570060151&entity=software` (Artist/Entwickler-ID) | 1 Artist + 3 Apps → **alle Apps eines Entwicklers** |
| `lookup?bundleId=com.duolingo.DuolingoMobile` | 1 Treffer → **Mapping bundleId → trackId** |
| `search?term=meditation&entity=software&country=us&limit=200` | 192 Treffer |
| Duolingo US vs. DE | `userRatingCount` 5.531.166 (US) vs. 868.690 (DE) → **Ratings sind pro Storefront** |

**Felder der Lookup-Antwort [beobachtet]:** `trackId, trackName, bundleId, sellerName, artistId, artistName,
artistViewUrl, primaryGenreId, primaryGenreName, genreIds, genres, price, currency, formattedPrice,
averageUserRating, userRatingCount, averageUserRatingForCurrentVersion, userRatingCountForCurrentVersion,
releaseDate, currentVersionReleaseDate, version, releaseNotes, description, contentAdvisoryRating,
trackContentRating, advisories, fileSizeBytes, minimumOsVersion, languageCodesISO2A, supportedDevices,
features, isGameCenterEnabled, screenshotUrls, ipadScreenshotUrls, appletvScreenshotUrls, artworkUrl60/100/512,
sellerUrl, trackViewUrl, kind, wrapperType, isVppDeviceBasedLicensingEnabled`

Ausschnitt (Duolingo, `country=us`):

```json
{"trackId":570060128,"trackName":"Duolingo: Learn Languages","bundleId":"com.duolingo.DuolingoMobile",
 "sellerName":"Duolingo, Inc","artistId":570060151,"primaryGenreName":"Education","genreIds":["6017","6005"],
 "price":0.0,"currency":"USD","averageUserRating":4.72258,"userRatingCount":5531166,
 "releaseDate":"2012-11-13T08:00:00Z","currentVersionReleaseDate":"2026-10-21T17:05:12Z","version":"7.145.1",
 "contentAdvisoryRating":"4+","fileSizeBytes":"514648064","minimumOsVersion":"17.0"}
```

**Was die Lookup-API NICHT liefert:** IAP-Liste, Ratings-Histogramm, Privacy-Labels, Versionshistorie, Ränge,
Downloads. Dafür braucht es A6/A7/A9.

**Durchsatz-Rechnung [abgeleitet]:**
- Bei 20 Calls/min sind es 28.800 Calls/Tag. Mit je ~200 Apps entspricht das **≈ 5,7 Mio. App-Lookups pro Tag
  und IP**.
- Ein iOS-Vollpass (2,0 Mio., eine Storefront) braucht ≈ 10.000 Calls bzw. ≈ 8,3 h.
- Zusätzlich Top-60k in 40 Storefronts: 2,4 Mio. Lookups ≈ 12.000 Calls.
- **Beides zusammen passt in das offizielle Limit einer einzigen IP.** Transfer: ~2,3 GB gz pro Vollpass.

### 3.4 A6: Öffentliche Web-Detailseite (der „Goldstandard“ für iOS-Zusatzdaten)

**Test [beobachtet]:** `curl -L --compressed https://apps.apple.com/us/app/duolingo-language-lessons/id570060128`
- Die Antwort ist zunächst ein 301 auf den kanonischen Slug, danach 200 mit 886 KB HTML (110 KB gz).
- Enthalten ist `<script type="application/json" id="serialized-server-data">` mit **559 KB JSON**.

Gefundene Inhalte (gekürzt):

```json
{"$kind":"Annotation","title":"In-App Purchases","summary":"Yes","items":[
  {"$kind":"textPair","leadingText":"Barrel of Gems (1200)","trailingText":"$4.99"},
  {"$kind":"textPair","leadingText":"Super Duolingo","trailingText":"$9.99"},
  {"$kind":"textPair","leadingText":"Super Duolingo","trailingText":"$83.99"}, …]}

{"$kind":"Ratings","productId":"570060128","ratingAverage":4.7,"totalNumberOfRatings":5533085,
 "ratingCounts":[4649343,560538,135769,46808,140627]}

{"$kind":"PrivacyType","identifier":"DATA_LINKED_TO_YOU","title":"Data Linked to You",
 "purposes":[{"identifier":"THIRD_PARTY_ADVERTISING","categories":[{"identifier":"PURCHASES","dataTypes":["Purchase History"]}]}]}

{"content":{"position":"1"},"heading":"Chart","caption":"Education"}          ← Chart-Platz
{"primarySubtitle":"Version 7.145.1","secondarySubtitle":"Wed Oct 21 2026 …"}  ← Versionshistorie (page "versionHistory")
"You Might Also Like" (Shelf)                                                   ← Similar Apps für Snowball
{"title":"Seller","summary":"Duolingo, Inc"}, {"title":"Size","summary":"514.6 MB"}, {"title":"Category","summary":"Education"}
```

**Bewertung [abgeleitet]:**
- Die **IAP-Top-10 mit Preisen** sind die Grundlage für die AppKittie-Kennzahl „Preisspanne In-App-Käufe“ und
  für Umsatzschätzungen (Abo-Preise!).
- Das **Histogramm** dient Sentiment und Qualität.
- Die **Privacy-Labels** liefern Hinweise auf Werbe-SDKs, z. B. „Data Used to Track You“ als Proxy für
  „Ads aktiv“.
- Der Pfad `/{cc}/app/…` ist in der robots.txt **nicht** verboten.
- Kosten: ~110 KB gz pro App. **Täglich nur für Top-Apps, Long Tail monatlich.**
- **Achtung, fragile Struktur:** Das JSON ist ein internes UI-Modell (`$kind`, Shelves). Apple hat die Website
  2025 neu gebaut; solche Strukturen ändern sich ohne Vorwarnung. Wir brauchen Parser-Contract-Tests und
  Alerting (§ 8.8).

### 3.5 A7: Web-Chart-Seiten (Top 200, robots-konform)

**Test [beobachtet]:** `curl -L --compressed https://apps.apple.com/us/iphone/charts/6017` (Education)
- 200, 51 KB gz.
- `serialized-server-data` → `segments`: **„Top Free Apps“ (`top-free`)** und **„Top Paid Apps“ (`top-paid`)**.
- Pro Segment: 25 vollständige Lockups plus `nextPage.remainingContent` mit 175 weiteren IDs, also
  **200 Ränge pro Liste**.
- Ein Segment **Top Grossing** gibt es auf der Website nicht.

**Umfang [abgeleitet]:**
- Rund 25 App-Kategorien + ~17 Spiele-Unterkategorien + „Alle“, also ≈ 43 Genres.
- × Geräte (iphone, ipad; mac optional) × Storefronts (bis 175).
- Für 40 wichtige Länder × 43 × 2 sind es ≈ 3.440 Requests/Tag ≈ 0,18 GB gz. **Sehr günstig.**

### 3.6 A8/A9: RSS-Feeds (Charts inkl. Top Grossing)

**Marketing Tools v2 [beobachtet]:**
- `rss.applemarketingtools.com` antwortet mit 301 auf **`rss.marketingtools.apple.com`**.
- `…/api/v2/us/apps/top-free/100/apps.json` → 200, 52,8 KB, 100 Einträge.
- `/200/` und `/500/` → **HTTP 500**. Maximum sind also 100.
- Mehrfach sporadische **502/504 vom Apple-Origin** (Body „Apple“) → Retries einplanen.
- Felder pro Eintrag: `artistName, id, name, releaseDate, kind, artworkUrl100, genres, url`. Nur Gesamtcharts,
  **keine Kategorien, kein Grossing**.

```json
{"artistName":"Vinted Limited","id":"632064380","name":"Vinted: Pre-loved marketplace",
 "releaseDate":"2013-04-11","kind":"apps","url":"https://apps.apple.com/us/app/vinted-pre-loved-marketplace/id632064380"}
```

**Legacy-iTunes-RSS – existiert weiterhin [beobachtet]:**
- `https://itunes.apple.com/us/rss/topgrossingapplications/limit=200/genre=6014/json` → 200, 430 KB,
  **100 Einträge** (Cap 100).
- Für DE geprüft und alle mit 200 beantwortet: `topfreeapplications`, `toppaidapplications`,
  **`topgrossingapplications`**, `newapplications` (109), `newfreeapplications`, `newpaidapplications`,
  `topfreeipadapplications`, **`topgrossingipadapplications`**. Zeitstempel `updated` = aktuell.

```json
{"im:name":{"label":"MONOPOLY GO!"},"im:price":{"label":"Get","attributes":{"amount":"0.00","currency":"USD"}},
 "id":{"attributes":{"im:id":"1621328561","im:bundleId":"com.scopely.monopolygo"}},
 "im:artist":{"label":"Scopely, Inc.","attributes":{"href":"https://apps.apple.com/us/developer/scopely-inc/id305003647?uo=2"}},
 "category":{"attributes":{"im:id":"6014","term":"Games"}},"im:releaseDate":{"label":"2023-04-11T00:00:00-07:00"}}
```

- **Rang** ergibt sich aus der Reihenfolge der Einträge.
- **Top Grossing pro Genre und Land ist der wichtigste Umsatz-Proxy für iOS.**
- Die robots.txt von `itunes.apple.com` enthält `Disallow: /*/rss/*` sowie `/search*` und `/*/lookup?`
  **[beobachtet]**. Die Feeds sind aber ein von Apple öffentlich angebotenes Produkt; die robots.txt richtet
  sich an Crawler/Indexer.
- **[abgeleitet]** Risiko gering bis mittel; Abrufrate moderat halten (≈ 3.500 Requests/Tag für 40 Länder ×
  43 Genres × 2 Geräte).

### 3.7 A10: Ratings & Reviews

**Customer-Reviews-RSS [beobachtet]:**
- `https://itunes.apple.com/us/rss/customerreviews/page=1/id=570060128/sortby=mostrecent/json`
  → 200, 41 KB, 50 Reviews. Der Link `rel=last` zeigt auf `page=10`.
- `page=10` → 50 Reviews, `page=11` → **HTTP 400**. **Maximum: 500 neueste Reviews pro App und Storefront.**
- Felder: `author.name`, `author.uri`, `updated`, `im:rating`, `im:version`, `id`, `title`, `content`,
  `im:voteSum`, `im:voteCount`.

```json
{"author":{"name":{"label":"MIMI SO MAD"}},"updated":{"label":"2026-10-24T09:46:34-07:00"},
 "im:rating":{"label":"1"},"im:version":{"label":"7.145.1"},"id":{"label":"14706175812"},
 "title":{"label":"Stop"},"content":{"label":"Stop giving me these ads. I hate Duolingo stop doing it."}}
```

- **Strategie [abgeleitet]:** Für Top-Apps täglich Seite 1–2 pro wichtiger Storefront abrufen
  (inkrementell über die Review-ID). Damit ist ein vollständiger Review-Strom ab Start möglich.
- **Historische Reviews** (> 500) gibt es nur über die amp-api (Grauzone) oder gar nicht.
- **Datenschutz:** Reviewer-Namen sind personenbezogene Daten → nur gehasht oder gar nicht speichern (§ 7).
- Das **Ratings-Histogramm** kommt aus A6. `userRatingCount` pro Storefront kommt günstig aus A4 und ist die
  wichtigste tägliche Zeitreihe für iOS-Schätzungen.

### 3.8 A11: Inoffizielle amp-api

**Beobachtet:**
- Die Detailseite referenziert
  `https://amp-api-edge.apps.apple.com/v1/catalog/us/apps/570060128?platform=web&additionalPlatforms=appletv,ipad,iphone,mac,realityDevice,watch&extend=…`
  mit u. a. folgenden Parametern:
  - `extend`: `ageRating, description, fileSizeByDevice, installSizeByDeviceInBytes, privacy, privacyDetails,
    privacyPolicyUrl, requirementsByDeviceFamily, sellerInfo, customScreenshotsByType, …`
  - `include=alternate-apps, app-bundles, customers-also-bought-apps, developer, developer-other-apps,
    merchandised-in-apps, related-editorial-items, reviews`
  - `views=categorizations, top-in-app-purchasables`
  - `sparseLimit[apps:customers-also-bought-apps]=40`
- Das Web-Bundle (`/assets/index~….js`, 666 KB) enthält
  `authorization:\`Bearer ${…MEDIA_API_TOKEN}\`` und die Hosts `amp-api-edge.apps.apple.com`,
  `amp-api-search-edge.apps.apple.com` und `amp-api.apps.apple.com`.
- Ein JWT im Klartext fand sich im Haupt-Bundle nicht; er wird vermutlich in einem Chunk oder per Config
  geladen. **Wir haben die amp-api bewusst nicht aufgerufen.**
- Die Library `app-store-scraper` (npm 0.18.0) nutzt
  `https://amp-api.apps.apple.com/v1/catalog/${country}/apps/${id}?platform=web&fields=privacyDetails`
  für Privacy-Daten.

**Was sie zusätzlich bringt [abgeleitet]:**
- Reviews mit Paging über die 500er-Grenze hinaus.
- „customers-also-bought“ (bis 40) als Similar-Graph.
- Strukturierte IAP-Daten („top-in-app-purchasables“).
- Größe pro Gerät.
- Alles strukturiert statt UI-JSON.

**Risiko [abgeleitet]:**
- Undokumentierte, tokenbasierte API.
- Pfade `/api/*` und `/v1/*` sind auf `apps.apple.com` per robots.txt verboten (der amp-api-Host selbst hat
  eine eigene Policy, nicht geprüft).
- Ein extrahierter Bearer-Token könnte als **Umgehung einer Zugangskontrolle** gewertet werden. Das ist
  deutlich riskanter als das Lesen öffentlicher HTML-Seiten.
- **Empfehlung:** nicht im MVP. Alles Nötige gibt es aus A6 (HTML), dem identischen Datenmodell.

### 3.9 A12: Enterprise Partner Feed (EPF)

**[extern]** [performance-partners.apple.com/epf](https://performance-partners.apple.com/epf):
- Bulk-Feed als relationale Tabellen-Dateien. **Voll-Export wöchentlich, inkrementell täglich.**
- Die Dateiliste nennt weiter `application` („all iPhone and iPod touch applications“) sowie Detail-, Preis-
  und Popularitäts-Tabellen.
- Gleichzeitig steht dort: „Apple Music and iTunes Music data is not available from EPF“. Das Overview nennt
  Apps gar nicht mehr.
- Zugang über „Apply Now“ für **Performance Partners**. Apple „may refuse or terminate access … for any
  reason“.
- **Lizenz:** nur „in connection with links to the iTunes Store“; ausdrücklich **kein KI-/ML-Training** mit
  Feed-Daten.

**[abgeleitet]**
- Apple hat Apps 2018 aus dem Affiliate-Programm genommen (eigenes Wissen, nicht neu verifiziert). Ob
  Neukunden heute App-Daten aus dem EPF bekommen, ist **offen**.
- Selbst bei Zugang verbietet die Lizenz die Nutzung als Analytics-Produkt bzw. Datenweitergabe
  vermutlich. → **Antrag stellen schadet nicht, aber nicht darauf planen.**

### 3.10 iOS: Feld → Quelle

| Feld | Quelle | Frequenz (Vorschlag) |
|---|---|---|
| trackId, Name, bundleId, Entwickler, Kategorie(n), Preis, Release-Datum, Update-Datum, Version, Größe, minOS, Sprachen, Beschreibung, Screenshots | A4 Lookup | täglich (alle), da günstig |
| Rating-Ø + Count **pro Storefront** | A4 Lookup (`country=`) | täglich: alle in Haupt-Storefront, Top-60k in 40 Storefronts |
| Ratings-Histogramm | A6 Web-Detail | täglich Top, sonst monatlich |
| IAP-Liste mit Preisen (Top 10) | A6 | täglich Top, sonst monatlich |
| Privacy-Labels | A6 | bei Versionswechsel |
| Versionshistorie + Release Notes | A6 (+ A4 aktuelle Version) | bei Versionswechsel |
| Chart-Ränge Free/Paid (Top 200) | A7 Web-Charts | täglich (optional 2×) |
| Chart-Ränge Grossing (Top 100) | A9 Legacy-RSS | täglich |
| Neue Apps | A2 New-App-Sitemap | täglich |
| Reviews | A10 RSS | täglich (Top-Apps, inkrementell) |
| Similar Apps | A6 „You Might Also Like“ | bei Detail-Crawl |
| Alle Apps eines Entwicklers | A4 `lookup?id={artistId}&entity=software` | bei neuem Entwickler |

---

## 4. Google Play – alle Datenwege

### 4.1 Die robots.txt entscheidet über die Strategie

**[beobachtet]** `curl -s https://play.google.com/robots.txt`, relevante Zeilen:

```
Disallow: /_                                  ← betrifft /_/PlayStoreUi/data/batchexecute (Charts, Reviews, Permissions)
Disallow: /store/search                       ← Suche
Disallow: /store/getreviews                   ← alte Reviews-API
Disallow: /store/apps/datasafety*             ← Data-Safety-Seite
Disallow: /store/apps/collection/p3_details_* ← "Similar"-Collections
Disallow: /store/xhr, /xhr, /store/recommended, …
Sitemap: https://play.google.com/sitemaps/sitemaps-index-0.xml
Sitemap: https://play.google.com/sitemaps/sitemaps-index-1.xml
```

**Nicht verboten:** `/store/apps/details?id=…`, `/store/apps/category/…`, `/store/apps/dev?id=…`,
`/store/apps/developer?id=…`, `/store/games`, `/store/apps`.

**Google ToS [extern]** ([policies.google.com/terms](https://policies.google.com/terms?hl=en), „Effective
July 30, 2026“) nennen unter „Don’t abuse our services“:
> „using automated means to access content from any of our services in violation of the machine-readable
> instructions on our web pages (for example, robots.txt files that disallow crawling, training, or other
> activities)“

→ **Konsequenz [abgeleitet]:**
- Detailseiten, Sitemaps, Kategorie- und Entwicklerseiten sind **robots-konform**.
- `batchexecute` (Charts, Reviews, Permissions), `/store/search` und Data Safety sind **ToS-widrig**.
- Die Play-ToS ([play.google.com/about/play-terms](https://play.google.com/about/play-terms/)) verbieten
  zusätzlich das „collect or harvest any personal data of any user of Google Play“. Das ist relevant für
  Reviewer-Namen.

### 4.2 Play-Sitemaps – vollständige Paketliste (wichtigster Fund)

**[beobachtet]**
- `sitemaps-index-0.xml` (139 KB) enthält 50.000 Einträge, `sitemaps-index-1.xml` (103 KB) weitere 36.927.
  Zusammen sind das **86.927 Kind-Sitemaps** nach dem Muster
  `https://play.google.com/sitemaps/play_sitemaps_2026-10-24_1792846916-00000-of-86927.xml.gz`.
- Kein `<lastmod>`. Das **Datum im Dateinamen** (Vortag) deutet auf regelmäßige, vermutlich tägliche
  Neuerzeugung hin (nicht über mehrere Tage verifiziert).
- Eine Kind-Sitemap hat ~195–257 KB gz (≈ 6 MB entpackt) und 356–398 URLs. Davon sind nur **35–59 Apps**
  (`/store/apps/details?id=`); der Rest sind Bücher, Hörbücher, Serien und `/store/info/name`.
- Jede App-URL trägt bis zu 402 `hreflang`-Alternates; alle zeigen auf dieselbe URL, ohne
  Länderinformation.
- In 13 Dateien gab es 596 Apps, alle eindeutig → **≈ 4,0 Mio. App-URLs** hochgerechnet.

```xml
<url><loc>https://play.google.com/store/apps/details?id=site.chiyan.stackclear</loc>
<xhtml:link rel='alternate' hreflang='en-tc' href='https://play.google.com/store/apps/details?id=site.chiyan.stackclear'/>
<xhtml:link rel='alternate' hreflang='hu-hu' href='…'/> …</url>
```

**Mengengerüst [abgeleitet]:**
- Vollscan: 86.927 Requests ≈ **18 GB gz**. Bei 1 Request/s ≈ 24 h, bei 2 Requests/s ≈ 12 h.
- Wöchentlicher Vollscan: ≈ 12.400 Requests/Tag.
- Neue Apps erscheinen hier vermutlich mit Verzögerung. Für Tagesaktualität bei Neuerscheinungen ergänzen wir
  Kategorie-, Entwickler- und Similar-Snowball (§ 4.4).

### 4.3 Play-Detailseite (HTML) – Felder inkl. exakter Installationszahl

**Test [beobachtet]:** `curl --compressed "https://play.google.com/store/apps/details?id=com.duolingo&hl=en&gl=US"`
- 200, 0,41 s, 1,23 MB HTML (212 KB gz).
- Daten liegen in `AF_initDataCallback({key: 'ds:0'…'ds:12', data: …})`-Blöcken (verschachtelte Arrays ohne
  Feldnamen).
- Long-Tail-Seiten: ~1,06 MB bzw. **~166 KB gz**.

Ausschnitt mit Installs-Bucket, Untergrenze, **exakter Zahl** und Kurzform:

```
[1369829880,429000000]],null,null,["500,000,000+",500000000,988861573,"500M+"],null,null,null,null,[2],["$0.99 - $239.99 per item
```

Long-Tail-Beispiele: `["1,000+",1000,4144,"1K+"]`, `["10+",10,18,"10+"]`.

**Geparst mit `google-play-scraper` (Python 1.2.7, ein Request) [beobachtet]:**

```json
{"title":"Duolingo: Learn Languages","appId":"com.duolingo","installs":"500,000,000+","minInstalls":500000000,
 "realInstalls":988861573,"score":4.7459044,"ratings":51298880,"reviews":967028,
 "histogram":[947282,345394,1164739,5879963,42961468],"price":0,"free":true,"currency":"USD",
 "offersIAP":true,"inAppProductPrice":"$0.99 - $239.99 per item","genre":"Education","genreId":"EDUCATION",
 "developer":"Duolingo","developerId":"6957685454452609502","developerEmail":"super-support@duolingo.com",
 "released":"May 29, 2013","updated":1792518370,"lastUpdatedOn":"Oct 20, 2026","version":"Varies with device",
 "contentRating":"Everyone","adSupported":true,"containsAds":true}
```

Alle Felder: `adSupported, appId, categories, comments, containsAds, contentRating,
contentRatingDescription, currency, description, descriptionHTML, developer, developerAddress, developerEmail,
developerId, developerWebsite, free, genre, genreId, headerImage, histogram, icon, inAppProductPrice, installs,
lastUpdatedOn, minInstalls, offersIAP, originalPrice, price, privacyPolicy, ratings, realInstalls, released,
reviews, sale, saleText, saleTime, score, screenshots, summary, title, updated, url, version, video,
videoImage`.

**Bewertung [abgeleitet]:**
- **`realInstalls` ist ein von Google eingebetteter Zähler**, keine Schätzung der Library: er steht wörtlich
  im HTML.
  - Die Differenz zwischen zwei Tagen entspricht ungefähr den Neuinstallationen.
  - Ob Google den Wert verzögert oder geglättet ausliefert und ob Re-Installs mitzählen, ist **offen** und
    muss mit eigenen Zeitreihen geprüft werden.
  - Er ist trotzdem **die beste öffentlich verfügbare Download-Messgröße überhaupt**.
- `containsAds` (Play-Badge „Contains ads“) ist ein direkter Indikator für Monetarisierung über Werbung.
- `inAppProductPrice` liefert die **IAP-Preisspanne** direkt (entspricht AppKittie „Preisspanne In-App-Käufe“).
- **Ländereffekt:** Preis und Verfügbarkeit hängen von `gl` ab. Installs und Ratings sind (vermutlich) global.
  Für den Long Tail genügt daher **ein Land**; mehrere Länder nur für Preise bei Top-Apps.
- `developerEmail` und `developerAddress` sind bei Einzelentwicklern **personenbezogen** → DSGVO (§ 7).

### 4.4 Weitere robots-konforme Discovery-Quellen auf Play

| Seite | Test [beobachtet] | Nutzen |
|---|---|---|
| `/store/apps/category/EDUCATION?hl=en&gl=US` | 200, 397 KB, **61 Pakete** | Kategorie-Cluster („Top“, „New“, …): aktuelle, populäre Apps pro Kategorie und Land |
| `/store/games?hl=en&gl=US` | 200, 539 KB, 99 Pakete, Sektionen „Top free / Top grossing / Top paid“ (Teil-Listen) | Teil-Charts ohne batchexecute |
| `/store/apps/top` | 302 → `/store/apps` | – |
| `/store/apps/collection/topselling_free` | 200, aber 0 Pakete | Legacy-URL, tot |
| `/store/apps/dev?id=6957685454452609502` und `/store/apps/developer?id=Duolingo` | 200, 3 Pakete | Alle Apps eines Entwicklers (Snowball) |
| Detailseite → „Similar apps“ und „More by …“ | 9 verlinkte Pakete in der Duolingo-Seite | Snowball über ähnliche Apps |

### 4.5 Grauzone: batchexecute (Charts, Reviews, Search, Permissions)

**[beobachtet im Quellcode von `google-play-scraper` npm 10.1.4]:**

| Funktion | Endpunkt / RPC | robots.txt |
|---|---|---|
| `list()` – **Top-Charts** (`TOP_FREE`, `TOP_PAID`, `GROSSING` × Kategorie) | `POST /_/PlayStoreUi/data/batchexecute?rpcids=vyAe2` | ❌ `Disallow: /_` |
| `reviews()` | `batchexecute?rpcids=oCPfdb` (früher UsvDTd) | ❌ |
| `permissions()`, Paging (`processPages`) | `batchexecute?rpcids=qnKhOb` | ❌ |
| `suggest()` | `batchexecute?rpcids=IJ4APc` | ❌ |
| `search()` | `GET /store/search?c=apps&q=…` | ❌ `Disallow: /store/search` |
| `datasafety()` | `GET /store/apps/datasafety?id=…` | ❌ |
| `app()`, `similar()`, `developer()` | `GET /store/apps/details`, Cluster-URL, `/store/apps/dev…` | ✅ (außer `collection/p3_details_*`) |

**Abwägung [abgeleitet]:**
- **Vollständige Play-Top-Charts inkl. Grossing pro Kategorie** gibt es praktisch nur über `vyAe2`. Ohne sie
  fehlt für Android ein wichtiger Umsatz-Proxy.
- Für Android haben wir aber `realInstalls` (Downloads) und `inAppProductPrice`. Umsatz lässt sich daher auch
  ohne Grossing-Charts modellieren: Downloads × Monetarisierungsquote der Kategorie, kalibriert an iOS-Grossing
  und App-Paaren.
- **Optionen:**
  - **(a) robots-strikt:** Kategorieseiten + `/store/games`-Teil-Charts + Modell.
  - **(b) pragmatisch:** `vyAe2` mit sehr niedriger Rate (≈ 50 Kategorien × 3 Listen × 20 Länder
    ≈ 3.000 Requests/Tag), bewusst als Risiko akzeptiert.
  - **(c) zukaufen:** Play-Charts von einem Datenanbieter oder als Apify-Actor beziehen; das Risiko liegt
    dann rechtlich nur teilweise beim Anbieter.
- **Empfehlung:** Start mit (a), Entscheidung zu (b)/(c) **nach anwaltlicher Prüfung** (offene Frage).

### 4.6 Open-Source-Libraries (Referenz für Parser)

| Library | Sprache | Version (geprüft) | Bemerkung |
|---|---|---|---|
| [`google-play-scraper`](https://github.com/facundoolano/google-play-scraper) | Node | 10.1.4 (npm) | Endpunkte s. o.; Parser-Mappings (`ds:`-Pfade) wiederverwendbar (MIT) |
| [`google-play-scraper`](https://github.com/JoMingyu/google-play-scraper) | Python | 1.2.7 (PyPI) | `app()` erfolgreich getestet, inkl. `realInstalls` |
| `app-store-scraper` | Node | 0.18.0 (npm) | nutzt iTunes Lookup/Search, Legacy-RSS (`ax.itunes.apple.com/WebObjects/MZStoreServices.woa/ws/RSS/…`), Reviews-RSS, amp-api für Privacy |

**[abgeleitet]** Für die Produktion empfiehlt sich ein **eigener, schlanker Parser**, der die Mapping-Pfade
der Libraries als Referenz nutzt. Dazu Contract-Tests gegen gespeicherte HTML-Fixtures, damit
Layout-Änderungen sofort auffallen. Die Libraries brechen regelmäßig, wenn Google die Array-Struktur ändert.

### 4.7 Rate-Limits, Blocking, Proxies

- **Offizielle Limits:** keine (kein offizielles API) **[extern]**.
- **Anekdotisch [extern]:**
  - Bot-Warnungen und Blocking bei vielen Review-Abrufen
    ([discuss.python.org](https://discuss.python.org/t/rotating-proxies-for-google-play-scraper-library/31972)).
  - Rechenzentrums-IPs werden früher geflaggt als Residential- oder Mobil-IPs
    ([DZone-Erfahrungsbericht](https://dzone.com/articles/playwright-blocked-after-200-requests)).
- **Unser Test:** ~20 Play-Requests aus dem Container-Rechenzentrum mit 1–2 s Abstand, alle 200
  **[beobachtet]**. Die Schwelle pro IP bei Dauerlast ist **unbekanntwerden → Spike-Test in Woche 1**.
- **Proxy-Preise [extern, Listicles, schwankend]:**
  - Residential ca. $1–8/GB, z. B. Decodo ~$2–4/GB, Bright Data ~$3,30–8,40/GB, IPRoyal ~$1,75–7/GB.
  - Datacenter ab ~$0,5 pro IP und Monat.
  - Quellen: [aimultiple.com/proxy-pricing](https://aimultiple.com/proxy-pricing),
    [proxidize.com](https://proxidize.com/blog/residential-proxy-pricing/).
- **[abgeleitet] Kostenfalle:** Bei ~170 KB gz pro Play-Seite kosten 1 Mio. Seiten ≈ 170 GB. Über Residential
  zu $3/GB sind das ≈ **$510 pro Mio. Seiten**.
  - Ein täglicher Vollpass über 4 Mio. wäre also **> $2.000 pro Tag** und damit unbezahlbar.
  - → **Tiering** (§ 8.3), eigene Rechenzentrums-IPs zuerst, Residential nur als Fallback.

### 4.8 Fertige Datensätze / Paketlisten

| Datensatz | Umfang | Nutzbarkeit für uns |
|---|---|---|
| **AndroZoo** ([androzoo.uni.lu](https://androzoo.uni.lu/), [Access](https://androzoo.uni.lu/access)) | 27,4 Mio. APKs (Homepage), Play-Metadaten seit 12/2023 | ❌ nur Forschung, institutionelle E-Mail, „Don’t use it for commercial purposes“ [extern] |
| Kaggle „Google Play Store Apps“ (L. Gupta) | ~10.841 Apps, 2018 | ❌ veraltet, winzig [extern] |
| Kaggle-Datensatz mit ~2,3 Mio. Apps (2021) | – | ❓ per Suche **nicht verifiziert**, ohnehin veraltet |
| Common Crawl (CDX-Index nach `play.google.com/store/apps/details*`) | potenziell Mio. URLs | ❓ `index.commoncrawl.org` war aus dem Container **nicht erreichbar** (Verbindung vom Proxy zurückgesetzt) [beobachtet]; überflüssig, da die Play-Sitemaps vollständiger und aktueller sind |
| Play-Sitemaps (§ 4.2) | ≈ 4 Mio. App-URLs, täglich frisch | ✅ **die** Quelle |

### 4.9 Android: Feld → Quelle

| Feld | Quelle | Frequenz |
|---|---|---|
| Paketliste | Play-Sitemaps | wöchentlich voll |
| Titel, Entwickler, Kategorie, Preis, IAP-Spanne, Contains Ads, Released, Updated, Version, Content Rating, Beschreibung, Screenshots | Detail-HTML | Tier-abhängig (täglich bis monatlich) |
| **Installs exakt (`realInstalls`)**, Bucket, Ratings, Reviews-Count, Histogramm, Score | Detail-HTML | Top täglich, Rest wöchentlich/monatlich |
| Ränge (Teil-Charts) | `/store/games`, `/store/apps`, Kategorieseiten | täglich |
| Ränge (vollständig, inkl. Grossing) | `batchexecute vyAe2` (Grauzone) | täglich (nur falls freigegeben) |
| Reviews | `batchexecute oCPfdb` (Grauzone) | nur falls freigegeben |
| Data Safety | `/store/apps/datasafety` (robots-verboten) | ❌ |
| Similar/Developer | Detail-HTML, `/store/apps/dev?id=` | beim Detail-Crawl |

---

## 5. Machbarkeitstests im Container – Gesamtübersicht

Alle Tests am 25.10.2026 zwischen ~19:30 und 19:50 UTC, sparsam (≈ 90 Requests insgesamt, mit Pausen).
Rohdaten: `/tmp/claude-0/-home-user-app-check/d63162d4-fab3-5636-9ce0-a454efc0c4f0/scratchpad/db/raw/`,
Protokoll: `/tmp/claude-0/-home-user-app-check/d63162d4-fab3-5636-9ce0-a454efc0c4f0/scratchpad/db/TESTLOG.md`.

| Ziel | Ergebnis | Proxy |
|---|---|---|
| `apps.apple.com/robots.txt` | ✅ 200 | durchgelassen |
| Apple-Sitemaps (Index app/new-app/chart, 13 Kind-Dateien) | ✅ 200 | durchgelassen |
| `itunes.apple.com/lookup` (einzeln, 200, 400 IDs, bundleId, artistId) | ✅ 200 | durchgelassen |
| `itunes.apple.com/search` | ✅ 200 | durchgelassen |
| `rss.marketingtools.apple.com` (100) | ✅ 200; /200 → 500; sporadisch 502/504 (Apple) | durchgelassen |
| `rss.applemarketingtools.com` | 301 → marketingtools | – |
| Legacy-RSS `itunes.apple.com/{cc}/rss/…` (8 Feedtypen) | ✅ 200 | durchgelassen |
| Customer-Reviews-RSS | ✅ 200 (Seite 1–10), Seite 11 → 400 | durchgelassen |
| `apps.apple.com/us/app/…` (Detail) + Web-Bundle | ✅ 200 | durchgelassen |
| `apps.apple.com/us/iphone/charts/6017` | ✅ 200 | durchgelassen |
| `play.google.com/robots.txt` + Sitemap-Indizes + 13 Kind-Sitemaps | ✅ 200 | durchgelassen |
| `play.google.com/store/apps/details` (Duolingo + 8 Long-Tail) | ✅ 200 (1× 404 = App nicht verfügbar) | durchgelassen |
| Play Kategorie-/Games-/Entwicklerseiten | ✅ 200 (`/store/apps/top` → 302) | durchgelassen |
| `pypi.org` / `registry.npmjs.org` (Libraries) | ✅ | noProxy |
| `index.commoncrawl.org` | ❌ Connection reset (`ws_closed_mid_exchange`) | **nicht erreichbar** |
| GitHub-API für `facundoolano/google-play-scraper` | ❌ „GitHub access … not enabled for this session“ → stattdessen npm-Tarball gelesen | Session-Policy |
| `batchexecute`, `/store/search`, amp-api | **bewusst nicht getestet** (robots.txt bzw. Token) | – |

---

## 6. Kommerzielle und Open-Data-Abkürzungen

| Anbieter | Was | Preis (grob) | Vorteile | Nachteile |
|---|---|---|---|---|
| **Similarweb App Intelligence (ex-42matters)**; Übernahme 07/2024 ([Similarweb IR](https://ir.similarweb.com/news/press-releases/detail/98/index.html)) | API + **File-Dumps** (Vollkatalog, 12 Stores, > 20 Mio. Apps, SDK-Daten) | nur auf Anfrage ([OMR](https://omr.com/de/reviews/product/42matters/pricing)) | Sofortiger Vollkatalog + **Historie** (Backfill!), SDK-/Ad-Netzwerk-Erkennung | Lizenz verbietet meist Weiterverkauf/Anzeige an Endkunden; teuer; Abhängigkeit |
| **AppTweak API** | ASO (Keywords, Rankings), Metadaten, Downloads-Schätzungen | Credits; 25.000 Credits/Monat inkl. ab „Pro“ ([Docs](https://developers.apptweak.com/reference/api-subscriptions)); Dritte nennen $166/$499/$1.666 pro Monat (nicht verifiziert) | Keyword-Popularity/Difficulty fertig | Credits reichen nie für Millionen Apps; Lizenz |
| **Appfigures API** | Store-Daten, Schätzungen | Credits für nicht getrackte Apps ([KB](https://appfigures.com/support/kb/670/how-much-does-it-cost-to-use-the-appfigures-api)) | gute Doku | pro Request Credits → für 4,5 Mio. nicht skalierbar |
| **Sensor Tower (inkl. data.ai seit 2024)** | Marktführer bei Schätzungen | Basis ~$30–115 Tsd./Jahr, Median ~$75 Tsd.; API-Add-on ~$5–20 Tsd./Jahr; Enterprise $150–300 Tsd.+ (Vendr-Daten via [Sekundärquelle](https://trysonar.app/blog/sensor-tower-api.md)) | beste Schätzqualität | prohibitiv; Wettbewerber-Nutzung untersagt |
| **SerpApi** (App-Store- und Play-APIs) | Live-Abfragen | $25/1.000, $75/5.000, $150/15.000, $275/30.000 Suchen pro Monat ([Sekundärquelle](https://scrapegraphai.com/blog/serpapi-pricing)) | einfach, ohne Blocking | für Millionen Datensätze viel zu teuer (2 Mio. Abrufe ≈ > $18.000) |
| **Apify-Actors** (Community) | Play-/App-Store-Scraper | ca. $0,10–2,00 pro 1.000 Ergebnisse ([Beispiel](https://apify.com/litescrape/google-play-product)) | Infrastruktur und Proxies inklusive | 4 Mio. Play-Apps ≈ $1–8 Tsd. pro Vollpass; Qualität schwankt; rechtliches Risiko bleibt |
| **RapidAPI-Wrapper** | diverse inoffizielle APIs | variabel | schnell testbar | instabil, ungeklärte Herkunft |
| **AndroZoo** | APKs + Metadaten | kostenlos | – | **nicht kommerziell** |

**Empfehlung [abgeleitet]:**
- Die **Basisdaten (Katalog, Metadaten, tägliche Metriken) selbst crawlen**. Das ist günstig (§ 9) und
  technisch gut machbar.
- **Zukauf erwägen nur für (1) historischen Backfill** (12 Monate Ranks/Downloads für „MRR growth“ ab Tag 1)
  **und (2) ASO-Keyword-Popularität**. Beides ist von außen kaum messbar.
- Lizenz vorher genau prüfen: Darf man abgeleitete Kennzahlen an eigene Kunden anzeigen?

---

## 7. Rechtliche Risiken (technische Einschätzung, keine Rechtsberatung)

| Thema | Lage | Risiko für uns [abgeleitet] | Gegenmaßnahme |
|---|---|---|---|
| **Datenbankherstellerrecht** (§§ 87a ff. UrhG, Art. 7 RL 96/9/EG) | Store-Kataloge sind Datenbanken. EuGH **C-762/19 CV-Online Latvia** (03.06.2021): Kopieren/Indexieren eines wesentlichen Teils durch eine spezialisierte Suchmaschine ist Entnahme und Weiterverwendung; verboten aber nur, wenn es die **Investition des Herstellers beeinträchtigt** ([SCL-Zusammenfassung](https://www.scl.org/12290-cjeu-search-engine-copying-of-databases-infringes-sui-generis-right-where-it-adversely-affects-database-maker-investment/)) | mittel: Wir entnehmen systematisch fast den ganzen Katalog. Apple/Google monetarisieren die Katalogdaten aber nicht direkt; wir verlinken zurück und konkurrieren nicht mit dem Store selbst | Anwalt prüfen lassen; keine 1:1-Spiegelung (kein Store-Klon), Mehrwert durch eigene Kennzahlen, Deep-Links in den Store |
| **Wettbewerbsrecht (UWG)** | BGH **I ZR 224/12 „Flugvermittlung im Internet“** (30.04.2014): automatisiertes Auslesen frei zugänglicher Daten ist keine unlautere Behinderung, auch wenn AGB es verbieten. Laut Kommentar gilt das nur, solange **keine technischen Schutzmaßnahmen umgangen** werden und die Seite nicht spürbar verlangsamt wird ([LTO](https://www.lto.de/recht/hintergruende/h/bgh-urteil-izr22412-screen-scraping-flugdaten-automatisiert-auslesen-ryanair-reiseportal)) | gering bis mittel | niedrige Raten, Backoff bei 429/403, **keine CAPTCHA-Löser, kein Login, keine Token-Extraktion** |
| **Vertrag/AGB Apple** | Apple-Website-Terms (Stand 2009) verbieten „deep-link, page-scrape, robot, spider“ für apple.com und verbundene Sites ([apple.com/legal](https://www.apple.com/legal/internet-services/terms/site.html)); Search-API-Bedingungen: Nutzung „only to promote store content“ | mittel. Ohne Account ist es fraglich, ob die AGB überhaupt Vertragsbestandteil werden; in den USA wurden ähnliche Klauseln für ausgeloggte Nutzer verneint (**Meta v. Bright Data**, N.D. Cal. 01/2024, [FBM](https://www.fbm.com/data-analytics/publications/major-decision-affects-law-of-scraping-and-online-data-collection-meta-platforms-v-bright-data/)) | ausgeloggt arbeiten; robots.txt respektieren; App-Store-Links/Badges zeigen; Rate-Limits einhalten |
| **Vertrag/ToS Google** | Google-ToS verbieten automatisierten Zugriff **entgegen robots.txt** (s. § 4.1) | gering, solange robots-konform; **hoch** bei batchexecute/Search/Reviews | robots-strikter Modus als Default; Grauzonen nur nach Freigabe |
| **Urheberrecht an Inhalten** | Beschreibungen, Screenshots, Icons gehören den Entwicklern | mittel bei vollständiger Wiedergabe | Icons/Screenshots per Store-CDN-URL einbinden statt re-hosten (Abwägung: Hotlinking vs. Verfügbarkeit); Beschreibungen nur für Suche/Analyse, Anzeige gekürzt |
| **DSGVO** | personenbezogen: Entwickler als natürliche Personen (Name, **E-Mail, Adresse** auf Play), Reviewer-Namen; Play-ToS verbieten „harvest personal data“ | mittel bis hoch | Datenminimierung: Reviewer nur gehasht, Entwickler-Kontaktdaten nicht anzeigen/exportieren (oder nur bei juristischen Personen); Art.-14-Info, berechtigtes Interesse dokumentieren, Löschkonzept |
| **Umgehung von Sperren** | IP-Rotation, um Blocks gezielt zu umgehen | steigt mit Aggressivität (vgl. BGH-Kriterium „keine technischen Schutzmaßnahmen umgehen“) | Last verteilen ist ok; **nach expliziter Sperre/Abmahnung stoppen**; keine Fingerprint-Spoofing-Tricks gegen Bot-Erkennung |
| **EPF-/Anbieter-Lizenzen** | EPF: nur für Store-Links, kein KI-Training; kommerzielle Anbieter: meist keine Weitergabe | hoch bei Lizenzverstoß | Lizenztexte vor Vertragsschluss prüfen |

---

## 8. Crawling-Architektur für Millionen Datensätze mit täglichen Updates

### 8.1 Überblick

```
                ┌───────────────────────── Discovery ─────────────────────────┐
                │ Apple-Sitemaps (wöchentl.)  New-App-Sitemap (tägl.)          │
                │ Play-Sitemaps (wöchentl.)   Charts/Kategorien (tägl.)        │
                │ Snowball: Similar / Developer / Lookup(artistId)             │
                └──────────────┬──────────────────────────────────────────────┘
                               ▼  upsert app_keys (platform, store_id, source, first_seen)
┌──────────────────────────────────────────────────────────────────────────────────┐
│ Postgres: crawl_targets (next_due_at, priority, tier, fail_count, last_hash)     │
│ Scheduler (alle 1–5 min): wählt fällige Targets → Jobs                           │
└──────────────┬───────────────────────────────────────────────────────────────────┘
               ▼  SELECT … FOR UPDATE SKIP LOCKED (Batching: iOS-Lookup 200 IDs/Job)
┌───────────────────────── Fetcher-Pool (stateless) ───────────────────────────────┐
│ Token-Bucket pro Host×Egress-IP · Retries mit Backoff+Jitter · 429/403 → Pause    │
│ Egress: eigene VMs/IPs → Datacenter-Proxy-Pool → (Fallback) Residential           │
└──────────────┬────────────────────────────────────────────────────┬──────────────┘
               ▼ Raw (zstd) → Object Storage, 7–14 Tage              ▼ Parser (Contract-Tests)
                                                      ┌──────────────────────────────┐
                                                      │ Normalisieren → Hash → Diff  │
                                                      └───┬──────────────┬───────────┘
                         Stammdaten/Versionen/IAP ◄───────┘              └──► Metriken/Ränge
                         Postgres (OLTP)                                      ClickHouse (Zeitreihen)
                                │                                                   │
                                ▼ CDC/Batch-Sync                                     ▼
                         Suchindex (Typesense/Meilisearch)              Schätzmodelle (Batch, tägl.)
```

### 8.2 Discovery-Pipeline

1. **Seed:** Apple- und Play-Sitemaps vollständig einlesen (Streaming-XML-Parser, z. B. `lxml.iterparse` oder
   ein SAX-Parser in Go/Rust). Daraus entsteht `app_keys(platform, store_id, discovered_via, first_seen_at)`.
2. **Täglich:** Apple-New-App-Sitemap, Chart-Seiten (Apple Web-Charts, Legacy-RSS, Play-Kategorie- und
   Games-Seiten). Neue IDs gehen sofort in Tier 0 (neue Apps sind für „trending“ besonders interessant).
3. **Snowball beim Detail-Crawl:** Apple „You Might Also Like“, Play „Similar apps“ und „More by“, plus
   Entwickler-Lookup → neue IDs mit niedriger Priorität.
4. **Tote Apps:** Apple-Lookup ohne Treffer in allen geprüften Storefronts bzw. Play-404 → `status=unavailable`,
   Re-Check nach 7, 30 und 90 Tagen, danach `removed`. Für „Apps entfernt“-Statistiken wird das Löschdatum
   gespeichert.

### 8.3 Scheduler, Queue, Priorisierung

**Queue-Technik [abgeleitet]:**

| Option | Durchsatz | Ops-Aufwand | Empfehlung |
|---|---|---|---|
| **Postgres-Queue** (`FOR UPDATE SKIP LOCKED`; Libraries: pg-boss (Node), graphile-worker (Node), River (Go), Procrastinate (Python)) | Tausende Jobs/s, bei Batching locker genug (~6 Requests/s Durchschnitt) | minimal: eine DB, transaktional mit Daten | ✅ **MVP und vermutlich dauerhaft** |
| Redis + BullMQ | sehr hoch | zusätzlicher Dienst, Persistenz beachten | bei > 100 Requests/s |
| Temporal | Workflows, Retries, Sichtbarkeit | hoch | Overkill für Crawling |

**Statt einer Job-Tabelle eine „Due-Date“-Tabelle [abgeleitet]:**
`crawl_targets(target_type, key, tier, priority, next_due_at, last_success_at, last_hash, fail_count)`.
Der Scheduler zieht `WHERE next_due_at <= now() ORDER BY priority DESC, next_due_at LIMIT n`. Nach Erfolg gilt
`next_due_at = now() + interval(tier)` mit Jitter, damit nicht alle Targets gleichzeitig fällig werden.

**Tiers [abgeleitet, Schwellen später an Daten justieren]:**

| Tier | Kriterium | iOS | Android | Intervall |
|---|---|---|---|---|
| **T0 Hot** | In einem getrackten Chart in den letzten 7 Tagen; ODER Top-Perzentil (iOS > 10k Ratings, Android > 1 Mio. Installs); ODER neu (< 30 Tage) mit Signal; ODER von Kunden getrackt | ~60k | ~60k | **täglich** (Detail + Metriken; iOS-Lookup zusätzlich in ~40 Storefronts) |
| **T1 Warm** | Android ≥ 10k Installs bzw. iOS ≥ 100 Ratings | ~300k | ~400k | Metriken täglich (iOS via Lookup gratis), Detail wöchentlich |
| **T2 Cold** | Rest aktiv | ~1,6 Mio. | ~2 Mio. | iOS-Lookup täglich (billig!), Detail monatlich |
| **T3 Dead/Unknown** | 404/kein Lookup-Treffer | – | ~1–1,5 Mio. (Sitemap-Überhang) | 7/30/90 Tage |

**Promotion/Demotion:**
- **Hoch:** Chart-Eintritt, Sprung bei Ratings/Installs (z. B. > 3σ), neue Version → sofort nach T0.
- **Runter:** 30 Tage ohne Signal.

### 8.4 Fetcher, Rate-Limits, Proxy-Strategie

- **Token-Bucket pro (Host × Egress-IP)**, konservativ starten:
  - `itunes.apple.com` ≤ 20/min pro IP (offizielle Angabe).
  - `apps.apple.com` ≈ 1–2/s gesamt.
  - `play.google.com` ≈ 0,2–0,5/s pro IP.
  - Danach anhand von 429/403 adaptiv steuern (AIMD: bei Fehlern halbieren, langsam steigern).
- **Backoff:** exponentiell mit Jitter. `Retry-After` beachten. Bei gehäuften 403 bekommt die IP eine
  Quarantäne von mehreren Stunden.
- **Caching:**
  - Der Lookup-CDN-Cache hat `max-age≈49.819 s` **[beobachtet]**. Mehrfachabfragen innerhalb von ~14 h liefern
    womöglich identische Daten, also **1× täglich pro App und Storefront genügt**.
  - `If-None-Match`/`If-Modified-Since` nutzen, wo ETags vorhanden sind (prüfen).
- **Proxy-Stufen:**
  1. Eigene Server-IPs (mehrere VMs/Provider, IPv4 + IPv6).
  2. Datacenter-Proxy-Pool (~50–100 IPs, Flatrate).
  3. Residential pay-per-GB nur für hartnäckige Fälle und Länderspezifisches.
- **User-Agent:** ehrlich bleiben bzw. einen gängigen Browser-UA nutzen. Keine Browser-Automatisierung nötig:
  Beide Stores liefern die Daten im initialen HTML (SSR).
- **Lastschutz:** globales Tageslimit pro Host. Wir wollen die Stores nachweislich nicht beeinträchtigen
  (BGH-Kriterium).

### 8.5 Parser, Change Detection, Rohdaten-Archiv

- **Parser** je Quelle als reine Funktion `raw → normalisiertes Objekt`. **Fixture-Tests** mit echten HTML/JSON
  pro Quelle; täglicher „Canary“ gegen 20 bekannte Apps. Bei Abweichung (Felder null, Typwechsel) **Alarm und
  Stopp der Schreibvorgänge für diese Quelle**.
- **Change Detection:** kanonisches JSON pro Entität und Hash (xxhash/sha1).
  - Stammdaten nur bei Hash-Änderung schreiben; dann neuer Eintrag in `app_snapshots` (Diff) und ggf.
    `app_versions`.
  - **Metriken immer täglich schreiben** (kleine Zeilen), auch unverändert. Das vereinfacht Deltas und
    Lückenerkennung.
- **Raw-Archiv** (zstd, Object Storage, 7–14 Tage Rotation): ermöglicht Re-Parsing nach Parser-Fixes ohne
  Re-Crawl.

### 8.6 Zeitreihen (Grundlage für Schätzungen)

Diese Reihen täglich je App erfassen **[abgeleitet]**:
- iOS: `userRatingCount` und `averageUserRating` pro Storefront.
- Android: `realInstalls`, `ratings`, `reviews`, `score`, `histogram`.
- Dazu Preis, Version, Größe sowie die IAP-Preise (bei Änderung).
- Chart-Ränge: Datum/Uhrzeit, Land, Plattform, Chart-Typ, Kategorie, Gerät, Rang, App.

Daraus entstehen später **[abgeleitet; Details im Schätzungs-Dokument (Prefix `est`)]**:
- **Android-Downloads/Tag** ≈ Δ `realInstalls`. Die Länderaufteilung erfolgt über Ränge bzw. Ratings-Verteilung.
- **iOS-Downloads/Tag** ≈ f(Rang in Top Free/Paid pro Land/Kategorie). Die Kurve wird kalibriert an
  Cross-Platform-Paaren (gleiche App auf Android mit bekanntem Δ Installs) und an Δ Ratings-Count.
- **Umsatz** ≈ g(Grossing-Rang) bzw. Downloads × ARPD der Kategorie, plausibilisiert mit IAP-Preisstruktur
  (Abo-Preise) und Δ Ratings.
- **MRR-Wachstum 12 Monate** erst nach 12 Monaten eigener Reihe, sonst nur mit Backfill.

### 8.7 Datenbanken & Suche

| Zweck | Empfehlung | Begründung [abgeleitet] |
|---|---|---|
| Stammdaten, Entwickler, Versionen, IAP, Crawl-State, Nutzer/Accounts | **PostgreSQL 16/17** | robust, Queue im selben System, JSONB für Rohfelder |
| Zeitreihen (Metriken täglich, Chart-Ränge, Schätzungen) | **ClickHouse** (Alternative: TimescaleDB) | Milliarden Zeilen, starke Kompression, schnelle Aggregationen („Top-Gainer 30 Tage“, „MRR-Wachstum“). Timescale ist einfacher (eine DB), aber bei > 1 Mrd. Zeilen und Ad-hoc-Analytics ist ClickHouse deutlich schneller |
| Volltext + Facettenfilter über ~4,5 Mio. Apps | **Typesense** oder **Meilisearch** (Alternative: OpenSearch; nur Postgres-FTS + `pg_trgm` für den MVP) | Typo-tolerante Instant-Suche, Facetten (Kategorie, Plattform, Preis), numerische Filter (Downloads, Umsatz, Launch-Datum), Sortierung. RAM-basiert: 4,5 Mio. Docs × ~1,5 KB indexierte Felder ≈ 10–20 GB RAM. OpenSearch skaliert weiter, kostet aber mehr Betrieb |
| Rohdaten | S3-kompatibler Object Storage | günstig, Rotation |

**Pragmatischer Start [abgeleitet]:**
- Postgres (inkl. `pg_trgm`, Indizes auf Filterspalten) + ClickHouse.
- Den Suchindex erst einführen, wenn die UI typo-tolerante Instant-Suche braucht.
- Die Filterliste (Downloads- und Umsatz-Spannen, Kategorie, Launch-Datum, Ads aktiv) funktioniert mit
  Postgres-B-Tree-Indizes auf einer denormalisierten `app_search`-Tabelle bei 4,5 Mio. Zeilen gut.

### 8.8 Betrieb & Monitoring

- **Metriken:** Requests/Status pro Host und IP, Parser-Fehlerquote pro Quelle, Fälligkeits-Rückstau pro Tier,
  Anteil `null` in Kernfeldern, Datenfrische (p95 Alter von T0).
- **Alarme:** Parser-Bruch (Canary), 403-Welle, Rückstau > 24 h bei T0, Sitemap-Format geändert.
- **Wöchentlicher Abgleich:** Katalogumfang vs. Sitemap, Anteil toter Apps, Plausibilitätschecks bei den
  Schätzungen.

---

## 9. Mengengerüst & Kosten [abgeleitet]

### 9.1 Requests und Transfer pro Tag (Steady State)

| Job | Menge | Requests/Tag | Transfer/Tag (gz) |
|---|---|---|---|
| iOS Lookup Vollkatalog (Haupt-Storefront + Fallback) | 2,0 Mio. Apps / 200 | ~11.000 | ~2,5 GB |
| iOS Lookup T0 in 40 Storefronts | 60k × 40 / 200 | ~12.000 | ~2,8 GB |
| iOS Web-Detail T0 täglich | 60k | 60.000 | ~6,6 GB |
| iOS Web-Detail T1 wöchentlich + T2 monatlich | 300k/7 + 1,6 Mio./30 | ~96.000 | ~10,5 GB |
| iOS Web-Charts (Free/Paid Top 200) | 43 Genres × 2 Geräte × 40 Länder | ~3.400 | ~0,2 GB |
| iOS Legacy-RSS Grossing | 43 × 2 × 40 | ~3.400 | ~0,3 GB |
| iOS New-App-Sitemap + Reviews-RSS T0 (Seite 1) | 353 + ~60k | ~60.000 | ~2,5 GB |
| Play Sitemap-Rescan (wöchentlich) | 86.927 / 7 | ~12.400 | ~2,6 GB |
| Play Detail T0 täglich | 60k | 60.000 | ~11 GB |
| Play Detail T1 wöchentlich | 400k / 7 | ~57.000 | ~10 GB |
| Play Detail T2 monatlich | 2 Mio. / 30 | ~67.000 | ~11 GB |
| Play Detail T3 Re-Checks | ~1,2 Mio. / 30 | ~40.000 | ~0,1 GB (404 sind klein) |
| Play Kategorie-/Games-Seiten | ~50 × 20 Länder | ~1.000 | ~0,3 GB |
| **Summe** | | **≈ 480.000 Requests/Tag (≈ 5,6/s)** | **≈ 60 GB/Tag (≈ 1,8 TB/Monat)** |

### 9.2 Initialer Aufbau (einmalig)

| Schritt | Requests | Transfer | Dauer (Rate) |
|---|---|---|---|
| Apple-Sitemaps komplett | ~1.750 | ~0,8 GB | < 1 h |
| Play-Sitemaps komplett | ~87.000 | ~18 GB | 12–24 h (1–2/s) |
| iOS-Lookup aller 2,0 Mio. | ~10.000–15.000 | ~3 GB | ~1 Tag (≤ 20/min/IP) |
| iOS Web-Detail Top 60k (Rest über Monats-Tier) | 60.000 | ~6,6 GB | ~1 Tag (1/s) |
| Play-Detail-Vollpass ~4 Mio. URLs | ~4 Mio. | ~650–700 GB | 6–12 Tage (4–8/s über IP-Pool) |

### 9.3 Speicher

| Daten | Größe (grob) |
|---|---|
| Postgres `apps` (~6,5 Mio. inkl. tote Apps × ~4 KB inkl. Beschreibung) + Indizes | ~40 GB |
| `app_versions` (ab Start; ~100k Updates/Tag × 300 B) | ~11 GB/Jahr |
| `iap_products` (iOS 2 Mio. × Ø 3–10) | < 2 GB |
| ClickHouse `app_metrics_daily` (~4,5 Mio. + 4,8 Mio. Storefront-Zeilen pro Tag) | ~3,4 Mrd. Zeilen/Jahr → **~15–30 GB/Jahr komprimiert** |
| ClickHouse `chart_ranks` (~2–3 Mio. Zeilen/Tag) | ~1 Mrd. Zeilen/Jahr → ~5–10 GB/Jahr |
| Reviews (selektiv, z. B. 50 Mio.) | ~20 GB |
| Raw-Archiv 14 Tage | ~0,5–0,8 TB (Object Storage) |
| Suchindex | ~10–20 GB RAM |

### 9.4 Kosten pro Monat

| Posten | Annahme | €/Monat |
|---|---|---|
| DB-Server (Postgres + ClickHouse): 64–128 GB RAM, 2× NVMe | Dedicated, z. B. Hetzner AX-Klasse; Preise 2026 gestiegen, AX42 ~€68–97 ([igor’sLAB](https://www.igorslab.de/hetzner-erhoeht-preise-ab-april-2026-deutlich-fuer-cloud-und-dedicated-server/)) | 100–180 |
| Crawler/Parser-Worker | 2–4 Cloud-VMs (CPU-arm; Parsing ~10 ms/Seite) | 40–120 |
| Such-Server (Typesense/Meili) | 32–64 GB RAM | 50–100 |
| Object Storage (~1 TB) | | 5–20 |
| Datacenter-Proxies | 50–100 IPs à ~$0,5–1,5 | 50–140 |
| Residential-Fallback | 30–100 GB à $2–4 | 60–400 |
| Monitoring/Backups | | 20–50 |
| **Summe** | | **≈ 330–1.000 € (typisch ~500–700 €)** |

Zum Vergleich: Sensor Tower ≈ $30–300 Tsd./Jahr; Apify-Vollpass Play ≈ $1–8 Tsd. pro Durchlauf.

---

## 10. Erster Entwurf des DB-Schemas

### 10.1 PostgreSQL (OLTP)

```sql
-- Plattform-Enum
CREATE TYPE platform AS ENUM ('ios', 'android');
CREATE TYPE app_status AS ENUM ('active', 'unavailable', 'removed', 'unknown');

-- Entwickler / Publisher
CREATE TABLE developers (
  id                bigserial PRIMARY KEY,
  platform          platform NOT NULL,
  store_developer_id text NOT NULL,          -- iOS artistId, Android developerId (numerisch oder Name)
  name              text NOT NULL,
  website           text,
  website_domain    text,                    -- für Cross-Platform-Matching
  is_legal_entity   boolean,                 -- DSGVO: Kontaktdaten natürlicher Personen nicht anzeigen
  contact_email     text,                    -- nur intern, minimiert
  country           text,
  first_seen_at     timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now(),
  UNIQUE (platform, store_developer_id)
);

-- Plattformübergreifendes "Produkt" (z. B. Duolingo iOS + Android)
CREATE TABLE products (
  id            bigserial PRIMARY KEY,
  name          text NOT NULL,
  match_method  text,                        -- 'bundle_id', 'domain', 'manual', 'fuzzy'
  created_at    timestamptz NOT NULL DEFAULT now()
);

-- Apps (aktueller Stand, denormalisiert für schnelle Filter)
CREATE TABLE apps (
  id                 bigserial PRIMARY KEY,
  platform           platform NOT NULL,
  store_app_id       text NOT NULL,          -- iOS trackId, Android packageName
  bundle_id          text,                   -- iOS bundleId (= oft Android-Paket)
  product_id         bigint REFERENCES products(id),
  developer_id       bigint REFERENCES developers(id),
  name               text,
  subtitle           text,                   -- iOS Subtitle / Android summary
  primary_category   text,                   -- iOS genreId / Android genreId
  categories         text[],
  is_game            boolean,
  price_usd          numeric(10,2),          -- Preis in Referenz-Storefront
  is_free            boolean,
  has_iap            boolean,
  iap_min_usd        numeric(10,2),
  iap_max_usd        numeric(10,2),
  contains_ads       boolean,                -- Play-Badge; iOS: aus Privacy/SDK-Heuristik (abgeleitet)
  content_rating     text,
  released_at        date,                   -- Launch-Datum
  store_updated_at   timestamptz,            -- letztes Update laut Store
  current_version    text,
  min_os             text,
  size_bytes         bigint,
  languages          text[],
  icon_url           text,
  description        text,
  -- aktuelle Kennzahlen (Kopie der letzten Zeitreihenwerte, für Filter/Sortierung)
  rating_avg         real,
  rating_count       bigint,                 -- iOS: Referenz-Storefront; Android: global
  rating_hist        integer[5],
  installs_bucket    bigint,                 -- Android minInstalls
  installs_exact     bigint,                 -- Android realInstalls
  est_downloads_30d  bigint,                 -- aus Schätzmodell
  est_revenue_30d_usd numeric(14,2),
  -- Crawl-/Lebenszyklus
  status             app_status NOT NULL DEFAULT 'unknown',
  discovered_via     text,                   -- 'sitemap', 'new_app_sitemap', 'chart', 'similar', 'developer'
  first_seen_at      timestamptz NOT NULL DEFAULT now(),
  last_seen_active_at timestamptz,
  removed_at         timestamptz,
  tier               smallint NOT NULL DEFAULT 2,
  content_hash       bytea,
  updated_at         timestamptz NOT NULL DEFAULT now(),
  UNIQUE (platform, store_app_id)
);
CREATE INDEX apps_filter_idx ON apps (platform, primary_category, status);
CREATE INDEX apps_released_idx ON apps (released_at);
CREATE INDEX apps_downloads_idx ON apps (est_downloads_30d DESC NULLS LAST);
CREATE INDEX apps_revenue_idx ON apps (est_revenue_30d_usd DESC NULLS LAST);
CREATE INDEX apps_bundle_idx ON apps (bundle_id);
CREATE INDEX apps_name_trgm ON apps USING gin (name gin_trgm_ops);   -- CREATE EXTENSION pg_trgm;

-- Verfügbarkeit + länderspezifische Werte (iOS-Ratings pro Storefront, Preise)
CREATE TABLE app_storefronts (
  app_id        bigint NOT NULL REFERENCES apps(id),
  country       char(2) NOT NULL,
  available     boolean NOT NULL,
  price         numeric(10,2),
  currency      char(3),
  rating_avg    real,
  rating_count  bigint,
  last_checked_at timestamptz NOT NULL,
  PRIMARY KEY (app_id, country)
);

-- Versionen (ab Crawl-Start, plus Historie aus iOS-Web-Detail)
CREATE TABLE app_versions (
  app_id        bigint NOT NULL REFERENCES apps(id),
  version       text NOT NULL,
  released_at   timestamptz,
  release_notes text,
  size_bytes    bigint,
  first_seen_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (app_id, version)
);

-- Änderungsprotokoll der Stammdaten (nur bei Hash-Änderung)
CREATE TABLE app_snapshots (
  app_id        bigint NOT NULL REFERENCES apps(id),
  captured_at   timestamptz NOT NULL,
  source        text NOT NULL,                -- 'itunes_lookup', 'apple_web', 'play_web'
  content_hash  bytea NOT NULL,
  changed_fields text[],
  payload       jsonb NOT NULL,               -- normalisiert; Rohdaten liegen im Object Storage
  PRIMARY KEY (app_id, captured_at, source)
);

-- In-App-Käufe (iOS: Top-10 mit Namen + Preis; Android: nur Spanne in apps)
CREATE TABLE iap_products (
  app_id        bigint NOT NULL REFERENCES apps(id),
  country       char(2) NOT NULL,
  name          text NOT NULL,
  price         numeric(10,2) NOT NULL,
  currency      char(3) NOT NULL,
  position      smallint,                     -- Reihenfolge im Store
  is_subscription_guess boolean,              -- Heuristik: "Super/Pro/Premium", Preis-Muster
  first_seen_at timestamptz NOT NULL DEFAULT now(),
  last_seen_at  timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (app_id, country, name, price)
);

-- Privacy-Labels (iOS) als Versionen
CREATE TABLE privacy_labels (
  app_id        bigint NOT NULL REFERENCES apps(id),
  captured_at   timestamptz NOT NULL,
  tracks_user   boolean,                      -- "Data Used to Track You" vorhanden
  payload       jsonb NOT NULL,
  PRIMARY KEY (app_id, captured_at)
);

-- Charts (Definition); die Einträge liegen in ClickHouse
CREATE TABLE charts (
  id          serial PRIMARY KEY,
  platform    platform NOT NULL,
  country     char(2) NOT NULL,
  device      text NOT NULL,                  -- 'iphone','ipad','mac','phone'
  chart_type  text NOT NULL,                  -- 'top_free','top_paid','top_grossing','new'
  category    text NOT NULL,                  -- 'all' oder genreId
  source      text NOT NULL,                  -- 'apple_web','apple_rss_legacy','play_category', ...
  max_rank    smallint NOT NULL,
  UNIQUE (platform, country, device, chart_type, category)
);

-- Reviews (minimiert, Autor nur gehasht)
CREATE TABLE reviews (
  platform      platform NOT NULL,
  review_id     text NOT NULL,
  app_id        bigint NOT NULL REFERENCES apps(id),
  country       char(2),
  rating        smallint NOT NULL,
  title         text,
  body          text,
  app_version   text,
  author_hash   bytea,                        -- kein Klarname (DSGVO)
  created_at    timestamptz,
  vote_sum      integer,
  vote_count    integer,
  sentiment     real,                         -- später (NLP)
  fetched_at    timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (platform, review_id)
) PARTITION BY HASH (platform, review_id);

-- Crawl-Steuerung
CREATE TABLE crawl_targets (
  target_type    text NOT NULL,               -- 'ios_lookup','ios_web','ios_chart','play_detail','play_sitemap',...
  target_key     text NOT NULL,               -- z. B. trackId|cc, package, chart-id
  tier           smallint NOT NULL,
  priority       integer NOT NULL DEFAULT 0,
  next_due_at    timestamptz NOT NULL,
  last_success_at timestamptz,
  last_status    smallint,
  fail_count     smallint NOT NULL DEFAULT 0,
  last_hash      bytea,
  locked_until   timestamptz,
  PRIMARY KEY (target_type, target_key)
);
CREATE INDEX crawl_due_idx ON crawl_targets (target_type, next_due_at) WHERE locked_until IS NULL;
```

### 10.2 ClickHouse (Zeitreihen)

```sql
CREATE TABLE app_metrics_daily (
  date            Date,
  platform        LowCardinality(String),
  app_id          UInt64,
  country         LowCardinality(String),   -- 'WW' für globale Android-Werte
  rating_count    UInt64,
  rating_avg      Float32,
  rating_hist     Array(UInt64),
  installs_exact  Nullable(UInt64),         -- Android realInstalls
  installs_bucket Nullable(UInt64),
  reviews_count   Nullable(UInt64),
  price           Nullable(Decimal(10,2)),
  version         LowCardinality(String),
  fetched_at      DateTime
) ENGINE = ReplacingMergeTree(fetched_at)
PARTITION BY toYYYYMM(date)
ORDER BY (platform, app_id, country, date);

CREATE TABLE chart_ranks (
  ts          DateTime,
  date        Date,
  chart_id    UInt32,                        -- -> Postgres charts.id
  platform    LowCardinality(String),
  country     LowCardinality(String),
  chart_type  LowCardinality(String),
  category    LowCardinality(String),
  device      LowCardinality(String),
  rank        UInt16,
  app_id      UInt64
) ENGINE = MergeTree
PARTITION BY toYYYYMM(date)
ORDER BY (chart_id, date, rank);

CREATE TABLE estimates_daily (
  date            Date,
  app_id          UInt64,
  country         LowCardinality(String),
  est_downloads   UInt32,
  est_revenue_usd Float32,
  model_version   LowCardinality(String),
  confidence      Float32
) ENGINE = ReplacingMergeTree
PARTITION BY toYYYYMM(date)
ORDER BY (app_id, country, date, model_version);
```

---

## 11. Plan „Datenbank in 6–8 Wochen“ [abgeleitet]

| Phase | Zeitraum | Inhalt | Ergebnis / Akzeptanzkriterium |
|---|---|---|---|
| **0 Vorbereitung** | Tage 1–3 (parallel) | Anwalt beauftragen (DB-Recht, AGB/ToS, DSGVO, Grauzonen-Entscheid batchexecute/amp-api); Server, Postgres, ClickHouse, Object Storage, Monitoring; Repo-Skelett Crawler | Infrastruktur steht; Entscheidungsvorlage „robots-strikt vs. pragmatisch“ |
| **1 Seed + Zeitreihen-Start** | Woche 1 | **Tag 1: Chart-Collector live** (Apple Web-Charts Top 200, Legacy-RSS Grossing, Marketing-Tools; Play Kategorie/Games); Apple-Sitemaps (1.392 + 353) → ~2,0 Mio. IDs; Play-Sitemaps (86.927) → ~4 Mio. Pakete; kontrollierter Play-Lasttest (Schwelle pro IP) | `app_keys` ≈ 6 Mio.; Charts täglich in ClickHouse; dokumentierte Rate-Limits |
| **2 iOS-Vollkatalog** | Woche 2 | Lookup aller IDs (Haupt-Storefront + Fallbacks) → Status/Stammdaten; Web-Detail Top 60k (IAP, Histogramm, Privacy, Versionen); Parser + Fixtures + Canary; Play-Detail für Chart-/Kategorie-Apps + Snowball (~100k) | ≥ 95 % der iOS-IDs mit Status; T0 iOS täglich; erste Android-T0 |
| **3 Play-Vollkatalog** | Wochen 3–4 | Play-Detail-Vollpass (~4 Mio., 4–8/s über IP-Pool), tote Apps markieren; Tier-Scheduler produktiv; tägliche Metrik-Reihen für alle T0/T1 | ~4–4,5 Mio. aktive Apps (beide Plattformen) mit Stammdaten; „Updated daily“ für T0 erfüllt; Rückstau < 24 h |
| **4 Suche & API** | Woche 4–5 | `app_search`-Denormalisierung, Filter (Kategorie, Launch-Datum, Preis, IAP-Spanne, Installs, Ads), Typesense/Meili optional, interne API | Filterabfragen über 4,5 Mio. Apps < 300 ms p95 |
| **5 Schätzungen v0** | Woche 5–6 | Cross-Platform-Matching (bundleId ↔ Paket, Entwickler-Domain); Android Δ realInstalls; iOS Rang→Downloads-Kurve; Umsatz v0 (Grossing-Rang + IAP-Preise) | Downloads/Umsatz für T0-Apps mit Konfidenz; Plausibilitätsreport |
| **6 Härtung** | Woche 7–8 | Reviews-RSS für Top-Apps, Alerting, Kostenoptimierung (Tier-Schwellen), Backfill-Entscheidung (Anbieter-Angebote), Datenschutz-Doku | stabiler 24/7-Betrieb; v1-Schätzungen nach ≥ 30 Tagen Historie |
| **Laufend** | ab Monat 3 | Modelle mit wachsender Historie verbessern; 12-Monats-Wachstum ab Monat 12 (oder mit Backfill sofort) | – |

**Kritischer Pfad:** Zeitreihen beginnen an Tag 1. Jeder Tag Verzögerung fehlt später in jeder Wachstumskennzahl.

---

## 12. Risiken & Gegenmaßnahmen

| Risiko | Wahrscheinlichkeit | Auswirkung | Gegenmaßnahme |
|---|---|---|---|
| Play blockt Rechenzentrums-IPs bei Dauerlast | mittel–hoch | Play-Aktualität sinkt | Tiering, adaptive Raten, IP-Pool über mehrere Provider, Residential-Fallback-Budget, Apify als Notfall-Outsourcing |
| Apple drosselt Lookup (403) | mittel | iOS-Metriken lückenhaft | ≤ 20/min/IP, Caching, Web-Detail als Zweitquelle für Ratings |
| Struktur-Änderung der Web-JSONs (Apple `serialized-server-data`, Play `ds:`-Arrays) | **hoch** (regelmäßig) | Parser liefern null/Falsches | Contract-Tests, Canary, Raw-Archiv zum Re-Parsen, Parser-Hotfix-Prozess, Library-Updates beobachten |
| Legacy-RSS wird abgeschaltet | mittel | iOS-Grossing fehlt | Grossing-Modell auch aus Downloads × ARPD; Web-Chart-Struktur beobachten; Anbieter-Fallback |
| Sitemaps ändern sich oder verschwinden | gering–mittel | Discovery für Neues schwächer | Snowball (Similar/Developer/Charts) läuft parallel und ist schon vollständig implementiert |
| Abmahnung oder Unterlassung durch Apple/Google | gering–mittel | Betriebsunterbrechung | robots-konform, keine Umgehung, schnelle Abschaltbarkeit pro Quelle, Anwalt vorab |
| DSGVO-Beschwerde (Entwickler-Kontakt, Reviewer) | mittel | Bußgeldrisiko | Minimierung, keine Anzeige privater Kontaktdaten, Hashing, Löschprozess, Datenschutzerklärung |
| Datenqualität der Schätzungen | hoch (inhärent) | Vertrauen der Nutzer | Konfidenzintervalle anzeigen, Kalibrierung an bekannten Werten (öffentliche Firmenzahlen, eigene Apps von Partnern) |
| Kostenexplosion durch Residential-Traffic | mittel | Budget | harte Tageslimits pro Proxy-Stufe, Alarme |

---

## 13. Offene Fragen

1. **Juristisch:** Ist die systematische Entnahme der Store-Kataloge nach CV-Online in DE/EU zulässig?
   Werden Apple-Website-AGB bzw. Search-API-Bedingungen ohne Account wirksam? Sind batchexecute (Play-Charts)
   und die amp-api vertretbar?
2. **Play `realInstalls`:** Wie oft aktualisiert Google den Wert (täglich? verzögert?), zählt er Re-Installs,
   ist er geglättet? → Mit 2–4 Wochen eigener Zeitreihe für ~100 Apps prüfen.
3. **Play-Sitemaps:** Täglich neu? Stabile Shard-Zuordnung (dann wäre ein Delta-Scan möglich)? Wie schnell
   erscheinen neue Apps darin? Warum ~4 Mio. statt ~2–2,7 Mio. (Anteil 404/nicht verfügbar)?
   → Stichprobe 1.000 Apps.
4. **Blocking-Schwellen:** Requests pro Minute und IP bei Play-Detail dauerhaft? Unterschied IPv4/IPv6,
   Rechenzentrum vs. Residential?
5. **Apple Lookup:** Ist das 20/min-Limit pro IP oder global? Liefert der CDN-Cache (`max-age≈14 h`) für
   `userRatingCount` tagesaktuelle Werte?
6. **EPF:** Bekommt man heute noch Zugang mit App-Daten, und erlaubt die Lizenz unseren Anwendungsfall?
   (Antrag stellen.)
7. **Backfill:** Was kostet ein 12-Monats-Historien-Paket bei Similarweb/42matters, AppTweak oder Appfigures,
   und dürfen abgeleitete Werte angezeigt werden?
8. **Kategorien/Storefronts:** Exakte Liste der iOS-Genres (inkl. Spiele-Subgenres) und der Play-Kategorien
   und -Länder festlegen; welche ~40 Länder decken > 90 % des Umsatzes ab? (Siehe Markt-Recherche.)
9. **Ads aktiv:** Wie gut korrelieren `containsAds` (Play) bzw. Privacy-„Tracking“ (iOS) mit tatsächlicher
   Werbeschaltung (Ad-Libraries)? (Siehe Media-Recherche.)

---

## 14. Empfehlungen für unseren Nachbau

1. **Discovery über Sitemaps** (Apple + Play). Snowball nur ergänzend. Keine Suche, kein Brute-Force über
   ID-Räume (iOS-IDs sind dünn besetzt, bis ~6,8 Mrd.).
2. **iOS-Rückgrat ist die offizielle Lookup API:** Batch 200, ≤ 20/min/IP, täglich der ganze Katalog. Die
   **Web-Detailseite** liefert IAP, Histogramm, Privacy und Versionen, Tier-gesteuert.
3. **iOS-Charts:** Web-Chart-Seiten (Top 200 Free/Paid, robots-konform, in Apples Sitemap) + Legacy-RSS
   Top Grossing (Top 100 je Genre).
4. **Android-Rückgrat ist das Play-Detail-HTML** mit `realInstalls`, Tier-gesteuert (T0 täglich, T1
   wöchentlich, T2 monatlich). Charts zunächst nur robots-konform (Kategorie- und Games-Seiten);
   batchexecute erst nach juristischer Freigabe.
5. **Tech-Stack:** Postgres (inkl. Queue via SKIP LOCKED) + ClickHouse + später Typesense/Meilisearch;
   Object Storage für Raw. Crawler in Go oder Python async (httpx/aiohttp); kein Headless-Browser nötig.
6. **Zeitreihen ab Tag 1:** Charts, iOS-Ratings pro Storefront, Android-Installs. Historie ist das eigentliche
   Kapital und lässt sich nicht nachholen.
7. **Parser-Robustheit vor Volumen:** Contract-Tests, Canary, Raw-Archiv.
8. **DSGVO by design:** Keine Klarnamen von Reviewern, keine Anzeige privater Entwickler-Kontakte.
9. **Budget:** ~€500–700/Monat Infrastruktur einplanen, plus optional einmalig Backfill-Lizenz. Kommerzielle
   Live-APIs nur punktuell (ASO-Keywords).
10. **Vor dem Start:** ~1 Tag Anwaltsberatung zu §§ 87a ff. UrhG, UWG, AGB/ToS und DSGVO. Die Ergebnisse
    bestimmen, ob die Grauzonen-Quellen (Play-Charts/-Reviews via batchexecute, amp-api) genutzt werden.

---

## 14a. Umsetzung: Werkzeug `appcrawl` (Stand 26.10.2026)

Der komplette Auszug ist als Werkzeug im Repo umgesetzt: [`crawler/`](../../crawler/README.md). Zwei Stufen:

1. **Discovery:** alle App-IDs aus den Sitemaps beider Stores (§ 3.2, § 4.2).
2. **Metadaten:** iOS über die iTunes Lookup API (§ 3.3), Android über die Play-Detailseite (§ 4.3).

**Live gemessen (Cloud-Container, eine IP) [beobachtet]:**

| Schritt | Ergebnis |
|---|---|
| iOS Discovery, alle 1.745 Sitemaps | Lauf aktiv, ~1 Sitemap/s, Ergebnis folgt |
| Android Discovery, Stichprobe 150 von 86.990 Sitemaps | 6.813 Apps, 45,4 pro Datei → **~3,95 Mio. App-URLs** |
| iOS Lookup, 2.000 Apps | 10 Requests in 33 s, 93 % im US-Store gefunden |
| Android Detailseiten, 80 Apps | 158 s bei 0,5 Requests/s, 89 % verfügbar, exakte Installationszahl bei allen |

**Neue Befunde aus der Umsetzung [beobachtet]:**
- Die `.xml.gz`-Sitemaps beider Stores kommen **doppelt gzip-komprimiert** (Content-Encoding plus gz-Datei).
- Die Python-Bibliothek `google-play-scraper` (§ 4.6) **deaktiviert beim Import global die
  TLS-Zertifikatsprüfung** (`ssl._create_default_https_context = ssl._create_unverified_context`). Wir nutzen nur
  ihren Parser und stellen die Prüfung wieder her.
- Der Play-Sitemap-Index wuchs innerhalb eines Tages von 86.927 auf 86.990 Dateien (neues Datum im Dateinamen).

**Engpass bestätigt:** Android-Detailseiten. 3,95 Mio. Seiten bei 0,5/s sind ~90 Tage auf einer IP. Für einen
Vollpass in einer Woche braucht es ~15–20 IPs oder eine höhere, noch zu messende Rate pro IP, plus
Priorisierung (Apps mit Signalen zuerst).

---

## 15. Quellen

**Selbst geprüft (Primärquellen, 25.10.2026):**
- https://apps.apple.com/robots.txt · https://apps.apple.com/sitemaps_apps_index_app_1.xml ·
  https://apps.apple.com/sitemaps_apps_index_new-app_1.xml · https://apps.apple.com/sitemaps_apps_index_chart_1.xml
- https://itunes.apple.com/lookup?id=570060128&country=us&entity=software ·
  https://itunes.apple.com/search?term=meditation&entity=software&country=us&limit=200 · https://itunes.apple.com/robots.txt
- https://rss.marketingtools.apple.com/api/v2/us/apps/top-free/100/apps.json
- https://itunes.apple.com/us/rss/topgrossingapplications/limit=200/genre=6014/json
- https://itunes.apple.com/us/rss/customerreviews/page=1/id=570060128/sortby=mostrecent/json
- https://apps.apple.com/us/app/duolingo-learn-languages/id570060128 · https://apps.apple.com/us/iphone/charts/6017
- https://play.google.com/robots.txt · https://play.google.com/sitemaps/sitemaps-index-0.xml ·
  https://play.google.com/sitemaps/sitemaps-index-1.xml
- https://play.google.com/store/apps/details?id=com.duolingo&hl=en&gl=US ·
  https://play.google.com/store/apps/category/EDUCATION?hl=en&gl=US · https://play.google.com/store/games?hl=en&gl=US
- npm `google-play-scraper@10.1.4`, `app-store-scraper@0.18.0`; PyPI `google-play-scraper@1.2.7`

**Extern:**
- Apple Search API Doku: https://performance-partners.apple.com/resources/documentation/itunes-store-web-service-search-api/
- Apple EPF: https://performance-partners.apple.com/epf
- Apple Dev Forums (Search-API 403): https://developer.apple.com/forums/thread/66399
- Apple Website Terms: https://www.apple.com/legal/internet-services/terms/site.html
- Google Terms of Service: https://policies.google.com/terms?hl=en · Google Play ToS: https://play.google.com/about/play-terms/
- 42matters Stats: https://42matters.com/stats · AppBrain: https://www.appbrain.com/stats/number-of-android-apps
- AndroZoo: https://androzoo.uni.lu/ · https://androzoo.uni.lu/access
- Similarweb/42matters: https://ir.similarweb.com/news/press-releases/detail/98/index.html · https://omr.com/de/reviews/product/42matters/pricing
- AppTweak API: https://developers.apptweak.com/reference/api-subscriptions · https://help.apptweak.com/en/articles/6051203-app-store-api-pricing-credits-plans
- Appfigures API-Kosten: https://appfigures.com/support/kb/670/how-much-does-it-cost-to-use-the-appfigures-api
- Sensor Tower Preise (Sekundär): https://trysonar.app/blog/sensor-tower-api.md · https://creatify.ai/blog/sensor-tower-pricing-(2026)-plans-credits-and-what-you-ll-actually-pay
- SerpApi Preise (Sekundär): https://scrapegraphai.com/blog/serpapi-pricing · https://serpapi.com/blog/breakdown-of-serpapis-subscriptions/
- Apify-Beispiele: https://apify.com/litescrape/google-play-product · https://apify.com/litescrape/google-play-apps
- Proxy-Preise: https://aimultiple.com/proxy-pricing · https://proxidize.com/blog/residential-proxy-pricing/
- Hetzner-Preise 2026: https://www.igorslab.de/hetzner-erhoeht-preise-ab-april-2026-deutlich-fuer-cloud-und-dedicated-server/
- EuGH C-762/19: https://www.scl.org/12290-cjeu-search-engine-copying-of-databases-infringes-sui-generis-right-where-it-adversely-affects-database-maker-investment/
- BGH I ZR 224/12: https://www.lto.de/recht/hintergruende/h/bgh-urteil-izr22412-screen-scraping-flugdaten-automatisiert-auslesen-ryanair-reiseportal
- Meta v. Bright Data: https://www.fbm.com/data-analytics/publications/major-decision-affects-law-of-scraping-and-online-data-collection-meta-platforms-v-bright-data/
- Proxy/Blocking-Erfahrungen: https://discuss.python.org/t/rotating-proxies-for-google-play-scraper-library/31972 · https://dzone.com/articles/playwright-blocked-after-200-requests
