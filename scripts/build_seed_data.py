#!/usr/bin/env python3
"""Build DynamoDB seed files in data/seed/ from the datasets already in the repo.

    python scripts/build_seed_data.py

Inputs : src/App.jsx (demo wards/assets, via export_demo_data.mjs),
         data/candidates.json, public/data/officers.json,
         public/data/delhi_wards.geojson
Outputs: data/seed/{wards,assets,politicians,officers}.json and
         data/seed/ward_crosswalk.json (how each ward id was resolved).

Ward numbers differ between the DataMeet boundaries (older delimitation) and
MyNeta (2022), so wards are joined by normalised name, never by number.
Canonical ward_id: DM-<DataMeet Ward_No> when a real boundary exists, else
DEMO-<demo id> for demo wards, else MN-<MyNeta number>.
"""
import hashlib
import json
import re
import shutil
import subprocess
import sys
from collections import Counter, defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "data" / "seed"
GEOJSON = ROOT / "public" / "data" / "delhi_wards.geojson"

# Spelling variants between MyNeta and DataMeet. Each was checked by hand;
# KADIPUR vs MADIPUR is deliberately absent because they are different places.
VARIANTS = {
    "RAJINDERNAGAR": "RAJENDERNAGAR",
    "CHITARANJANPARK": "CHITRANJANPARK",
    "MANDAWAII": "MANDAWALI",
    "KAROIBAGH": "KAROLBAGH",
}


def canon(name):
    key = re.sub(r"[^A-Z0-9]", "", name.upper())
    return VARIANTS.get(key, key)


def load_json(path):
    with open(path, encoding="utf-8") as handle:
        return json.load(handle)


def write_json(name, data):
    OUT.mkdir(parents=True, exist_ok=True)
    with open(OUT / name, "w", encoding="utf-8") as handle:
        json.dump(data, handle, ensure_ascii=False, indent=2)
        handle.write("\n")


def export_demo_data():
    node = shutil.which("node")
    if not node:
        sys.exit("node is required to read the demo data out of src/App.jsx")
    result = subprocess.run(
        [node, str(ROOT / "scripts" / "export_demo_data.mjs")],
        capture_output=True, text=True, encoding="utf-8", check=False,
    )
    if result.returncode != 0:
        sys.exit(f"export_demo_data.mjs failed:\n{result.stderr}")
    return json.loads(result.stdout)


