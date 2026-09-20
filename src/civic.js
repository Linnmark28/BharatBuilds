// Display rules for the Civic Data tiles (kept free of React so they can be tested).

// Rupee amounts the way Indian readers expect them: lakh and crore.
export function formatInr(amount) {
  if (typeof amount !== "number" || Number.isNaN(amount)) return "Not declared";
  if (amount >= 1e7) return `₹${Number((amount / 1e7).toFixed(2))} Cr`;
  if (amount >= 1e5) return `₹${Number((amount / 1e5).toFixed(1))} L`;
  return `₹${amount.toLocaleString("en-IN")}`;
}

// MyNeta appends "(Winner)" to the name of the person who won.
export function splitWinner(fullName) {
  const match = /^(.*?)\s*\(Winner\)\s*$/i.exec(fullName ?? "");
  return match ? { name: match[1], winner: true } : { name: fullName ?? "", winner: false };
}

// "Category: Graduate Professional | B.A. LL.B. , Mewar Law Institute" -> "Graduate Professional · B.A. LL.B., Mewar Law Institute"
export function cleanEducation(text) {
  const cleaned = String(text ?? "")
    .replace(/^Category:\s*/i, "")
    .replace(/\s*\|\s*/, " · ")
    .replace(/\s+,/g, ",")
    .replace(/\s+/g, " ")
    .trim();
  return cleaned || "Not declared";
}

const titleCase = (text) => text.toLowerCase().replace(/(^|[\s.-])([a-z])/g, (_, gap, letter) => gap + letter.toUpperCase());

// "10-JHARODA" -> { number: "10", name: "Jharoda" }
export function wardParts(code) {
  const match = /^(\d+)\s*-\s*(.+)$/.exec(String(code ?? "").trim());
  if (match) return { number: match[1], name: titleCase(match[2]) };
  return { number: "", name: code ? titleCase(String(code)) : "Ward not stated" };
}

// A joined record lists every officer role; group them by department so a tile stays short.
export function groupDuties(record) {
  const groups = new Map();
  for (const duty of record?.responsible_departments ?? []) {
    groups.set(duty.department_name, (groups.get(duty.department_name) ?? 0) + 1);
  }
  return [...groups].map(([department, roles]) => ({ department, roles }));
}
