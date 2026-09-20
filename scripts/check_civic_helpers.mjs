// Checks src/civic.js against the real Civic Data files (no browser).
//   node scripts/check_civic_helpers.mjs
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { cleanEducation, formatInr, groupDuties, splitWinner, wardParts } from "../src/civic.js";

const read = (name) => JSON.parse(readFileSync(new URL(`../data/${name}`, import.meta.url), "utf8"));

assert.equal(formatInr(5003915), "₹50 L");
assert.equal(formatInr(123456789), "₹12.35 Cr");
assert.equal(formatInr(10000000), "₹1 Cr");
assert.equal(formatInr(99999), "₹99,999");
assert.equal(formatInr(0), "₹0");
assert.equal(formatInr(null), "Not declared");
assert.equal(formatInr(undefined), "Not declared");
console.log("ok  rupee amounts in lakh and crore");

assert.deepEqual(splitWinner("Gagan Choudhary (Winner)"), { name: "Gagan Choudhary", winner: true });
assert.deepEqual(splitWinner("Ambika"), { name: "Ambika", winner: false });
assert.deepEqual(splitWinner(null), { name: "", winner: false });
assert.equal(
  cleanEducation("Category: Graduate Professional | B.A. LL.B. , Mewar Law Institute , CCS University Year 2013-2018"),
  "Graduate Professional · B.A. LL.B., Mewar Law Institute, CCS University Year 2013-2018",
);
assert.equal(cleanEducation("Category: Illiterate | Illiterate (Only Signature)"), "Illiterate · Illiterate (Only Signature)");
assert.equal(cleanEducation(""), "Not declared");
assert.equal(cleanEducation(null), "Not declared");
assert.deepEqual(wardParts("10-JHARODA"), { number: "10", name: "Jharoda" });
assert.deepEqual(wardParts("13-MUKHERJEE NAGAR"), { number: "13", name: "Mukherjee Nagar" });
assert.deepEqual(wardParts("72-SADAR BAZAR"), { number: "72", name: "Sadar Bazar" });
assert.deepEqual(wardParts("Somewhere"), { number: "", name: "Somewhere" });
assert.deepEqual(wardParts(""), { number: "", name: "Ward not stated" });
console.log("ok  names, education text and ward labels");

// Against the real files: every tile can be built and nothing renders as "undefined" or "NaN".
const candidates = read("candidates.json");
assert.equal(candidates.length, 100);
for (const candidate of candidates) {
  const shown = [splitWinner(candidate.full_name).name, cleanEducation(candidate.education_qualification),
    formatInr(candidate.total_assets_inr), wardParts(candidate.constituency_or_ward).name].join(" ");
  assert.doesNotMatch(shown, /undefined|NaN|null/, candidate.id);
}
const master = read("civic_master_data.json");
for (const record of master) {
  const groups = groupDuties(record);
  assert.ok(groups.length > 0 && groups.length <= record.responsible_departments.length, record.ward_or_constituency);
  assert.equal(groups.reduce((sum, group) => sum + group.roles, 0), record.responsible_departments.length);
}
assert.deepEqual(groupDuties(master[0]).map((g) => g.roles), [2, 2, 2, 2]);
assert.deepEqual(groupDuties({}), []);
console.log(`ok  ${candidates.length} candidates and ${master.length} joined records all render cleanly`);
