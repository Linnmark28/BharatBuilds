// Checks src/signals.js and the signal calls in src/api.js (no AWS, no browser).
//   node scripts/check_signal_helpers.mjs
import assert from "node:assert/strict";
import {
  assetTypeLabel, claimLabel, formatPublished, reviewAccess, safeUrl,
} from "../src/signals.js";
import { fetchSignals, reviewSignal } from "../src/api.js";

assert.equal(claimLabel("broken_or_hazard"), "Reports a failure or hazard");
assert.equal(claimLabel("progress_or_plan"), "Works planned or under way");
assert.equal(claimLabel("something-new"), "Claim unclear");
assert.equal(assetTypeLabel("Streetlight"), "Streetlight");
assert.equal(assetTypeLabel("none"), "No tracked asset type");
assert.equal(assetTypeLabel(undefined), "No tracked asset type");
assert.equal(formatPublished("2026-09-06T04:30:00+00:00"), "06 Sept 2026".replace("Sept", new Date("2026-09-06T00:00:00Z").toLocaleDateString("en-GB", { month: "short", timeZone: "UTC" })));
assert.equal(formatPublished(null), "date unknown");
console.log("ok  labels and dates");

assert.equal(safeUrl("https://news.example/a?b=1"), "https://news.example/a?b=1");
assert.equal(safeUrl("http://news.example/a"), "http://news.example/a");
for (const bad of ["javascript:alert(1)", "data:text/html,x", "//evil.test", "", null, undefined]) {
  assert.equal(safeUrl(bad), "#", String(bad));
}
console.log("ok  only web links are ever used as a href");

const named = (state, wardId = "DM-167") => ({ review_state: state, ward: { ward_id: wardId, name: "R K Puram" } });
const citizen = { wardId: "DM-167" };
assert.equal(reviewAccess({ signal: named("needs_review"), user: citizen }), "review");
assert.equal(reviewAccess({ signal: named("needs_review"), user: null }), "sign-in");
assert.equal(reviewAccess({ signal: named("needs_review", "DM-1"), user: citizen }), "other-ward");
assert.equal(reviewAccess({ signal: { review_state: "needs_review", ward: null }, user: citizen }), "citywide");
assert.equal(reviewAccess({ signal: named("linked"), user: citizen }), "done");
assert.equal(reviewAccess({ signal: named("dismissed"), user: citizen }), "done");
console.log("ok  who may review a report");


const seen = [];
const fake = (status, payload) => async (url, options = {}) => {
  seen.push({ url, method: options.method, cache: options.cache, auth: options.headers?.Authorization, body: options.body });
  return { ok: status < 400, status, json: async () => payload };
};
const listing = { count: 1, items: [{ signal_id: "sig-abc" }], pipeline: { origin: "rss_snapshot" } };
assert.deepEqual(await fetchSignals("https://api.test", fake(200, listing)), listing);
assert.deepEqual(seen[0], { url: "https://api.test/signals", method: undefined, cache: "no-store", auth: undefined, body: undefined });
await assert.rejects(() => fetchSignals("https://api.test", fake(500, {})), /returned 500/);
await assert.rejects(() => fetchSignals("https://api.test", fake(200, { items: "nope" })), /expected format/);
await assert.rejects(() => fetchSignals("", fake(200, listing)), /not configured/);

const reviewed = await reviewSignal("T", "sig-abc", { decision: "link", asset_id: "AST-1" }, "https://api.test", fake(200, { review_state: "linked" }));
assert.deepEqual(reviewed, { review_state: "linked" });
assert.deepEqual(seen.at(-1), {
  url: "https://api.test/signals/sig-abc/review", method: "POST", cache: undefined, auth: "T",
  body: '{"decision":"link","asset_id":"AST-1"}',
});
await assert.rejects(
  () => reviewSignal("T", "sig-abc", { decision: "dismiss" }, "https://api.test", fake(403, { error: "only citizens of the ward this report names can review it" })),
  (error) => error.status === 403 && /ward this report names/.test(error.message),
);
console.log("ok  signal requests: public list, signed review, server messages surfaced");
