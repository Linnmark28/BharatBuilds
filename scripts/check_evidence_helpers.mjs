// Checks src/evidence.js and the evidence calls in src/api.js (no AWS, no browser).
//   node scripts/check_evidence_helpers.mjs
import assert from "node:assert/strict";
import {
  REVIEW_NOTICE, formatDistance, getPosition, locationLabel, proofPanelState, reviewState, scoreSourceLabel, uploadProof, validateImage,
} from "../src/evidence.js";
import {
  fetchEvidence, fetchMyEvidence, fetchNarrative, requestUploadUrl, reviewEvidence, submitEvidence, uploadPhoto,
} from "../src/api.js";

const file = (type, size) => ({ type, size, name: "p" });
assert.equal(validateImage(file("image/jpeg", 1000)), "");
assert.equal(validateImage(file("image/webp", 5 * 1024 * 1024)), "");
assert.match(validateImage(null), /Choose a photo/);
assert.match(validateImage(file("image/gif", 10)), /JPEG, PNG or WebP/);
assert.match(validateImage(file("application/pdf", 10)), /JPEG, PNG or WebP/);
assert.match(validateImage(file("image/png", 0)), /empty/);
assert.match(validateImage(file("image/png", 6 * 1024 * 1024)), /6\.0 MB.*5 MB/);

assert.equal(formatDistance(42), "42 m");
assert.equal(formatDistance(1234), "1.2 km");
assert.match(locationLabel({ location_status: "verified", distance_m: 12 }), /verified \(12 m from the asset\)/);
assert.match(locationLabel({ location_status: "not_verified", distance_m: 2400 }), /not verified \(2\.4 km away\)/);
assert.equal(locationLabel({ location_status: "unavailable" }), "location not shared");
assert.equal(locationLabel({}), "location not shared");

const state = { live: true, signedIn: true, userWardId: "DM-1", assetWardId: "DM-1" };
assert.equal(proofPanelState({ ...state, live: false }), "demo");
assert.equal(proofPanelState({ ...state, signedIn: false }), "login");
assert.equal(proofPanelState({ ...state, assetWardId: "DM-2" }), "other-ward");
assert.equal(proofPanelState(state), "can-upload");
console.log("ok  photo rules, location labels and panel states");

const unreviewed = { evidence_id: "e1", status: "unverified" };
const review = (overrides) => reviewState({ panel: "can-upload", entry: unreviewed, mineIds: [], ...overrides });
assert.equal(review({}), "can-review");
assert.equal(review({ mineIds: ["e1"] }), "own");
assert.equal(review({ mineIds: ["other"] }), "can-review");
assert.equal(review({ mineIds: undefined }), "none", "no buttons until we know which photos are the citizen's own");
assert.equal(review({ entry: { ...unreviewed, status: "verified" } }), "none");
assert.equal(review({ entry: { ...unreviewed, status: "disputed" } }), "none");
for (const panel of ["demo", "login", "other-ward"]) assert.equal(review({ panel }), "none", panel);
assert.match(REVIEW_NOTICE.confirm, /Confirmed/);
assert.match(REVIEW_NOTICE.dispute, /Disputed/);
console.log("ok  review buttons: only a ward citizen, only on someone else's unreviewed photo");

assert.equal(scoreSourceLabel({ score_source: "live", verified_assets: 3 }), "LIVE · 3 verified assets");
assert.equal(scoreSourceLabel({ score_source: "blended", verified_assets: 1 }), "PARTLY LIVE · 1 verified asset");
assert.equal(scoreSourceLabel({ score_source: "seeded", verified_assets: 0 }), "");
assert.equal(scoreSourceLabel({}), "", "bundled demo wards carry no source tag");
console.log("ok  score source tags");

const fakeGeo = (result) => ({
  getCurrentPosition: (ok, fail) => (result ? ok({ coords: { latitude: result[0], longitude: result[1] } }) : fail(new Error("denied"))),
});
assert.deepEqual(await getPosition(fakeGeo([28.5, 77.2])), { lat: 28.5, lng: 77.2 });
assert.equal(await getPosition(fakeGeo(null)), null);
assert.equal(await getPosition(undefined), null);
console.log("ok  location is shared when allowed and null when denied");

