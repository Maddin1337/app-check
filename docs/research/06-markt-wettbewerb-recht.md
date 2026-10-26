# 06 – Markt, Wettbewerb & rechtliche Leitplanken

> **Prefix:** `markt` · **Stand:** 25.10.2026 · **Autor:** Research-Agent (Claude) im Auftrag des Koordinators
> **Gegenstand:** AppKittie als Unternehmen, Terms/Privacy, Wettbewerbslandschaft, rechtliche Leitplanken für einen
> Nachbau unter eigener Marke, Empfehlungen zum Geschäftsmodell.
>
> **Keine Rechtsberatung.** Abschnitt 4 ist eine Übersicht mit Quellen, damit wir die richtigen Fragen stellen. Vor dem
> Launch sollte eine Anwältin bzw. ein Anwalt für IT-, Urheber- und Datenschutzrecht (DE/EU) die markierten Punkte prüfen.

**Legende**

| Kürzel | Bedeutung |
|---|---|
| **[B]** | **beobachtet**: direkt gesehen, mit Quelle/URL/Befehl |
| **[A]** | **abgeleitet/vermutet**: Schlussfolgerung aus Indizien, nicht belegt |
| **[D]** | Angabe eines **Drittanbieters** (Directory, Analytics-Schätzung, Vendor-Blog): ungeprüft, mit Vorsicht lesen |

---

## 0. Kurzfassung (TL;DR)

1. **AppKittie ist ein sehr junges Indie-Produkt.** Domain registriert am 25.11.2025 [B], Waitlist im Dezember 2025, Launch für Anfang
   Januar 2026 angekündigt [B, X-Posts]. Öffentliche Listings folgen ab März 2026. Betreiber laut Terms ist die **Algo Media LLC** (Wyoming, Adresse vermutlich ein
   Registered-Agent- bzw. Mailbox-Service [A]). Als Gründer tritt öffentlich **Jacob Rodri** (@jacobrodri_, laut Drittprofil ca. 41K Follower auf X) auf [B/D].
   Das öffentliche MCP-Repo pflegt ein einzelner Entwickler, der laut seinem GitHub-Profil auch mit dem Creator-Tool
   **TopYappers** verbunden ist [B]. AppKittie bezieht seine Creator-Daten ausdrücklich von „TopYappers creator profiles“ [B, MCP-Code].
2. **Die Traktion ist moderat, das Marketing aber sehr effektiv.** Similarweb schätzt rund 70K Besuche in 3 Monaten (Sept. 2026) [D],
   davon **US 29 %, DE 19 %, IN 16 %, FR 10 %** [D]. Die Wachstumshebel sind gründergeführte X-Threads („filter apps making over $50k/mo …“),
   ein **Affiliate-Programm mit 30 % wiederkehrender Provision** [B], eine Flut von Directory-Listings, eine eigene Review-Domain
   (`appkittie-reviews.com`, registriert am 07.08.2026) [B] sowie MCP/Agent-Skills als KI-Kanal [B]. „Von ChatGPT empfohlen“
   ist ein Testimonial auf der Homepage [B] und das erklärte Ziel ihres AI-SEO.
3. **Zur Methodik veröffentlicht AppKittie fast nichts.** Die FAQ sagt nur „multiple datasets … rankings, performance, and monetization
   signals … our models“ [B], die Terms „publicly available sources and proprietary models“ [B]. Aus dem öffentlichen MCP-Code ist
   ablesbar: Meta-Ads-Daten stammen aus der **Meta-Ad-Library-Transparenz** (EU-Reach, `transparency_by_location`), TikTok-Ads als
   Zähler, Google Ads „legacy, no inventory“, dazu **Kontaktdaten** wie `emails`, `decision_makers` und `hiring` [B].
4. **Der Wettbewerb konsolidiert sich oben und zersplittert unten.** Sensor Tower hat 2024 data.ai und **am 12.05.2026 AppMagic**
   übernommen [B, Pressemitteilung]. MagicBrief wurde am **31.07.2026 eingestellt** [D]. Unten entstehen viele Indie-Tools
   (GetAppNiche, TrendApps, Appdex, Peekly, Appark, AppBird u. a.) zu Preisen von 9 bis 399 USD im Monat. Die Lücke für uns liegt bei
   **transparenten, kalibrierten Schätzungen, Monitoring und Alerts statt bloßem Stöbern, EU/DACH-Compliance und Lokalisierung,
   fairer Abrechnung und einem agent-first-Kanal**.
5. **Recht, die großen Leitplanken:** (a) eigener, nicht verwechselbarer Name. AppKittie hat **keine USPTO-Anmeldung** [B], in DE
   greift aber ggf. Werktitel- bzw. Unternehmenskennzeichenschutz ohne Registrierung. (b) Funktionsumfang nachbauen ist erlaubt,
   **UI, Texte und Grafiken nicht 1:1 kopieren**. Seit dem 01.05.2025 schützt das nicht eingetragene EU-Design ausdrücklich auch GUIs
   (3 Jahre, gegen Nachahmung). (c) **AppKittie-Daten tabu.** Das ist Spielregel und Vertragsverstoß zugleich. Das EU-sui-generis-Recht
   schützt eine US-LLC zwar vermutlich nicht, Terms, US-Recht und UWG gelten aber trotzdem. (d) Store-Daten: offizielle Feeds, APIs und
   Sitemaps bevorzugen, robots.txt respektieren, keine „Spiegel-Datenbank“ der Stores veröffentlichen. (e) **DSGVO**: keine
   Kontakt- oder „Decision-Maker“-Daten scrapen (CNIL vs. KASPR, 240.000 €), Reviews und Creator minimieren, Art.-14-Informationen
   bereitstellen. (f) Ad-Creatives und Videos lieber **einbetten bzw. verlinken als rehosten**, dazu ein Takedown-Prozess.

---

## 1. AppKittie als Unternehmen

### 1.1 Steckbrief

| Merkmal | Befund | Status / Quelle |
|---|---|---|
| Produkt | „App market intelligence for iOS and Android … revenue, downloads, winning ads, viral videos, ASO keywords and onboardings. Updated daily.“ | [B] Meta-Description der Homepage (`scratchpad/tech/home.html`) |
| Rechtsträger | **Algo Media LLC**, „a limited liability company“, 5830 E 2nd St, Ste 7000 #21260, Casper, Wyoming 82609, US | [B] https://www.appkittie.com/terms, /privacy |
| Charakter der Adresse | Suite plus „#21260“ deutet auf einen Registered-Agent- oder virtuellen Postfach-Service hin. Wyoming-LLCs sind bei Nicht-US-Gründern verbreitet (Stripe/US-Banking). | [A] |
| Registerauszug Wyoming SOS | nicht geprüft (interaktive Suche) | offen |
| Domain | `appkittie.com` registriert am **25.11.2025** (Porkbun), Nameserver `jade/tom.ns.cloudflare.com` | [B] RDAP: `curl https://rdap.verisign.com/com/v1/domain/appkittie.com` |
| Schwester-Domains | `topyappers.com` (registriert 22.10.2024) und `appkittie-reviews.com` (registriert 07.08.2026): gleicher Registrar und **gleiches Cloudflare-NS-Paar** | [B] RDAP; [A] gemeinsame Infrastruktur wahrscheinlich. NS-Paare werden pro Cloudflare-Account vergeben, sind aber nicht exklusiv, also nur ein Indiz. |
| Marke | **Keine** USPTO-Anmeldung für „appkittie“/„app kittie“ (Stand 25.10.2026). EUIPO/TMview nicht prüfbar (Request fehlgeschlagen). | [B] USPTO-tmsearch-API, 0 Treffer |
| Zielgruppe (Selbstbild) | „indie app developers, mobile marketers, growth teams, and app founders who want to validate ideas, reverse-engineer what's working …“ | [B] FAQ-JSON-LD der Homepage |
| Claim | „Trusted by 3,000+ app founders & growth teams“, „JOIN 3,000+ USERS“ | [B] Homepage |
| Preis | ein Plan, 79 USD/Monat bzw. 49 USD/Monat bei Jahreszahlung (Briefing). Die Affiliate-Seite rechnet mit „$79/mo“. | [B] https://www.appkittie.com/affiliate |
| Frühere Preise | Directories nennen „$49/mo or $169/yr“ und einen „3-day free trial“. Eine Reddit-Überschrift vom Juli 2026 nennt eine Abbuchung von „$97“. | [D] creatorstoolbox.com, whatlaunched.today |
| Refund | 14 Tage Geld-zurück für Erstabos | [B] Terms |

### 1.2 Wer steckt dahinter?

| Person/Entität | Rolle (öffentlich) | Belege |
|---|---|---|
| **Jacob Rodri** (X: @jacobrodri_) | Öffentliches Gesicht und Gründer. X-Bio laut Drittprofil: „founder appkittie.com – find winning apps, replicate what's working“. X-Account seit Sept. 2024, laut Drittprofil ca. 41K Follower. Als „solo founder“ und Maker gelistet. Listet zusätzlich ein Produkt „Viralboost“ (viralboost.now, Domain war bei der Prüfung nicht auflösbar). | [D] https://arrfounder.com/@jacobrodri_ · [D] https://shipyardhq.dev/products/appkittie · [D] https://bowora.com/appkittie.com · [B] X-Post-Snippets (s. Zeitleiste) |
| Maintainer des MCP-Repos | **Einziger menschlicher Committer** im offiziellen Repo `AppKittie/aso-mcp-skills` (72 Commits, 27.03. bis 14.10.2026). Das GitHub-Profil nennt TopYappers. Öffentlich mit Schwerpunkt Web-Datenextraktion. Weitere persönliche Angaben bewusst nicht aufgenommen, da für unseren Nachbau irrelevant. | [B] `git log` des geklonten Repos |
| **TopYappers** (topyappers.com) | Influencer-Datenbank („44M+ creators, 150+ countries“, MCP und API). Terms: „Aggregation of publicly available creator profiles, metrics, and content across platforms“. **Datenquelle für AppKittie-Creator** (`list_creators`: „Fetch TopYappers creator profiles“, Feld `topyappers_creators`). | [B] https://www.topyappers.com/ · /terms-of-service · [B] `src/appkittie_mcp/tools/list_creators.py` |
| Herkunft | Rechtsträger USA (Wyoming) | [B] Terms |

> **Einordnung [A]:** Das Team kombiniert einen reichweitenstarken Growth- bzw. X-Gründer mit Web-Datenextraktions-Know-how und einem
> zweiten Datenprodukt im Umfeld (TopYappers). Das erklärt, wie in rund 10 Monaten ein so breiter Datenumfang entstanden ist:
> Scraping- und Proxy-Know-how sowie Daten-Reuse zwischen den Produkten. Für uns heißt das: Die Daten-Pipeline ist der eigentliche
> Burggraben, nicht die UI.

### 1.3 Zeitleiste (beobachtet)

