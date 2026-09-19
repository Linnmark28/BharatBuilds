import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import * as cheerio from "cheerio";

const sourcePages = [
  { url: "https://eodb.mcd.gov.in/engineer_list", role: "Empanelled Engineer" },
  { url: "https://eodb.mcd.gov.in/supervisor_list", role: "Empanelled Supervisor" },
];
const outputPath = resolve(process.cwd(), "public/data/officers.json");
const clean = (value) => value.replace(/\s+/g, " ").trim();
const findColumn = (headers, terms) => headers.findIndex((header) => terms.some((term) => header.includes(term)));
const normalizeWard = (value) => {
  const ward = clean(value);
  const number = ward.match(/\b(\d{1,3})\b/);
  return number ? `W-${number[1].padStart(3, "0")}` : ward || "Unassigned";
};

async function scrapeSource({ url, role }) {
  const response = await fetch(url, {
    headers: {
      Accept: "text/html,application/xhtml+xml",
      "User-Agent": "Nirvasan civic data importer/1.0",
    },
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);

  const $ = cheerio.load(await response.text());
  const records = [];
  $("table").each((_, table) => {
    const rows = $(table).find("tr").toArray();
    if (rows.length < 2) return;
    const headers = $(rows[0]).find("th, td").toArray().map((cell) => clean($(cell).text()).toLowerCase());
    const dataRows = rows.slice(1);
    const nameIndex = findColumn(headers, ["name", "officer", "engineer", "supervisor"]);
    const wardIndex = findColumn(headers, ["ward", "locality"]);
    const zoneIndex = findColumn(headers, ["zone", "circle"]);
    const addressIndex = findColumn(headers, ["address"]);
    const phoneIndex = findColumn(headers, ["mobile", "phone", "contact"]);
    const emailIndex = findColumn(headers, ["email", "mail"]);
    if (nameIndex < 0) return;

    dataRows.forEach((row) => {
      const cells = $(row).find("td, th").toArray().map((cell) => clean($(cell).text()));
      const name = cells[nameIndex] || "";
      if (!name || /^(name|officer|engineer|supervisor)$/i.test(name)) return;
      records.push({
        ward: wardIndex >= 0 ? normalizeWard(cells[wardIndex]) : "Unassigned",
        zone: zoneIndex >= 0 ? cells[zoneIndex] || "Unknown" : "Unknown",
        name,
        role,
        address: addressIndex >= 0 ? cells[addressIndex] || null : null,
        phone: phoneIndex >= 0 ? cells[phoneIndex] || null : null,
        email: emailIndex >= 0 ? cells[emailIndex] || null : null,
        source: url,
        scrapedAt: new Date().toISOString(),
        confidence: "Scraped; pending ward assignment verification",
      });
    });
  });
  return records;
}

const results = await Promise.allSettled(sourcePages.map(scrapeSource));
const records = results.flatMap((result, index) => {
  if (result.status === "fulfilled") {
    console.log(`${sourcePages[index].role}: ${result.value.length} records`);
    return result.value;
  }
  console.warn(`${sourcePages[index].role}: ${result.reason.message}`);
  return [];
});
const uniqueRecords = [...new Map(records.map((record) => [`${record.source}|${record.name}|${record.role}`, record])).values()];
if (!uniqueRecords.length) throw new Error("No records found from fixed MCD sources.");

await mkdir(dirname(outputPath), { recursive: true });
await writeFile(outputPath, `${JSON.stringify(uniqueRecords, null, 2)}\n`, "utf8");
console.log(`Wrote ${uniqueRecords.length} MCD records to ${outputPath}`);