// The three steps run in order, and a failed step stops the rest.
const order = [];
const api = {
  requestUploadUrl: async (token, asset, type) => { order.push(["url", token, asset, type]); return { url: "u", fields: {}, key: "k" }; },
  uploadPhoto: async (presigned, f) => { order.push(["upload", presigned.key, f.name]); },
  submitEvidence: async (token, payload) => { order.push(["submit", payload]); return { ok: true }; },
};
const good = file("image/png", 100);
assert.deepEqual(await uploadProof({ file: good, assetId: "A1", verdict: "broken", idToken: "T", position: { lat: 1, lng: 2 }, api }), { ok: true });
assert.deepEqual(order, [
  ["url", "T", "A1", "image/png"],
  ["upload", "k", "p"],
  ["submit", { asset_id: "A1", key: "k", verdict: "broken", lat: 1, lng: 2 }],
]);
order.length = 0;
await uploadProof({ file: good, assetId: "A1", verdict: "working", idToken: "T", position: null, api });
assert.deepEqual(order[2], ["submit", { asset_id: "A1", key: "k", verdict: "working" }], "no coordinates are sent when location is not shared");
order.length = 0;
await assert.rejects(() => uploadProof({ file: file("image/gif", 1), assetId: "A1", verdict: "broken", idToken: "T", api }), /JPEG/);
assert.deepEqual(order, [], "an invalid photo never reaches the server");
await assert.rejects(
  () => uploadProof({ file: good, assetId: "A1", verdict: "broken", idToken: "T", api: { ...api, uploadPhoto: async () => { throw new Error("upload failed"); } } }),
  /upload failed/,
);
console.log("ok  upload runs url -> S3 -> record, and stops on the first failure");

// The real api.js calls, with a fake fetch.
const seen = [];
const fake = (status, payload) => async (url, options = {}) => {
  seen.push({ url, method: options.method, cache: options.cache, body: options.body, auth: options.headers?.Authorization });
  return { ok: status < 400, status, json: async () => payload };
};
await requestUploadUrl("T", "AST-1", "image/png", "https://api.test", fake(200, { key: "k" }));
assert.deepEqual(seen[0], {
  url: "https://api.test/evidence/upload-url", method: "POST", cache: undefined,
  body: '{"asset_id":"AST-1","content_type":"image/png"}', auth: "T",
});
await submitEvidence("T", { asset_id: "AST-1", key: "k", verdict: "broken" }, "https://api.test", fake(201, {}));
assert.equal(seen[1].url, "https://api.test/evidence");
const items = await fetchEvidence("AST 1", "https://api.test", fake(200, { count: 1, items: [{ evidence_id: "e" }] }));
assert.deepEqual(items, [{ evidence_id: "e" }]);
assert.equal(seen[2].url, "https://api.test/assets/AST%201/evidence");
assert.equal(seen[2].cache, "no-store");
await assert.rejects(() => fetchEvidence("A", "", fake(200, {})), /not configured/);

const reviewed = await reviewEvidence("T", { asset_id: "AST-1", evidence_id: "e1", decision: "confirm" }, "https://api.test", fake(200, { status: "verified", asset_status: "dead" }));
assert.deepEqual(reviewed, { status: "verified", asset_status: "dead" });
assert.deepEqual(seen[3], {
  url: "https://api.test/evidence/review", method: "POST", cache: undefined,
  body: '{"asset_id":"AST-1","evidence_id":"e1","decision":"confirm"}', auth: "T",
});
await assert.rejects(
  () => reviewEvidence("T", {}, "https://api.test", fake(403, { error: "you cannot review your own photo" })),
  (error) => error.status === 403 && /own photo/.test(error.message),
);
assert.deepEqual(await fetchMyEvidence("T", "AST 1", "https://api.test", fake(200, { asset_id: "AST 1", evidence_ids: ["e1"] })), ["e1"]);
assert.equal(seen.at(-1).url, "https://api.test/evidence/mine?asset_id=AST%201");
assert.equal(seen.at(-1).method, "GET");
assert.equal(seen.at(-1).auth, "T");

let sent;
await uploadPhoto({ url: "https://bucket.test/", fields: { key: "k", "Content-Type": "image/png" } }, new Blob(["x"], { type: "image/png" }), async (url, options) => {
  sent = { url, method: options.method, names: [...options.body.keys()] };
  return { ok: true, status: 204 };
});
assert.deepEqual(sent, { url: "https://bucket.test/", method: "POST", names: ["key", "Content-Type", "file"] });
await assert.rejects(
  () => uploadPhoto({ url: "u", fields: {} }, new Blob(["x"]), async () => ({ ok: false, status: 403 })),
  /failed \(403\)/,
);
console.log("ok  API calls: signed upload request, file sent last to S3, record, public list");

// Ward summary: public, one request, and anything unusable is an error the page can hide.
const summary = { ward_id: "DM-1", text: "A short summary.", source: "ai" };
const asked = [];
const summaryFetch = (status, payload) => async (url, options) => {
  asked.push({ url, hasSignal: Boolean(options.signal), auth: options.headers?.Authorization });
  return { ok: status < 400, status, json: async () => payload };
};
assert.deepEqual(await fetchNarrative("DM 1", "https://api.test", summaryFetch(200, summary)), summary);
assert.deepEqual(asked[0], { url: "https://api.test/wards/DM%201/narrative", hasSignal: true, auth: undefined });
await assert.rejects(() => fetchNarrative("DM-1", "https://api.test", summaryFetch(404, {})), /returned 404/);
await assert.rejects(() => fetchNarrative("DM-1", "https://api.test", summaryFetch(200, { text: "" })), /empty/);
await assert.rejects(() => fetchNarrative("DM-1", "", summaryFetch(200, summary)), /not configured/);
console.log("ok  ward summary request and failure handling");
