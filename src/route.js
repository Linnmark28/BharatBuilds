// Page addresses for the single-page app, kept in the URL hash so a refresh (or a shared link)
// reopens the same page and the browser's Back and Forward buttons work. A hash needs no
// server rewrite rules, so it works on any static host.
//   #/leaderboard                     #/rep-profile?ward=Kalkaji                #/civic-proof?asset=AST-0421
export const TAB_SLUGS = {
  Map: "map",
  Leaderboard: "leaderboard",
  "Ward Compare": "ward-compare",
  Alerts: "alerts",
  "Civic Data": "civic-data",
  "Rep Profile": "rep-profile",
  Officers: "officers",
  "Social Watch": "social-watch",
  "Report Asset": "report-asset",
  "Civic Proof": "civic-proof",
  "Login / Signup": "login",
};

const TAB_BY_SLUG = Object.fromEntries(Object.entries(TAB_SLUGS).map(([name, slug]) => [slug, name]));

// Anything unrecognised (empty hash, old link, typo) opens the map.
export function parseLocation(hash) {
  const [path, query = ""] = String(hash ?? "").replace(/^#\/?/, "").split("?");
  const params = new URLSearchParams(query);
  return { tab: TAB_BY_SLUG[path] ?? "Map", ward: params.get("ward") || null, asset: params.get("asset") || null };
}

// Only the context a page needs is kept: the ward on the map and profile, the asset on Civic Proof.
export function buildLocation({ tab, ward, asset }) {
  const params = new URLSearchParams();
  if (ward && ward !== "All wards" && (tab === "Map" || tab === "Rep Profile")) params.set("ward", ward);
  if (asset && tab === "Civic Proof") params.set("asset", asset);
  const query = params.toString();
  return `#/${TAB_SLUGS[tab] ?? TAB_SLUGS.Map}${query ? `?${query}` : ""}`;
}
