# 04 – Schätzmodelle: Downloads, Umsatz, MRR-Wachstum, Ad-Spend, ASO, Sentiment

> **Frage:** Wie schätzen AppKittie, Sensor Tower, Appfigures, AppMagic und data.ai für Millionen Apps Downloads,
> Umsatz, MRR-Wachstum, Werbeausgaben nach Land, Keyword-Popularität/-Difficulty und Sentiment – und wie bauen wir das
> selbst?
>
> Stand: 2026-10-25 · Prefix `est` · Autor: Research-Agent (Claude) · Noch kein Produktcode, nur Recherche und Design.

**Legende für alle Aussagen**

| Kürzel | Bedeutung |
|---|---|
| **[B]** | **beobachtet** – selbst per Request/Test geprüft (Befehl bzw. URL steht dabei, Datum 2026-10-25) |
| **[Q]** | **extern belegt** – steht so in einer verlinkten Quelle. Achtung: Was ein Anbieter über sich selbst sagt, ist damit nicht unabhängig geprüft |
| **[A]** | **abgeleitet/vermutet** – eigene Herleitung, Rechnung oder Designannahme |

---

## 0. Kurzfassung

1. **Alle großen Anbieter arbeiten nach demselben Muster:** Sie haben echte Zahlen von Apps, die ihre Daten teilen
   (verbundene Developer-Accounts, SDKs, ein Konsumenten-Panel), und trainieren damit ein Modell. Dieses Modell rechnet
   **öffentliche Store-Signale** (vor allem Chart-Ränge, dazu Kategorie, Land, Wochentag und Saison) in Downloads und
   Umsatz um. Appfigures nennt „hundreds of thousands of apps“ als Trainingsbasis und eine selbst gemessene
   **MdAPE von 5–25 %** [Q]. Sensor Tower nennt ein Panel von über 10 Mio. Konsumenten [Q]. **AppKittie** sagt öffentlich
   nur: „multiple datasets … rankings, performance, and monetization signals“ [B].
2. **Rang → Downloads folgt grob einem Potenzgesetz** (Pareto/Zipf). Der Exponent hängt aber vom Segment ab:
   - Paid-Charts 2013 (Garg & Telang): Rang 1 hat ~150× so viele Downloads wie Rang 200, also β≈0,95 [Q→A].
   - US-Free, Nicht-Spiele 2022 (Sensor Tower): Rang 1 ≈ 156k/Tag, Top-10-Schwelle ≈ 52k/Tag. Das ergibt an der Spitze
     β≈0,48 [Q→A].
   - Konsequenz: **Die Kurve muss pro Segment (Store × Land × Chart × Kategorie) kalibriert werden.**
3. **Google Play liefert eine echte Kalibrierungsquelle.** Die Play-Detailseite enthält neben dem Bucket „500M+“ eine
   **genaue Installationszahl**, z. B. für Duolingo `["500,000,000+",500000000,988861573,"500M+"]` [B]. Aus täglichen
   Differenzen dieser Zahl bekommen wir für Android echte Download-Raten, mit denen sich die Rang-Kurven fitten lassen.
4. **Ratings-Wachstum funktioniert als Proxy.** In einer eigenen Stichprobe (92 Play-Apps) lag das Verhältnis
   Ratings/Installs im Median bei **1,5 %** (P10–P90: 0,8–3,1 %). Ein log-log-Fit streut um etwa **Faktor 1,9** [B].
   iOS liefert `userRatingCount` **pro Storefront** [B]. Damit bekommen wir einen Länder-Mix und eine Rating-Velocity
   für alle Apps, auch für solche außerhalb der Charts.
5. **Umsatz entsteht auf drei Wegen, die wir kombinieren:**
   - (a) Top-Grossing-Rang → Umsatz;
   - (b) Bottom-up: Downloads × Conversion × Preis, mit Benchmarks von RevenueCat und Adapty sowie den IAP-Preisen, die
     auf der App-Store-Seite stehen [B];
   - (c) Downloads × Umsatz pro Download.
   - Brutto und Netto müssen strikt getrennt bleiben. Appfigures zeigt **netto** [Q], AppTweak (iOS) **brutto** [Q].
6. **Ad-Spend nach Land ist nur für die EU (und UK) halbwegs messbar.**
   - Meta liefert für kommerzielle EU/UK-Anzeigen `eu_total_reach` und `age_country_gender_reach_breakdown`, also
     Reichweite pro Land, aber **keine Spend- und Impression-Bänder**. Die gibt es nur bei politischen Anzeigen [Q].
   - TikTok liefert `unique_users_seen_breakdowns` pro Region (nur EEA) [Q].
   - Spend ≈ Reichweite × Frequenz × CPM/1000. Länder außerhalb der EU (USA, JP, BR …) lassen sich **nur modellieren**.
     Das muss im UI so gekennzeichnet sein.
7. **Für Keyword-Popularität gibt es seit dem 14.08.2026 eine offizielle Apple-Quelle**, die **Apple Ads Platform API**:
   `POST https://api.ads.apple.com/v1/insights/apps/search-term-popularity/query` liefert `searchPopularity1to100`,
   `searchPopularityInGenre` und `rankInGenre` pro Genre, Land und Woche oder Monat [B: Apple-Doku-JSON]. Man braucht dafür
   einen Apple-Ads-Account mit API-Rolle. Der App-Store-Endpunkt „search hints“ liefert heute nur noch eine sortierte
   Vorschlagsliste ohne `priority`-Feld [B].
8. **Sentiment ist billig.** Mit **Claude Haiku 5.5** über die Batch API kostet die Klassifikation von **1 Mio. Reviews
   (Sentiment + Themen) rund 12 USD**. Ohne Batch sind es rund 23 USD [A, Preise laut Anthropic-Preisseite]. Ein
   Grundwert lässt sich sogar ohne Text berechnen, aus den Änderungen von Durchschnitt und Anzahl der Ratings [A].
9. **Realistische Genauigkeit für unser MVP** [A]:
   - Top-Apps: Faktor 1,3–1,5;
   - Apps in Kategorie-Charts: Faktor 1,5–2;
   - Long Tail ohne Chartplatz: Faktor 2–4.
   - Darum zeigen wir **gerundete Werte, Spannen und Konfidenz-Badges** und blenden schwache Schätzungen aus. So macht es
     auch Appfigures, das unterhalb seiner Fehlerschwelle nichts anzeigt [Q].
10. **Ab Tag 1 sammeln:** Chart-Ränge (alle Länder × Kategorien × Charttypen, mehrmals täglich), Play-`realInstalls`,
    iOS-Ratings pro Storefront, Reviews, Anzeigen, Keyword-Popularität. **Zeitreihen lassen sich nicht nachkaufen.**
    Reviews mit Zeitstempel sind die einzige Quelle, mit der man rückwirkend Historie annähern kann („Backfill“).

---

## 1. Wie die Anbieter es machen

### 1.1 Überblick

