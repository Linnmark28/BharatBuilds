// Rules and helpers for citizen photo evidence (kept free of React so they can be tested).
export const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
export const MAX_BYTES = 5 * 1024 * 1024;

// Returns "" when the file can be uploaded, otherwise a message for the citizen.
export function validateImage(file) {
  if (!file) return "Choose a photo first.";
  if (!ALLOWED_TYPES.includes(file.type)) return "The photo must be a JPEG, PNG or WebP image.";
  if (file.size === 0) return "That file is empty.";
  if (file.size > MAX_BYTES) {
    return `That photo is ${(file.size / 1024 / 1024).toFixed(1)} MB. The limit is 5 MB.`;
  }
  return "";
}

export const formatDistance = (metres) =>
  metres >= 1000 ? `${(metres / 1000).toFixed(1)} km` : `${metres} m`;

export function locationLabel(entry) {
  if (entry.location_status === "verified") return `location verified (${formatDistance(entry.distance_m)} from the asset)`;
  if (entry.location_status === "not_verified") return `location not verified (${formatDistance(entry.distance_m)} away)`;
  return "location not shared";
}

// What the upload panel should offer this visitor.
//   demo        data is not from the API, so keep the local-only widget
//   login       not signed in
//   other-ward  signed in, but the asset is in a different ward
//   can-upload  signed in, and the asset is in the citizen's own ward
export function proofPanelState({ live, signedIn, userWardId, assetWardId }) {
  if (!live) return "demo";
  if (!signedIn) return "login";
  return userWardId === assetWardId ? "can-upload" : "other-ward";
}

// What the signed-in citizen may do with one photo in the timeline.
//   can-review  a ward citizen looking at someone else's photo that still awaits a second person
//   own         their own photo that still awaits a second person
//   none        already reviewed, or the visitor cannot review (not signed in, other ward, ids not loaded yet)
export function reviewState({ panel, entry, mineIds }) {
  if (panel !== "can-upload" || entry.status !== "unverified" || !Array.isArray(mineIds)) return "none";
  return mineIds.includes(entry.evidence_id) ? "own" : "can-review";
}

// A short tag when citizen evidence has moved a ward's score; "" for seeded or demo scores.
export function scoreSourceLabel(ward) {
  const count = ward.verified_assets ?? 0;
  const assets = `${count} verified ${count === 1 ? "asset" : "assets"}`;
  if (ward.score_source === "live") return `LIVE · ${assets}`;
  if (ward.score_source === "blended") return `PARTLY LIVE · ${assets}`;
  return "";
}

export const REVIEW_NOTICE = {
  confirm: "Confirmed. Thank you for being the second pair of eyes.",
  dispute: "Disputed. The photo stays visible but does not count.",
};

// The citizen's coordinates, or null if they decline or the device cannot say.
export function getPosition(geolocation = globalThis.navigator?.geolocation, timeoutMs = 8000) {
  return new Promise((resolve) => {
    if (!geolocation) return resolve(null);
    geolocation.getCurrentPosition(
      (position) => resolve({ lat: position.coords.latitude, lng: position.coords.longitude }),
      () => resolve(null),
      { enableHighAccuracy: true, timeout: timeoutMs, maximumAge: 30000 },
    );
  });
}

// api = { requestUploadUrl, uploadPhoto, submitEvidence } (passed in so tests can fake them).
export async function uploadProof({ file, assetId, verdict, idToken, position, api }) {
  const problem = validateImage(file);
  if (problem) throw new Error(problem);
  const presigned = await api.requestUploadUrl(idToken, assetId, file.type);
  await api.uploadPhoto(presigned, file);
  return api.submitEvidence(idToken, { asset_id: assetId, key: presigned.key, verdict, ...(position ?? {}) });
}
