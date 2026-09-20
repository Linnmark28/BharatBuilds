// Rules and labels for the Social Watch page (kept free of React so they can be tested).
const CLAIMS = {
  broken_or_hazard: "Reports a failure or hazard",
  repaired_or_working: "Reports a fix",
  progress_or_plan: "Works planned or under way",
  unclear: "Claim unclear",
};

export const claimLabel = (claim) => CLAIMS[claim] ?? CLAIMS.unclear;

export const assetTypeLabel = (type) => (type && type !== "none" ? type : "No tracked asset type");

// Headlines link out to publishers; only ordinary web links are ever used as a href.
export const safeUrl = (url) => (/^https?:\/\//i.test(String(url ?? "")) ? url : "#");

export const formatPublished = (iso) =>
  iso
    ? new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric", timeZone: "UTC" })
    : "date unknown";

// What the visitor can do with one report.
//   done        already linked or dismissed
//   citywide    no ward is named, so nobody can review it
//   sign-in     it names a ward, but the visitor is signed out
//   other-ward  it names a different ward from the visitor's
//   review      a citizen of the named ward, report still awaiting a decision
export function reviewAccess({ signal, user }) {
  if (signal.review_state !== "needs_review") return "done";
  if (!signal.ward) return "citywide";
  if (!user) return "sign-in";
  return user.wardId === signal.ward.ward_id ? "review" : "other-ward";
}
