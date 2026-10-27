import { CHARTS, countryName } from "@/lib/catalog";
import { formatNumber, formatPrice } from "@/lib/format";
import type { EventKind } from "@/lib/queries";

export const EVENT_LABEL: Record<EventKind, string> = {
  top100_entry: "Neu in den Top 100",
  rank_up: "Aufstieg",
  rank_down: "Abstieg",
  ratings_spike: "Bewertungs-Sprung",
  installs_spike: "Installations-Sprung",
  price_change: "Preisänderung",
  new_version: "Neue Version",
};

type Event = { kind: EventKind; country: string; chart: string; old_value: string | null; new_value: string | null; magnitude: number };

/** One event as a short German sentence. */
export function EventText({ event, withCountry = true }: { event: Event; withCountry?: boolean }) {
  const chart = CHARTS[event.chart] ?? event.chart;
  const where = withCountry && event.country && event.country !== "ww" ? ` (${countryName(event.country)})` : "";
  switch (event.kind) {
    case "rank_up":
      return <>steigt in {chart}{where} von #{event.old_value} auf #{event.new_value} <span className="text-good">+{event.magnitude}</span></>;
    case "rank_down":
      return <>fällt in {chart}{where} von #{event.old_value} auf #{event.new_value} <span className="text-bad">−{event.magnitude}</span></>;
    case "top100_entry":
      return <>neu in den Top 100 von {chart}{where}: #{event.new_value}{event.old_value ? ` (vorher #${event.old_value})` : ""}</>;
    case "ratings_spike":
      return <><span className="text-good">+{formatNumber(Math.round(event.magnitude))}</span> Bewertungen pro Tag{where ? ` im Store${where}` : ""}</>;
    case "installs_spike":
      return <><span className="text-good">+{formatNumber(Math.round(event.magnitude))}</span> Installationen pro Tag</>;
    case "price_change":
      return <>Preis {formatPrice(event.old_value, "USD")} → {formatPrice(event.new_value, "USD")}{where}</>;
    case "new_version":
      return <>Version {event.old_value} → {event.new_value}</>;
  }
}
