// Checks src/rating.js and the rating calls in src/api.js (no AWS, no browser).
//   node scripts/check_rating_helpers.mjs
import assert from "node:assert/strict";
import { ratingAggregate, ratingPanelState } from "../src/rating.js";
import { fetchMyRating, postRating } from "../src/api.js";

assert.deepEqual(ratingAggregate({}), { count: 0, average: null });
assert.deepEqual(ratingAggregate({ rating_count: 2, rating_sum: 5 }), { count: 2, average: 2.5 });
assert.deepEqual(ratingAggregate({ rating_count: 3, rating_sum: 10 }), { count: 3, average: 3.3 });

const base = { live: true, signedIn: true, userWardId: "DM-1", wardId: "DM-1", myRating: null };
assert.equal(ratingPanelState({ ...base, live: false }), "demo");
assert.equal(ratingPanelState({ ...base, signedIn: false }), "login");
assert.equal(ratingPanelState({ ...base, userWardId: "DM-2" }), "other-ward");
assert.equal(ratingPanelState({ ...base, myRating: undefined }), "loading");
assert.equal(ratingPanelState({ ...base, myRating: 4 }), "rated");
assert.equal(ratingPanelState(base), "can-rate");
console.log("ok  rating panel states and averages");

const calls = [];
const respond = (status, payload) => async (url, options) => {
  calls.push({ url, method: options.method, auth: options.headers.Authorization, body: options.body, type: options.headers["Content-Type"] });
  return { ok: status < 400, status, json: async () => payload };
};

assert.deepEqual(await postRating("TOK", 4, "https://api.test", respond(201, { average: 4, count: 1 })), { average: 4, count: 1 });
assert.deepEqual(calls[0], {
  url: "https://api.test/ratings", method: "POST", auth: "TOK", body: '{"stars":4}', type: "application/json",
});
assert.deepEqual(await fetchMyRating("TOK", "https://api.test", respond(200, { rated: false })), { rated: false });
assert.deepEqual(calls[1], { url: "https://api.test/ratings/mine", method: "GET", auth: "TOK", body: undefined, type: undefined });

await assert.rejects(
  () => postRating("TOK", 2, "https://api.test", respond(409, { error: "you have already rated this representative" })),
  (error) => error.status === 409 && /already rated/.test(error.message),
);
await assert.rejects(() => postRating("TOK", 2, "https://api.test", respond(500, null)), /500/);
console.log("ok  rating calls send the token and body, and surface server messages");
