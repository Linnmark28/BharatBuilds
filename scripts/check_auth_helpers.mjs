// Checks the pure helpers in src/auth.js and src/api.js (no AWS, no browser).
//   node scripts/check_auth_helpers.mjs
import assert from "node:assert/strict";
import { authEnabled, friendlyError, toE164, userFromSession } from "../src/auth.js";
import { fetchMe } from "../src/api.js";

assert.equal(authEnabled, false, "auth must stay disabled without env vars");

assert.equal(toE164("98765 43210"), "+919876543210");
assert.equal(toE164("+91 98765-43210"), "+919876543210");
assert.equal(toE164("09876543210"), "+919876543210");
assert.equal(toE164("919876543210"), "+919876543210");
assert.equal(toE164("12345"), null);
assert.equal(toE164("5876543210"), null, "Indian mobiles start with 6-9");
assert.equal(toE164(""), null);
assert.equal(toE164(undefined), null);

const session = {
  getIdToken: () => ({
    decodePayload: () => ({
      sub: "u-1", email: "a@b.in", name: "Asha", phone_number: "+919876543210",
      "custom:ward_id": "DM-155", "custom:pincode": "110024",
    }),
  }),
};
assert.deepEqual(userFromSession(session), {
  id: "u-1", email: "a@b.in", name: "Asha", phone: "+919876543210", wardId: "DM-155", pincode: "110024",
});
assert.equal(userFromSession({ getIdToken: () => ({ decodePayload: () => ({ sub: "x" }) }) }).wardId, null);

assert.match(friendlyError({ code: "UsernameExistsException" }), /already exists/);
assert.match(friendlyError({ code: "NotAuthorizedException" }), /Incorrect email or password/);
assert.match(friendlyError({ name: "CodeMismatchException" }), /not right/);
assert.match(friendlyError({ code: "InvalidParameterException", message: "bad phone" }), /bad phone/);
assert.match(friendlyError(new Error("network down")), /Something went wrong/);
console.log("ok  auth helpers: phone formatting, token claims, friendly errors");

const seen = [];
const okFetch = async (url, options) => {
  seen.push({ url, auth: options.headers.Authorization });
  return { ok: true, status: 200, json: async () => ({ email: "a@b.in" }) };
};
assert.deepEqual(await fetchMe("TOKEN", "https://api.test", okFetch), { email: "a@b.in" });
assert.deepEqual(seen, [{ url: "https://api.test/me", auth: "TOKEN" }]);
await assert.rejects(() => fetchMe("T", "https://api.test", async () => ({ ok: false, status: 401 })), /401/);
await assert.rejects(() => fetchMe("T", "", okFetch), /not configured/);
console.log("ok  fetchMe sends the token and reports failures");
