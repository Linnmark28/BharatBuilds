// Loads wards and assets from the Nirvasan API and reshapes them into the
// structures the UI already uses. Returns null on any problem so the app can
// keep running on its bundled demo data.
const API_BASE = (import.meta.env?.VITE_API_BASE_URL || "").replace(/\/$/, "");
const TIMEOUT_MS = 6000;

const byDisplayOrder = (a, b) =>
  (a.display_order ?? Number.MAX_SAFE_INTEGER) -
  (b.display_order ?? Number.MAX_SAFE_INTEGER);

// Storage-only fields the UI does not use; every other field passes through.
const WARD_STORAGE_FIELDS = [
  "demo_id", "ward_id", "monitored", "display_order", "dm_ward_no",
  "dm_ward_name", "geometry_source", "myneta_wards", "metrics_source", "data_source_tag",
];
const ASSET_STORAGE_FIELDS = ["asset_id", "ward_id", "demo_ward_id", "data_source_tag", "display_order"];

const withoutFields = (item, fields) => {
  const copy = { ...item };
  fields.forEach((field) => delete copy[field]);
  return copy;
};

export const adaptWard = (ward) => ({
  id: ward.demo_id,
  wardId: ward.ward_id,
  ...withoutFields(ward, WARD_STORAGE_FIELDS),
});

export const adaptAsset = (asset) => ({
  id: asset.asset_id,
  ward: asset.demo_ward_id,
  wardId: asset.ward_id,
  ...withoutFields(asset, ASSET_STORAGE_FIELDS),
});

const isUsable = ({ wards, assets }) =>
  wards.length > 0 &&
  assets.length > 0 &&
  wards.every((w) => w.id && w.name) &&
  assets.every((a) => a.id && a.ward && typeof a.lat === "number");

async function getItems(baseUrl, path, fetchImpl, init = {}) {
  const response = await fetchImpl(`${baseUrl}${path}`, {
    signal: AbortSignal.timeout(TIMEOUT_MS),
    ...init,
  });
  if (!response.ok) throw new Error(`${path} returned ${response.status}`);
  const body = await response.json();
  if (!Array.isArray(body.items)) throw new Error(`${path} returned no items`);
  return body.items;
}

