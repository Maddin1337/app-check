import type { Metadata } from "next";
import Link from "next/link";
import { Suspense, type ReactNode } from "react";

import { Card, Skeleton } from "@/components/ui";
import { formatDate, formatNumber, formatUsd } from "@/lib/format";
import { methodology, type AnchorRow } from "@/lib/queries";

export const metadata: Metadata = { title: "Methodik" };

export default function MethodologyPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Methodik</h1>
        <p className="mt-1 text-sm text-muted">
          Was wir messen, was wir schätzen und wie gut die Schätzungen sind. Alle Daten stammen aus eigener Erhebung bei
          App Store und Google Play; wir übernehmen keine Zahlen anderer Datenanbieter.
        </p>
      </header>

      <div className="grid gap-5 md:grid-cols-2">
        <Card title="Gemessen">
          <List items={[
            "Katalog aus den Sitemaps beider Stores",
            "Metadaten, Preise, Bewertungen (iOS pro Store) über Apples Lookup-API und die Play-Detailseiten",
            "Exakte Installationszahl bei Google Play, täglich für wichtige Apps",
            "Charts Top Free, Top Paid und Top Grossing in 40 Ländern, täglich",
            "Liste der In-App-Käufe mit Preisen von den App-Store-Seiten, wöchentlich",
          ]} />
        </Card>
        <Card title="Geschätzt">
          <List items={[
            "Downloads pro Tag bei iOS (Apple veröffentlicht keine Download-Zahlen)",
            "Umsatz pro Monat bei iOS und Android",
            "Wachstum bei iOS als Zuwachs der Bewertungen, ein Signal für Downloads, keine Download-Zahl",
          ]} />
          <p className="px-4 pb-4 text-xs text-muted">
            Jede Schätzung erscheint als Spanne (P10 bis P90) mit Konfidenz. Fehlt ein Wert, ist er unbekannt, nicht null.
          </p>
        </Card>
      </div>

      <Suspense fallback={<Card><Skeleton rows={8} /></Card>}>
        <LiveSections />
      </Suspense>

      <Card title="Grenzen">
        <List items={[
          "iOS-Schätzungen gelten für den US App Store. Andere Länder folgen, sobald dort geeicht werden kann.",
          "Umsatz heißt Umsatz über die Stores, brutto. Werbeeinnahmen, Web-Checkout und andere Kanäle fehlen.",
          "Die Grossing-Kurve ist an wenigen Apps geeicht; ihre Steigung ist noch nicht gemessen, sondern angenommen.",
          "Apps, deren Abo ein Nebengeschäft ist, werden außerhalb der Top-Grossing-Charts eher überschätzt.",
          "Zeitreihen beginnen am 26.10.2026; Wachstum über längere Zeiträume entsteht erst mit der Historie.",
        ]} />
      </Card>

      <Card title="Aktualisierung (UTC)">
        <List items={[
          "01:05 Charts aller Länder inklusive Top Grossing, danach Refresh-Planung",
          "ab 02:15 Metadaten und Bewertungen aller iOS-Apps, danach Wachstum, Eichung, Schätzungen und Ereignisse",
          "13:00 Preislisten der In-App-Käufe (8.000 Apps pro Tag), danach Schätzungen",
          "laufend Google-Play-Detailseiten: wichtige Apps täglich, der Rest wöchentlich bis monatlich",
        ]} />
      </Card>
    </div>
  );
}

