// Checks src/route.js (no browser).
//   node scripts/check_route_helpers.mjs
import assert from "node:assert/strict";
import { TAB_SLUGS, buildLocation, parseLocation } from "../src/route.js";

// Every page has its own address and round-trips.
const names = Object.keys(TAB_SLUGS);
assert.equal(names.length, 11);
assert.equal(new Set(Object.values(TAB_SLUGS)).size, 11, "slugs are unique");
for (const tab of names) {
  const hash = buildLocation({ tab });
  assert.match(hash, /^#\/[a-z-]+$/, tab);
  assert.deepEqual(parseLocation(hash), { tab, ward: null, asset: null }, tab);
}
assert.equal(buildLocation({ tab: "Leaderboard" }), "#/leaderboard");
assert.equal(buildLocation({ tab: "Login / Signup" }), "#/login");

// Context that a page needs survives a refresh, including names with spaces.
for (const ward of ["Kalkaji", "R K Puram", "Chittaranjan Park", "Karol Bagh"]) {
  for (const tab of ["Map", "Rep Profile"]) {
    assert.deepEqual(parseLocation(buildLocation({ tab, ward })), { tab, ward, asset: null }, `${tab} ${ward}`);
  }
}
assert.deepEqual(parseLocation(buildLocation({ tab: "Civic Proof", asset: "AST-0471" })), { tab: "Civic Proof", ward: null, asset: "AST-0471" });
assert.equal(buildLocation({ tab: "Rep Profile", ward: "All wards" }), "#/rep-profile", "'All wards' is the default, so it is not written");
assert.equal(buildLocation({ tab: "Leaderboard", ward: "Kalkaji", asset: "AST-1" }), "#/leaderboard", "pages that ignore a ward or asset do not carry one");
assert.equal(buildLocation({ tab: "Map", asset: "AST-1" }), "#/map");
console.log("ok  every page has its own address and keeps the context it needs");

// Anything odd opens the map instead of breaking.
for (const junk of [undefined, null, "", "#", "#/", "#/nowhere", "#/../etc", "#/<script>alert(1)</script>", "#/MAP", "map", 42]) {
  assert.deepEqual(parseLocation(junk), { tab: "Map", ward: null, asset: null }, String(junk));
}
assert.equal(parseLocation("#/leaderboard?ward=&asset=").ward, null);
assert.equal(parseLocation("map").tab, "Map");
assert.equal(parseLocation("#leaderboard").tab, "Leaderboard", "a leading '#' without a slash still works");
assert.equal(parseLocation("#/rep-profile?ward=R%20K%20Puram").ward, "R K Puram", "%20 and + both decode");
assert.equal(parseLocation("#/rep-profile?ward=R+K+Puram").ward, "R K Puram");
console.log("ok  unknown or damaged addresses fall back to the map");