// Calls for the signed-in citizen. Errors carry the server's message and status.
async function authedRequest(path, { idToken, method = "GET", body, baseUrl = API_BASE, fetchImpl = fetch }) {
  if (!baseUrl) throw new Error("API address is not configured");
  const response = await fetchImpl(`${baseUrl}${path}`, {
    method,
    headers: { Authorization: idToken, ...(body ? { "Content-Type": "application/json" } : {}) },
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  let payload = {};
  try {
    payload = (await response.json()) ?? {};
  } catch {
    // The body was not JSON; the status code is still reported below.
  }
  if (!response.ok) {
    const error = new Error(payload.error || `the server answered ${response.status}`);
    error.status = response.status;
    throw error;
  }
  return payload;
}

// The signed-in citizen as the server sees them (proves the token is accepted).
export const fetchMe = (idToken, baseUrl = API_BASE, fetchImpl = fetch) =>
  authedRequest("/me", { idToken, baseUrl, fetchImpl });

export const postRating = (idToken, stars, baseUrl = API_BASE, fetchImpl = fetch) =>
  authedRequest("/ratings", { idToken, method: "POST", body: { stars }, baseUrl, fetchImpl });

export const fetchMyRating = (idToken, baseUrl = API_BASE, fetchImpl = fetch) =>
  authedRequest("/ratings/mine", { idToken, baseUrl, fetchImpl });

// Photo evidence: ask for a signed upload, send the photo to S3, then record it.
export const requestUploadUrl = (idToken, assetId, contentType, baseUrl = API_BASE, fetchImpl = fetch) =>
  authedRequest("/evidence/upload-url", {
    idToken, method: "POST", body: { asset_id: assetId, content_type: contentType }, baseUrl, fetchImpl,
  });

export async function uploadPhoto(presigned, file, fetchImpl = fetch) {
  const form = new FormData();
  Object.entries(presigned.fields).forEach(([name, value]) => form.append(name, value));
  form.append("file", file); // S3 requires the file to be the last field
  const response = await fetchImpl(presigned.url, {
    method: "POST",
    body: form,
    signal: AbortSignal.timeout(60000),
  });
  if (!response.ok) throw new Error(`the photo upload failed (${response.status})`);
}

export const submitEvidence = (idToken, payload, baseUrl = API_BASE, fetchImpl = fetch) =>
  authedRequest("/evidence", { idToken, method: "POST", body: payload, baseUrl, fetchImpl });

// Public: a short plain-language summary of a ward, written from its verified figures.
// The first request after the facts change can take a few seconds while the model writes it.
export async function fetchNarrative(wardId, baseUrl = API_BASE, fetchImpl = fetch) {
  if (!baseUrl) throw new Error("API address is not configured");
  const response = await fetchImpl(`${baseUrl}/wards/${encodeURIComponent(wardId)}/narrative`, {
    signal: AbortSignal.timeout(15000),
  });
  if (!response.ok) throw new Error(`the summary returned ${response.status}`);
  const body = await response.json();
  if (typeof body.text !== "string" || !body.text) throw new Error("the summary was empty");
  return body;
}

// News reports for Social Watch: {count, items, pipeline}. The first request after new items
// arrive can take a few seconds while Amazon Nova reads them; later ones are instant.
export async function fetchSignals(baseUrl = API_BASE, fetchImpl = fetch) {
  if (!baseUrl) throw new Error("API address is not configured");
  const response = await fetchImpl(`${baseUrl}/signals`, { cache: "no-store", signal: AbortSignal.timeout(20000) });
  if (!response.ok) throw new Error(`the reports returned ${response.status}`);
  const body = await response.json();
  if (!Array.isArray(body.items)) throw new Error("the reports were not in the expected format");
  return body;
}

// A citizen of the ward the report names links it to one of the ward's assets, or dismisses it.
export const reviewSignal = (idToken, signalId, payload, baseUrl = API_BASE, fetchImpl = fetch) =>
  authedRequest(`/signals/${encodeURIComponent(signalId)}/review`, {
    idToken, method: "POST", body: payload, baseUrl, fetchImpl,
  });

// Two-person verification: a second citizen of the ward confirms or disputes a photo.
export const reviewEvidence = (idToken, payload, baseUrl = API_BASE, fetchImpl = fetch) =>
  authedRequest("/evidence/review", { idToken, method: "POST", body: payload, baseUrl, fetchImpl });

// Ids of the caller's own photos on an asset (a citizen cannot review those).
export const fetchMyEvidence = async (idToken, assetId, baseUrl = API_BASE, fetchImpl = fetch) => {
  const body = await authedRequest(`/evidence/mine?asset_id=${encodeURIComponent(assetId)}`, {
    idToken, baseUrl, fetchImpl,
  });
  return body.evidence_ids;
};

// Public: the newest photos for an asset, with short-lived links.
export const fetchEvidence = (assetId, baseUrl = API_BASE, fetchImpl = fetch) => {
  if (!baseUrl) return Promise.reject(new Error("API address is not configured"));
  return getItems(baseUrl, `/assets/${encodeURIComponent(assetId)}/evidence`, fetchImpl, { cache: "no-store" });
};

export async function loadLiveData(baseUrl = API_BASE, fetchImpl = fetch) {
  if (!baseUrl) return null;
  try {
    const [rawWards, rawAssets] = await Promise.all([
      getItems(baseUrl, "/wards?monitored=true", fetchImpl),
      getItems(baseUrl, "/assets", fetchImpl),
    ]);
    const live = {
      wards: rawWards.sort(byDisplayOrder).map(adaptWard),
      assets: rawAssets.sort(byDisplayOrder).map(adaptAsset),
    };
    return isUsable(live) ? live : null;
  } catch (error) {
    console.warn("Nirvasan API unavailable, using bundled demo data:", error.message);
    return null;
  }
}