| Anbieter | Eingaben (laut eigener Darstellung) | Ground Truth / Panel | Umsatzdefinition | Genauigkeitsangabe |
|---|---|---|---|---|
| **Appfigures** | „information that can be observed in the store“, KI-Modelle, mehr als 100 größere Modell-Updates, tägliche Aktualisierung [Q1] | echte Download- und Umsatzdaten von „hundreds of thousands of apps“, die ihre Daten teilen („billions of data points“), Double-Opt-out [Q1] | **netto** nach Store-Gebühr (30 % bzw. 15 % bei Abos) [Q2] | **MdAPE 5 % (bester Fall) bis 25 % (schlechtester Fall)**; Schätzung erst ab einer Mindestzahl von Downloads pro Land und Tag (1 bis 100), nur iPhone, keine Downloads für Paid-Apps; Länder werden ausgelassen, wenn die Fehlerschwelle nicht erreicht wird [Q2][Q3] |
| **Sensor Tower** (seit 2024 inkl. data.ai) | „global first-party consumer panel and app store APIs“ plus Modelle und Drittdaten [Q4]; Panel mit über 10 Mio. Nutzern [Q5] | Panel und „early adopters program“ [Q6] | brutto, ohne Steuern, ohne Ads und M-Commerce, Refunds nicht abgezogen (laut eMarketer-Chartnotiz) [Q4] | keine öffentlichen Fehlerzahlen [Q6]; ein Entwickler berichtet 40k USD geschätzt gegenüber 90k USD tatsächlicher MRR (2,25× zu niedrig), nur als Anekdote zitiert [Q5] |
| **data.ai / App Annie** | anonymisierte Entwicklerdaten wurden mit öffentlichen Chart-Rängen korreliert und dann statistisch extrapoliert [Q7]; Konsumenten-Panel für Nutzungsdaten | verbundene Developer-Accounts | Brutto-Konsumentenausgaben vor Store-Gebühr [Q7] | „customers regularly check the estimates against hard data“ (Firmenaussage) [Q7] |
| **AppTweak** | Downloads: Kategorie-Rang in Free/Paid, Land, Datum, Saison, Deep Learning auf Daten verbundener Apps und mehr als 10 Jahren Store-Historie. Umsatz: Top-Grossing-Kategorie-Rang plus Rang-Historie [Q8] | verbundene Apps (anonymisiert) | iOS: **brutto** („Sales … whole amount before the commission“) [Q9] | Schätzung **nur, wenn die App in den Top 500 (iOS) bzw. Top 200 (Android) steht**, sonst 0; Werte können sich bis 7 Tage nachträglich ändern [Q9] |
| **AppMagic** | keine öffentliche Methodik gefunden [Q10] | – | – | – |
| **AppKittie** | „We estimate app revenue using multiple datasets and continuously monitor apps for changes in rankings, performance, and monetization signals. Our models combine those inputs …“ [B: FAQ auf https://www.appkittie.com, Recon-Mitschnitt 2026-10-25] | unbekannt | unbekannt | keine; Testimonial: Die Umsatzschätzungen seien gerade für **organisch getriebene Apps** gut, „most app tracking tools … are completely wrong“ für solche Apps [B] |

**Beobachtete AppKittie-Beispielwerte** (Demo-Karte auf der Startseite, also Marketing, nicht überprüfbar) [B]:

- „Cal AI“: `Free | $0.99–$29.99 | Active ads 292 | Viral videos 830 | Est. Monthly Downloads 520K | Est. Monthly Revenue $3M | MRR growth +75% last 12 months`
- Ads-Karten: „Duolingo | Active for 93 days | Top #1 Ad“, „Lyfta | Active for 3 days | Top #5 Ad“, „Cal AI | Active for 28 days | Top #3 Ad“
- Ad-Spend-Karte: „Ad spend by country · last 30 days $2.4M | United States $1.2M | United Kingdom $480K | Germany $355K | Japan $186K | Brazil $210K“

**Was wir daraus ableiten** [A]:

- Die Werte sind auf zwei signifikante Stellen gerundet.
- Die Preisspanne ist offenbar Minimum bis Maximum der IAP-Preisliste.
- „MRR growth“ setzt mindestens 12 Monate Umsatzhistorie voraus, gesammelt oder rekonstruiert.
- Ad-Spend wird auch für Länder außerhalb der EU (USA, JP, BR) gezeigt. Das geht nur mit einem Modell, nicht mit
  DSA-Messdaten (siehe Kapitel 4).
- Das Testimonial zu organischen Apps deutet an, dass AppKittie neben Rängen auch **Ratings- und Review-Velocity und/oder
  virale Videos** einbezieht. Rang-Modelle unterschätzen Apps, die außerhalb der Charts viel verdienen.

### 1.2 Das gemeinsame Grundprinzip

```
                   ┌──────────────────────────── Ground Truth ─────────────────────────────┐
                   │ verbundene Developer-Accounts (App Store Connect / Play Console),     │
                   │ SDK-/Panel-Daten, öffentliche Zahlen (Gründer, SEC, Reports)          │
                   └───────────────┬───────────────────────────────────────────────────────┘
                                   │ Training / Kalibrierung
 öffentliche Signale ──► Feature-Bau ──► Modell (Kurve / GBM / Bayes) ──► Schätzung + Unsicherheit ──► UI (gerundet, Spanne)
 (Ränge, Ratings, Installs-Buckets,       (pro App × Land × Tag)
  Preise, Ads, Reviews …)
```

**Der Burggraben dieser Anbieter ist die Ground Truth, nicht die Formel.** Appfigures, AppTweak und Mobile Action sagen
ausdrücklich, dass die Genauigkeit davon abhängt, wie viele verbundene Apps es in Kategorie und Land gibt [Q1][Q8][Q11].
Für uns heißt das [A]: Früh einen **„Connect your app“-Anreiz** bauen, also kostenlose eigene Analytics gegen
Daten-Opt-in, und sich bis dahin mit öffentlicher Ground Truth und Android-`realInstalls` behelfen.

---

## 2. Downloads

### 2.1 Signale und ihre Quellen

| Signal | Quelle / Endpunkt | Abdeckung | Status |
|---|---|---|---|
| Chart-Rang iOS (Top Free / Paid / Grossing, pro Genre und Land) | Legacy-RSS `https://itunes.apple.com/{cc}/rss/topfreeapplications/limit=200/genre={id}/json` | liefert **nur 100 Einträge**, auch bei `limit=200`; Top-Grossing funktioniert ebenfalls [B] | [B] |
| | neue RSS-API `https://rss.marketingtools.apple.com/api/v2/us/apps/top-free/100/apps.json` | 100 Einträge; `/200/` gibt HTTP 500 zurück [B] | [B] |
| | Web-Charts `https://apps.apple.com/us/iphone/charts/36` | serverseitig gerendert sind 50–100 App-IDs [B]; mehr nur über clientseitige API-Calls | [B] |
| | Tiefere Charts (bis Rang 200/500) | AppTweak rechnet mit Top 500 iOS / Top 200 Android [Q9]. **Wie man öffentlich und sauber an die Tiefe kommt, ist offen** (gehört ins Datenquellen-Dokument) | offen |
| Chart-Rang Android | Google-Play-Charts; Google hat die Android-Charts **auf Top 200 verkürzt** [Q9] | 200 | [Q] |
| **Genaue Android-Installs** | Play-Detailseite (HTML-Daten): `["500,000,000+",500000000,988861573,"500M+"]` – Bucket-Text, Bucket-Untergrenze, **genaue Zahl**, Kurzform [B: `curl https://play.google.com/store/apps/details?id=com.duolingo&hl=en_US&gl=US`] | global, nicht pro Land | [B] |
| | Bibliotheken: `google-play-scraper` (Python) liefert `minInstalls` und `realInstalls`, die Node-Variante `maxInstalls` [Q12][B] | | [B] |
| Ratings-Anzahl iOS pro Land | iTunes Lookup `https://itunes.apple.com/lookup?id=ID1,ID2&country=de` → `userRatingCount`, `averageUserRating`, `userRatingCountForCurrentVersion` | **pro Storefront**, mehrere IDs pro Call möglich. Beispiel Duolingo: US 5.532.054 · DE 869.197 · GB 992.756 · JP 768.793 · BR 1.163.557 [B] | [B] |
| | Rate-Limit Search/Lookup API: „approximately 20 calls per minute“; Apple verweist für Massennutzung auf den **Enterprise Partner Feed (EPF)** [Q13] | | [Q] |
| Ratings Android | Play-Detailseite / Scraper: `ratings`, `reviews`, `histogram` (global) [Q12] | global | [B] |
| Reviews iOS | RSS `https://itunes.apple.com/{cc}/rss/customerreviews/page={1..10}/id={id}/sortby=mostrecent/json` | **maximal 10 Seiten × 50 = 500 neueste Reviews pro Land**; Seite 11 gibt HTTP 400 [B] | [B] |
| Reviews Android | Scraper `reviews(..., sort=NEWEST)` mit Paginierung [Q12] | praktisch vollständig, nur durch Request-Budget begrenzt | [Q] |

### 2.2 Rang → Downloads: das Potenzgesetz

**Grundform** (Pareto/Zipf, Schätzung im Log-Raum):

```
ln D(r) = α_s − β_s · ln(r)                         # einfache Zipf-Form
ln D(r) = α_s − β_s · ln(r + q_s)                   # Zipf-Mandelbrot: q_s > 0 macht die Spitze flacher
s = Segment (Store, Land, Charttyp, Kategorie, Gerät)
α_s = Skala (Marktgröße), β_s = Steilheit, D = Downloads pro Tag
```

**Was Literatur und Anker zur Steilheit sagen:**

| Quelle | Befund | implizites β |
|---|---|---|
| Garg & Telang 2013, MIS Quarterly (Paid-Apps, iPhone/iPad, nur öffentliche Daten) [Q14] | Rang 1 hat etwa 150× (iPhone) bzw. 120× (iPad) so viele Downloads wie Rang 200; Annahme einer Pareto-Beziehung (Zusammenfassung laut Sekundärquelle [Q15]) | iPhone: ln150/ln200 ≈ **0,95**; iPad: ln120/ln200 ≈ **0,90** [A] |
| Sensor Tower 2022, US, Mediane einzelner Tage [Q16] | Nicht-Spiel iPhone: Rang 1 ≈ 156.000/Tag, Top-10-Schwelle ≈ 52.000/Tag. Android: Rang 1 ≈ 56.000, Top 10 ≈ 29.000. Spiele iPhone: Rang 1 ≈ 93.000, Top 10 ≈ 26.000. China iPhone Top 10 ≈ 108.000; Indien Android Top 10 ≈ 292.000 | iPhone Nicht-Spiel, Rang 1→10: log10(156/52) ≈ **0,48**; Android: log10(56/29) ≈ **0,29**; iPhone-Spiele: ≈ **0,55** [A] |
| Amazon-Bücher (Vergleichsliteratur) [Q17] | log Q = α + β log rank, ein Beispielwert β ≈ −0,83 | ≈ 0,8–1,2 je nach Studie und Konvention [Q17] |
| „Shape of the App Store“ 2015 (Overcast-Umsatz vs. US-Top-Grossing-Rang) [Q18] | Knick („hockey stick“) bei etwa Rang 870; Rang 871 ≈ 700 USD/Tag, Rang 3.175 ≈ 53.891 USD/Jahr | im Long Tail ≈ 1,2 (Herleitung des Fetch-Tools aus den gerundeten Werten [Q18]) |

**Schlussfolgerungen** [A]:

- **Die Spitze ist flacher, der Tail steiler.** Eine einzige Potenzlinie passt nicht. Besser sind Zipf-Mandelbrot
  (`q_s`) oder ein **stückweise lineares Modell bzw. ein Spline im log-log-Raum** mit Knoten etwa bei Rang 10, 50, 200
  und 500.
- β und α sind **segmentabhängig** und **driften über die Jahre**: Für Rang 1 bei iPhone-Nicht-Spielen waren es 2019
  noch 114k/Tag, 2020 185k und 2022 156k [Q16]. Deshalb müssen wir laufend neu kalibrieren, Appfigures tut das jährlich
  [Q3].
- Der **Chart-Algorithmus** von Apple und Google bewertet die **jüngere Download-Velocity**, nicht Gesamtzahlen.
  Vermutlich fließen auch weitere Faktoren ein [A, Branchenwissen; nicht offiziell dokumentiert]. Deshalb mehrmals täglich
  sammeln und den Rang zu einem **Tagesmittel oder -median** glätten.
- Wenn eine App in mehreren Charts gleichzeitig steht (Gesamt, Kategorie, iPhone und iPad, mehrere Länder), liefert
  jede Chartposition eine eigene Schätzung. Wir kombinieren sie nach **Präzision**:

```
ln D̂_app,c,t = Σ_k w_k · ln D̂_k / Σ_k w_k ,   w_k = 1 / σ_k²     # σ_k = Residuen-Streuung des Segments k
```

### 2.3 Kalibrierung über Android-`realInstalls` (die wichtigste Abkürzung)

Die genaue Install-Zahl auf der Play-Seite [B] macht Android „halb beobachtbar“:

```
Δ_inst(a, t1→t2) = realInstalls(a, t2) − realInstalls(a, t1)        # global, kumulativ
D_android_global(a) ≈ Δ_inst / (t2 − t1)                            # z. B. Fenster von 7 Tagen
```

Damit lassen sich α und β der Android-Charts fitten. Die Länder-Ränge einer App erklären zusammen ihren globalen Zuwachs:

```
Δ_inst(a, t) / Tage ≈ Σ_c exp(α_c,k − β_c,k · ln(r_a,c,t + q)) + RoW_a     # RoW = Länder, in denen die App nicht in den Charts steht
→ nichtlineare Kleinste-Quadrate oder hierarchisches Bayes-Modell über tausende App-Tage
```

**Übertrag auf iOS** [A]:

- Startwert: α_iOS,c = α_Android,c + δ_c. Das Verhältnis δ kommt aus öffentlichen Ankern, z. B. US-Top-10 iPhone
  52k gegenüber Android 29k, also etwa Faktor 1,8 [Q16].
- Danach mit iOS-Ground-Truth (Kapitel 2.7) nachjustieren.
- Für den Länder-Mix einer App das Verhältnis der `userRatingCount` pro Storefront verwenden [B].

**Unklar, vor dem Bau messen:**

- Wie oft aktualisiert Google `realInstalls`?
- Zählt die Zahl Neuinstallationen auf weiteren Geräten und Re-Installs mit?
- Bleibt das Feld dauerhaft verfügbar?

Fällt `realInstalls` weg, bleiben die **Bucket-Übergänge** (z. B. der Tag, an dem eine App von „1M+“ auf „5M+“
springt) als grobe Ankerpunkte.

### 2.4 Ratings-Wachstum als Proxy

**Eigene Stichprobe** [B]:

- Erhebung: `google-play-scraper` (Python), Suche nach 8 Begriffen (habit tracker, budget planner, meditation, photo
  editor, language learning, period tracker, calorie counter, pdf scanner), je 12 Treffer, danach `app()` für die
  Details. US, 2026-10-25, 96 Apps, davon 92 mit Installs und Ratings.

| Kennzahl | Wert |
|---|---|
| Ratings / realInstalls, Median | **1,48 %** |
| P10 / P25 / P75 / P90 | 0,80 % / 0,93 % / 2,23 % / 3,06 % |
| Median nach Größe (100k+ / 1M+ / 10M+ / 100M+ Installs) | 1,55 % / 1,50 % / 1,51 % / 1,45 % (über die Größenklassen erstaunlich stabil) |
| log-log-Fit | `log10(Installs) = 2,15 + 0,94 · log10(Ratings)`, Residuen-Streuung 0,28 dex, also **typisch Faktor 1,9** |
| realInstalls / Bucket-Untergrenze | Median 1,70 (Spanne 1,01–4,97). Allein der Bucket lässt also bis zu Faktor 5 Unschärfe |

**Einschränkungen:** Die Stichprobe ist klein und **verzerrt zu populären Apps** (nur Suchtreffer). Die Werte sind
lebenslang kumuliert, also keine Tagesraten. Für iOS gibt es keine öffentliche Ground Truth. Eine Drittquelle setzt für
iOS „1 review per 100–200 installs“ an, also 0,5–1 % [Q5], allerdings ohne Beleg.

**Modell** [A]:

```
ΔR_a,c(k)   = R_a,c(t) − R_a,c(t − k)                  # k = 7 Tage (glättet das Rauschen einzelner Tage)
D̂_ratings   = ΔR / ρ_a                                 # ρ = Ratings pro Download
ln ρ_a      ~ Normal(μ_Kategorie,Plattform , τ²)       # hierarchischer Prior
```

**Selbstkalibrierung pro App:** Solange eine App in den Charts steht, schätzen wir
`ρ_a = ΔR / D̂_rank`. Fällt sie aus den Charts, rechnen wir mit ihrem eigenen ρ_a weiter statt mit dem
Kategorie-Mittel. Rating-Prompts (SKStoreReviewController, höchstens 3 pro Nutzer und Jahr [Q19]) machen ρ von App zu App
sehr unterschiedlich. ρ ist innerhalb einer App aber vermutlich stabiler als zwischen Apps [A].

**Fallstricke:**

- Rating-Resets bei neuen Versionen (iOS: `userRatingCountForCurrentVersion`) und Löschungen erzeugen **negative
  Deltas**. Diese Tage als fehlend markieren, nicht als null werten.
- Kampagnen mit Rating-Prompts erzeugen Spitzen, die nicht von Downloads kommen.
- Incentivierte oder gefälschte Ratings. Ein Hinweis darauf: Die Ratings wachsen deutlich schneller als der Rang.

### 2.5 Review-Velocity

- Reviews mit Text sind auf iOS viel seltener als Ratings. Ihr Vorteil sind **Zeitstempel**. Damit eignen sie sich für
  einen **Backfill**, also die rückwirkende Rekonstruktion der Aktivität (Kapitel 3.5) [A].
- iOS liefert per RSS nur die neuesten 500 Reviews pro Land [B]. Für kleine und mittlere Apps reicht das über
  Monate bis Jahre zurück, für große Apps nur über Tage.
- Android: vollständige Paginierung möglich, aber teuer bei Apps mit Millionen von Reviews.
- Feature-Ideen: Reviews pro Tag, Anteil 1★ in den letzten 7 Tagen, Verteilung über Länder und Sprachen.

### 2.6 Kombiniertes Modell (Gradient Boosting und/oder Bayes)

**Stufe 1 – parametrisch und hierarchisch (MVP)** [A]:

```python
# pro App a, Land c, Tag t
est = []
if rank_signals(a, c, t):                      # jede Chartposition liefert eine Schätzung mit Unsicherheit
    for k in rank_signals:                     # Gesamtchart, Kategoriechart, iPad …
        est.append((alpha[k.seg] - beta[k.seg] * log(k.rank + q[k.seg]), sigma[k.seg]))
if delta_ratings_7d(a, c) is not None:
    est.append((log(delta_ratings_7d / 7) - log_rho(a), sigma_rho(a)))
if platform == "android" and delta_real_installs(a) and is_main_country(c):
    est.append((log(delta_real_installs / days * country_share(a, c)), sigma_share))
if not est:                                    # keine Signale: Long-Tail-Prior
    est.append((prior_mu[category, c, age_bucket], prior_sigma))
ln_D, var = precision_weighted(est)            # Σ w·x / Σ w ,  var = 1/Σw
p10, p50, p90 = exp(ln_D + z * sqrt(var)) for z in (-1.28, 0, 1.28)
```

**Stufe 2 – Gradient Boosting**, sobald genug Ground Truth vorliegt (Android über `realInstalls` schon nach wenigen
Wochen, iOS über das Connect-Programm) [A]:

| Feature-Gruppe | Beispiele |
|---|---|
| Rang | bester ln(Rang) im Gesamt- und im Kategoriechart, Anzahl Charts und Länder, Tage in den Charts (7/30), Rang-Trend (Steigung von ln r über 7 Tage), Rang-Volatilität |
| Ratings / Reviews | ln(1+ΔR_7d), ln R_total, Durchschnittsrating, Durchschnitt der neuen Ratings (Kapitel 6.1), Reviews pro Tag |
| Stammdaten | Kategorie, Land, Alter der App, Preis, IAP ja/nein, Spanne der IAP-Preise, Updatefrequenz |
| Cross-Plattform | Android-Δinstalls der Schwester-App (Zuordnung über Entwickler und Titel) |
| Marketing | aktive Ads (Anzahl), EU-Reichweite der letzten 30 Tage, virale Videos und Views (organische Nachfrage!) |
| Ziel | ln(Downloads) pro App × Land × Tag oder Monat |

- Modell: LightGBM oder CatBoost mit **Quantil-Zielen** (α = 0,1 / 0,5 / 0,9) oder NGBoost. Alternativ ein
  Punktmodell plus **Conformal Prediction**, damit die Intervalle die zugesagte Abdeckung auch einhalten.
- Validierung: `GroupKFold` nach App bzw. Entwickler (sonst leckt Information zwischen den Tagen derselben App) plus
  ein zeitlicher Split.
- **Stufe 3:** ein hierarchisches Bayes-Modell, z. B. in PyMC oder Stan, mit Teilpooling über Länder und Kategorien.
  Das lohnt sich für dünn besetzte Segmente wie kleine Länder oder Nischenkategorien, in denen GBM überanpasst.

### 2.7 Öffentliche Ground-Truth-Quellen zur Kalibrierung

| Quelle | Was sie liefert | Brauchbarkeit / Vorsicht |
|---|---|---|
| **Google Play `realInstalls`** [B] | genaue globale Installs, täglich differenzierbar | **die wichtigste Quelle** für Android-Downloads, kostenlos, für jede App |
| **TrustMRR** [Q20] | verifizierte Umsätze (Stripe, RevenueCat, Superwall, **App Store**). App-Store-Anbindung: täglicher Umsatz aus Paid-Apps, IAP und Abos, **vor** Apples Provision, minus Refunds, in USD; keine MRR und keine Kunden. **Öffentliche API** (`list startups`, `get by slug`, 10 bzw. 60 Requests/Minute), dazu `/llms.txt` und `/startup/{slug}.md` | sehr gute **Umsatz**-Ground-Truth für Indie-Apps; App-Store-Links stehen im Profil, außer im Anonym-Modus. **Nutzungsbedingungen für kommerzielle Nutzung prüfen** |
| Gründer-Posts (X/#buildinpublic, Indie Hackers, Reddit) mit App-Store-Connect-Screenshots | Downloads, Proceeds und Sales pro Zeitraum | manuell kuratieren, mit **Herkunft speichern** (URL, Datum, Metrik). Normalisieren: „Proceeds“ ist netto, „Sales“ brutto, App Store Connect rechnet in PST, oft weltweit aggregiert |
| **RevenueCat State of Subscription Apps 2026** (über 115.000 Apps, 16 Mrd. USD) [Q21] | **Verteilungs-Priors**, keine Werte einzelner Apps, z. B.: Download→Paid median 10,7 % bei Hard Paywall und 2,1 % bei Freemium; Umsatz pro Install nach 60 Tagen 3,09 USD (hard) bzw. 0,38 USD (freemium); Nordamerika 0,55 USD gegenüber Indien/SEA 0,11 USD; 17,3 % der neuen Apps erreichen binnen 2 Jahren 1k USD MRR, 4,6 % erreichen 10k USD; Median-MRR-Wachstum 5,3 %, oberstes Quartil über 80 % pro Jahr | Kalibrierung der Long-Tail-Verteilung („distribution matching“) und der Conversion-Priors |
| **Adapty State of In-App Subscriptions 2026** (über 16.000 Apps, über 3 Mrd. USD) [Q22] | Install→Trial ca. 10,9 %, Trial→Paid ca. 25,6 % (Health & Fitness 35,0 %, Entertainment 19,1 %); Konzentration: 95 % des Abo-Umsatzes entfallen auf die obersten 10 % [Q23] | Conversion-Priors pro Kategorie |
| **Öffentliche Reports von Sensor Tower, Appfigures u. a.** | Schwellen pro Rang (Kapitel 2.2), Top-Apps mit Zahlen, Jahressummen der Märkte | **ebenfalls nur Schätzungen.** Taugen als Plausibilitätsanker, nicht als Wahrheit. Nur öffentlich publizierte Zahlen nutzen, keine Plattformdaten abgreifen |
| **SEC-Filings börsennotierter App-Firmen** (z. B. Duolingo, Match Group, Bumble, Grindr, Life360) | Quartalsumsatz, zahlende Nutzer, DAU/MAU | nur als **Oberer-Rand-Anker** für Top-Grossing-Ränge. Die Firmenumsätze enthalten Web-Zahlungen, Ads und andere Plattformen, deshalb mit Plattformanteilen herunterrechnen [A] |
| **Eigene und Partner-Apps** über App Store Connect API und Play Console Reports | exakte Downloads und Umsätze pro Land und Tag | langfristig **der Burggraben**: Analytics-Dashboard gegen Daten-Opt-in, wie bei Appfigures [Q1] |

**Top-down-Abgleich** [A]: Die Summe unserer Umsatzschätzungen pro Land und Jahr muss zu den veröffentlichten
Jahresgesamtwerten der Märkte passen, mit Vorsicht wegen unterschiedlicher Definitionen. Ebenso muss die Verteilung über
die Apps zu den RevenueCat- und Adapty-Quantilen passen. Beides bindet α, also die Skala, auch dort, wo wir keine
Einzel-Ground-Truth haben.

---

## 3. Umsatz

### 3.1 Weg A: Top-Grossing-Rang → Umsatz

Gleiche Form wie bei den Downloads, aber mit eigenen Parametern:

```
ln R̂_a,c,t = α'_s − β'_s · ln(r_grossing + q'_s)
```

- Die Top-Grossing-Charts reichen bei iOS bis Rang 500, bei Android bis Rang 200 [Q9]. Öffentlich per RSS kommen wir
  aber nur an 100 Einträge [B].
- Im Long Tail ist die Kurve vermutlich steiler (Knick bei etwa Rang 870 im US-Gesamtchart 2015 [Q18]).
- Kalibrieren mit TrustMRR, Gründerzahlen, SEC-Ankern und dem Top-down-Abgleich.

### 3.2 Weg B: Bottom-up (Downloads × Conversion × Preis)

**Preise sind beobachtbar.** Die App-Store-Webseite listet die In-App-Käufe mit Preis [B: `curl -L https://apps.apple.com/us/app/id570060128`]:

> „In-App Purchases: Barrel of Gems (1200) $4.99 · Super Duolingo $9.99 · Super Duolingo $83.99 · Cart of Gems (3000) $9.99 · Super Duolingo $12.99 · … · Super Duolingo $119.99 · Super Duolingo $95.99 · Chest of Gems $0.99 …“

- Die Reihenfolge entspricht vermutlich der Beliebtheit. Früher hieß die Liste „Top In-App Purchases“ [A, unbestätigt].
- Google Play zeigt nur eine Spanne (`IAPRange`) [Q12].
- Die Abo-Perioden (Woche, Monat, Jahr) lassen sich aus Name und Preisniveau klassifizieren, regelbasiert oder per LLM.
- Paywall-Typ (hard oder freemium), Trial-Länge und angezeigte Preise liefert unsere **Onboarding-Library**. Das ist
  eine echte Synergie zwischen zwei Produktteilen [A].

**Abo-Kohortenmodell** [A]:

```
neue_zahler_t  = D̂_t · p_conv(seg)                     # seg = Paywall-Typ × Preisniveau × Land × Kategorie
aktive_abos_t  = aktive_abos_{t−1} · (1 − churn_m(seg)) + neue_zahler_t
brutto_t       = Σ_plan anteil_plan · aktive_abos_t · preis_plan,c / periode_plan  +  IAP_konsum_t
netto_t        = brutto_t / (1 + MwSt_c) · (1 − gebühr_store,programm)    # wenn der Preis inkl. MwSt angegeben ist
```

**Vereinfachung im eingeschwungenen Zustand** (Little's Law) [A]: Bei stabilem Download-Volumen gilt

```
Monatsumsatz ≈ Downloads/Monat × LTV_pro_Install
LTV_pro_Install ≈ p_conv × LTV_pro_Zahler
```

Prior-Werte aus RevenueCat 2026 [Q21]:

| Größe | Wert |
|---|---|
| Download→Paid | 10,7 % (hard), 2,1 % (freemium) |
| realisierter LTV im 1. Jahr pro Zahler | 62,19 USD (hochpreisig), 10,69 USD (niedrigpreisig) |
| Median-Jahrespreis | 34,80 USD |
| Umsatz pro Install nach 60 Tagen | 3,09 USD (hard) bzw. 0,38 USD (freemium) |

Bei wachsenden Apps unterschätzt diese Formel, bei schrumpfenden überschätzt sie. Deshalb mit dem Download-Trend
korrigieren.

### 3.3 Weg C: Downloads × Umsatz pro Download (für den Long Tail)

```
R̂_monat = D̂_monat × RPD(Kategorie, Land, Monetarisierungstyp)
```

- RPD heißt Umsatz pro Download. Startwerte kommen aus Benchmarks, später aus eigener Ground Truth.
- Der Länder-Mix kommt aus dem Verhältnis der iOS-Ratings pro Storefront [B]. Länder-Multiplikatoren aus RevenueCat:
  Nordamerika etwa 5× Indien/SEA beim Umsatz pro Install nach 60 Tagen [Q21].

### 3.4 Brutto, Netto und Gebühren (Parametertabelle, Stand Okt. 2026)

| Store / Fall | Gebühr | Quelle / Status |
|---|---|---|
| Apple Standard | 30 % | [Q24] |
| Apple Small Business Program (unter 1 Mio. USD Proceeds im Vorjahr) und Abos ab dem 2. Jahr | 15 % | [Q24] |
| Apple EU (neue Bedingungen, Aug. 2026) | 26 % Standard / 15 % reduziert mit Apple-IAP; alternative Zahlungsabwicklung 20 % / 10 %; Link-out 15 % / 10 %. Laut einer Quelle ab 1.10.2026 über Attachment 14 der DPLA geregelt | [Q24], Sekundärquellen – **vor Nutzung prüfen** |
| Apple USA, Link-out zu Web-Checkout | derzeit 0 %, hängt vom Verfahren Epic v. Apple ab | [Q24] |
| Google Play, Abos in USA, UK und EEA (neu) | 10 % Service Fee + 5 % Billing Fee bei Play Billing = 15 % | [Q25] |
| Google Play, übrige Märkte (bis zur Umstellung) | 15 % auf die erste Mio. USD, danach 30 %; Abos 15 % | [Q25] |

**Empfehlung** [A]:

- **Intern brutto speichern**, also Kundenpreis ohne MwSt, und **netto abgeleitet** daneben.
- Im UI klar beschriften, welche Variante gezeigt wird.
- Ob AppKittie brutto oder netto zeigt, ist unbekannt (offene Frage).
- Web-Zahlungen (RevenueCat: 3,2 % global, 4,9 % in Nordamerika [Q21]) erscheinen in keinem Store-Signal. Beim
  Abgleich mit SEC-Zahlen berücksichtigen.

### 3.5 Wie „Est. Monthly Revenue“ und „MRR growth last 12 months“ entstehen

```
EstMonthlyRevenue_a   = Σ_{d = t−29..t} Σ_c R̂_a,c,d               # rollierende 30 Tage, gerundet auf 2 signifikante Stellen
MRR_a(t)              ≈ EstMonthlyRevenue_a(t)                     # für Abo-Apps; bei IAP-lastigen Apps „monatlicher Umsatz“
MRR_growth_12m        = MRR_a(t) / MRR_a(t − 365) − 1
Anzeige nur, wenn Konfidenz(t) ≥ mittel UND Konfidenz(t − 365) ≥ mittel, sonst „–“
```

**Woher kommen 12 Monate Historie, bevor wir 12 Monate gesammelt haben?** [A]

1. **Review-Backfill:** Monatliche Review-Zahlen N_rev(m) als Proxy für Downloads, unter der Annahme, dass Reviews pro
   Download innerhalb einer App stabil bleiben. Wachstums-Proxy = N_rev(jetzt) / N_rev(vor 12 Monaten).
   - Android: vollständige Review-Historie.
   - iOS: 500 Reviews pro Land [B]. Über die rund 175 Storefronts summiert reicht das für kleine und mittlere Apps.
   - **Im UI als „Proxy“ kennzeichnen.**
2. **Play-`realInstalls`** liefert nur den aktuellen Stand, keine Historie. Die Installationen der Vergangenheit lassen
   sich höchstens aus dem Erscheinungsdatum und dem Review-Profil grob verteilen.
3. **Web-Archiv-Snapshots** (Wayback Machine) von App-Store- und Play-Seiten mit historischen Rating-Zahlen und Buckets
   wären gute Anker. **`web.archive.org` war aus diesem Container nicht erreichbar** (Connection reset) [B]. Nicht
   umgangen, gehört zu den offenen Fragen.
4. Echte Rang-Historie (Drittanbieter-Datensätze) ist meist veraltet oder lizenzpflichtig.

### 3.6 Kombination der Wege

```
ln R̂ = Σ_j w_j ln R̂_j / Σ_j w_j  mit  w_j = 1/σ_j²        # j ∈ {A Grossing-Rang, B Bottom-up, C RPD}
```

- Steht eine App im Top-Grossing-Chart, dominiert Weg A, weil σ dort am kleinsten ist.
- Außerhalb der Charts tragen B und C.
- Widersprechen sich die Wege um mehr als Faktor 3, wird die Konfidenz herabgestuft und ein „review flag“ für die
  interne Prüfung gesetzt [A].

---

## 4. Ad-Spend nach Land

### 4.1 Datenlage (offizielle Schnittstellen)

| Plattform | Zugang | Relevante Felder | Grenzen |
|---|---|---|---|
| **Meta Ad Library API** (`ads_archive`, ArchivedAd, Graph API v26.0) [Q26] | Identitätsprüfung, Developer-App, Token laufen nach 60 Tagen ab [Q27] | für alle Anzeigen: `ad_creation_time`, `ad_delivery_start_time`, `ad_delivery_stop_time`, `ad_snapshot_url`, `ad_creative_bodies/link_titles/…`, `languages`, `page_id/page_name`, `publisher_platforms`. **Für EU/UK-Anzeigen:** `eu_total_reach` (int), `age_country_gender_reach_breakdown` (Reichweite nach Land × Alter × Geschlecht), `target_locations`, `target_ages`, `target_gender`, `beneficiary_payers`; `total_reach_by_location` für EU, BR und UK | `spend` und `impressions` (als Bänder) **nur bei POLITICAL_AND_ISSUE_ADS** [Q26]. Kommerzielle Anzeigen, die **keine** EU erreicht haben, liefert die API nicht [Q28]. EU-Anzeigen bleiben 1 Jahr nach der letzten Impression im Archiv [Q27]. Mehrere Anbieter behaupten Spend-Bänder für kommerzielle EU-Anzeigen; **das widerspricht der offiziellen Feldliste** [Q26][Q29] |
| **TikTok Commercial Content API** [Q30][Q31] | Antrag mit Prüfung durch TikTok, eher auf Forschung ausgerichtet [Q27] | Query: `ad.id`, `first_shown_date`, `last_shown_date`, `status`, `videos`, `image_urls`, `reach.unique_users_seen`; Filter `ad_reach` („0-10K“, „10K-100K“, „100K+“). **Detail-Endpunkt:** `reach.unique_users_seen_breakdowns` **pro Region** (mit Alter und Geschlecht), `targeting_info` (Länder, Alter, Interessen, `number_of_users_targeted`), `download_url`, `external_url`, `advertising_objective`, Werbetreibender inkl. TikTok-Account | **nur EEA**, ohne UK und Schweiz [Q31]; maximal 10 Ergebnisse pro Request; Rate-Limits nicht dokumentiert |
| Google Ads Transparency Center | nur Browser, keine offizielle API [Q27] | Suche, YouTube, Display; DSA-Details für EU | Screenshots im Medien-Dokument (`assets/media-google-ads-transparency-*.webp`) |
| Apple Ad Repository (DSA, App-Store-Anzeigen in der EU) | Web | siehe `assets/media-apple-ad-repository.webp` (Medien-Agent) | keine Details recherchiert |
| LinkedIn, X, Snapchat, Pinterest | Web, CSV, Galerien [Q27] | LinkedIn: Impression-Bänder pro EU-Staat | für Consumer-Apps kaum relevant |

### 4.2 Formel: Reichweite → Impressionen → Spend

```python
WINDOW = last_30_days
for ad in ads_of(app) if overlaps(ad.active_period, WINDOW):
    lifetime = (ad.stop or today) - ad.start
    share = overlap_days(ad.active_period, WINDOW) / lifetime    # Annahme: gleichmäßige Auslieferung
    for c in EU_UK_COUNTRIES:
        reach_c = sum(b.count for b in ad.age_country_gender_reach_breakdown if b.country == c)   # Meta
        # TikTok: reach_c = ad.unique_users_seen_breakdowns[c].unique_users_seen
        impr_c  = reach_c * FREQ[platform, objective] * share
        spend[c] += impr_c / 1000 * CPM[c, platform, quarter]
```

**Rechenbeispiel** [A]: Eine Meta-Anzeige erreicht 400.000 Konten in DE. Bei einer angenommenen Frequenz von 1,8 und
einem CPM von 9 USD ergibt das 400.000 × 1,8 / 1000 × 9 ≈ **6.480 USD**.

**Eingabeparameter (hohe Unsicherheit):**

- **CPM pro Land und Plattform:** Die Benchmarks streuen stark.
  - Meta USA: 10,50–16,80 USD (Q1 2026) [Q32], andere Quellen 16–23 USD [Q32];
  - Meta DE: 7,60–12,40 USD, FR: 6,80–11,20 USD, UK: 8,40–13,60 USD [Q32];
  - TikTok: Plattformmittel 4,8–13,3 USD je nach Quelle [Q33].
  - Daraus folgt: **Spannen speichern, Quartalsupdates einplanen, mit echten Kampagnendaten kalibrieren** (eigene
    Kampagnen, Partner, öffentliche Aussagen von Gründern).
- **Frequenz:** Die Bibliotheken liefern keine Frequenz. Annahme 1,2–3 je nach Laufzeit und Ziel [A]. Diese Annahme ist
  der größte Fehlerfaktor neben dem CPM.
- **Zum Vergleich der Branchenansatz** (Sensor Tower Pathmatics, panelbasiert): Jede beobachtete Impression bekommt
  einen CPM; Spend = Impressionen × CPM [Q34].

### 4.3 Länder außerhalb der EU (USA, Japan, Brasilien …)

Hier gibt es **keine** öffentliche Reichweite. Eine Modellierung ist möglich [A]:

```
spend_c (nicht-EU) = spend_EU_gesamt × (Marktgewicht_c / Σ_EU Marktgewicht) × (CPM_c / CPM̄_EU) × Intensität_c
Marktgewicht_c ≈ Download- oder Nutzeranteil der App in c (iOS-Ratings pro Storefront, Download-Schätzung)
Intensität_c   ≈ 1, sofern es Hinweise auf Kampagnen in c gibt (Sprachen der Creatives, Länder im Targeting,
                 Präsenz im Google ATC), sonst niedriger
```

- **Die Konfidenz ist niedrig**, und das muss im UI stehen.
- Die Ad-Library-**Weboberfläche** von Meta zeigt kommerzielle Anzeigen auch pro Nicht-EU-Land, aber nur ohne
  Reichweite. Sie automatisiert auszulesen ist **nach Metas Nutzungsbedingungen riskant**. Offene Rechtsfrage, keine
  Empfehlung.

### 4.4 „Active for N days“ und „Top #N Ad“

```
active_days(ad) = (ad_delivery_stop_time or today) − ad_delivery_start_time      # Meta
active_days(ad) = last_shown_date − first_shown_date + 1                         # TikTok
```

„Top #N Ad“: Ein **Rang innerhalb der aktiven Anzeigen einer App** (oder einer Kategorie bzw. eines Lands), sortiert
nach einem Score [A]:

```
score(ad) = geschätzte_Impressionen_30d(ad)            # primär (aus Reichweite × Frequenz)
          → Gleichstand: active_days, Anzahl Varianten/Duplikate desselben Creatives, Zahl der Plattformen
TopN(ad) = 1 + #{ad' derselben App : score(ad') > score(ad)}
```

- Begründung: Anzeigen, die lange laufen und breit ausgeliefert werden, sind mit hoher Wahrscheinlichkeit
  „Gewinner“. Werbetreibende stoppen Anzeigen, die nicht funktionieren.
- Die AppKittie-Beispiele („Active for 93 days | Top #1 Ad“) passen zu diesem Muster [B/A].
- **Duplikate zusammenführen:** Jede Variante ist eine eigene Zeile [Q27]. Wir gruppieren per Perceptual Hash bzw.
  Video-Fingerprint und Textähnlichkeit.

---

## 5. ASO: Popularität, Difficulty, Ranking-Tracking

### 5.1 Keyword-Popularität von Apple: Apple Ads Platform API (neu, offiziell)

**Endpunkt** [B: Apple-Doku als JSON, `https://developer.apple.com/tutorials/data/documentation/apple-ads-platform-api/query-app-search-term-popularity-data.json`]:

```
POST https://api.ads.apple.com/v1/insights/apps/search-term-popularity/query
Header: X-AP-Context: adAccountId=…   (OAuth2 Client-Credentials wie bei der bisherigen Search-Ads-API)
Body:
{ "filters":[ {"field":"countryOrRegion","operator":"EQUALS","value":"US"},
              {"field":"genre","operator":"EQUALS","value":"PRODUCTIVITY_UTILITIES"} ],
  "timeRange":{"start":"2025-01-05","end":"2025-01-11","granularity":"WEEKLY_SUN_SAT"},   # oder MONTHLY
  "sorting":[{"field":"rankInGenre","order":"ASC"}],
  "pagination":{"offset":0,"pageSize":20} }
→ rows: week|month, countryOrRegion, genre, searchTerm, rankInGenre,
        searchPopularityInGenre (1–100), searchPopularity1to100 (1–100, über alle Genres im Land), searchPopularity1to5
```

**Details aus der Doku:**

- Filter auf `searchTerm` mit `EQUALS`, `IN`, `CONTAINS` und `STARTS_WITH`.
- Mehrere Länder pro Request möglich, `pageSize` bis 10.000, höchstens 2 Sortierfelder.
- Genres: BUSINESS, EDUCATION, ENTERTAINMENT, FINANCE, FOOD_DRINK, GAMES, HEALTH_FITNESS, LIFESTYLE, NEW_PUBLICATION,
  PHOTO_VIDEO, PRODUCTIVITY_UTILITIES, SHOPPING, SOCIAL_NETWORKING, SPORTS, TRAVEL [B].

**Weitere Endpunkte** [B]:

- `POST /v1/suggestions/keywords/query`: Keyword-Vorschläge mit `popularity`. Pflichtfeld ist `promotedObjectId`, also
  die **eigene** beworbene App.
- `POST /v1/suggestions/phrases/query`: Die Route `SEARCH` mit `phrase IN` bzw. `LIKE` liefert Popularität für
  bestimmte Phrasen **ohne** `promotedObjectId`. Laut einer Drittquelle ist das eher ein Marken- und Business-Katalog
  [Q35]. Ob die Route für App-Keywords taugt, muss getestet werden.
- `POST /v1/insights/apps/impression-share/query`: nur für Apps, die man selbst bewirbt.

**Kontext laut Drittquellen:**

| Punkt | Inhalt |
|---|---|
| Veröffentlichung | API seit 14.08.2026, offizielle SDKs für Python, Node, Java und Swift [Q35][Q36] |
| Kosten und Voraussetzungen | keine API-Gebühren; Insights-Abfragen brauchen **kein laufendes Werbebudget**; API-Rollen: Account Manager, Read Only oder Limited Access [Q36] |
| Historie | reicht bis Oktober 2025 zurück [Q36] |
| Abschaltung der alten API | Campaign Management API v4/v5 wird am **26.01.2027** abgeschaltet [Q36] |
| Abdeckung | laut einer Quelle nur die **Top-500-Begriffe** pro Genre und Land [Q37] |
| Schwelle | RespectASO (Open Source, AGPL-3.0) schätzt in einem Code-Kommentar: Im Datensatz stehen nur Begriffe mit etwa ≥ 500 Suchen pro Woche, der beobachtete Boden liegt bei Popularität ≈ 40 [Q38]. **Nicht verifiziert** |

**Vorgeschichte:**

- Die bekannten „5–100“-Werte der ASO-Tools stammen aus der Campaign-Management-API bzw. dem Search-Ads-Dashboard. Apple
  dokumentierte offiziell nur eine 1–5-Skala.
- Ab dem 29.09.2025 fiel die Zahl der US-Keywords mit Popularität über 5 binnen vier Tagen um 77 % (von 165.875 auf
  39.254). Viele Werte klebten danach am Boden 5 [Q39].
- Die neue API ersetzt diese Werte durch die Skala 1–100.

**Rechtliche Vorsicht** [A]: Ob wir Popularitätswerte aus einem Apple-Ads-Account **an zahlende Kunden
weiterverteilen** dürfen, ist offen. Apple-Ads-Bedingungen und DPLA prüfen. Die Alternative ist, nur eigene, kalibrierte
Schätzwerte zu zeigen.

### 5.2 Alternativen und eigene Popularitätsschätzung

| Quelle | Befund |
|---|---|
| App-Store-„search hints“ `https://search.itunes.apple.com/WebObjects/MZSearchHints.woa/wa/hints?clientApplication=Software&term=habit` (Header `X-Apple-Store-Front: 143441-1,29`) | liefert eine plist mit **10 Vorschlägen** (`term`, `url`), z. B. „the habit burger grill, habit tracker, habitica, habit, habitify, habitshare, habit tracker free, habitkit, habitlink, habit rabbit“. **Kein `priority`-Feld mehr** [B]. Drittanbieter beschreiben das Feld noch als 0–10000-Wert [Q40]; das ist offenbar veraltet |
| Google Play Suggest | alter Endpunkt `market.android.com/suggest/SuggRequest` gibt **HTTP 404** zurück [B]; heute über die Play-Web-RPC (google-play-scraper `suggest`, bis zu 5 Vorschläge) [Q12] |
| Suchergebnisse | Anzahl der Treffer und Stärke der Top-10-Apps, über die iTunes Search API oder die Web-Suche (Kapitel 5.4) |

**Eigenes Popularitätsmodell** (für Begriffe unterhalb von Apples Schwelle und für Google Play) [A]:

```
Merkmale(term, c):
  min_prefix  = kleinstes k, bei dem term in hints(term[:k]) erscheint      # kurzer Präfix = populär
  pos_k       = Position von term in hints(term[:k]) für k = min_prefix … len(term)
  n_words, n_results, top10_ratings_median, title_match_share, play_suggest_pos …
Modell: isotonische Regression oder GBM auf Begriffen mit offizieller Apple-Popularität (Training) → pop̂ ∈ [1, 100]
Begriffe ohne Autocomplete-Treffer → „niedrig (unter Apples Schwelle)“
```

**Popularität → Suchen pro Tag**, optional für eine „Traffic“-Kennzahl:

- RespectASO nutzt eine Stützpunkttabelle, z. B. 40 → ca. 70 Suchen/Tag, 60 → ca. 1.150, 80 → ca. 19.000,
  100 → ca. 300.000 (US).
- Dazu eine Tap-Through-Kurve nach Position (Rang 1 ca. 30 %, Rang 5 ca. 6 %, Rang 10 ca. 1,3 %) und 5 % Install-Rate
  [Q38].
- Die Werte sind selbst gesetzt bzw. kalibriert, **nicht offiziell**.
- **AGPL-3.0:** Ideen übernehmen ist in Ordnung. Code in ein geschlossenes SaaS zu kopieren, löst AGPL-Pflichten aus.

### 5.3 Difficulty

Die Anbieter definieren Difficulty alle über die **Stärke der Top-10-Apps** eines Keywords:

- **AppTweak:** „App Power“ der Top 10 [Q41];
- **Mobile Action:** Sichtbarkeit der Top 10, skaliert auf 0–100 [Q41];
- **AppFollow:** über 15 Parameter, u. a. ein Store-Performance-Index der Top 10 und der Anteil mit dem Keyword im Titel
  [Q41].
- **RespectASO** gewichtet (offener Code [Q38]): Rating-Volumen 0,30 · Dominanz großer Marken 0,20 · Rating-Wachstum
  0,10 · Durchschnittsrating 0,10 · Alter 0,10 · Publisher-Vielfalt 0,10 · Keyword im Titel 0,10. Zur Kalibrierung hat
  das Projekt 309 Suchen in 6 Storefronts gegen reale Positionen ausgewertet.

**Vorschlag für den Start** [A]:

```
strength(app) = 0,40·norm(ln Ratings_c) + 0,15·norm(ln(1+ΔRatings_30d)) + 0,15·norm(ln D̂_monat)
              + 0,10·norm(Durchschnittsrating) + 0,10·norm(Alter) + 0,10·Titeltreffer(app, term)
difficulty(term, c) = 100 · [ 0,70 · mean_{Top 10}(strength) + 0,20 · max_{Top 3}(strength) + 0,10 · (1 − Publisher-Vielfalt) ]
norm(x) = Perzentil von x über alle Apps des Landes (0–1)
```

**Kalibrieren:** Wo landen neue Apps mit bekannter Stärke tatsächlich (Ranking-Tracking)? Die Gewichte so anpassen,
dass „Lücke = Difficulty − Stärke der eigenen App“ die erreichte Position monoton vorhersagt. Diesen Ansatz verfolgt
auch RespectASO [Q38].

### 5.4 Keyword-Ranking-Tracking (Positionen pro Land und Tag)

| Quelle | Befund |
|---|---|
| App-Store-Websuche `https://apps.apple.com/us/iphone/search?term=habit%20tracker` | serverseitig gerendert, **11 App-IDs** in Reihenfolge im HTML: 1438388363, 1528595748, 6443918070, 1547137474, 1450486923, 983826477 … [B] |
| iTunes Search API `https://itunes.apple.com/search?term=habit+tracker&entity=software&country=us` | **ähnliche, aber nicht identische Reihenfolge**: 1438388363, 6443918070, 1547137474, 1528595748, 983826477, 1450486923 … Die Plätze 2–4 und 5–6 sind vertauscht [B]. Für exaktes Tracking ist diese API also nur eine Näherung |
| Google-Play-Suche | `play.google.com/store/search?q=…&c=apps&gl=US` (nicht getestet) |

**Volumen und Planung** [A]:

- Beispiel: 20.000 Keywords × 10 Länder × 2 Stores = 400.000 Requests pro Tag, also ca. 4,6 pro Sekunde.
- Dafür braucht es einen IP-Pool, Rate-Limiting und Caching. Die Nutzungsbedingungen der Stores sind zu beachten.
- **Priorisieren:** Keywords von Nutzer-Watchlists täglich, den Rest wöchentlich.
- Gespeichert wird Position 1…N (N = 50–200), getrennt nach iPhone und iPad.
- Ads-Slots (Apple Ads) erscheinen in der Websuche vermutlich nicht. Organisch und bezahlt trennen.

---

## 6. Sentiment

### 6.1 Grundwert ohne Text (kostenlos)

- **iOS:** Die Lookup-API liefert pro Land `averageUserRating` (5 Nachkommastellen) und `userRatingCount` [B]. Daraus
  lässt sich der **Durchschnitt der neuen Ratings** berechnen [A]:

```
avg_neu(t−k → t) = (avg_t · N_t − avg_{t−k} · N_{t−k}) / (N_t − N_{t−k})
```

- Rundungsfehler werden klein, wenn N_t − N_{t−k} groß genug ist (z. B. 50 oder mehr).
- **Android:** Das `histogram` (1–5★) liefert die Anteile direkt [Q12]. Die Deltas zwischen zwei Tagen ergeben die
  Verteilung der neuen Ratings.
- Kennzahl: „Sentiment = Anteil 4–5★ unter den neuen Ratings der letzten 30 Tage“.

### 6.2 Review-Text: LLM oder Klassifikator

**Ziel:** Neben dem Sentiment auch **Themen bzw. Aspekte**: Preis/Paywall, Abo-Kündigung, Bugs/Abstürze, Werbung,
Funktionen, Support, Onboarding, Datenschutz. Erst damit wird die Review-Analyse für Gründer wirklich nützlich.

**Kosten für 1 Mio. Reviews** [A, Preise laut Anthropic-Preisseite, abgerufen 2026-10-25 [Q42]]

Annahmen:

- ca. 109 Input-Tokens pro Review (≈ 70 Tokens Text + Overhead, 25 Reviews pro Request, ca. 600 Tokens
  Instruktion/Schema umgelegt);
- ca. 25 Output-Tokens pro Review (kompaktes JSON);
- Thinking aus: Bei Haiku 5.5 darf es bis Effort `high` deaktiviert werden.

| Modell (ID) | Input / Output pro MTok | Kosten Standard | Kosten **Batch API (−50 %)** |
|---|---|---|---|
| Claude Haiku 5.5 (`claude-haiku-5-5`) | 0,10 / 0,50 USD (Prompts bis 100k Tokens) | **ca. 23 USD** | **ca. 12 USD** |
| Claude Haiku 4.5 (`claude-haiku-4-5`) | 1 / 5 USD | ca. 234 USD | ca. 117 USD |
| Claude Sonnet 5.5 (`claude-sonnet-5-5`) | 2 / 10 USD | ca. 468 USD | ca. 234 USD |

- Prompt-Caching der Instruktion spart zusätzlich. Cache-Hit bei Haiku 5.5: 0,01 USD/MTok [Q42].
- Bei z. B. 2 Mio. neuen Reviews pro Tag über alle getrackten Apps kostet Haiku 5.5 im Batch ca. **700 USD/Monat**.
  Lässt sich auf Apps mit Nutzerinteresse beschränken.
- **Open-Source-Alternative:** multilinguale Transformer-Klassifikatoren in Base-Größe (XLM-R-Familie), auf einer
  einzelnen GPU grob 10³ Reviews pro Sekunde. 1 Mio. Reviews dauern dann etwa 10–20 Minuten und kosten deutlich unter
  1 USD GPU-Zeit [A, Größenordnung, nicht gemessen]. Diese Modelle sind schwächer bei Aspekten, Ironie und Mischsprachen.
- **Empfohlene Pipeline** [A]:
  1. Deduplizieren (Hash, Spam);
  2. Sprache erkennen;
  3. Sternewert als Prior;
  4. Claude Haiku 5.5 Batch für Sentiment und Aspekte (JSON-Schema über Structured Outputs);
  5. Aggregation pro App × Land × Woche;
  6. Stichprobe von 1–2 % von einem stärkeren Modell oder einem Menschen gegenprüfen lassen (Qualitätsmonitoring).

---

## 7. „Trending/Growing“-Erkennung

**Signale** [A]:

```
Rang-Momentum   M_a,c = median(ln r, t−34..t−28) − median(ln r, t−6..t)            # > 0 heißt: steigt
Downloadwachstum G_a  = ln(D̂_7d / D̂_vorige_7d) ;   Z_G = (G − μ_Kategorie) / σ_Kategorie   (robust: Median und MAD)
Ratings-Beschl.  A_a  = ln((1+ΔR_7d) / (1+ΔR_vorige_7d))
Breadth          B_a  = Anzahl Länder mit M > 0,5
Neue-App-Breakout:  Erscheinungsdatum ≤ 90 Tage  ∧  erstmals Top-N in ≥ k Ländern  ∧  Z_G ≥ 2 an ≥ 3 aufeinanderfolgenden Tagen
TrendScore = 0,35·Z_G + 0,20·Z_Umsatz + 0,15·Z_A + 0,15·Z_B + 0,10·neue_Ads_30d + 0,05·virale_Views_Z
```

**Robustheit:**

- **Persistenz verlangen**, also mehrere Tage und mehrere Länder.
- Bekannte Störquellen ausfiltern:
  - Featuring durch Apple oder Google (plötzlicher Sprung, nach wenigen Tagen zurück);
  - Preisaktionen, etwa der Wechsel von Paid zu Free;
  - saisonale Kategorien (Steuern, Fitness im Januar);
  - Chart-Manipulation durch incentivierte Installs. Hinweis darauf: Der Rang steigt stark, die Ratings bewegen sich
    kaum.
- Zur Glättung eignet sich ein **Bayesian Shrinkage**: Wachstumsraten kleiner Apps mit wenig Daten werden Richtung
  Kategorie-Mittel gezogen. Sonst dominieren Apps mit sehr kleiner Basis.

---

## 8. Genauigkeit, Unsicherheit und Backtesting

### 8.1 Was realistisch ist

| Segment | Downloads (typischer Faktor) | Umsatz (typischer Faktor) | Bemerkung |
|---|---|---|---|
| Top 50 Gesamtchart in großen Ländern, mit Kalibrierung | 1,25–1,5 | 1,3–1,6 | Anker vorhanden (Reports, SEC) |
| Kategorie-Charts Rang 50–500 | 1,5–2 | 2 | Laut Drittquellen haben auch die großen Anbieter bei Apps um Rang 300–1000 dünne Panels [Q5] |
| Long Tail ohne Chartplatz (nur Ratings/Reviews) | 2–4 | 3–5 | nur **Spannen bzw. Buckets** zeigen |
| Android mit `realInstalls`-Deltas (global) | ca. 1,1–1,3 global, schlechter pro Land | – | Downloads gut, Umsatz nicht |
| Zum Vergleich: Appfigures, selbst gemeldet | MdAPE 5–25 % | MdAPE 5–25 % | mit Ground Truth aus über 100.000 Apps und Schwellen, unterhalb derer nichts angezeigt wird [Q2] |

Die Faktoren für unser MVP sind eigene Erwartungswerte [A]. Laut einer Drittquelle weichen die Anbieter **untereinander**
um 20–50 % beim absoluten Umsatz ab [Q7]. Ihre Rangfolgen und Trends sind verlässlicher als ihre absoluten Werte.

### 8.2 Wie Anbieter Unsicherheit kommunizieren (und was wir übernehmen)

| Anbieter | Praxis |
|---|---|
| Appfigures | eine MAPE-Zahl, Schwellen (keine Schätzung unterhalb), nur Länder mit genügend niedriger Fehlerrate, jährliche Neukalibrierung mit Statusmeldung [Q2][Q3] |
| AppTweak | 0 außerhalb der Chart-Tiefe; Werte können bis 7 Tage nachträglich revidiert werden; das Feld `precision` ist seit 2023 abgeschafft [Q9] |
| Sensor Tower | keine Fehlerzahlen; Hinweis, Schätzungen eher relativ zu nutzen [Q6] |
| AppKittie | „Est.“-Präfix, auf 2 signifikante Stellen gerundet, keine Fehlerangaben [B] |

**Für uns** [A]:

- Präfix „Est.“ und Rundung;
- **Konfidenz-Badge** (hoch, mittel, niedrig) mit Tooltip, der die verwendeten Signale nennt (z. B. „Grossing-Rang in
  12 Ländern + Ratings-Velocity“);
- im Detail eine **P10–P90-Spanne**;
- unter der Schwelle „< 1K“ statt einer Zahl;
- Länder ohne Schätzung ausblenden;
- eine Methodik-Seite mit dem gemessenen Backtest-Fehler.

### 8.3 Wie wir unsere Modelle testen

**Metriken (immer pro Segment ausweisen):**

```
MdAPE      = median(|ŷ − y| / y)
MdLQ       = median(|ln(ŷ / y)|)          → „typischer Faktor“ = exp(MdLQ)
Hit@×2     = Anteil mit 0,5 ≤ ŷ/y ≤ 2      (dazu Hit@×1,5)
Bias       = median(ln(ŷ / y))            pro Land, Kategorie und Größenklasse (systematische Über- oder Unterschätzung?)
Coverage   = Anteil von y in [P10, P90]    → Soll ≈ 80 %
Spearman ρ = Rangkorrelation innerhalb einer Kategorie (für „wer ist größer?“-Anwendungen)
```

**Protokoll** [A]:

1. **Ground-Truth-Register** mit Herkunft (Quelle, URL, Datum, Metrik brutto oder netto, Zeitraum, Land oder weltweit,
   Zeitzone).
2. **GroupKFold nach App bzw. Entwickler**, kein zufälliger Split über die Tage einer App.
3. **Rolling-Origin-Backtest:** mit Daten bis Monat m trainieren, Monat m+1 vorhersagen, monatlich wiederholen. Das
   misst die Drift.
4. **Leave-one-country-out:** Wie gut übertragen sich Parameter auf Länder ohne Ground Truth?
5. **Android als Testfeld:** `realInstalls`-Deltas sind die tägliche Ground Truth für tausende Apps, ideal für schnelles
   Iterieren am Rang-Modell.
6. Ein **Backtest-Bericht pro Modellversion**, der in Git versioniert wird. Neue Versionen gehen nur live, wenn sich
   MdLQ und Coverage nicht verschlechtern.
7. **Monitoring:** Die tägliche Summe aller Schätzungen pro Land soll keine Sprünge zeigen. Neue Ground-Truth-Punkte
   laufen automatisch gegen die Live-Schätzung.

---

## 9. Ergebnis: Modell-Design für unser MVP

### 9.1 Ab Tag 1 starten: Sammler (Zeitreihen lassen sich nicht nachholen!)

| Sammler | Inhalt | Frequenz | Größenordnung Requests/Tag [A] |
|---|---|---|---|
| iOS-Charts | Top Free, Paid und Grossing × (Gesamt + ca. 25 Genres + Spiele-Subgenres) × Länder (Start: Top 30–60, später 175) | **2–4× täglich**, Tagesmedian | 60 Länder × ca. 80 Feeds × 3 ≈ 15.000 (RSS: 100 tief [B]; Quelle für mehr Tiefe noch offen) |
| Android-Charts | Top Free, Paid und Grossing × Kategorien × Länder (bis 200 tief [Q9]) | 2–4× täglich | ähnlich |
| Android-Details | `realInstalls`, Bucket, Ratings, Histogramm, IAP-Spanne, Version | **täglich** für alle Apps, die je in einem Chart standen, plus Watchlist; wöchentlich für den Rest | 100k–1 Mio. |
| iOS-Lookup | `userRatingCount` und `averageUserRating` **pro Storefront** | täglich für Chart-Apps und Watchlist in den Top-Ländern, wöchentlich für den Rest | Batch-Lookup mit mehreren IDs [B]; Rate-Limit ca. 20/min pro IP [Q13], also IP-Pool oder EPF nötig |
| iOS-Webseite | IAP-Liste mit Preisen [B], Beschreibung, Version | wöchentlich oder bei Versionswechsel | |
| Reviews | iOS-RSS (500 pro Land) [B], Play-Reviews inkrementell (nur neue seit dem letzten Lauf) | täglich für Watchlist und Chart-Apps | |
| Ads | Meta Ad Library API (EU/UK), TikTok CCL API (EEA) pro Werbetreibendem bzw. pro App | täglich | abhängig von den API-Limits |
| ASO | Apple Ads Platform API (alle Genres × Länder, wöchentlich und monatlich); Search Hints und Play Suggest für die Keyword-Liste; Positionen für die Watchlist | Popularität wöchentlich, Positionen täglich | |

### 9.2 Modellversionen und „ab wann brauchbar“

| Zeitpunkt | Was geht | Qualität [A] |
|---|---|---|
| **Woche 1** | relative Rang-Schätzungen mit Literatur-Priors (β 0,5–1,0, Skala aus den Sensor-Tower-Ankern 2022 [Q16]); Preise; Sentiment-Grundwert | nur relative Aussagen („größer als“), als „früh“ gekennzeichnet |
| **Woche 2–4** | Android-α/β aus `realInstalls`-Deltas; Ratings-Velocity (ab 2 Snapshots, stabil ab ca. 14 Tagen); erste Ground-Truth-Sammlung (50–200 Apps: TrustMRR, Gründer, SEC) | Android-Downloads brauchbar; iOS Faktor 2–3 |
| **Monat 2–3** | iOS-Kalibrierung, Umsatzwege A, B und C kombiniert, P10–P90-Intervalle, erster Backtest-Bericht, GBM für Android | Top-Apps Faktor 1,5; Kategorie-Charts Faktor 2 |
| **Monat 4–6** | Trend-Erkennung robust (genug Historie für Basislinien), Ad-Spend mit erster CPM-Kalibrierung, eigenes Popularitätsmodell kalibriert | |
| **Monat 12** | echtes „MRR growth 12 months“ statt Proxy, Jahressaisonalität im Modell | |
| **laufend** | „Connect your app“-Programm, jährliche bzw. quartalsweise Neukalibrierung | Richtung Anbieterqualität, sobald es Hunderte bis Tausende verbundene Apps gibt |

### 9.3 Täglicher Schätz-Job (Pseudocode)

```python
def daily_estimates(day):
    for app in active_apps(day):                       # in Charts, Watchlist oder mit neuen Signalen
        for c in countries_with_signal(app, day):
            sig = collect_signals(app, c, day)         # Ränge (Tagesmedian), ΔRatings_7d, ΔrealInstalls, Preise, Ads …
            d = combine([rank_model(sig), ratings_model(sig), android_installs_model(sig), longtail_prior(app, c)])
            r = combine([grossing_model(sig),
                         bottom_up_model(d, prices(app, c), paywall_type(app), priors(c, app.category)),
                         rpd_model(d, app.category, c)])
            store(app, c, day, downloads=d.quantiles(), revenue_gross=r.quantiles(),
                  revenue_net=to_net(r, store_fee(app, c, day)), confidence=grade(d, r), signals=sig.names())
        roll_up_monthly(app, day)                      # Est. Monthly Downloads/Revenue (30 Tage), MRR, Wachstum 12M (oder Proxy)
    compute_trending(day); compute_ad_spend(day); refresh_keyword_scores(day)
    run_ground_truth_checks(day)                       # neue Ground-Truth-Punkte gegen Live-Schätzung → Monitoring
```

### 9.4 Minimales Datenmodell (Zeitreihen)

```
chart_snapshot(ts, store, country, device, chart_type, category, rank, app_id)                 -- Partition nach Tag
app_metric_daily(day, app_id, country, rating_count, rating_avg, min_installs, real_installs,
                 histogram_json, price, iap_min, iap_max, version)
review(app_id, country, review_id, ts, rating, lang, text_hash, sentiment, aspects_json)
ad(ad_id, platform, app_id, page_or_advertiser, start, stop, first_seen, last_seen, creative_hash)
ad_reach(ad_id, snapshot_day, country, reach, age_gender_json)
keyword_popularity(period, country, genre, term, pop_1_100, pop_in_genre, rank_in_genre, source)
keyword_rank(day, store, country, device, term, position, app_id)
estimate_daily(day, app_id, country, dl_p10, dl_p50, dl_p90, rev_gross_p50, rev_net_p50, …, confidence, model_version)
ground_truth(app_id, country|WW, period_start, period_end, metric, value, gross_net, source_url, captured_at)
```

---

### 9.5 Erste Kalibrierung (26.10.2026)

Umsetzung: `crawler/appcrawl/calibrate.py`, Vergleichswerte in `crawler/appcrawl/data/ground_truth.csv`.

- **Anker:** sechs Apps mit berichtetem Umsatz Q2 2026 (Geschäftsberichte, je mit Quelle): Tinder, Hinge, Bumble,
  Duolingo, Grindr, Life360. Umgerechnet auf den US App Store über Spannen für US-Anteil, iOS-Anteil und Anteil über
  Apples In-App-Kauf **[A]**; die berichteten Umsätze selbst sind **[Q]**.
- **Ergebnis:** Die angenommene Grossing-Kurve lag um **Faktor 3,84 zu niedrig**; neue Skala 9,6 Mio. $/Tag an Platz 1
  (β = 0,75 fest). Reststreuung der Anker 0,45 (natürlicher Log, etwa Faktor 1,6).
- **Hinweis auf die Steigung:** Nach der Eichung liegen die besser platzierten Anker über, die schlechter platzierten
  unter ihrem Wert (Life360 Platz 20: 30 statt 14–24 Mio. $; Bumble Platz 75: 11 statt 15–30 Mio. $). Die Kurve ist
  vermutlich flacher als β = 0,75. Sechs Punkte reichen nicht, um das von Rauschen zu trennen; β bleibt fest.
- **Grenze:** Kein Anker oberhalb von Platz 20. Werte für Platz 1–19 sind Hochrechnung (z. B. ChatGPT Median
  ~290 Mio. $/Monat, P10–P90 91–912 Mio. $) und laufen mit Konfidenz „niedrig“.
- **Nachtrag 26.10.2026, 8 Anker:** Roblox (US- und Kanada-Buchungen 843 Mio. $/Quartal laut Supplement, Folie 13)
  und Snapchat (Other Revenue 316 Mio. $/Quartal) ergänzen Platz 5 und 10. Skala jetzt **Faktor 3,75** (9,4 Mio. $/Tag
  an Platz 1), Reststreuung 0,55. Die neuen Spitzen-Anker widersprechen sich (Snapchat überschätzt, Roblox
  unterschätzt) und geben keinen Hinweis auf die Krümmung; hochgerechnet ist nur noch Platz 1–4.
- **Nächste Anker:** mehr Apps zwischen Platz 1 und 20 und unterhalb von Platz 75 (weitere Geschäftsberichte;
  TrustMRR für kleine Apps, sobald Zugang und Nutzungsbedingungen geklärt sind). Ab etwa 15 Ankern β mitschätzen.

## 10. Roadmap zur Verbesserung

1. **v0 (MVP):** parametrische Kurven, Präzisionsgewichtung, Literatur- und Benchmark-Priors, Android-`realInstalls`.
   Konfidenz-Badges, Spannen.
2. **v1:** Ground-Truth-Register mit mindestens 500 App-Monaten; hierarchisches Bayes-Modell pro Land × Kategorie;
   Top-down-Abgleich (Marktsummen, RevenueCat-Quantile); Review-Backfill für das 12-Monats-Wachstum.
3. **v2:** GBM mit Quantil-Zielen und Conformal-Intervallen; Features aus Ads und viralen Videos (wichtig für
   organisch getriebene Apps, die Rang-Modelle unterschätzen); eigene Paywall- und Onboarding-Merkmale aus der
   Onboarding-Library.
4. **v3:** „Connect your app“ (App Store Connect API, Play Console, RevenueCat-Integration) als **Panel**. Ab einigen
   Hundert verbundenen Apps pro großem Land sind Modelle pro Land und Kategorie möglich.
5. **v4:** CPM- und Frequenz-Kalibrierung mit echten Kampagnendaten von Partnern; Keyword→Download-Modell über
   Apple-Ads-Impression-Share der verbundenen Apps.
6. **Laufend:** Neukalibrierung pro Quartal, Drift-Monitoring, öffentliche Methodik-Seite mit Backtest-Zahlen.

---

## 11. Offene Fragen

- **Chart-Tiefe iOS:** Öffentliche RSS-Feeds liefern nur 100 Einträge [B]. Wie kommen wir sauber an die Ränge 101–500?
  Gehört ins Datenquellen-Dokument, inklusive Rechtslage.
- **`realInstalls`:** Wie oft aktualisiert Google den Wert, was genau zählt er (Geräte, Re-Installs), und wie lange
  bleibt er verfügbar?
- **iOS-Verhältnis Ratings pro Download:** Ohne iOS-Ground-Truth unbekannt. Erste 50–100 Apps mit bekannten Zahlen
  sammeln.
- **Apple Ads Platform API:**
  - Dürfen Popularitätswerte kommerziell an Dritte weitergegeben werden?
  - Funktioniert die Phrasen-Route `SEARCH` für App-Keywords?
  - Wie groß ist die Abdeckung (Top 500 pro Genre und Land?), und welche Rate-Limits gelten?
- **Meta/TikTok-APIs:** Wie lauten die Nutzungsbedingungen für die kommerzielle Weiterverwendung in einem SaaS? Bekommt
  ein kommerzielles Produkt überhaupt TikTok-Zugang?
- **Frequenz und CPM** für die Ad-Spend-Schätzung: Woher bekommen wir belastbare Kalibrierdaten?
- **AppKittie:** Brutto oder netto? Welche Quellen stecken hinter „multiple datasets“? Ist „Ad spend by country“ für
  Länder außerhalb der EU modelliert? Öffentlich nicht feststellbar.
- **Wayback Machine** als Quelle für historische Rating-Zahlen und Buckets: aus diesem Container nicht erreichbar [B],
  später prüfen.
- **TrustMRR-API:** Nutzungsbedingungen für den Einsatz als Kalibrierungsdaten?

## 12. Empfehlungen für unseren Nachbau

1. **Sammler sofort starten**, bevor das UI fertig ist: Charts (mehrmals täglich), Play-`realInstalls`, iOS-Ratings pro
   Storefront, Reviews, Ads, Keyword-Popularität. Jeder Tag ohne Sammeln ist Historie, die später fehlt.
2. **Android zuerst kalibrieren:** `realInstalls`-Deltas sind kostenlose Ground Truth. Das Rang-Modell dort fertig
   entwickeln und dann auf iOS übertragen.
3. **Ground-Truth-Register von Anfang an** pflegen, mit Herkunft und Brutto/Netto-Kennzeichnung. Quellen: TrustMRR,
   Gründer-Posts, SEC-Filings, eigene Apps. Später ein „Connect your app“-Programm als echter Burggraben.
4. **Unsicherheit ehrlich zeigen:** Est.-Präfix, Rundung, Konfidenz-Badge, Spannen, Schwellen. Modellierte Länder
   außerhalb der EU beim Ad-Spend ausdrücklich als „modelliert“ markieren.
5. **Umsatz über drei Wege schätzen** (Grossing-Rang, Bottom-up mit beobachteten IAP-Preisen und Paywall-Typ, RPD) und
   nach Präzision kombinieren. Die Onboarding-Library als Datenquelle für Paywall-Typ, Trial und Preise nutzen.
6. **Keyword-Popularität:** Apple Ads Platform API intern zur Kalibrierung nutzen. Kunden nach rechtlicher Prüfung
   eigene, kalibrierte Werte zeigen. Search Hints und Play Suggest dienen als Merkmale und für die Keyword-Entdeckung.
7. **Sentiment mit Claude Haiku 5.5 über die Batch API** umsetzen, mit Aspekten (ca. 12 USD pro Mio. Reviews), dazu der
   kostenlose Grundwert aus den Rating-Deltas.
8. **Vor jedem Modell-Release backtesten** (MdLQ, Hit@×2, Coverage, Bias pro Segment) und die Ergebnisse versionieren.
9. **Rechtliches** separat klären lassen: Store-Nutzungsbedingungen beim Scraping, Meta-Ad-Library- und TikTok-CCL-API-
   Bedingungen, Weitergabe von Apple-Ads-Daten, AGPL bei RespectASO-Ideen (keinen Code übernehmen).

---

## 13. Quellen

**Eigene Beobachtungen [B]** (alle am 2026-10-25, wenige einzelne Requests):

- Play-Detailseite Duolingo (`curl …details?id=com.duolingo&hl=en_US&gl=US`) → Install-Array mit genauer Zahl.
- `google-play-scraper` (PyPI), Stichprobe von 96 Apps → Verhältnis Ratings/Installs.
- iTunes Lookup (`/lookup?id=570060128,1438388363&country=de|gb|jp|br`) → Ratings pro Storefront.
- iOS-Review-RSS, Seiten 1/10/11 → Maximum 500 Reviews.
- Apple-RSS-Charts (Legacy und marketingtools v2) → Maximum 100 Einträge.
- `apps.apple.com` (App-Seite mit IAP-Liste, Charts, Websuche).
- `MZSearchHints.woa` (plist ohne `priority`); `market.android.com/suggest` (404); `web.archive.org` (Connection reset).
- Apple-Developer-Doku als JSON: `https://developer.apple.com/tutorials/data/documentation/apple-ads-platform-api/{query-app-search-term-popularity-data,insights-endpoints,query-keyword-suggestions,query-phrase-suggestions}.json`.
- AppKittie-Startseite (FAQ, Demo-Karten), aus dem Recon-Mitschnitt des Koordinators (`scratchpad/recon/home.json`) bzw. https://www.appkittie.com.

**Externe Quellen [Q]:**

- [Q1] Appfigures – How Appfigures Estimates Downloads and Revenue: https://help.appfigures.com/en/article/how-appfigures-estimates-downloads-and-revenue-for-ios-and-android-apps-na7a2h/
- [Q2] Appfigures – How to compare your downloads and revenue with estimates: https://help.appfigures.com/en/article/how-to-compare-your-downloads-and-revenue-with-estimates-in-competitor-intelligence-ey4pid/
- [Q3] Appfigures – Estimates Recalibration for 2022: https://status.appfigures.com/incidents/k3qy1j78v6x2
- [Q4] eMarketer-Chartnotizen mit Sensor-Tower-Daten (Definitionen): https://www.emarketer.com/chart/248655/app-store-revenues-downloads-mobile-games-total-mobile-apps-worldwide-by-os-h1-2020-h1-2021-billions · Statista-Methodiknotiz: https://www.statista.com/statistics/271644/worldwide-mobile-app-revenue/
- [Q5] Sonar – App Revenue Estimates: How They Work (and Fail) (Wettbewerber-Blog): https://trysonar.app/blog/app-revenue-estimates-how-they-work-and-fail
- [Q6] Sensor Tower – How to get estimated downloads and revenue for apps (2015): https://sensortower.com/blog/how-to-get-estimated-downloads-and-revenue-for-apps
- [Q7] PocketGamer.biz – Getting to grips with App Annie's stats: https://www.pocketgamer.biz/feature/47064/stateside-getting-to-grips-with-app-annies-app-store-stats/ · MWM-Glossar (20–50 % Abweichung zwischen Anbietern): https://mwm.ai/contact/glossary/revenue-estimation · eMarketer (App Annie, Panel, brutto): https://www.emarketer.com/chart/253475/us-mobile-finance-app-downloads-2018-2021-millions
- [Q8] AppTweak – App download & revenue estimates: https://www.apptweak.com/en/aso-blog/app-download-revenue-estimates
- [Q9] AppTweak API – App Metrics: https://developers.apptweak.com/reference/app-metrics
- [Q10] AppMagic (keine Methodik gefunden), Überblick: https://us.fitgap.com/products/009979/appmagic
- [Q11] Mobile Action – Download-/Umsatzberechnung (laut Suchergebnis, Seite leitet inzwischen um): https://help.mobileaction.co/en/articles/4273155-how-do-you-calculate-download-and-revenue-estimates-and-can-i-trust-them
- [Q12] google-play-scraper (Node): https://github.com/facundoolano/google-play-scraper · (Python): https://github.com/JoMingyu/google-play-scraper
- [Q13] Apple – iTunes Search API: https://performance-partners.apple.com/search-api
- [Q14] Garg & Telang (2013), Inferring App Demand from Publicly Available Data, MIS Quarterly 37(4): https://aisel.aisnet.org/misq/vol37/iss4/14 (Volltext bei CMU KiltHub: 403 aus dem Container)
- [Q15] Lehrbuch-Zusammenfassung „Sales from Rank“: https://bookdown.org/mike/marketing_research/sales-from-rank.html
- [Q16] Sensor Tower – Downloads to reach No. 1 (2022): https://sensortower.com/blog/app-downloads-to-number-one-2022
- [Q17] Evaluating Pricing Strategy Using e-Commerce Data (log Q ~ log rank, β≈−0,83): https://arxiv.org/pdf/math/0609170 · Konventionen Pareto vs. Zipf: https://laweconcenter.org/wp-content/uploads/2023/09/SSRN-id3543827.pdf
- [Q18] The Shape of the App Store (2015): https://dazeend.org/2015/01/the-shape-of-the-app-store/
- [Q19] Apple – Ratings, reviews, and responses: https://developer.apple.com/app-store/ratings-and-reviews/
- [Q20] TrustMRR FAQ: https://trustmrr.com/faq
- [Q21] RevenueCat State of Subscription Apps 2026 (Zusammenfassung SaaStr): https://saastr.com/the-top-10-learnings-from-revenuecats-state-of-subscription-apps-how-115000-mobile-apps-deliver-16b-in-revenue-whats-working-whats-quietly-killing-growth · Report-Seite: https://revenuecat.com/state-of-subscription-apps-2025
- [Q22] Adapty State of In-App Subscriptions 2026: https://adapty.io/state-of-in-app-subscriptions/
- [Q23] PPC Land – 95 % des Abo-Umsatzes bei den obersten 10 %: https://ppc.land/95-of-app-subscription-revenue-goes-to-top-10-adaptys-2026-benchmark-report/
- [Q24] Apple-Gebühren: RevenueCat – App Store fees: https://www.revenuecat.com/blog/engineering/app-store-fees · iClarified (EU, Aug. 2026): https://www.iclarified.com/101814/apple-revises-eu-app-store-terms-replaces-core-technology-fee-with-5-commission
- [Q25] Google Play – Service fees: https://support.google.com/googleplay/android-developer/answer/112622?hl=en · Adapty-Analyse: https://adapty.io/blog/google-play-billing-changes-subscriptions-fees
- [Q26] Meta Graph API – ArchivedAd (Feldreferenz): https://developers.facebook.com/docs/graph-api/reference/archived-ad/
- [Q27] adlibrary.com – EU DSA Ad Repositories: What Developers Can Actually Pull: https://adlibrary.com/posts/eu-dsa-ad-repositories-developers
- [Q28] metapi.io – Facebook Ad Library API (Umfang außerhalb der EU): https://metapi.io/compare/facebook-ad-library-api
- [Q29] Admapix – Competitor Ad Spend 2026 (Methode Reichweite × CPM, Anbieterbehauptungen): https://www.admapix.com/blog/ad-intelligence/competitor-ad-spend
- [Q30] TikTok – Commercial Content API, Query Ads: https://developers.tiktok.com/doc/commercial-content-api-query-ads
- [Q31] TikTok – Get Ad Details: https://developers.tiktok.com/doc/commercial-content-api-get-ad-details · Getting started / EEA-Umfang: https://developers.tiktok.com/doc/commercial-content-api-getting-started
- [Q32] CPM-Benchmarks Meta: Stackmatix 2026: https://stackmatix.com/blog/platform-ad-cost-benchmarks-country-industry-2026 · Lebesgue: https://lebesgue.io/?p=305 · AdManage: https://admanage.ai/blog/facebook-cpm-benchmarks-by-industry
- [Q33] CPM-Benchmarks TikTok: Influee: https://influee.co/blog/tiktok-cpm · Lebesgue: https://lebesgue.io/tiktok-ads/tiktok-ads-benchmarks
- [Q34] Sensor Tower Pathmatics, Methodiktext in Reports (Sampling, Impressionen × CPM): https://investgame.net/wp-content/uploads/2025/11/2025_State_Of_Digital_Advertising_India.pdf
- [Q35] Adapty – Apple released the Apple Ads Platform API: https://adapty.io/blog/apple-ads-platform-api/
- [Q36] Sonar – Apple Ads Platform API Guide: https://trysonar.app/blog/apple-ads-platform-api-guide · Appeeky-Doku: https://docs.appeeky.com/docs/apple-search-ads-insights
- [Q37] Koddit – Apple Ads Platform API (Top-500-Grenze): https://blog.koddit.com/en/ios/apple-ads-platform-api-nedir-mobil-uygulamaniz-daha-cok-indirilsin/
- [Q38] RespectASO (Open Source, AGPL-3.0), `aso/scoring.py`, `aso/strength.py`, `aso/services.py`: https://github.com/respectlytics/respectaso
- [Q39] RespectASO – Apple Search Ads Popularity: Why It's Unreliable: https://respectaso.com/blog/apple-search-ads-popularity-unreliable-aso-keyword-data/
- [Q40] Drittanbieter-Beschreibung des Hints-Endpunkts: https://glama.ai/mcp/servers/MiguelAlvRed/mobile-store-scraper-mcp/tools/suggest · https://www.socialcrawl.dev/platforms/app_store/search-suggestions
- [Q41] AppTweak – Ranking Difficulty: https://www.apptweak.com/en/aso-blog/ranking-difficulty-chance-score-now-on-apptweak · Mobile Action – Difficulty: https://helpcenter.mobileaction.co/what-is-difficulty · AppFollow – Keyword Difficulty: https://support.appfollow.io/hc/en-us/articles/360020832017
- [Q42] Anthropic – Pricing (Modelle, Batch −50 %, Caching): https://platform.claude.com/docs/en/about-claude/pricing
- Weitere Hintergrundquellen: Carare (2012), The Impact of Bestseller Rank on Demand, International Economic Review: https://ideas.repec.org/r/wly/iecrev/v53y2012i3p717-742.html · Petsas et al., Rise of the Planet of the Apps (IMC): https://www.syssec-project.eu/m/page-media/3/petsas-appstores-imc.pdf · App Rank Anchors (HF-Datensatz, Kalibrierung über `realInstalls`-Deltas): https://huggingface.co/datasets/Ahad690/app-rank-anchors · Apify App Store Revenue Estimator (Signalhierarchie Bucket → Rang → Ratings-Velocity → Ratings-Gesamtzahl): https://apify.com/seibs.co/app-store-revenue-estimator
