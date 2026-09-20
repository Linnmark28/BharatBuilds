// Prints the demo wards, assets and boundary aliases from src/App.jsx as JSON.
// Bridge until the app reads these from the API; used by build_seed_data.py.
import { readFileSync } from "node:fs";
import vm from "node:vm";

const source = readFileSync(new URL("../src/App.jsx", import.meta.url), "utf8");

function extract(name, close) {
  const marker = `const ${name} = `;
  const start = source.indexOf(marker);
  if (start === -1) throw new Error(`const ${name} not found in src/App.jsx`);
  const end = source.indexOf(`\n${close};`, start);
  if (end === -1) throw new Error(`end of const ${name} not found in src/App.jsx`);
  const literal = source.slice(start + marker.length, end + 1 + close.length);
  return vm.runInNewContext(`(${literal})`);
}

process.stdout.write(
  JSON.stringify({
    wards: extract("wards", "]"),
    assets: extract("assets", "]"),
    realWardNameAliases: extract("realWardNameAliases", "}"),
  }),
);