def main():
    demo = export_demo_data()
    geo = load_json(GEOJSON)["features"]
    candidates = load_json(ROOT / "data" / "candidates.json")
    officers_raw = load_json(ROOT / "public" / "data" / "officers.json")

    geo_by_name = {}
    geo_by_canon = {}
    for feature in geo:
        props = feature["properties"]
        if not props.get("Ward_Name") or props.get("Ward_No") is None:
            continue
        geo_by_name[props["Ward_Name"].strip()] = props
        geo_by_canon.setdefault(canon(props["Ward_Name"]), props)

    nodes = {}
    crosswalk = []

    # 1. Demo (monitored) wards.
    demo_node_by_id = {}
    demo_by_canon = {}
    for order, ward in enumerate(demo["wards"]):
        alias = demo["realWardNameAliases"].get(ward["name"])
        props = geo_by_name.get(alias) if alias else None
        ward_id = f"DM-{props['Ward_No']}" if props else f"DEMO-{ward['id']}"
        # Every field of the demo ward is carried over, so new fields added to
        # App.jsx (e.g. assistantOfficer) reach DynamoDB without editing this file.
        nodes[ward_id] = {
            **{k: v for k, v in ward.items() if k != "id"},
            "ward_id": ward_id,
            "demo_id": ward["id"],
            "monitored": True,
            "display_order": order,
            "dm_ward_no": str(props["Ward_No"]) if props else None,
            "dm_ward_name": props["Ward_Name"].strip() if props else None,
            "geometry_source": "datameet" if props else "none",
            "myneta_wards": [],
            "metrics_source": "seeded",
            "data_source_tag": "seeded",
        }
        demo_node_by_id[ward["id"]] = ward_id
        demo_by_canon[canon(ward["name"])] = ward_id
        crosswalk.append({
            "ward_id": ward_id, "source": "demo", "label": f"{ward['id']} {ward['name']}",
            "method": "alias" if props else "none",
        })

    # 2. MyNeta wards -> a demo ward, a DataMeet boundary, or a stub.
    myneta_node = {}
    for label in sorted({c["constituency_or_ward"] for c in candidates}):
        number, _, name = label.partition("-")
        key = canon(name)
        if key in demo_by_canon:
            ward_id, method = demo_by_canon[key], "demo-name"
        elif key in geo_by_canon:
            props = geo_by_canon[key]
            ward_id, method = f"DM-{props['Ward_No']}", "datameet-name"
            nodes.setdefault(ward_id, {
                "ward_id": ward_id,
                "name": props["Ward_Name"].strip().title(),
                "zone": None,
                "demo_id": None,
                "monitored": False,
                "dm_ward_no": str(props["Ward_No"]),
                "dm_ward_name": props["Ward_Name"].strip(),
                "geometry_source": "datameet",
                "myneta_wards": [],
                "data_source_tag": "real",
            })
        else:
            ward_id, method = f"MN-{number}", "none"
            nodes.setdefault(ward_id, {
                "ward_id": ward_id,
                "name": name.strip().title(),
                "zone": None,
                "demo_id": None,
                "monitored": False,
                "dm_ward_no": None,
                "dm_ward_name": None,
                "geometry_source": "none",
                "myneta_wards": [],
                "data_source_tag": "real",
            })
        nodes[ward_id]["myneta_wards"].append(label)
        myneta_node[label] = ward_id
        crosswalk.append({"ward_id": ward_id, "source": "myneta", "label": label, "method": method})

    # 3. Assets (seeded demo data) point at canonical ward ids.
    assets = []
    for order, asset in enumerate(demo["assets"]):
        item = {"asset_id": asset["id"], "display_order": order}
        item.update({k: v for k, v in asset.items() if k not in ("id", "ward")})
        item["ward_id"] = demo_node_by_id[asset["ward"]]
        item["demo_ward_id"] = asset["ward"]
        item["data_source_tag"] = "seeded"
        assets.append(item)

    # 4. Politicians (real MyNeta affidavits).
    politicians, seen_pol, dup_pol = [], set(), 0
    for cand in candidates:
        if cand["id"] in seen_pol:
            dup_pol += 1
            continue
        seen_pol.add(cand["id"])
        is_winner = cand["full_name"].rstrip().endswith("(Winner)")
        politicians.append({
            "politician_id": cand["id"],
            "ward_id": myneta_node[cand["constituency_or_ward"]],
            "full_name": re.sub(r"\s*\(Winner\)\s*$", "", cand["full_name"]).strip(),
            "is_winner": is_winner,
            "party": cand["party"],
            "myneta_ward": cand["constituency_or_ward"],
            "election_year": cand["election_year"],
            "criminal_cases_count": cand["criminal_cases_count"],
            "education_qualification": cand["education_qualification"],
            "total_assets_inr": cand["total_assets_inr"],
            "total_liabilities_inr": cand["total_liabilities_inr"],
            "affidavit_url": cand["affidavit_url"],
            "source_url": cand["source_url"],
            "scraped_at": cand["scraped_at"],
            "data_source_tag": "real",
        })

    # 5. Officers (real MCD empanelment lists; no ward assignment exists).
    officers, seen_off, dup_off = [], set(), 0
    for rec in officers_raw:
        digest = hashlib.sha1("|".join([
            rec["role"], rec["name"].strip().lower(), rec.get("phone") or "", rec.get("email") or "",
        ]).encode("utf-8")).hexdigest()[:12]
        officer_id = f"OFF-{digest}"
        if officer_id in seen_off:
            dup_off += 1
            continue
        seen_off.add(officer_id)
        officers.append({
            "officer_id": officer_id,
            "name": rec["name"].strip(),
            "role": rec["role"],
            "address": rec.get("address"),
            "phone": rec.get("phone"),
            "email": rec.get("email"),
            "ward_id": None,
            "assignment": "unassigned",
            "source": rec["source"],
            "scraped_at": rec["scrapedAt"],
            "confidence": rec["confidence"],
            "data_source_tag": "real",
        })

    wards_out = sorted(nodes.values(), key=lambda n: (not n["monitored"], n["ward_id"]))
    write_json("wards.json", wards_out)
    write_json("assets.json", assets)
    write_json("politicians.json", politicians)
    write_json("officers.json", officers)
    write_json("ward_crosswalk.json", crosswalk)

    # Report
    methods = Counter((row["source"], row["method"]) for row in crosswalk)
    print(f"wards        {len(wards_out):>4}  ({sum(n['monitored'] for n in wards_out)} monitored demo wards)")
    print(f"assets       {len(assets):>4}")
    print(f"politicians  {len(politicians):>4}  ({sum(p['is_winner'] for p in politicians)} winners, {dup_pol} duplicate ids skipped)")
    print(f"officers     {len(officers):>4}  ({dup_off} duplicates skipped)")
    print("crosswalk    ", dict(methods))
    no_geo_demo = [n["name"] for n in wards_out if n["monitored"] and n["geometry_source"] == "none"]
    print("demo wards with no real boundary:", no_geo_demo)
    stubs = [n["name"] for n in wards_out if n["ward_id"].startswith("MN-")]
    print("MyNeta wards with no real boundary:", stubs)
    per_ward = defaultdict(list)
    for asset in assets:
        per_ward[asset["ward_id"]].append(asset["asset_id"])
    print("assets per ward id:", {k: len(v) for k, v in sorted(per_ward.items())})


if __name__ == "__main__":
    main()
