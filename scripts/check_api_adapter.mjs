// Checks that data served by the API (simulated here from data/seed) adapts back
// into exactly the wards/assets arrays that src/App.jsx bundles.
//   node scripts/check_api_adapter.mjs
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import assert from "node:assert/strict";
import { loadLiveData } from "../src/api.js";

const seed = (name) => JSON.parse(readFileSync(new URL(`../data/seed/${name}.json`, import.meta.url), "utf8"));
const bundled = JSON.parse(
  execFileSync(process.execPath, [fileURLToPath(new URL("./export_demo_data.mjs", import.meta.url))], {
    encoding: "utf8",
  }),
);

const shuffled = (items) => [...items].sort((a, b) => JSON.stringify(a).length - JSON.stringify(b).length);
const apiWards = shuffled(seed("wards").filter((w) => w.monitored));
const apiAssets = shuffled(seed("assets"));

const fakeFetch = (routes) => async (url) => {
  const path = url.replace("https://api.test", "");
  if (!(path in routes)) return { ok: false, status: 404, json: async () => ({}) };
  return { ok: true, status: 200, json: async () => ({ count: routes[path].length, items: routes[path] }) };
};
const dropWardId = (item) => {
  const copy = { ...item };
  delete copy.wardId;
  return copy;
};

// 1. Round trip: API order is scrambled, display_order must restore the UI order.
const live = await loadLiveData("https://api.test", fakeFetch({
  "/wards?monitored=true": structuredClone(apiWards),
  "/assets": structuredClone(apiAssets),
}));
assert.ok(live, "loader returned null for valid data");
assert.deepEqual(live.wards.map(dropWardId), bundled.wards);
assert.deepEqual(live.assets.map(dropWardId), bundled.assets);
console.log(`ok  round trip: ${live.wards.length} wards, ${live.assets.length} assets identical to the bundled arrays`);

// 2. Every failure mode falls back to null instead of throwing.
const warn = console.warn;
console.warn = () => {};
assert.equal(await loadLiveData("", fakeFetch({})), null);
assert.equal(await loadLiveData("https://api.test", fakeFetch({})), null);
assert.equal(await loadLiveData("https://api.test", async () => { throw new Error("offline"); }), null);
assert.equal(await loadLiveData("https://api.test", fakeFetch({ "/wards?monitored=true": [], "/assets": [] })), null);
assert.equal(await loadLiveData("https://api.test", fakeFetch({
  "/wards?monitored=true": [{ demo_id: "W-1", ward_id: "X", name: "A" }],
  "/assets": [{ asset_id: "A1", demo_ward_id: "W-1", lat: "not a number" }],
})), null);
console.warn = warn;
console.log("ok  offline, 404, empty and malformed responses all fall back to null");
