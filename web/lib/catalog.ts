// App Store genre IDs as named on Apple's own chart pages (36 = all apps).
export const APPLE_GENRES: Record<string, string> = {
  "36": "Alle Apps",
  "6000": "Business",
  "6001": "Weather",
  "6002": "Utilities",
  "6003": "Travel",
  "6004": "Sports",
  "6005": "Social Networking",
  "6006": "Reference",
  "6007": "Productivity",
  "6008": "Photo & Video",
  "6009": "News",
  "6010": "Navigation",
  "6011": "Music",
  "6012": "Lifestyle",
  "6013": "Health & Fitness",
  "6014": "Alle Spiele",
  "6015": "Finance",
  "6016": "Entertainment",
  "6017": "Education",
  "6018": "Books",
  "6020": "Medical",
  "6021": "Magazines & Newspapers",
  "6023": "Food & Drink",
  "6024": "Shopping",
  "6026": "Developer Tools",
  "6027": "Graphics & Design",
  "7001": "Spiele · Action",
  "7002": "Spiele · Adventure",
  "7003": "Spiele · Casual",
  "7004": "Spiele · Board",
  "7005": "Spiele · Card",
  "7006": "Spiele · Casino",
  "7009": "Spiele · Family",
  "7011": "Spiele · Music",
  "7012": "Spiele · Puzzle",
  "7013": "Spiele · Racing",
  "7014": "Spiele · Roleplaying",
  "7015": "Spiele · Simulation",
  "7016": "Spiele · Sports",
  "7017": "Spiele · Strategy",
  "7018": "Spiele · Trivia",
  "7019": "Spiele · Word",
};

export const CHARTS: Record<string, string> = {
  "top-free": "Top Free",
  "top-paid": "Top Paid",
  "top-grossing": "Top Grossing",
};

const regionNames = new Intl.DisplayNames(["de"], { type: "region" });

export function countryName(code: string) {
  try {
    return regionNames.of(code.toUpperCase()) ?? code.toUpperCase();
  } catch {
    return code.toUpperCase();
  }
}

export function genreName(id: string) {
  return APPLE_GENRES[id] ?? `Genre ${id}`;
}

export const DEVICES: Record<string, string> = { iphone: "iPhone", ipad: "iPad", mac: "Mac" };

// Languages an iOS app can list (ISO 639-1, as the Lookup API returns them), for the explorer filter.
export const LANGUAGES: Record<string, string> = {
  EN: "Englisch", DE: "Deutsch", FR: "Französisch", ES: "Spanisch", IT: "Italienisch", PT: "Portugiesisch",
  NL: "Niederländisch", SV: "Schwedisch", DA: "Dänisch", NB: "Norwegisch", FI: "Finnisch", PL: "Polnisch",
  CS: "Tschechisch", TR: "Türkisch", RU: "Russisch", UK: "Ukrainisch", AR: "Arabisch", HE: "Hebräisch",
  HI: "Hindi", JA: "Japanisch", KO: "Koreanisch", ZH: "Chinesisch", TH: "Thai", VI: "Vietnamesisch", ID: "Indonesisch",
};