| Datum | Ereignis | Quelle |
|---|---|---|
| 22.10.2024 | `topyappers.com` registriert | [B] RDAP |
| 25.11.2025 | `appkittie.com` registriert | [B] RDAP |
| 25. bis 28.12.2025 | Jacob Rodri: „we haven't launched appkittie yet … early access“ und „about to launch appkittie, a platform where you can see revenue of each app, downloads, their winning ads …, updated daily“ | [B] X-Post-IDs 2004570171822964866, 2005377017794162946 (Datum aus Snowflake-ID dekodiert) |
| 01.01.2026 | „launching appkittie next week (there's a gift for everyone on the waitlist)“ | [B] X 2006799769008853343 |
| 15. bis 18.03.2026 | Rodri-Thread „find app ideas that already work: 1. go to appkittie 2. filter apps making over $50,000/mo 3. sort by rating (low to high) …“. Fast wortgleicher Post eines anderen Accounts (@Hartdrawss) am 18.03. | [B] X 2033209442754506848, 2034035489649660389, 2034200657775775914 · [A] koordinierte bzw. Affiliate-Promotion wahrscheinlich |
| 17.03.2026 | Listing auf ShipyardHQ („from EUR 49“) | [D] |
| 20.03.2026 | What Launched Today: Platz 4 von 15 | [D] |
| 27.03.2026 | Erster Commit des MCP-/Skills-Repos (Cloudflare Worker `aso-mcp-skills`) | [B] git log |
| 09.04.2026 | PeerPush-Listing (5 Upvotes; „223 AI crawler reads“ in 30 Tagen) | [D] https://peerpush.com/p/appkittie |
| 28.04.2026 | Rodri: „the fastest way to see your competitors' ad spend … copy their creatives – winners copy winners“ | [B] X 2049152634989486563 |
| 16.06.2026 | Trustpilot-1★: Kündigung im 3-Tage-Trial beendete den Zugang sofort | [D] Trustpilot |
| 22.07.2026 | Reddit-Überschrift „Appkittie charged me $97 five minutes after I started a free trial. Watch out“ | [D] via whatlaunched.today (Reddit selbst gesperrt) |
| 07.08.2026 | `appkittie-reviews.com` registriert | [B] RDAP |
| Sept./Okt. 2026 | MCP erweitert um Funnels/Onboarding-Screens (11.09.), Screen-Counts (17.09.), Favoriten (20.09.) und TikTok-Ads (14.10.) | [B] git log |
| 23.10.2026 | Terms und Privacy aktualisiert | [B] „Last updated: October 23, 2026“ |
| 24.10.2026 | X-Post aus dem Team: „Meta Ads sauce for apps just dropped!!!“ | [B] X 2113914055647764926 (Inhalt nur als Snippet) |

### 1.4 Wachstums- und Traffic-Indikatoren

| Indikator | Wert | Status |
|---|---|---|
| Similarweb (Sept. 2026) | **ca. 70,2K Besuche in den letzten 3 Monaten** (ca. 23K/Monat), +4,7 % MoM, Global Rank #310.520 | [D] https://www.similarweb.com/website/appkittie.com/ |
| Länder | US 28,9 %, **DE 18,8 %**, IN 15,7 %, **FR 10,0 %**, PK 6,1 % | [D] ebd. |
| Kanäle (Desktop) | Direct 50,6 %, danach Organic Social (X > Reddit > LinkedIn), dann Organic Search. Nur 5 Referrer, darunter aitoolhub.net und toolfolio.com. | [D] ebd. |
| Engagement | Bounce 40 %, 7,8 Seiten/Besuch, 3:02 min | [D] ebd. |
| RankmyAI (Aug. 2026) | Gesamt #7.334 von 75.795 KI-Tools, Traffic #4.497. „AI market research“ #33/400. | [D] https://www.rankmyai.com/tools/6cd68877-2412-4764-b65d-855fd773bcc6/appkittie. Der Ranking-Verlauf ab Sept. 2025 passt nicht zur Domain-Registrierung im Nov. 2025. |
| Trustpilot | 3,9 von 5 bei **5 Reviews** (4× 5★, 1× 1★), keine Antworten des Unternehmens | [D] https://www.trustpilot.com/review/appkittie.com |
| GitHub MCP-Repo | 7 Stars, 2 Forks, 72 Commits, MIT | [D] GitHub-Seite / [B] Clone |
| Nutzerzahl | „3,000+“ (Eigenangabe, nicht verifizierbar) | [B] Homepage |
| Umsatz | nicht öffentlich, „Stripe data pending“ bei Bowora | [D] |

> **Einordnung [A]:** Rund 23K Besuche im Monat bei einer Zielgruppe mit hoher Kaufbereitschaft (Indie-Founder) und starkem
> Direct-Anteil passen zu einem Produkt, das vor allem über X und Affiliates verkauft wird, kaum über SEO. Auffällig ist der
> **hohe EU-Anteil (DE und FR zusammen ca. 29 %)**: Es gibt Nachfrage in Europa, die ein US-Produkt mit dünner Datenschutzerklärung
> nur halb bedient.

### 1.5 Marketing-Kanäle

| Kanal | Was AppKittie macht | Status |
|---|---|---|
| **Gründer-X/Twitter** | „Playbook“-Threads mit der Formel *filtern, schwache Ratings finden, besser nachbauen*. Hooks wie „winners copy winners“ oder „Take a Top 20 app from one country, adapt it for another“. Jeder Post verlinkt appkittie. | [B] X-Snippets (1.3) |
| **Influencer/Affiliates** | **30 % wiederkehrend, lebenslang, ohne Deckel, 30-Tage-Cookie**, sofortige Freischaltung, Rewardful (`r.wdfl.co`, `data-rewardful="47258e"`). Zielgruppe: App-Dev-Creator, ASO-Berater, Newsletter, Indie Hackers. „Join hundreds of affiliates“. | [B] https://www.appkittie.com/affiliate, Homepage-HTML |
| **Copy-Paste-Posts Dritter** | Fast identische Threads anderer Accounts (z. B. @Hartdrawss am 18.03.2026, @KalyfaMuhd am 27.04.2026) | [B] Snippets · [A] Affiliate oder bezahlt (Kennzeichnung nicht prüfbar) |
| **AI-SEO / „ChatGPT recommended“** | (1) Testimonial „chatgpt recommended appkittie to me a few months ago …“ auf der Homepage. (2) Masse an Directory-Listings (PeerPush, RankmyAI, ShipyardHQ, What Launched Today, EarlyHunt, IndieHunt, TopAIHubs, AcidTools, NeoAds, Toolfolio, AITool Hub, CreatorsToolbox, Bowora …), die LLM-Crawler einsammeln (PeerPush zählt „223 AI crawler reads/30 Tage“). (3) **Eigene Review-Domain** `appkittie-reviews.com` mit 8 handverlesenen 5★-Zitaten. (4) FAQ als `FAQPage`-JSON-LD. | [B] Homepage, RDAP · [D] Directory-Seiten |
| **Agent-Ökosystem** | MCP-Server, „Agent Skills“-Repo (Claude Code, Cursor, Codex, Manus), Listing auf mcpmarket.com, Claude-Connector-Kompatibilität per OAuth-Shim | [B] Repo · [D] https://mcpmarket.com/server/appkittie-app-store-intelligence |
| **Paid** | Google Ads (gtag `AW-18125348783`), Meta Pixel (`_fbp`-Cookie wird **serverseitig beim ersten Request gesetzt**) | [B] Homepage-HTML · [B] `scratchpad/tech/headers-home.txt` (Set-Cookie `_fbp`, `__attrib*`) |
| **Analytics** | Simple Analytics, eigenes Attribution-Cookie `__attrib` (Referrer und Landingpage) | [B] ebd. |
| **Klassisches SEO** | schwach. `/robots.txt`, `/sitemap.xml` und `/llms.txt` liefern die Next.js-404-Seite (`noindex`). | [B] `scratchpad/recon/*robots*`, `*sitemap*`, eigener Abruf `llms.txt` → 404 |
| **Social Proof** | Testimonials mit Umsatz-Badges („Founder of Prayer Lock – $1M ARR“, „Notewave – 500K users“, „LifeReset – 1M+ users“). Zitat: „we replicated the onboarding of an app making $600K/mo and our conversion went up considerably“. | [B] Homepage |

### 1.6 Öffentliche Aussagen zu Datenherkunft und Methodik

| Quelle | Aussage | Status |
|---|---|---|
| FAQ „How do you calculate app revenue?“ | „We estimate app revenue using multiple datasets and continuously monitor apps for changes in rankings, performance, and monetization signals. Our models combine those inputs …“ | [B] Homepage-JSON-LD |
| FAQ „What data and markets …?“ | „Every app on the App Store and Google Play … estimated revenue and downloads, in-app purchases, its live ad creatives and estimated spend by country, the viral videos …, keyword rankings, reviews and its full onboarding flow. Updated daily.“ | [B] |
| Terms, Intellectual Property | „The data displayed on our platform is aggregated from publicly available sources and proprietary models.“ | [B] |
| MCP-README | „data from the AppKittie API (**2M+ apps**)“. Die Homepage nennt laut Briefing „4,500,000+“, die Review-Domain „millions of apps across **50+ countries**“. | [B] Widerspruch in den Mengenangaben |
| MCP-Code: Meta | Filter `hasMetaAdSpend` bzw. `minMetaAdSpend`: „**reported Meta Ads transparency spend**“. Sortierung nach `app_meta_ads_estimated_spend_{7d,30d,90d}_usd` und `…estimated_reach_…`. Ad-Detail mit `transparency_by_location`, `region_stats`. | [B] `constants.py`, `tools/REGISTRY.md` · [A] Quelle sind die EU/DSA-Transparenzangaben der Meta Ad Library (Reach je Land/Region), daraus wird Spend geschätzt. |
| MCP-Code: TikTok/Google | `tiktok_ads_total_count`: „a known ad count, not an active-ad count“. Google: „remains accepted for compatibility but has **no current inventory**“. | [B] `instructions.py` |
| MCP-Code: Creator | „TopYappers creator profiles“ | [B] |
| MCP-Code: Onboarding | Bilder mit **„AppKittie.com watermark“** als „capture-source metadata“, dazu Design-Metadaten (Farben, Typo, „font families are estimates“) | [B] `instructions.py` · [A] eigene Aufzeichnung der Flows, LLM/Vision-Analyse |
| MCP-Code: Historien | Metriken `downloads, revenue, mau, dau, reviews, score, size, price`, Wachstum aktuell nur `growthMetric: reviews` | [B] `constants.py` · [A] Reviews-Wachstum als Hauptsignal für Schätzungen (vgl. Review-to-Install-Ansätze) |
| MCP-Code: Kontakte | App-Detail enthält `decision_makers`, `socials`, `hiring`, `emails`, `websites`, Filter `hasEmails` | [B] `tools/REGISTRY.md` · [A] Lead-Enrichment. In der EU DSGVO-heikel (s. 4.6). |
| Gründer-Posts | Keine Methodik-Aussagen gefunden. Aus dem Team heißt es sinngemäß, es sei „a bit too early to tell their correct download/revenue estimates“ (über eine Fremd-App). | [B] X 2065513332484821334 (Snippet) |

**Nicht gefunden:** Interviews, Indie-Hackers-Posts oder Podcasts mit Methodik-Erklärungen. Product Hunt: kein Listing gefunden.

### 1.7 Nutzerbewertungen und Kritik

| Thema | Befund | Status |
|---|---|---|
| Genauigkeit (positiv) | „its revenue estimates for apps using organic marketing are pretty accurate … Most app tracking tools out there are completely wrong when it comes to apps driven by organic marketing“ (Testimonial, Notewave) | [B] Homepage (selbst kuratiert) |
| Genauigkeit (neutral/kritisch) | Keine unabhängige Genauigkeitsprüfung gefunden. Trustpilot-Reviews äußern sich nicht zur Genauigkeit. Allgemein gilt: Schätzungen verschiedener Anbieter weichen für dieselbe App um das 2-Fache oder mehr voneinander ab. Im Mittelfeld (Ränge ca. 300 bis 1.000) sind sie besonders unsicher. | [D] https://trysonar.app/blog/app-revenue-estimates-how-they-work-and-fail |
| Preis/Value | Trustpilot: „price is good for the value, especially versus pricier alternatives“ | [D] |
| **Billing/Trial** | 1★ auf Trustpilot (Trial-Kündigung beendet sofort den Zugang). Reddit-Überschrift „charged me $97 five minutes after I started a free trial“. Keine Antwort des Unternehmens. | [D] |
| Support | „excellent, responsive, quick“ (Trustpilot) | [D] |
| Bewertungsplattformen | Trustpilot 3,9 (n=5). SaaSHub-Seite existiert (403 beim Abruf). Eigene Review-Domain nur mit 5★. | [D]/[B] |

> **Lehre für uns [A]:** Abrechnung und Trial sind die offene Flanke von AppKittie. Ein transparenter Trial (ohne Karte oder mit
> Erinnerung vor der Abbuchung, Kündigung erst zum Trial-Ende) ist ein billiger und glaubwürdiger Differenzierer.

### 1.8 AI-, MCP- und API-Angebot (öffentliche Doku)

**Quelle:** öffentliches GitHub-Repo https://github.com/appkittie/aso-mcp-skills (MIT). Lokal geklont nach
`scratchpad/markt/gh/repo` (`git clone`, nur gelesen).

| Aspekt | Befund [B] |
|---|---|
| Endpunkt | `https://mcp.appkittie.com/mcp` (Streamable HTTP), MCP-Protokollversion `2025-03-26` |
| Hosting | **Cloudflare Workers, Python** (`wrangler.toml`: `main = "src/worker.py"`, `python_workers`) |
| Auth | `Authorization: Bearer <API_KEY>`. Keys unter `appkittie.com/settings/api-keys`, nur einmal angezeigt. **OAuth-Shim** für Claude-Connectors: Client-ID `appkittie-claude`, API-Key als Client-Secret, Scope `appkittie:read`. |
| REST-API | Basis `https://www.appkittie.com/api/v1`: `/apps`, `/apps/:id`, `/apps/:id/historicals`, `/favorites/apps`, `/trending`, `/trending/:slug/history`, `/ads`, `/ads/:id`, `/creators`, `/organic`, `/keywords/difficulty` (GET, POST-Batch ≤10), `/reviews`, `/onboarding/screens`. Cursor-Pagination, Fehlercodes 400/401/**402 (keine Credits)**/404/429/500/503. Rate-Limit pro Key im gleitenden 60-s-Fenster (`X-RateLimit-*`). |
| Tools (15) | `search_apps`, `list_favorite_apps`, `get_app_detail`, `get_app_historicals`, `list_store_rankings`, `get_store_ranking_history`, `search_ads`, `get_ad_detail`, `list_creators`, `list_organic_content`, `get_keyword_difficulty`, `batch_keyword_difficulty`, `get_app_reviews`, `search_onboarding_screens`, `get_supported_countries` |
| Prompts (6) | `discover_niche`, `competitor_analysis`, `keyword_research`, `app_growth_report`, `ad_intelligence`, `review_analysis` |
| Skills (11) | app-discovery, keyword-research, metadata-optimization, competitor-analysis, growth-analysis, revenue-analysis, ad-intelligence, creator-discovery, app-marketing-context, review-analysis, onboarding-analysis. Installation per `npx skills add appkittie/mcp`. |
| Credits | Listen: **1 Credit pro zurückgegebener Zeile** (Apps, Ads, Creator, Organic, Reviews, Rankings, Onboarding-Apps). Detail/Historicals/Ad-Detail: 1 pro Call. Keyword-Difficulty: **10** pro Keyword. Ranking-Historie: 10. Länderliste und Favoriten: gratis. Header `X-Credits-Used/Remaining`. |
| Kontingent | 5.000 Credits/Monat im Plan (Briefing/Website). Kein separates API-Pricing öffentlich. |
| Keyword-Länder | 26 (US, GB, CA, AU, NZ, IE, DE, FR, IT, ES, NL, BE, AT, CH, PT, LU, SE, NO, DK, FI, JP, KR, CN, TW, HK, SG) |
| Onboarding-Screen-Typen | u. a. onboarding, quiz, paywall, home, permissions, success, subscription, discount, lesson, search |

> **Bewertung [A]:** Das Credit-Modell „1 Credit pro Zeile“ ist simpel und für LLM-Agenten gut verständlich. 5.000 Credits/Monat sind
> aber schnell aufgebraucht, wenn ein Agent breit sucht (50 Apps × 100 Queries). Das ist ein Upsell-Hebel. Für unseren Nachbau
> brauchen wir mindestens **Feature-Parität beim MCP**. Differenzieren können wir über Free-Credits für Discovery, klar
> dokumentierte Confidence-Werte in jeder Antwort und Monitoring-Tools (Watchlists, Alerts) als MCP-Tools.

---

## 2. AppKittie Terms & Privacy Policy (Stand 23.10.2026)

Abgerufen per `curl` (je ein Request, öffentliche Seiten) am 25.10.2026, Text extrahiert nach
`scratchpad/markt/terms.txt` und `privacy.txt`.

### 2.1 Terms and Conditions: relevante Klauseln [B]

| Klausel | Inhalt | Relevanz für uns |
|---|---|---|
| Leistungsbeschreibung | „competitive intelligence platform … app store analytics, keyword research, ad intelligence, and market insights“. Unter anderem „Monitor influencer collaborations and UGC campaigns“ und „**Generate professional App Store screenshots**“ (Screenshot-Generator, auf der Homepage nicht prominent). | Featureliste, [A] möglicher geplanter oder Legacy-Bereich |
| Mindestalter | 18+ | – |
| **Acceptable Use, Verbote** | „Use **automated tools (bots, scrapers)** to access the platform without permission“, „**Resell or redistribute data** obtained from appkittie“, „Attempt to gain unauthorized access“, „Share your account credentials“, „Infringe on intellectual property rights of others“ | Bestätigt die Spielregel: **kein Scraping, keine Weiterverwendung von AppKittie-Daten**. |
| Reverse Engineering / Wettbewerbsverbot | **Kein ausdrückliches** Reverse-Engineering-Verbot und **keine** Klausel gegen Nachbau oder Wettbewerb | Funktional nachbauen ist vertraglich nicht untersagt. Urheber-, Design- und Lauterkeitsrecht gelten trotzdem (Abschn. 4.2). |
| Intellectual Property | „The appkittie platform, including its design, features, and content, is owned by appkittie and protected by intellectual property laws.“ Daten: „aggregated from publicly available sources and proprietary models … for competitive intelligence purposes only“ | Anspruch auf Design und Inhalte. „Features“ als solche sind rechtlich kaum schützbar. |
| Abo/Billing | monatlich oder jährlich im Voraus, „non-refundable unless otherwise stated“, Preisänderung mit 30 Tagen Vorlauf, Kündigung zum Periodenende | – |
| Refund | **14-Tage-Geld-zurück** nur für Erstabos | Benchmark |
| Gewährleistung | „as is“. Keine Garantie, dass Daten „complete, accurate, or up-to-date“ sind. | Standard. Wir sollten das ebenso regeln, aber mit offener Methodik. |
| Haftung | Ausschluss indirekter Schäden | Standard (in DE gegenüber Verbrauchern nur eingeschränkt wirksam) |
| Kündigung durch Anbieter | jederzeit, „with or without notice … or for any other reason“ | in der EU AGB-rechtlich angreifbar [A] |
| **Gerichtsstand / Recht** | „governed by … the laws of the **jurisdiction in which appkittie operates**“. **Kein konkreter Gerichtsstand**, keine Schiedsklausel. | Unbestimmt [A]. Faktisch Wyoming/US. |
| Unternehmen | Algo Media LLC, Casper, Wyoming | s. 1.1 |
| Kontakt | „through our support channels“, **keine E-Mail, kein Impressum** | Für ein Angebot an EU-Kunden dünn [A] |

### 2.2 Privacy Policy: relevante Klauseln [B]

| Klausel | Inhalt |
|---|---|
| Erhobene Daten | Name, E-Mail, Zahlungsdaten, Präferenzen, Kommunikation. Nutzung: Suchanfragen und Filter, angesehene, getrackte und **exportierte Apps**, beobachtete Wettbewerber, IP, Browser, OS, Logs |
| Cookies | „cookies and similar tracking technologies“, Verwaltung über die Browsereinstellungen (kein Consent-Banner erwähnt) |
| **Subprozessoren** | Namentlich **nur Stripe**. Sonst generisch: „Cloud hosting and infrastructure providers“, „Email service providers“, „Analytics and monitoring services“. |
| Kein Datenverkauf | „We do not sell, rent, or trade your personal information …“ |
| Sicherheit | „Encryption of data in transit and at rest“, „Regular security audits“ (unbelegt) |
| Aufbewahrung | solange das Konto aktiv ist, danach für Compliance, Streitigkeiten, Durchsetzung, Betrugsprävention |
| DSGVO-Rechte | Liste der Betroffenenrechte (Auskunft, Berichtigung, Löschung, Einschränkung, Portabilität, Widerspruch) |
| CCPA | Rechte gelistet |
| Fehlend | **Kein Verantwortlicher mit Kontaktadresse für Datenschutz, kein EU-Vertreter (Art. 27 DSGVO), keine Rechtsgrundlagen (Art. 6), keine Drittlandtransfers/SCCs, keine Speicherdauern, kein Beschwerderecht bei einer Aufsichtsbehörde. Nichts dazu, wie AppKittie mit personenbezogenen Daten Dritter umgeht (Creator, Reviewer, `decision_makers`, `emails`).** |

### 2.3 Was die Dokumente (und der Code) über Tech-Stack und Datenquellen verraten

| Komponente | Befund | Status |
|---|---|---|
| Payments | Stripe | [B] Privacy |
| Web-Frontend | Next.js (Turbopack-Chunks, `x-powered-by: Next.js`), Fonts Satoshi und JetBrains Mono | [B] Header/HTML |
| CDN/DNS | Cloudflare (`server: cloudflare`, NS jade/tom) | [B] |
| MCP | Cloudflare Workers (Python) | [B] Repo |
| Registrar | Porkbun | [B] RDAP |
| Marketing-Tracking | Google Ads gtag, Meta Pixel (`_fbp` serverseitig), Rewardful, Simple Analytics, eigenes Attribution-Cookie | [B] |
| Creator-Daten | **TopYappers** (Schwesterprodukt) | [B] |
| Ads-Daten | Meta Ad Library inkl. **EU-Transparenzdaten** (Reach je Standort), TikTok-Ad-Zähler | [B] Felder · [A] Quelle |
| Kontaktdaten | `emails`, `decision_makers`, `hiring`, `socials`, `websites` | [B] Felder · [A] Enrichment (Herkunft unklar) |
| Onboarding | eigene Aufnahmen mit Wasserzeichen, Vision/LLM-Design-Annotation | [B] Hinweise · [A] Verfahren |

> **Compliance-Lücken bei AppKittie [A]** (für uns Differenzierungschance und zugleich Warnung):
> (1) Meta-Pixel-Cookie wird **vor jeder Einwilligung serverseitig gesetzt**. In DE/EU verstößt das gegen § 25 TDDDG bzw. Art. 5(3) der ePrivacy-RL.
> (2) Kein EU-Vertreter, keine benannten Subprozessoren, keine Rechtsgrundlagen.
> (3) Verarbeitung von Kontakt- und Creator-Daten Dritter ohne Art.-14-Information.
> (4) Kein Impressum (für einen EU-Anbieter nach § 5 DDG Pflicht, für AppKittie als US-Anbieter nicht direkt).

---

## 3. Wettbewerb

### 3.1 Marktstruktur und Konsolidierung (Stand Okt. 2026)

| Ereignis | Datum | Quelle |
|---|---|---|
| Sensor Tower übernimmt **data.ai** (ex App Annie). data.ai leitet heute auf Sensor Tower weiter. | März 2024 | [D] https://www.strataigize.com/insights/app-intelligence-tools-guide/ |
| Sensor Tower übernimmt **AppMagic** als „dedicated SMB solution“ | **12.05.2026** | [B] Pressemitteilung https://tools.prnewswire.com/en-us/live/20813/release/20260512EN55509 · https://pulse2.com/sensor-tower-acquires-appmagic-to-add-smb-intelligence-offering-to-its-digital-insights-platform/ |
| **MagicBrief** eingestellt (31.07.2026), Team zu Canva (Canva Grow) | Juli 2026 | [D] https://www.thekeyword.co/learn/magic-brief-shutting-down-alternatives |
| Apptopia kauft ein US-Consumer-Panel (laut eigener News). Gerüchte über eine Übernahme durch Sensor Tower 2023 sind **nicht verifiziert**, Apptopia publiziert weiter eigenständig. | Feb. 2025 | [D] https://apptopia.com/en/category/company-news/ · https://www.theatdb.com/companies/apptopia |

**Segmente:**
1. **Enterprise-Intelligence** (Sensor Tower inkl. data.ai und AppMagic, Apptopia, Similarweb): 30.000 bis 300.000 USD+/Jahr, Panel-Daten.
2. **ASO- und Mid-Market-Suites** (AppTweak, Appfigures, MobileAction, SplitMetrics/App Radar): 10 bis 2.500 USD/Monat, Schätzungen oft erst in hohen Tiers.
3. **Rohdaten und APIs** (42matters, Apptopia-Feeds, MobileAction-API): Enterprise.
4. **Ad-Intelligence** (Foreplay, SocialPeta, AppGrowing, MobileAction Ad Intel, früher MagicBrief): allgemein (DTC) oder Mobile-Games.
5. **UI-, Onboarding- und Paywall-Libraries** (Mobbin, Appllama, ScreensDesign, PaywallPro): 10 bis 20 USD/Monat, kaum Marktdaten.
6. **Indie-„Find winning apps“-Tools** (AppKittie, GetAppNiche, TrendApps, Appdex, Peekly, Appark, AppBird, Sonar …): 0 bis 399 USD/Monat, stark wachsend und zersplittert.

### 3.2 Enterprise und Mid-Market

| Tool | Zielgruppe | Kernfeatures | Preis (Quelle) | Datenabdeckung | Stärken | Schwächen |
|---|---|---|---|---|---|---|
| **Sensor Tower** (inkl. data.ai, Pathmatics) | Publisher, Enterprise, Investoren, Agenturen | Downloads/Revenue, Usage (DAU/MAU, Retention), Demografie, Ad-Intel (Spend, Creatives), ASO, Web/Gaming, API | angebotsbasiert. Laut Vendr-Daten 30.000 bis 70.000 USD/Jahr für kleine Teams, Median ca. 75.000 USD. Limitierter Free-Account. [D] https://creatify.ai/blog/sensor-tower-pricing-(2026)-plans-credits-and-what-you-ll-actually-pay | iOS und Google Play, global. Panel mit „10M+ opted-in consumers“ [D] | Genauigkeit, Breite, Marke, Historie | Preis, Komplexität, nicht self-serve, nichts für Indies |
| **AppMagic** (seit 05/2026 Sensor Tower) | SMB, Games-Studios | Downloads/Revenue, Ad-Intel, Creatives, LiveOps, Steam | Free-Plan laut Appark (08/2026) [D]. Paid-Tiers nicht öffentlich, Demo. Ältere Angabe „ab 150 USD/Monat“ unverifiziert. | iOS/GP, starke Games-Taxonomie | günstiger, Games-Fokus | Zukunft nach der Übernahme unklar (Bundling/Preis) |
| **Appfigures** | Indie bis Enterprise | eigene App-Analytics (Connect), ASO, Reviews, App-Intelligence, Market Intelligence | ASO/Analytics: Free, Connect 9,99 → Amplify 1.399,99 USD/Monat. **Market Intelligence:** Scout 599,99, Pathfinder 1.249,99, **Scale 2.499,99 USD/Monat (erst hier Download/Revenue-Schätzungen)**, Explore (API) auf Anfrage. [B] https://appfigures.com/pricing | „every major store“, Ranks stündlich, „300,000+ apps“ als Kunden | **verbundene Entwickler-Konten liefern Kalibrierdaten**, self-serve | Schätzungen sehr teuer |
| **AppTweak** | ASO-Teams, Publisher | ASO (Keywords, Volumes, Chance, Featuring), Creative/CPP-Explorer, Reporting-Agent, Market Intelligence, Ads-Intel, API | ASO Essential **ab 79 USD/Monat** (jährlich, 5 Apps) → Expand 833 USD. Market-Intelligence-Starter mit Schätzungen gratis. [B] https://www.apptweak.com/en/pricing | iOS/GP, viele Länder | ASO-Tiefe, KI-Agenten, Gratis-Schätzungen | Preis pro App und Seat, Schätzungen nur Basis |
| **MobileAction** | ASO und Apple-Ads-Manager | ASO, Apple-Ads-Automatisierung (CMP), Search-Ads-Intel, Ad-Intelligence (90M+ Ads, 45+ Netzwerke), CPP-Intel, API | ASO Lite 15, Basic 69, Pro 239 USD/Monat. CMP gratis bis 10.000 USD Spend. Ad-Intel/API custom. [B] https://www.mobileaction.co/pricing/ | iOS-lastig, 2M Keywords (API) | Apple Ads, günstiger Einstieg | Market- und Ad-Intel nur custom |
| **42matters** | Adtech, SDK-Anbieter, Datenkäufer | App-Intelligence-Explorer, API (Navigationspunkt „API and MCP“), File-Dumps, SDK-Stats | nicht öffentlich [B] https://42matters.com/pricing | Google Play, App Store, Amazon, Tencent, Apple TV, Fire TV, Roku | Rohdaten, CTV, SDKs | keine Growth-UX, Enterprise-Preise |
| **Apptopia** | Investoren (200+ Finanzfirmen), Enterprise | Performance, SDK-Intel, KPI-Forecasting, Ad-Intel, Bloomberg-Integration | angebotsbasiert [D] | „15M+ devices“-Panel [D] | Panel-Genauigkeit, Finanzfokus | Preis, nicht für Indies |
| **SplitMetrics** (inkl. App Radar) | Apple-Ads-UA, ASO-Teams, Agenturen | Acquire (Apple-Ads-Automatisierung, KI-Agent „Iris“), Optimize (Store-A/B-Tests), App Radar (ASO), Intelligence, Managed Services | Free-Starter für Acquire, sonst auf Anfrage [D] https://splitmetrics.com/blog/ | iOS-lastig | Apple Ads, Testing | keine breite Markt-DB |
| **Similarweb** (App-Modul) | Enterprise, Marketing | App-Downloads, Usage, Web plus App | auf Anfrage [D] | breit | Web plus App kombiniert | Preis |

### 3.3 Ad-Intelligence

| Tool | Zielgruppe | Kernfeatures | Preis | Abdeckung | Stärken | Schwächen |
|---|---|---|---|---|---|---|
| **Foreplay** | DTC/Performance-Marketer, Agenturen | Swipe-File, Discovery (Community-Library, „200M+“ bzw. Footer 54,7M Ads), Spyder (Wettbewerber-Tracking), Lens (eigene Meta/TikTok-Ads), Briefs. Integrationen: Claude, ChatGPT, MCP. | Basic 59 (49 jährlich) → Workflow 175 → Agency 459 USD/Monat. 7 Tage Trial mit Karte. [B] https://www.foreplay.co/pricing | Meta, TikTok, LinkedIn u. a. | Workflow und Briefing, MCP | nicht app-spezifisch (keine App-Metriken), Community-Bias |
| **MagicBrief** | Creative-Teams | Ad-Library, Analytics, Briefs | ehemals ab 249 USD/Monat. **Eingestellt am 31.07.2026** [D] | – | – | **Marktlücke** für Kreativ-Teams |
| **SocialPeta** | Mobile Games/Apps, E-Commerce (Asien-stark) | Ad-Creatives, Advertiser-Ranking, Markttrends | auf Anfrage. Directories nennen 29 bis 499 USD/Monat. 3-Tage-Test. [D] https://www.toolsurf.com/socialpeta-pricing-2026/ | viele Netzwerke inkl. Asien | große DB | intransparente Preise, UX |
| **AppGrowing** (YouCloud) | Mobile Games/Apps | Ad-Creatives (Facebook, TikTok, Google), Downloads | ab ca. 399 USD/User laut GetApp [D] https://www.getapp.sg/software/2099460/appgrowing | global, Asien-stark | Netzwerkbreite | Preis |
| **MobileAction Ad Intelligence** | UA-Teams | 90M+ Ads, 45+ Netzwerke/DSPs | custom [B] | 10+ Länder | DSP-Abdeckung | custom |
| *Gratis-Quellen* | alle | Meta Ad Library, TikTok Creative Center / Commercial Content Library, Google Ads Transparency Center | 0 | offiziell | Primärquelle | keine Aggregation, kein App-Bezug |

### 3.4 UI-, Onboarding- und Paywall-Libraries

| Tool | Zielgruppe | Kernfeatures | Preis | Abdeckung | Stärken | Schwächen |
|---|---|---|---|---|---|---|
| **Mobbin** | Designer, Produktteams | Screens, Flows, Animationen, Deep Search, Collections. **MCP in Pro seit 09/2026**, REST-API nicht in Pro. | Pro 10 USD/Monat (jährlich) bzw. 15 USD (quartalsweise), Team 16 USD/Member [D] https://pricingsaas.com/companies/mobbin | iOS, Android, Web. „400,000+ screens“ [D] | größte Library, Marke | **keine Marktdaten**. „All core apps“ statt „all apps“ (06/2026). |
| **Appllama** | Builder/Designer von Subscription-Apps | Screens in Journey-Reihenfolge (Welcome → Onboarding → Paywall → Produkt), Flows, UI-Elemente, Farben/Fonts, Umsatz/Downloads je App, **MCP (1 Credit pro Call)** | Pro 16 USD/Monat bzw. 144 USD/Jahr, Team 16 USD/Seat [D] https://toolradar.com/tools/appllama. **Beobachtet im MCP-Konto des Nutzers:** 1.500 Credits/Monat, 90/min, 400/Tag. | **nur iOS, top-grossing**. 620 bis 1.470+ Apps, 25.600 bis 66.000+ Screens (widersprüchliche Angaben) [D] | Flow-Tiefe, Revenue-Kontext, MCP | kleiner Katalog, keine Ads/Videos/ASO |
| **ScreensDesign** | Founder von Subscription-Apps | Onboarding- und Paywall-Screens bzw. -Videos, Filter nach Revenue/Installs, MCP | **nicht ermittelt** (Seite client-gerendert) | iOS, 2.000 bis 2.805+ Top-Apps [D] https://alternativeto.net/software/screensdesign/about | Onboarding-Fokus plus Revenue | nur iOS, klein |
| **PaywallPro** | Subscription-Apps | 46.000+ iOS-Paywalls, Open-Source-Teilmenge (500) | k. A. | iOS | Paywall-Tiefe | eng |

### 3.5 Indie-„Winning Apps“-Tools (direkte Konkurrenz)

| Tool | Zielgruppe | Kernfeatures | Preis | Abdeckung | Stärken | Schwächen |
|---|---|---|---|---|---|---|
| **AppKittie** (Referenz) | Indie-Founder, Studios, Growth | Revenue/Downloads, Ads (Meta/TikTok) plus Spend, Organic Videos, Creator, ASO, Onboarding, Reviews, Rankings, CSV, Team, API und MCP | 79 bzw. 49 USD/Monat, 5.000 Credits | „4,5M+“ bzw. „2M+“ Apps, iOS und GP | **Bündel-Breite zum Einheitspreis**, starkes Marketing, MCP | keine Methodik, Billing-Kritik, dünne Compliance |
| **GetAppNiche** | Indie-Founder | Revenue-Schätzungen (eigenes Modell), Keywords, Reviews, Charts, REST plus **MCP** | 39 USD/Monat, 249 USD/Jahr, **299 USD Lifetime** (erste 100) [D] https://www.saasworthy.com/product/getappniche/pricing | 3,6M+ Apps (1,1M iOS, 2,5M GP). Trends teils nur iOS. | günstig, MCP | kein Trial, schmaleres Feature-Set |
| **TrendApps** (trendapps.dev) | Indie | junge Apps mit Umsatz bei wenigen Reviews (<100) | Free, 9 und 69 USD/Monat [D] https://alternativeto.net/software/trend-apps/about | iOS und GP | Nischen-Discovery | eng |
| **Appdex** | Indie | Revenue/Downloads mit **Confidence-Label**, „verifizierte“ Zahlen aus Entwickler-Disclosures | k. A. [D] https://www.producthunt.com/products/appdex | 1M+ iOS | Transparenz | nur iOS |
| **Peekly** | Builder | App-Ideen, Revenue/Downloads, Ads, Paywalls, Publisher. Ein Plan, „public methodology“ (Eigenangabe). | Free-Account. Ein Paid-Plan (Reseller nennt 41 USD). [D] | „300,000+ apps“ [D] | Methodik-Transparenz | Seite hinter Vercel-Checkpoint (nicht prüfbar) |
| **Appark** | Indie/SMB | Top-Charts (stündlich, 40+ Märkte) mit 30-Tage-Schätzungen, Suche, Vergleich, Monitoring von 50 Apps gratis | Free-Start, Paid ohne Preisangabe [D] https://appark.ai/en/blog/mobile-app-intelligence-guide | „7M+ apps“ | großzügiger Free-Tier | Tiefe unklar |
| **AppBird** | Indie bis SMB, Games | tägliches New-App-Tracking, Rankings, Ad-Creatives, „X-Ray“-SDK-Teardowns, KI-Daily-Radar | Pro 199, Elite 399 USD/Monat [D] https://appbird.ai/blog/app-analytics-comparison-indie-developers/ | iOS und GP. GP-Downloads, iOS nur Ranking-Signale. | Tech-Teardowns | teuer, iOS-Schätzungen schwach |
| **Sonar** (trysonar.app) | ASO, Entwickler | ASO plus **Revenue-API mit Methodik und Confidence (high/medium/low)** | k. A. [D] | iOS/GP | erklärbare Schätzungen | ASO-Fokus |
| weitere | – | IntelMyApp AI, Apptica, ASOMobile, AppstoreSpy, AppGrowKit (Screenshots/ASO) | – | – | – | – |

### 3.6 Feature-Matrix (vereinfacht)

✓ = vorhanden laut Quelle, ~ = teilweise oder teurer Add-on, – = nicht vorhanden, ? = unbekannt

| Feature | AppKittie | Sensor Tower | Appfigures | AppTweak | MobileAction | Foreplay | Mobbin | Appllama | GetAppNiche |
|---|---|---|---|---|---|---|---|---|---|
| Revenue/Download-Schätzungen | ✓ | ✓ | ~ (ab 2.500 USD/Monat) | ✓ (Starter gratis) | ~ | – | – | ✓ (Top-iOS) | ✓ |
| iOS **und** Google Play | ✓ | ✓ | ✓ | ✓ | ✓ | – | ✓ (UI) | – (iOS) | ✓ |
| Ad-Library (Creatives) | ✓ (Meta, TikTok) | ✓ | – | ~ | ~ (custom) | ✓ | – | – | – |
| Ad-Spend-Schätzung | ✓ (Meta-Transparenz) | ✓ | – | ? | ? | – | – | – | – |
| Organic Videos / Creator | ✓ | ? | – | – | – | – | – | – | – |
| Onboarding-/Paywall-Library | ✓ | – | – | – | – | – | ✓ | ✓ | – |
| ASO-Keywords | ✓ | ✓ | ✓ | ✓ | ✓ | – | – | – | ✓ |
| Reviews | ✓ | ✓ | ✓ | ✓ | ✓ | – | – | – | ✓ |
| MCP / KI-Zugang | ✓ | ? | ? | ~ (KI-Agenten, MCP ?) | ? | ✓ | ✓ | ✓ | ✓ |
| **Offene Methodik / Confidence** | – | ~ | – | ~ | – | n/a | n/a | – | – |
| **Change-Alerts (Paywall, Preis, Onboarding)** | – (nur Favoriten) | ~ | ✓ (Ranks) | ✓ | ✓ | ✓ (Spyder) | – | – | ? |
| Einstiegspreis/Monat | 49 bis 79 USD | ca. 30.000 USD/Jahr | 0 bis 10 USD | 79 USD | 15 USD | 49 bis 59 USD | 10 USD | 12 bis 16 USD | 21 bis 39 USD |

### 3.7 Lücke und Positionierung für uns [A]

**Was AppKittie stark macht:** ein günstiger Einheitspreis für ein sehr breites Bündel („alles, was du zum Nachbauen einer
funktionierenden App brauchst“), plus Gründer-Reichweite, Affiliates und MCP.

**Wo die Lücke liegt:**

1. **Vertrauen statt Blackbox.** Keine der Indie-Plattformen mit vollem Bündel veröffentlicht Fehlerbänder. Wir
   bieten eine öffentliche Methodik-Seite, **Konfidenzintervalle je Schätzung**, regelmäßige Accuracy-Reports gegen
   verifizierte Umsätze (opt-in verbundene App-Store-Connect-, Google-Play-, RevenueCat- oder Stripe-Konten sowie öffentliche Founder-Disclosures).
   Ein Datennetzwerk-Effekt entsteht, wenn Nutzer ihre eigene App verbinden und dafür Credits bzw. Benchmarks bekommen
   (Appfigures und Sensor Tower nutzen dasselbe Prinzip).
2. **Monitoring statt Stöbern.** Watchlists mit Alerts (neue Paywall, Preisänderung je Land, Onboarding-Änderung, neue
   Creatives, Keyword-Sprünge, „App überholt X in Land Y“). Das steigert die Retention. AppKittie hat bisher nur Favoriten.
3. **EU/DACH-first.** 29 % von AppKitties Traffic kommt laut Similarweb aus DE und FR. Wir bieten DE/FR/ES-UI, EUR-Preise
   mit Rechnung und USt (OSS), EU-Hosting, AVV/DPA, benannte Subprozessoren, kein Pixel vor Consent und keine
   Kontaktdaten-Scrapes. Das macht uns zum „sauberen“ Anbieter für Agenturen und Studios in der EU.
4. **„Localize a winner“ als Kern-Use-Case.** Länder-Gaps zeigen: App X ist Top 20 in US/DE, aber nicht in FR/IT/ES/JP.
   AppKittie-Gründer predigen genau diese Strategie, das Produkt bildet sie aber nicht eigens ab.
5. **Agent-first.** MCP mit Free-Credits für Discovery (als Akquisekanal), Confidence in jeder Tool-Antwort, Alert- und Watchlist-Tools
   im MCP, Skills, ChatGPT-App bzw. Claude-Connector. Da MagicBrief eingestellt wurde und AppMagic in Sensor Tower aufgeht,
   suchen SMB- und Creative-Kunden Alternativen.
6. **Faire Abrechnung** als Marketingbotschaft (Trial ohne Überraschungen, Kündigungsbutton, klare Credits).

---

## 4. Rechtliche Leitplanken (Übersicht, keine Rechtsberatung)

**Annahme:** Wir betreiben das Produkt aus Deutschland bzw. der EU und vertreiben weltweit. Damit gelten **EU-Recht und deutsches
Recht voll** (DSGVO, UrhG, UWG, MarkenG, BGB), für US-Kunden zusätzlich US-Recht im Streitfall.

### 4.1 Marken- und Namensrecht

| Punkt | Leitplanke | Quellen |
|---|---|---|
| Eigener Name | Name, Logo und Maskottchen dürfen **nicht verwechslungsfähig** mit „AppKittie“ sein. Kein „Kitty/Kittie/Kat“, keine Katzen-Bildmarke, kein „-ie“-Wortspiel in derselben Klangstruktur, keine Typo-Domains. Maßstab ist die Verwechslungsgefahr (Zeichen- plus Waren/Dienstleistungs-Ähnlichkeit, hier identische Dienstleistungen). | § 14 MarkenG https://www.gesetze-im-internet.de/markeng/__14.html · Art. 9 UMV (VO (EU) 2017/1001) https://eur-lex.europa.eu/eli/reg/2017/1001/oj |
| Kein Register ≠ kein Schutz | AppKittie hat **keine USPTO-Anmeldung** [B]. In DE können aber ohne Eintragung **Unternehmenskennzeichen und Werktitel** (§ 5 MarkenG) entstehen, sobald das Zeichen im Inland benutzt wird. Laut BGH können auch Apps und Websites Werktitelschutz genießen („wetter.de“). In den USA gibt es Common-Law-Rechte (Lanham Act § 43(a)). | § 5 MarkenG https://www.gesetze-im-internet.de/markeng/__5.html · BGH, Urt. v. 28.01.2016, I ZR 202/14 „wetter.de“ |
| Eigene Marke sichern | Vor dem Launch: Identitäts- und Ähnlichkeitsrecherche (DPMA, EUIPO/TMview, USPTO, WIPO Global Brand DB, App Stores, Domains, Social Handles). Anmeldung in den Klassen 9 (Software), 35 (Marktforschung, Werbung), 42 (SaaS). Richtwerte: **DPMA 290 € online inkl. 3 Klassen, EUIPO 850 € (1 Klasse) + 50 € (2.) + 150 € (je weitere), USPTO 350 USD je Klasse** (Gebühren vor Anmeldung prüfen). | https://www.dpma.de · https://euipo.europa.eu · https://www.uspto.gov |
| Vergleichende Werbung | „Alternative zu AppKittie/Sensor Tower“ ist zulässig, wenn **wahr, objektiv, nachprüfbar** und nicht herabsetzend. Fremdmarken nur nominativ, keine fremden Logos oder Screenshots ohne Grund. | § 6 UWG https://www.gesetze-im-internet.de/uwg_2004/__6.html |
| KI-Logos | „Works with ChatGPT/Claude/Gemini …“: nur nach den Brand-Guidelines der jeweiligen Anbieter, Logos nicht verfremden, keinen Partner-Status suggerieren. | Brand-Guidelines der Anbieter |
| Store-Marken | „App Store“, „Google Play“ und Badges nur nach den Marketing-Guidelines von Apple und Google | Apple/Google Marketing Guidelines |

### 4.2 Design-Inspiration vs. Kopie

| Schutzrecht | Was geschützt ist | Was **nicht** geschützt ist | Leitplanke für uns |
|---|---|---|---|
| **Urheberrecht** (UrhG, InfoSoc-RL) | Texte (Marketing-Copy, FAQ, Onboarding-Texte), Illustrationen, Icons, Fotos, Videos, ggf. ein GUI als Werk, sofern originell (EuGH C-393/09 BSA). Originalität setzt freie kreative Entscheidungen voraus (EuGH C-683/17 Cofemel, C-833/18 Brompton). | Ideen, Funktionen, Geschäftsmodell, Filterlogik, Kennzahlen-Konzepte, technisch bedingte Layouts. Menübefehle sind in den USA nicht schutzfähig (Lotus v. Borland, 1st Cir. 1995). | **Keine Texte, Grafiken, Icons oder Screenshots übernehmen.** Eigene Copy, eigenes Designsystem. Feature-Ideen und Informationsarchitektur dürfen ähnlich sein. |
| **Nicht eingetragenes EU-Design** (VO (EU) 2024/2822, seit 01.05.2025) | Erscheinungsform eines „Erzeugnisses“, **ausdrücklich auch grafische Benutzeroberflächen**. Schutz **3 Jahre ab erster Offenbarung in der EU**, nur gegen **Nachahmung**. | unabhängige Eigenentwicklung, technisch bedingte Merkmale | AppKitties UI ist seit Anfang 2026 öffentlich und in der EU stark genutzt, also **potenziell geschützt bis ca. 2029**. Daher **kein 1:1-Nachbau** von Layout, Farbwelt, Karten-Design und Microinteractions. Wir brauchen einen eigenen Gesamteindruck. |
| **UWG § 4 Nr. 3** (ergänzender Leistungsschutz) | Nachahmung eines Produkts mit „wettbewerblicher Eigenart“, wenn sie zu **vermeidbarer Herkunftstäuschung** führt, den Ruf ausnutzt bzw. beeinträchtigt oder auf **unredlich erlangten Kenntnissen** beruht | Übernahme gemeinfreier oder technisch notwendiger Gestaltungen | Andere Marke, anderer Look, keine Übernahme von Daten oder Assets. Unsere Spielregeln (kein Login, kein Scraping) verhindern zugleich „unredlich erlangte Kenntnisse“. |
| **Trade Dress (USA)** | Gesamterscheinung, wenn unterscheidungskräftig und nicht funktional. Produktdesign braucht Verkehrsgeltung (Wal-Mart v. Samara, 2000). | funktionale Elemente | Bei einem anderen Gesamtauftritt gering. |
| **Datenbank-/Vertragsrecht** | s. 4.3 | – | Keine AppKittie-Daten (auch nicht „zum Testen“) |

> **Praxis-Checkliste „Inspiration statt Kopie“:** eigener Name, Logo und Farbpalette; eigene Komponentenbibliothek; keine übernommenen
> Texte (auch nicht paraphrasiert-nah); keine AppKittie-Screenshots in Marketing oder Docs; Kennzahlen eigenständig benennen und
> definieren; Design-Review mit „Side-by-side-Test“ (würde ein Nutzer uns für AppKittie halten?).

### 4.3 EU-Datenbankrecht (sui generis)

**Grundlagen:** Datenbank-RL 96/9/EG Art. 7 (in DE §§ 87a ff. UrhG). Geschützt ist der **Hersteller**, der eine **wesentliche Investition in
Beschaffung, Überprüfung oder Darstellung** des Inhalts getätigt hat (nicht in die *Erzeugung* der Daten, EuGH C-203/02 BHB v. William Hill).
Verboten sind **Entnahme oder Weiterverwendung eines wesentlichen Teils** sowie die **wiederholte und systematische Entnahme unwesentlicher
Teile**, wenn sie der normalen Auswertung zuwiderläuft (Art. 7 Abs. 5). Auch manuelles Abtippen nach Ansicht gilt als Entnahme
(EuGH C-304/07 Directmedia). Ein spezialisierter Meta-Suchdienst kann eine Weiterverwendung sein (EuGH C-202/12 Innoweb).
Nach **EuGH C-762/19 CV-Online** (2021) liegt eine Verletzung aber nur vor, wenn die Handlung die **Amortisation der Investition gefährdet**.
Schutzdauer 15 Jahre, bei wesentlichen Änderungen erneuert (dynamische DBs damit faktisch dauerhaft).

**Wer ist geschützt? (Art. 11 RL 96/9/EG):** nur Hersteller, die Staatsangehörige eines Mitgliedstaats sind oder ihren gewöhnlichen
Aufenthalt in der EU haben, bzw. Unternehmen mit Sitz, Hauptverwaltung oder Hauptniederlassung in der EU (mit echter Verbindung). Für
die USA gibt es **keine Gegenseitigkeitsvereinbarung**.

| Szenario | Einordnung [A] | Leitplanke |
|---|---|---|
| **AppKittie-Daten** | Hersteller ist vermutlich die Algo Media LLC (USA) und hätte damit **kein** EU-sui-generis-Recht (Ausnahme denkbar, falls der Hersteller tatsächlich eine EU-Person ist; unklar). **Trotzdem verboten bzw. riskant:** (1) Vertrag/AGB. Nach **EuGH C-30/14 Ryanair** (2015) darf der Betreiber einer *nicht* geschützten DB die Nutzung vertraglich beschränken, und die AppKittie-Terms verbieten Scraping sowie Weiterverbreitung. (2) Ggf. Urheberrecht an Texten und Screens. (3) **UWG** (unredlich erlangte Kenntnisse, gezielte Behinderung). (4) US-Recht (Vertrag, CFAA bei Umgehung, Copyright an Medien). (5) Die AppKittie-Daten sind selbst nur Schätzungen und Drittinhalte, also auch qualitativ wertlos als Fundament. | **Absolutes Tabu** (Spielregel). Auch keine „Stichproben zum Vergleich“ aus eingeloggten Accounts. Für Genauigkeitsvergleiche nur öffentliche Angaben (Marketing-Screens) qualitativ nutzen. |
| **Apple App Store** | Der App Store wird in der EU von **Apple Distribution International Ltd. (Irland)** betrieben, ein EU-Hersteller ist also denkbar. Ob die Investition „Beschaffung/Überprüfung/Darstellung“ erfüllt (App-Review, Darstellung, Rankings, Ratings), ist offen: Metadaten liefern die Entwickler, Rankings „erzeugt“ Apple. Risiko **mittel**. | Bevorzugt offizielle Wege (iTunes Search/Lookup API, RSS/Marketing-Feeds, öffentliche Sitemaps). Nur die benötigten Felder übernehmen. Daraus **eigene Datenprodukte** ableiten (Schätzungen, Zeitreihen, Analysen) statt eines 1:1-Spiegels des Stores. Nicht systematisch den „ganzen Store“ als durchsuchbare Ersatz-DB veröffentlichen. |
| **Google Play** | EU-Vertragspartner ist Google Ireland bzw. Google Commerce Ltd. Bewertung wie bei Apple. | wie oben, plus robots.txt (s. 4.5) |
| **Meta Ad Library / TikTok Library** | DSA-Pflicht-Repositorien (Art. 39 DSA) sind öffentlich, Datenbank- und Vertragsrecht bleiben aber bestehen. Meta verlangt für automatisierte Erhebung eine **schriftliche Erlaubnis** (s. 4.5). | Offizielle APIs nutzen (Ad Library API, TikTok Commercial Content API), Nutzungsbedingungen prüfen, Creatives nicht massenhaft rehosten (4.7). |
| **TDM-Schranke** | Art. 4 DSM-RL / **§ 44b UrhG** erlaubt Vervielfältigungen und Entnahmen aus rechtmäßig zugänglichen Werken **und Datenbanken** für Text- und Data-Mining, solange der Rechteinhaber keinen **maschinenlesbaren Nutzungsvorbehalt** erklärt hat. Kopien sind zu löschen, wenn sie nicht mehr erforderlich sind. Das **LG Hamburg** (27.09.2024, 310 O 227/23, LAION) hat § 44b auf KI-Datensätze angewandt; in der Literatur wird vertreten, dass auch Vorbehalte in natürlicher Sprache genügen können. | Deckt **Analyse** (z. B. Schätzmodelle aus Seiten berechnen), aber **nicht die dauerhafte Veröffentlichung** fremder Inhalte. Vorbehalte (robots.txt, AGB) respektieren. |

Quellen: RL 96/9/EG https://eur-lex.europa.eu/eli/dir/1996/9/oj · §§ 87a–87e UrhG https://www.gesetze-im-internet.de/urhg/__87b.html ·
EuGH C-203/02 https://curia.europa.eu/juris/liste.jsf?num=C-203/02 · C-304/07 https://curia.europa.eu/juris/liste.jsf?num=C-304/07 ·
C-202/12 https://curia.europa.eu/juris/liste.jsf?num=C-202/12 · C-762/19 https://curia.europa.eu/juris/liste.jsf?num=C-762/19 ·
C-30/14 https://curia.europa.eu/juris/liste.jsf?num=C-30/14 · § 44b UrhG https://www.gesetze-im-internet.de/urhg/__44b.html ·
LAION: https://cms.law/de/deu/legal-updates/erstes-urteil-deutschlands-zur-urheberrechtlichen-zulaessigkeit-des-ki-trainings-ergangen

### 4.4 Scraping-Rechtsprechung (Auswahl)

| Fall | Gericht, Datum | Kernaussage | Bedeutung für uns |
|---|---|---|---|
| **hiQ Labs v. LinkedIn** | 9th Cir. 2019 und 18.04.2022 (nach *Van Buren v. United States*, SCOTUS 2021); N.D. Cal. Nov. 2022; Vergleich Dez. 2022 | Scraping **öffentlicher** Profile ist wahrscheinlich kein Zugriff „without authorization“ im Sinne des CFAA. **Aber:** hiQ hat die User Agreement (eingeloggt, Fake-Accounts) verletzt, Vergleich mit Unterlassung. | Öffentlich und ausgeloggt: CFAA-Risiko gering. **Eingeloggt, Fake-Accounts, Umgehung: hohes Risiko.** https://en.wikipedia.org/wiki/HiQ_Labs_v._LinkedIn |
| **Meta v. Bright Data** | N.D. Cal., 23.01.2024 (Judge Chen) | Metas Terms verbieten **ausgeloggtes** Scraping öffentlicher Daten nicht. Wer ausgeloggt scrapt, ist kein „User“. Meta zog die Klage danach weitgehend zurück. | US-Vertragsrisiko bei ausgeloggtem Scraping gering, Login-Daten tabu. https://www.fbm.com/data-analytics/publications/major-decision-affects-law-of-scraping-and-online-data-collection-meta-platforms-v-bright-data/ |
| **X Corp. v. Bright Data** | N.D. Cal., 09.05.2024 (Judge Alsup) | Klage abgewiesen. State-Law-Claims gegen Scraping öffentlicher Inhalte sind durch den Copyright Act präemptiert. Kein Trespass ohne Schaden. | US-Plattformen können öffentliche Daten nur begrenzt per AGB monopolisieren. https://www.cnbc.com/2024/05/10/elon-musks-x-loses-lawsuit-against-bright-data-over-data-scraping.html |
| **Google v. SerpApi** | N.D. Cal., eingereicht 19.12.2025 (Az. 25-10826) | DMCA § 1201: Umgehung von Googles Anti-Bot-System „SearchGuard“. Laut Sekundärquelle mit Leave to Amend abgewiesen (**unverifiziert**). | **Umgehung technischer Schutzmaßnahmen** (Captchas, Bot-Schutz) ist die rote Linie. Abhängigkeit von Scraping-APIs Dritter ist ein Lieferantenrisiko. https://ipwatchdog.com/2025/12/26/google-sues-serpapi-parasitic-scraping-circumvention-protection-measures/ |
| **Ryanair v. PR Aviation** | EuGH, 15.01.2015, C-30/14 | Ist eine DB weder urheber- noch sui-generis-geschützt, stehen die Schranken der Datenbank-RL einer **vertraglichen** Nutzungsbeschränkung nicht entgegen. | AGB-Verbote können in der EU greifen, sofern wirksam einbezogen (nationales AGB-Recht). https://curia.europa.eu/juris/liste.jsf?num=C-30/14 |
| **CV-Online Latvia v. Melons** | EuGH, 03.06.2021, C-762/19 | Eine Suchmaschine, die fremde Stellenanzeigen indexiert, verletzt das sui-generis-Recht nur, wenn die Investition gefährdet wird. Abwägung mit Informationsfreiheit und Wettbewerb. | Je stärker unser Produkt die Quelle **ersetzt**, desto höher das Risiko. Je mehr es **neue Erkenntnisse** liefert (Schätzungen, Trends), desto geringer. |
| **BGH „Automobil-Onlinebörse“** | BGH, 22.06.2011, I ZR 159/10 | Screen-Scraping einzelner Fahrzeugangebote verletzte §§ 87b UrhG nicht (unwesentliche Teile, keine systematische Umgehung) und war nicht unlauter. | Abfrageweise Übernahme kleiner Teile ist eher zulässig als Bulk-Spiegelung. |
| **BGH „Flugvermittlung im Internet“** (Ryanair) | BGH, 30.04.2014, I ZR 224/12 | Automatisiertes Auslesen von Flugdaten trotz AGB-Verbot ist **keine gezielte Behinderung** (UWG), solange **keine technischen Schutzmaßnahmen überwunden** werden und die Website nicht beeinträchtigt wird. | Lauterkeitsrechtlich zulässig ohne Umgehung und ohne Last. Urheber- und Datenbankrecht bleiben separat zu prüfen. https://www.lto.de/recht/hintergruende/h/bgh-urteil-izr22412-screen-scraping-flugdaten-automatisiert-auslesen-ryanair-reiseportal |
| **CNIL vs. KASPR** | CNIL, 05.12.2024 (verkündet 19.12.2024) | **240.000 €** Bußgeld für das Sammeln von LinkedIn-Kontaktdaten, auch von Nutzern mit eingeschränkter Sichtbarkeit. Verstöße gegen Art. 6, 5(1)(e), 12, 14, 15 DSGVO. | **Kontakt- und „Decision-Maker“-Daten nicht scrapen.** https://www.cnil.fr/en/data-scraping-kaspr-fined-eu240000 |
| **Autoriteit Persoonsgegevens (NL)** | Leitfaden 01.05.2024 | Scraping personenbezogener Daten durch Private sei „fast immer“ rechtswidrig, rein kommerzielle Interessen reichten nicht. | Restriktivste Lesart in der EU. https://iapp.org/news/a/netherlands-dpa-issues-guidance-against-web-scraping |
| **EuGH KNLTB** | EuGH, 04.10.2024, C-621/22 | Auch ein **kommerzielles** Interesse kann ein berechtigtes Interesse nach Art. 6(1)(f) sein (Abwägung bleibt nötig). | Relativiert die NL-Position. Legitimate Interest bleibt möglich, mit sauberer Abwägung. https://curia.europa.eu/juris/liste.jsf?num=C-621/22 |

### 4.5 Plattform-ToS und robots.txt (Primärquellen)

| Quelle | Regel | Befund / Leitplanke |
|---|---|---|
| **Apple Website Terms of Use** | „You may not use any "deep-link", "page-scrape", "robot", "spider" or other automatic device …“, „Apple reserves the right to bar any such activity.“ Kalifornisches Recht. | [B] https://www.apple.com/legal/internet-services/terms/site.html. Ob diese Site-Terms auch `apps.apple.com` erfassen, ist unklar. Vertragsbindung ohne Zustimmung ist in den USA schwach (Meta v. Bright Data), Bot-Sperren sind aber das **praktische** Risiko. |
| **apps.apple.com/robots.txt** | `Disallow: /api/*`, `/v1/*`, `*/search?*`, `/WebObjects/*`. **Sitemaps** für Apps, Charts, neue Apps, Stories. | [B] `curl https://apps.apple.com/robots.txt`. App-Detailseiten sind nicht gesperrt und werden per Sitemap angeboten. Die internen APIs (`amp-api`, `/v1/`) und die Suche sind gesperrt, also **nicht nutzen**. |
| **iTunes Search API** | „limited to approximately 20 calls per minute“, für mehr gibt es den Enterprise Partner Feed (EPF). Zweck: Inhalte **bewerben** („only to promote store content“), Badge bzw. Link zum Store, Caching empfohlen. | [B] https://performance-partners.apple.com/search-api. Zweckbindung „Promotion“ ist für reine Analytics eine Grauzone. Jede App-Ansicht mit „Im App Store ansehen“ verlinken. |
| **App Store Connect API / Play Developer API** | nur eigene Apps | Nur für die **Opt-in-Kalibrierung** mit Nutzer-Konten (mit deren Zustimmung) |
| **Google Terms of Service** (gültig ab 30.07.2026) | Verboten: „using automated means to access content from any of our services in violation of the machine-readable instructions on our web pages (for example, robots.txt files that disallow crawling …)“ | [B] https://policies.google.com/terms. **robots.txt ist bei Google vertraglich relevant.** |
| **play.google.com/robots.txt** | gesperrt u. a.: `/store/search`, `/store/getreviews`, `/store/xhr`, **`/_`** (u. a. die internen `batchexecute`-Endpunkte), `/store/apps/datasafety*`, `/apps`. **Nicht** gesperrt: `/store/apps/details?id=…`. Sitemaps vorhanden. | [B] `curl https://play.google.com/robots.txt`. Detailseiten sind erlaubt. **Reviews über interne Endpunkte und Suche sind per robots.txt gesperrt** und damit nach Googles ToS untersagt. Verbreitete Scraper-Libraries nutzen genau diese Endpunkte, was ein Compliance-Risiko ist. |
| **Meta Automated Data Collection Terms** (07.10.2024) | „You will not engage in Automated Data Collection without first obtaining Meta's express written permission.“ Kein Weiterverkauf bzw. keine Lizenzierung gesammelter Daten. robots.txt beachten. | [B] https://www.facebook.com/apps/site_scraping_tos_terms.php. Scraping der Ad-Library-Website ist ohne Erlaubnis vertragswidrig, sofern die Terms gelten. **Ad Library API** (Identitätsverifizierung, Zweckbindung) prüfen. Kommerzielle Ads liefert sie vollständig nur für die EU (DSA) [D]. |
| **TikTok Commercial Content API** | Antrag und Prüfung durch TikTok. Ads ab Laufzeit bis 1 Jahr nach letzter Ausspielung. Start mit EU-Daten. Research-API nur für Forschung. | [D] https://developers.tiktok.com/products/commercial-content-api. Kommerzielle Nutzung klären, Research-API ist **nicht** für uns. |
| **DSA Art. 39** | Very Large Online Platforms müssen öffentliche, per API durchsuchbare Werbearchive führen | https://eur-lex.europa.eu/eli/reg/2022/2065/oj. Liefert die Rechtsgrundlage für die Existenz, aber **keine** Lizenz zur kommerziellen Weiterverwertung. |
| **YouTube API Services** | Nutzung per offizieller Data API und Embeds. Gespeicherte API-Daten müssen regelmäßig aktualisiert bzw. gelöscht werden (Developer Policies, i. d. R. 30 Tage). | [A] Policy vor Implementierung prüfen |

> **Leitplanke [A]:** (1) Offizielle APIs, Feeds und Sitemaps vor HTML-Scraping. (2) robots.txt strikt einhalten (bei Google zusätzlich
> vertraglich relevant). (3) **Nie** Login, Fake-Accounts, Captcha- oder Bot-Schutz-Umgehung (CFAA/DMCA § 1201, § 95a UrhG, BGH Ryanair).
> (4) Moderate Raten, identifizierbarer User-Agent, Caching. (5) Abhängigkeit von Drittanbieter-Scrapern (SerpApi, Apify-Actors) vertraglich
> absichern, denn deren Rechtsrisiko wird zu unserem Lieferrisiko.

### 4.6 DSGVO

| Datenkategorie | Personenbezug? | Rechtsgrundlage / Pflichten | Leitplanke |
|---|---|---|---|
| **Store-Metadaten** (App, Entwickler-Firma) | i. d. R. nein. Ja bei Einzelentwicklern (Name als Developer). | Art. 6(1)(f) | Einzelentwickler-Namen nur wie im Store angezeigt, keine Anreicherung |
| **Reviews** (Text, Nickname, Datum) | **ja** (Nickname kann identifizieren, Text enthält oft persönliche Angaben) | Art. 6(1)(f) mit Abwägung, **Art. 14 Info-Pflicht** (Ausnahme bei unverhältnismäßigem Aufwand nach Art. 14(5)(b) nur mit öffentlicher Information), Widerspruchsrecht Art. 21, Speicherbegrenzung | Für Analysen **Nicknames pseudonymisieren bzw. hashen**, in der UI nur kurze Auszüge, Sentiment und Topics aggregiert. Keine Reviewer-Profile über Apps hinweg. Löschung auf Anfrage. Speicherfristen festlegen. |
| **Creator/Influencer** (Handle, Follower, Videos) | **ja** (auch bei öffentlichen Profilen) | Art. 6(1)(f) (EuGH C-621/22: kommerzielles Interesse möglich), Art. 14, Art. 21, ggf. **DSFA** (Art. 35) bei umfangreicher Profilbildung | Nur geschäftsrelevante, öffentlich gepostete Inhalte mit App-Bezug. **Keine Kontaktdaten, keine Zielgruppen-Demografie** einzelner Personen. Opt-out-Seite für Creator, Privacy-Notice nach Art. 14 auf der Website. |
| **Developer-Kontakte**, „Decision Makers“, „Hiring“ (wie bei AppKittie) | **ja** | KASPR-Fall: hohes Bußgeldrisiko. Zudem **§ 7 UWG**: Werbe-E-Mails brauchen in DE auch B2B eine vorherige ausdrückliche Einwilligung. | **Nicht anbieten.** Höchstens die im Store veröffentlichte Support-URL bzw. -E-Mail als Link, mit Zweckhinweis. |
| **Eigene Nutzer** | ja | Vertrag (Art. 6(1)(b)), AVV mit Subprozessoren, **Drittlandtransfer** (DPF/SCCs), Verzeichnis (Art. 30), TOMs | Benannte Subprozessoren-Liste, EU-Hosting bevorzugt, DPA für B2B-Kunden |
| **Website-Tracking** | ja | **§ 25 TDDDG**: Einwilligung vor nicht notwendigen Cookies und Pixeln | Kein Meta-Pixel bzw. `_fbp` vor Consent (Gegenbeispiel AppKittie). Cookieless-Analytics wie Simple Analytics/Plausible sind ok. |
| Ad-Creatives mit Personen | ja (abgebildete Personen) | Art. 6(1)(f), Recht am eigenen Bild (KUG) | s. 4.7, Takedown |
| **US-Seite** | – | CCPA/CPRA-Schwellen. **Kalifornisches Data-Broker-Register** (Delete Act) prüfen, falls Creator-Daten von 100K+ Kaliforniern verkauft bzw. geteilt werden. | bei Skalierung prüfen [A] |

Quellen: DSGVO https://eur-lex.europa.eu/eli/reg/2016/679/oj · CNIL KASPR (s. o.) · EDPB-Meldung https://www.edpb.europa.eu/news/data-scraping-french-supervisory-authority-fined-kaspr-eu240-000_sv ·
§ 25 TDDDG https://www.gesetze-im-internet.de/ttdsg/__25.html · § 7 UWG https://www.gesetze-im-internet.de/uwg_2004/__7.html

### 4.7 Hosting von Ad-Creatives, Videos und Screenshots

| Inhalt | Rechtslage (Kurz) | Risiko | Empfehlung |
|---|---|---|---|
| **Ad-Creatives** (Meta/TikTok) | Urheberrecht liegt bei Advertiser bzw. Agentur. Rehosting ist Vervielfältigung (§ 16 UrhG) und öffentliche Zugänglichmachung (§ 19a UrhG). Das **Zitatrecht** (§ 51 UrhG) verlangt eine Belegfunktion (eigene Auseinandersetzung) und trägt kaum ein Massenarchiv. In den USA spricht Fair Use für Thumbnails in Suchkontexten (*Kelly v. Arriba Soft*, 2003; *Perfect 10 v. Amazon*, 2007), die EU kennt keinen Fair Use. | mittel (Branchenpraxis: Foreplay, AppGrowing, SocialPeta rehosten; Abmahnungen selten, aber möglich) | **Bevorzugt Metadaten plus Thumbnail plus Deep-Link bzw. offizielles Embed** zur Ad Library. Videos nur per Link oder Embed oder kurzzeitig gecacht. Bei eigener Analyse (Hook, CTA, Struktur) wird die Belegfunktion gestärkt. **Notice-and-Takedown** mit Reaktionszeit, Opt-out für Advertiser. |
| **Organische Videos** (TikTok, Instagram, YouTube Shorts) | Wie oben. Zusätzlich **Musikrechte**: TikTok-Lizenzen decken unsere Nutzung nicht ab. | **hoch bei Rehosting** (AppKittie: „organic creator videos with hosted media“ [B]) | **Nur offizielle Embeds** (TikTok-, Instagram-, YouTube-Embed bzw. oEmbed). Embedding frei zugänglicher Inhalte ist nach EuGH keine neue öffentliche Wiedergabe (C-466/12 Svensson, C-348/13 BestWater), anders bei Umgehung von Schutzmaßnahmen (C-392/19 VG Bild-Kunst). Eigene Kennzahlen speichern, nicht die Datei. |
| **Store-Screenshots und Icons** | Urheberrecht beim Entwickler. Apple erlaubt die Nutzung von App-Icons und Assets „to promote store content“ mit Badge bzw. Link [B]. | gering (Branchenstandard, verlinkt auf den Store) | Immer mit Store-Link und Attribution. Keine Bearbeitung, kein Mockup-Weiterverkauf. |
| **Onboarding-Flows** (eigene Aufnahmen) | Screens enthalten geschützte Texte und Grafiken, die Sammlung ist Vervielfältigung. Mobbin, Appllama, ScreensDesign und PaywallPro arbeiten so (Rechtsgrundlage meist Zitat/Fair Use plus Takedown). Abo-Käufe für Aufnahmen: App-EULA beachten (keine Weitergabe von Zugängen). | mittel | Wasserzeichen, kein Hi-Res-Bulk-Download, analytische Annotation (Schritte, Paywall-Typ, Preis), **Developer-Opt-out** und Takedown, keine kompletten In-App-Inhalte (nur Onboarding/Paywall). |
| **Reviews** | Kurze Texte oft nicht schöpferisch, aber personenbezogen (4.6) | gering bis mittel | Auszüge, Pseudonymisierung |
| **Haftungsprivileg** | Hosting-Privileg (Art. 6 DSA, US-DMCA § 512) gilt nur für **Nutzer-Uploads**, nicht für von uns selbst gesammelte Inhalte | – | Kein Verlass auf Safe Harbor. In den USA trotzdem einen DMCA-Agenten registrieren (falls Nutzer Uploads machen, z. B. Boards). |

### 4.8 Vertrieb: Verbraucher- und Wettbewerbsrecht

| Thema | Leitplanke | Quelle |
|---|---|---|
| **Fake- und kuratierte Reviews** | Keine erfundenen oder gekauften Bewertungen. Eigene Review-Seiten klar als **eigene** kennzeichnen (AppKitties `appkittie-reviews.com` ist eine eigene Domain mit nur 5★). In der EU: Anhang UWG Nr. 23b/23c (seit 28.05.2022). In den USA: **FTC-Rule 16 CFR Part 465** (seit 21.10.2024) verbietet Fake-Reviews und als unabhängig getarnte firmeneigene Review-Sites. | https://www.gesetze-im-internet.de/uwg_2004/anhang.html · https://www.ecfr.gov/current/title-16/chapter-I/subchapter-D/part-465 |
| **Affiliate-Kennzeichnung** | Affiliates und Creator müssen Werbung kennzeichnen (§ 5a Abs. 4 UWG, FTC Endorsement Guides) und das vertraglich zusichern | § 5a UWG |
| **Trial und Abo** | Klare Preisangaben, Erinnerung vor der Abbuchung. In DE gegenüber Verbrauchern **Kündigungsbutton** (§ 312k BGB) und Widerrufsrecht bei digitalen Leistungen. B2B-only-Checkout reduziert den Aufwand. | § 312k BGB https://www.gesetze-im-internet.de/bgb/__312k.html |
| **Impressum, AGB, USt** | Impressum (§ 5 DDG), AGB nach deutschem Recht mit Gerichtsstand, EU-OSS für digitale Leistungen (oder Merchant of Record) | § 5 DDG https://www.gesetze-im-internet.de/ddg/__5.html |
| **Schätzungen als Tatsachen?** | Schätzungen klar als Schätzungen kennzeichnen (Irreführungsverbot § 5 UWG). Wer konkrete Firmenumsätze falsch darstellt, riskiert Ansprüche des betroffenen Entwicklers (Kreditgefährdung § 824 BGB). | § 5 UWG, § 824 BGB |

### 4.9 Risikomatrix (Ampel) [A]

| Aktivität | Risiko | Bedingung für „grün“ |
|---|---|---|
| Funktionsumfang wie AppKittie nachbauen | 🟢 | eigener Name und eigenes Design, keine Assets |
| UI sehr ähnlich nachbauen | 🔴 | – (EU-Design, UWG § 4 Nr. 3, Urheberrecht) |
| AppKittie-Daten nutzen | 🔴 | – (Spielregel, AGB, UWG) |
| Store-Metadaten über offizielle APIs, Feeds und Sitemaps | 🟢/🟡 | Rate-Limits, robots.txt, keine Ersatz-DB |
| HTML-Scraping von Store-Detailseiten | 🟡 | robots.txt-konform, moderat, keine Umgehung |
| Interne Store-Endpunkte (Play `batchexecute`, Apple `amp-api`) | 🔴/🟡 | robots.txt verbietet sie, bei Google auch die ToS |
| Meta-Ad-Library per offizieller API | 🟢/🟡 | API-Terms einhalten |
| Meta-Ad-Library-Website scrapen | 🟡/🔴 | schriftliche Erlaubnis nötig (Meta-ADC-Terms) |
| Ad-Creatives rehosten | 🟡 | Takedown, Thumbnails, Analyse-Kontext |
| TikTok/IG-Videos rehosten | 🔴 | – (lieber Embeds) |
| Reviews pseudonymisiert analysieren | 🟢/🟡 | DSGVO-Maßnahmen (4.6) |
| Creator-Profile (öffentlich, App-Bezug) | 🟡 | Art. 14, Opt-out, keine Kontakte |
| Developer-E-Mails, Decision-Makers | 🔴 | – |
| Login, Fake-Accounts, Captcha-Umgehung | 🔴 | – |

---

## 5. Geschäftsmodell-Empfehlungen [A]

### 5.1 Zielgruppen (priorisiert)

| # | Segment | Job-to-be-done | Zahlungsbereitschaft | Kanal |
|---|---|---|---|---|
| 1 | **Indie-Founder, „Vibe-Coder“, Solo-Studios** | validierte App-Ideen finden, Wettbewerber verstehen | 20 bis 60 €/Monat, hohe Churn | X, TikTok, YouTube, Communities, AI-Assistenten |
| 2 | **App-Studios und „App-Factories“** (Copy-and-Localize-Modell) | tägliches Monitoring von Nischen, Länder-Gaps, Onboardings, Ads | 100 bis 500 €/Monat, Seats | Outbound, Partnerschaften, Content |
| 3 | **UA-, Growth- und UGC-Agenturen** | Creatives, Spend-Signale, Creator mit App-Bezug | 150 bis 600 €/Monat | Agentur-Netzwerke, LinkedIn, Konferenzen (OMR, App Promotion Summit) |
| 4 | **ASO-Freelancer und -Berater** | Keywords, Wettbewerber-Metadaten, Reports | 30 bis 150 €/Monat | Affiliate (Berater empfehlen an Kunden) |
| 5 | **App-Käufer und -Investoren** (Flippa/Acquire.com, Micro-PE) | Due-Diligence-Vorfilter, Umsatzplausibilisierung | hoch, aber Genauigkeit entscheidend | Direktvertrieb, Daten-API |
| 6 | **KI-Agenten** (als Kanal) | Tool-Calls aus ChatGPT, Claude, Cursor | nutzungsbasiert | MCP-Registries, Connector-Verzeichnisse |

### 5.2 Pricing

**Benchmark:** AppKittie 79 bzw. 49 USD; GetAppNiche 39 USD bzw. 249 USD/Jahr bzw. 299 USD lifetime; TrendApps 9 bis 69 USD; Foreplay 49 bis 459 USD;
Mobbin 10 bis 15 USD; Appllama 12 bis 16 USD; AppTweak ab 79 USD; AppBird 199 bis 399 USD.

| Plan | Preis (Vorschlag) | Inhalt | Zweck |
|---|---|---|---|
| **Free** | 0 € | öffentliche App-Seiten (SEO), Top-Charts, Schätzungen als Bänder (z. B. „10 bis 50K $/Monat“), 3 Watchlist-Apps, **100 MCP-Credits/Monat** | Akquise über Google, LLMs und Agenten |
| **Pro** | **39 €/Monat** bzw. 29 €/Monat jährlich | volle Suche und Filter, exakte Schätzungen mit Konfidenz, Ads, Onboardings, Keywords, 25 Watchlist-Apps mit Alerts, CSV, **5.000 Credits** | Kernprodukt, unter AppKitties Monatspreis |
| **Studio/Team** | **129 €/Monat** bzw. 99 €/Monat jährlich (3 Seats, +25 €/Seat) | 200 Watchlist-Apps, Länder-Gap-Reports, geteilte Boards, 25.000 Credits, Slack/Webhook-Alerts | Studios, Agenturen |
| **API/Data** | nutzungsbasiert (Credit-Pakete, z. B. 20.000 Credits für 49 €), Enterprise-Feed auf Anfrage | REST, MCP, Bulk-Export | Agenten-Kanal, Datenkäufer |
| **Early-Bird-Lifetime** | streng limitiert (≤ 200), Credits-Kontingent begrenzt | – | Cash für Dateninfrastruktur, Community-Kern. Vorsicht: laufende Datenkosten. |

**Prinzipien:** EUR-Preise in der EU, USD sonst; 7 Tage Trial **ohne Karte** oder mit E-Mail-Erinnerung 48 h vorher; 14 Tage
Geld-zurück; Kündigung im Dashboard (Kündigungsbutton); Credits im UI live anzeigen; „verbinde deine App“ schenkt Credits
(Kalibrierdaten).

### 5.3 Go-to-Market

1. **Gründergeführter Content (X, TikTok, YouTube, LinkedIn):** wöchentliche „App-Teardown“-Threads mit unseren Daten (Umsatzband,
   Onboarding-Schritte, Hooks der Top-Ads). Dazu ein **Newsletter „Winning Apps der Woche“**, auch auf Deutsch.
2. **Programmatic SEO und AI-SEO:** öffentliche, indexierbare Seiten pro App, Kategorie, Keyword, Land und Paywall-Typ (AppKittie hat
   keine Sitemap, die Lücke ist also groß). `llms.txt`, saubere strukturierte Daten, eine **ehrliche Methodik-Seite** (wird von
   LLMs bevorzugt zitiert) und faire Vergleichsseiten („vs. AppKittie, Sensor Tower, AppTweak“; § 6 UWG beachten).
3. **AI-Assistenten als Kanal:** hosted MCP-Server (Streamable HTTP, OAuth 2.1), Einträge in der offiziellen MCP-Registry, bei Smithery,
   Glama und mcpmarket; Claude-Connector, ChatGPT-App bzw. Connector, Gemini/Cursor-Doku; Agent-Skills-Repo (wie
   AppKittie, aber mit Workflows wie „Länder-Gap finden“, „Paywall-Benchmark“, „ASO-Brief“). **Free-Credits im MCP** machen das zum
   Akquisekanal. Jede Tool-Antwort enthält einen Deep-Link zur Web-App.
4. **Affiliate:** 30 bis 40 % wiederkehrend für 12 Monate (oder lebenslang wie AppKittie), Rewardful oder Tolt bzw. PartnerStack.
   Pflicht zur Werbekennzeichnung im Vertrag.
5. **Communities und Partnerschaften:** Indie-Hacker-, RevenueCat- und Adapty-Communities, App-Dev-Kurse (Bundle-Deals), deutsche
   Szene (OMR Reviews, Indie-Hacker-DACH, App-Entwickler-Meetups), Product-Hunt-Launch (AppKittie war dort nicht).
6. **Vertrauen als Marketing:** öffentliche Accuracy-Reports, Changelog, offener Takedown- und Opt-out-Prozess, DSGVO-Seite,
   Bewertungsplattformen ehrlich bespielen (Trustpilot, G2, OMR).

### 5.4 Differenzierung (Kurzliste)

| Hebel | Konkret | Warum es zieht |
|---|---|---|
| **Kalibrierte, erklärbare Schätzungen** | Konfidenzband plus Treiber („basiert auf Rank-Historie, Review-Velocity, Preis-Tiers“). Opt-in-Kalibrierung über verbundene Konten. Quartalsweiser Accuracy-Report. | größte Schwäche des Marktes. Investoren und Studios zahlen dafür. |
| **Monitoring und Alerts** | Paywall- und Preisänderungen je Land, Onboarding-Diffs, neue Creatives, Ranking-Sprünge, „neue App mit Umsatz bei <100 Reviews“ | Retention statt Einmal-Recherche |
| **Länder-Gap-Engine** | „Top in US/DE, fehlt in FR/IT/JP“ plus Lokalisierungs-Score | bildet die Copy-and-Localize-Strategie ab |
| **EU-Compliance by Design** | keine Personenkontakte, Embeds statt Rehosting, AVV, EU-Hosting, Consent | Agenturen und EU-Studios, geringeres Rechtsrisiko |
| **Agent-first** | MCP mit Free-Tier, Watchlist- und Alert-Tools, Skills | wachsender Kanal, AppKittie hat Vorsprung, aber ohne Monitoring |
| **Fair Billing** | Trial ohne Karte, Kündigungsbutton | direkte Antwort auf AppKittie-Kritik |

### 5.5 Meilensteine (Vorschlag)

| Phase | Ziel | KPI |
|---|---|---|
| 0 bis 3 Monate | MVP: iOS- und GP-Katalog, Charts und Rank-Historie, Schätzungen v1 mit Bändern, Watchlists, MCP (Basis-Tools), öffentliche App-Seiten | 1.000 Signups, 50 zahlende Kunden, MCP in 3 Registries |
| 3 bis 6 Monate | Ads (Meta EU via API, TikTok), Onboarding-Library (eigene Aufnahmen, Top 500), Keyword-Modul, Alerts | 300 zahlende Kunden, Churn < 8 %/Monat |
| 6 bis 12 Monate | Kalibrierungs-Netzwerk (verbundene Konten), Accuracy-Report v1, Team-Plan, API-Pakete | 1.000 zahlende Kunden, ≥ 15 % Umsatz über API/MCP |

---

## 6. Offene Fragen

1. **Wyoming-Registereintrag** der Algo Media LLC (Gründungsdatum, Registered Agent) nicht geprüft (interaktive SOS-Suche).
2. **EUIPO/TMview-Recherche** zu „AppKittie“ schlug technisch fehl, bitte manuell prüfen. Gleiches gilt für unseren Wunschnamen.
3. **Rollenverteilung im Team** (Co-Founder? Agentur? Beteiligung?) ist öffentlich nicht eindeutig.
4. **Herkunft der Kontaktdaten** (`decision_makers`, `hiring`, `emails`): eigenes Enrichment oder Drittanbieter? Nicht feststellbar.
5. **Inhalt der Reddit-Threads** zu AppKittie (Reddit für unseren Fetcher gesperrt) und von X-Posts (X liefert 402).
6. **Genauigkeit der AppKittie-Schätzungen**: keine unabhängige Messung gefunden.
7. **ScreensDesign-Preis**, **Peekly-Methodik** (Vercel-Checkpoint) und **Mobbin-Pricing-Seite** (403) nicht direkt verifiziert.
8. **Kommerzielle Nutzbarkeit** der Meta Ad Library API und der TikTok Commercial Content API für ein SaaS-Produkt: Terms im Detail prüfen
   (Antragsprozess, Zweckbindung).
9. **Datenbankrecht an App-Store-Daten** (Apple/Google als EU-Hersteller?) ist juristisch ungeklärt, anwaltliche Einschätzung nötig.
10. **Google v. SerpApi**: Verfahrensstand (Abweisung mit Leave to Amend?) aus Primärquelle verifizieren.

## 7. Empfehlungen für unseren Nachbau (Checkliste)

- [ ] **Name und Marke:** Shortlist von 5 Namen ohne Katzen- bzw. „-ie“-Bezug → Recherche DPMA/EUIPO/USPTO/Stores/Domains → EU-Marke (Kl. 9/35/42) anmelden.
- [ ] **Design:** eigenes Designsystem und eigene Copy. Side-by-side-Review gegen AppKittie vor dem Launch (Verwechslungs- und Nachahmungs-Check).
- [ ] **Daten-Policy (intern, verbindlich):** keine AppKittie- oder anderen Wettbewerberdaten; offizielle APIs, Feeds und Sitemaps zuerst; robots.txt-Gate im Crawler; keine Logins, Fake-Accounts oder Umgehungen; Rate-Limits; Herkunft je Datenfeld dokumentieren (Data Lineage).
- [ ] **Google Play:** nur erlaubte Pfade (`/store/apps/details`). Reviews **nicht** über `/_`-Endpunkte. Alternativen bewerten (z. B. nur Review-Statistiken der Detailseite, Opt-in-Developer-API).
- [ ] **Apple:** Search/Lookup API (≤ ca. 20 Calls/min), Marketing-RSS, öffentliche Sitemaps. Keine `amp-api`/`/v1`-Nutzung.
- [ ] **Ads:** Meta Ad Library API (EU-Daten) und TikTok Commercial Content API beantragen. Creatives als Thumbnail plus Link/Embed, Takedown-Formular.
- [ ] **Videos:** nur offizielle Embeds, eigene Kennzahlen speichern.
- [ ] **Onboarding-Library:** eigene Aufnahmen, Wasserzeichen, Developer-Opt-out, keine Hi-Res-Bulk-Downloads.
- [ ] **DSGVO-Paket:** Verzeichnis der Verarbeitungstätigkeiten, LIA (Legitimate-Interest-Assessment) für Reviews und Creator, DSFA prüfen, Art.-14-Hinweisseite und Opt-out, AVVs, Subprozessorenliste, EU-Hosting, Consent-Banner (kein Pixel vor Einwilligung).
- [ ] **Keine Personen-Kontaktdaten** im Produkt (kein `emails`/`decision_makers`-Äquivalent).
- [ ] **Recht und Vertrieb:** AGB (DE-Recht, Gerichtsstand), Impressum, Datenschutzerklärung, Kündigungsbutton, faire Trial-Logik, OSS/USt oder Merchant of Record, Affiliate-Vertrag mit Kennzeichnungspflicht.
- [ ] **Schätzungen:** immer als Schätzung mit Konfidenz kennzeichnen, Methodik-Seite, Korrekturprozess für Entwickler („Your numbers are wrong? Verify & correct“).
- [ ] **MCP/KI:** hosted MCP mit OAuth 2.1, Free-Credits, Confidence in jeder Antwort, Watchlist- und Alert-Tools, Skills-Repo, Registry-Einträge.
- [ ] **Anwaltliche Prüfung** vor dem Launch: 4.3 (DB-Recht Store-Daten), 4.5 (API-Terms Meta/TikTok), 4.6 (LIA/DSFA), 4.7 (Ad-Creative-Hosting).

---

## 8. Quellen

**AppKittie (Primär)**
- Terms: https://www.appkittie.com/terms · Privacy: https://www.appkittie.com/privacy · Affiliate: https://www.appkittie.com/affiliate (je 1 Request per curl, 25.10.2026)
- Homepage-HTML (Recon des Koordinators): `scratchpad/tech/home.html`, Header: `scratchpad/tech/headers-home.txt`
- MCP/Skills-Repo: https://github.com/appkittie/aso-mcp-skills (geklont, MIT) · MCP-Endpunkt laut README: https://mcp.appkittie.com/mcp
- RDAP: https://rdap.verisign.com/com/v1/domain/appkittie.com (analog topyappers.com, appkittie-reviews.com)
- USPTO-Markensuche (tmsearch-API, 0 Treffer „appkittie“)

**Personen und Umfeld**
- https://arrfounder.com/@jacobrodri_ · X-Posts @jacobrodri_ (IDs in 1.3) · https://shipyardhq.dev/products/appkittie · https://bowora.com/appkittie.com
- https://www.topyappers.com/ · https://www.topyappers.com/terms-of-service

**Traffic, Directories, Reviews**
- https://www.similarweb.com/website/appkittie.com/ · https://www.rankmyai.com/tools/6cd68877-2412-4764-b65d-855fd773bcc6/appkittie
- https://peerpush.com/p/appkittie · https://whatlaunched.today/en/launch/appkittie · https://creatorstoolbox.com/tools/appkittie
- https://www.trustpilot.com/review/appkittie.com · https://www.appkittie-reviews.com/ · https://mcpmarket.com/server/appkittie-app-store-intelligence
- https://x.com/Hartdrawss/status/2034200657775775914 · https://x.com/KalyfaMuhd/status/2048780654754550005

**Wettbewerb**
- https://appfigures.com/pricing · https://www.apptweak.com/en/pricing · https://www.mobileaction.co/pricing/ · https://42matters.com/pricing
- https://www.foreplay.co/pricing · https://pricingsaas.com/companies/mobbin · https://toolradar.com/tools/appllama
- https://creatify.ai/blog/sensor-tower-pricing-(2026)-plans-credits-and-what-you-ll-actually-pay
- https://tools.prnewswire.com/en-us/live/20813/release/20260512EN55509 (Sensor Tower × AppMagic)
- https://www.strataigize.com/insights/app-intelligence-tools-guide/ · https://appark.ai/en/blog/mobile-app-intelligence-guide
- https://appbird.ai/blog/app-analytics-comparison-indie-developers/ · https://trysonar.app/blog/app-revenue-estimates-how-they-work-and-fail
- https://www.saasworthy.com/product/getappniche/pricing · https://alternativeto.net/software/trend-apps/about · https://www.producthunt.com/products/appdex
- https://www.thekeyword.co/learn/magic-brief-shutting-down-alternatives · https://www.toolsurf.com/socialpeta-pricing-2026/ · https://www.getapp.sg/software/2099460/appgrowing
- https://alternativeto.net/software/screensdesign/about · https://apptopia.com/en/category/company-news/

**Recht**
- Apple Website ToU: https://www.apple.com/legal/internet-services/terms/site.html · iTunes Search API: https://performance-partners.apple.com/search-api
- Google ToS: https://policies.google.com/terms · robots.txt: https://play.google.com/robots.txt, https://apps.apple.com/robots.txt
- Meta Automated Data Collection Terms: https://www.facebook.com/apps/site_scraping_tos_terms.php · TikTok CCA: https://developers.tiktok.com/products/commercial-content-api
- DSA: https://eur-lex.europa.eu/eli/reg/2022/2065/oj · DB-RL: https://eur-lex.europa.eu/eli/dir/1996/9/oj · VO (EU) 2024/2822: https://eur-lex.europa.eu/eli/reg/2024/2822/oj
- EuGH: C-30/14, C-762/19, C-203/02, C-202/12, C-304/07, C-621/22, C-393/09, C-683/17, C-833/18, C-466/12, C-348/13, C-392/19 (curia.europa.eu, Suche per Aktenzeichen)
- BGH I ZR 224/12: https://www.lto.de/recht/hintergruende/h/bgh-urteil-izr22412-screen-scraping-flugdaten-automatisiert-auslesen-ryanair-reiseportal · BGH I ZR 159/10 (Automobil-Onlinebörse) · BGH I ZR 202/14 (wetter.de)
- hiQ: https://en.wikipedia.org/wiki/HiQ_Labs_v._LinkedIn · Meta v. Bright Data: https://www.fbm.com/data-analytics/publications/major-decision-affects-law-of-scraping-and-online-data-collection-meta-platforms-v-bright-data/
- X v. Bright Data: https://www.cnbc.com/2024/05/10/elon-musks-x-loses-lawsuit-against-bright-data-over-data-scraping.html · Google v. SerpApi: https://ipwatchdog.com/2025/12/26/google-sues-serpapi-parasitic-scraping-circumvention-protection-measures/
- CNIL KASPR: https://www.cnil.fr/en/data-scraping-kaspr-fined-eu240000 · AP NL: https://iapp.org/news/a/netherlands-dpa-issues-guidance-against-web-scraping
- EU-Design-Reform: https://www.rpclegal.com/thinking/ip/eu-design-regulation-changes-coming-1-may-2025/ · https://www.dreyfus.fr/en/2026/01/05/eu-design-protection-complete-guide-to-the-2025-reform/
- LG Hamburg LAION: https://cms.law/de/deu/legal-updates/erstes-urteil-deutschlands-zur-urheberrechtlichen-zulaessigkeit-des-ki-trainings-ergangen
- FTC 16 CFR 465: https://www.ecfr.gov/current/title-16/chapter-I/subchapter-D/part-465 · UWG/MarkenG/UrhG/BGB/DDG/TDDDG: https://www.gesetze-im-internet.de

---

## Anhang A: Methodik und verwendete Befehle

| Schritt | Befehl / Tool | Ergebnis |
|---|---|---|
| Terms/Privacy | `curl -sS -L https://www.appkittie.com/terms` (bzw. `/privacy`), HTML → Text per Python | `scratchpad/markt/terms.txt`, `privacy.txt` |
| Affiliate, llms.txt | `curl …/affiliate`, `curl …/llms.txt` (4 s Pause) | Affiliate 200, llms.txt 404 |
| Homepage-Analyse | Auswertung der vorhandenen Recon-Datei `scratchpad/tech/home.html` (kein neuer Request) | Testimonials, FAQ-JSON-LD, Tracking |
| MCP-Repo | `git clone https://github.com/appkittie/aso-mcp-skills.git` | `git log`, Code- und Doku-Analyse |
| Domains | `curl https://rdap.verisign.com/com/v1/domain/<domain>` | Registrierungsdaten, NS |
| Marke | POST `https://tmsearch.uspto.gov/prod-stage-v1-0-0/tmsearch` (Wortmarke „appkittie“, „app kittie“) | 0 Treffer |
| robots.txt Stores | `curl https://play.google.com/robots.txt`, `curl https://apps.apple.com/robots.txt` | s. 4.5 |
| X-Post-Daten | Snowflake-ID → Datum: `((id >> 22) + 1288834974657) / 1000` | s. 1.3 |
| Appllama | MCP `get_credits` (kostenlos) im Konto des Nutzers | 1.500 Credits/Monat, 90/min, 400/Tag |
| Web-Recherche | WebSearch/WebFetch (Vendor-Seiten, Directories, Rechtsquellen) | s. Quellen |

**Requests an appkittie.com durch diesen Agenten:** 4 (terms, privacy, affiliate, llms.txt), langsam, ohne Login.

## Anhang B: Was nicht ging

| Ziel | Problem |
|---|---|
| x.com (Profile/Posts) | HTTP 402. Nur Such-Snippets ausgewertet. |
| reddit.com | vom Fetch-Tool gesperrt |
| saashub.com, peerlist.io, mobbin.com/pricing, mcpservers.org | HTTP 403 |
| peekly.app | Vercel Security Checkpoint (429), **nicht umgangen** |
| screensdesign.com/pricing | client-gerendert, keine Preise im HTML |
| TMview/EUIPO-API | leere Antwort |
| api.github.com (Repo-/User-Metadaten) | für diese Session gesperrt. Repo stattdessen per `git clone` und raw-Dateien gelesen. |
| launchscroll.com, builderhustle.com, appraven.app (Vergleichsseiten) | HTTP 404 |
| viralboost.now | DNS nicht auflösbar |