async function LiveSections() {
  const { calibration, anchors, counts } = await methodology();
  const scale = calibration.grossing_top;
  const anchorRank = calibration.grossing_anchor_rank?.value;

  return (
    <>
      <Card title="Downloads">
        <table className="w-full text-sm">
          <tbody>
            <MethodRow name="Platz in den US-Gesamtcharts (iPhone)" confidence="mittel">
              Rangkurve mit Werten aus öffentlichen Marktberichten: Platz 1 ≈ 156.000 Downloads pro Tag, Platz 10 ≈ 50.000.
              Median der letzten drei Chart-Tage.
            </MethodRow>
            <MethodRow name="Platz in einem Kategorie-Chart" confidence="niedrig">
              Dieselbe Kurve, pro Kategorie skaliert an Apps, die zugleich im Gesamtchart stehen. Wer nicht im Gesamtchart
              steht, liegt unter dessen letztem Platz.
            </MethodRow>
            <MethodRow name="Zuwachs der Bewertungen (iOS)" confidence="niedrig">
              Neue Bewertungen pro Tag × Downloads je Bewertung, gelernt an den Chart-Apps.
            </MethodRow>
            <MethodRow name="Installationszähler (Android)" confidence="mittel">
              Gemessen: tägliche Zunahme der exakten Installationszahl.
            </MethodRow>
          </tbody>
        </table>
      </Card>

      <Card title="Umsatz">
        <table className="w-full text-sm">
          <tbody>
            <MethodRow name="Platz im US-Top-Grossing-Chart" confidence="mittel">
              Rangkurve, deren Skala an berichteten Umsätzen börsennotierter App-Firmen geeicht ist
              {scale ? (
                <> ({formatNumber(scale.anchors)} Vergleichs-Apps, Stand {formatDate(scale.computed_at)}): Platz 1 ≈{" "}
                  {formatUsd(scale.value)} pro Tag, {formatNumber(Math.round((scale.value / scale.prior) * 100) / 100)}-mal
                  der ungeeichte Startwert{scale.spread != null ? `; typische Abweichung der Vergleichs-Apps Faktor ${formatNumber(Math.round(Math.exp(scale.spread) * 10) / 10)}` : ""}.</>
              ) : " (noch nicht geeicht)."}{" "}
              {anchorRank ? `Über Platz ${formatNumber(anchorRank)} gibt es keinen Vergleichswert; dort ist der Wert hochgerechnet und die Konfidenz niedrig.` : ""}
            </MethodRow>
            <MethodRow name="Downloads × Erlös pro Download" confidence="niedrig">
              Für Apps ohne Grossing-Platz: Erlös pro Download je Monetarisierung (Abo, In-App-Käufe, Kaufpreis), angepasst an
              das Preisniveau aus der In-App-Kauf-Liste. Wer nicht in den Top 100 Grossing steht, liegt unter dem Wert von
              Platz 100.
            </MethodRow>
          </tbody>
        </table>
        <p className="border-t border-border px-4 py-3 text-xs text-muted">
          Brutto = was Kundinnen und Kunden zahlen, ohne Mehrwertsteuer. Netto zieht die Store-Gebühr ab (15 % für kleine
          Anbieter und Abos, sonst 30 %). Aktuell {formatNumber(counts.estimates)} Apps mit Schätzung, davon{" "}
          {formatNumber(counts.with_revenue)} mit Umsatz{counts.day ? ` (Stand ${formatDate(counts.day)})` : ""}.
        </p>
      </Card>

      <Card title="Vergleichswerte" aside={<span className="text-xs text-muted">berichtete Umsätze, Q2 2026</span>}>
        <p className="px-4 pt-3 text-xs leading-relaxed text-muted">
          Die Firmen berichten meist weltweit und über alle Plattformen. Für den Vergleich mit dem US App Store rechnen wir
          mit Spannen für den US-Anteil, den iOS-Anteil und den Anteil, der über Apple abgerechnet wird. Diese Anteile sind
          Annahmen; die berichteten Umsätze sind es nicht.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="text-left text-xs text-muted">
              <tr className="border-b border-border">
                <th className="px-4 py-2 font-medium">App</th>
                <th className="px-3 py-2 text-right font-medium">Grossing-Platz</th>
                <th className="px-3 py-2 text-right font-medium">Berichtet / Monat</th>
                <th className="px-3 py-2 text-right font-medium">US App Store (Annahme)</th>
                <th className="px-3 py-2 text-right font-medium">Unsere Schätzung</th>
                <th className="px-4 py-2 font-medium">Abgleich</th>
              </tr>
            </thead>
            <tbody>
              {anchors.map((a) => <AnchorTableRow key={a.store_id} anchor={a} />)}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  );
}

function AnchorTableRow({ anchor: a }: { anchor: AnchorRow }) {
  const verdict = a.estimate == null ? "–"
    : a.estimate < a.truth_low ? `zu niedrig (Faktor ${factor(a.truth_low / a.estimate)})`
    : a.estimate > a.truth_high ? `zu hoch (Faktor ${factor(a.estimate / a.truth_high)})`
    : "in der Spanne";
  return (
    <tr className="border-b border-border last:border-0">
      <td className="px-4 py-2">
        <Link href={`/app/${a.platform}/${encodeURIComponent(a.store_id)}`} className="font-medium hover:text-primary">{a.app}</Link>
        <a href={a.source_url} target="_blank" rel="noreferrer" className="ml-2 text-xs text-primary hover:underline">Quelle</a>
      </td>
      <td className="px-3 py-2 text-right tabular-nums">{a.grossing_rank ? `#${a.grossing_rank}` : "–"}</td>
      <td className="px-3 py-2 text-right tabular-nums">{formatUsd(a.reported_month_usd)}</td>
      <td className="px-3 py-2 text-right tabular-nums">{formatUsd(a.truth_low)} – {formatUsd(a.truth_high)}</td>
      <td className="px-3 py-2 text-right tabular-nums">{formatUsd(a.estimate)}</td>
      <td className={`px-4 py-2 text-xs ${verdict === "in der Spanne" ? "text-good" : "text-muted"}`}>{verdict}</td>
    </tr>
  );
}

const factor = (value: number) => value.toLocaleString("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function MethodRow({ name, confidence, children }: { name: string; confidence: string; children: ReactNode }) {
  return (
    <tr className="border-b border-border align-top last:border-0">
      <th className="w-56 px-4 py-3 text-left font-medium">
        {name}
        <span className="mt-0.5 block text-xs font-normal text-muted">Konfidenz {confidence}</span>
      </th>
      <td className="px-4 py-3 text-muted">{children}</td>
    </tr>
  );
}

function List({ items }: { items: string[] }) {
  return (
    <ul className="list-disc space-y-1.5 py-3 pr-4 pl-8 text-sm">
      {items.map((item) => <li key={item}>{item}</li>)}
    </ul>
  );
}
