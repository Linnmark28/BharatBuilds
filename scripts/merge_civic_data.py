#!/usr/bin/env python3
"""Join candidate records with department responsibility definitions."""

from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[1]
CANDIDATES_PATH = ROOT / "data" / "candidates.json"
DEPARTMENTS_PATH = ROOT / "data" / "departments_and_officers.json"
OUTPUT_PATH = ROOT / "data" / "civic_master_data.json"


def load_json(path: Path) -> Any:
    with path.open(encoding="utf-8") as handle:
        return json.load(handle)


def normalize(value: str | None) -> str:
    return " ".join((value or "").lower().split())


def matching_departments(candidate: dict[str, Any], departments: list[dict[str, Any]]) -> list[dict[str, Any]]:
    searchable = normalize(" ".join([
        str(candidate.get("constituency_or_ward", "")),
        str(candidate.get("party", "")),
    ]))
    explicit_categories = candidate.get("responsibility_categories", [])
    matches = []
    for department in departments:
        terms = [normalize(department.get("category")), *map(normalize, department.get("service_keywords", []))]
        if any(term and (term in searchable or term in explicit_categories) for term in terms):
            matches.append(department)
    return matches or departments


def department_contract(department: dict[str, Any]) -> list[dict[str, Any]]:
    return [
        {
            "department_name": department["department_name"],
            "officer_title": role["designation"],
            "duties": role["responsibilities"],
            "department_id": department["department_id"],
            "linked_political_oversight": role["linked_political_oversight"],
        }
        for role in department.get("officer_roles", [])
    ]


def merge(candidates: list[dict[str, Any]], departments: list[dict[str, Any]]) -> list[dict[str, Any]]:
    return [
        {
            "ward_or_constituency": candidate.get("constituency_or_ward") or "Unassigned",
            "politician": candidate,
            "responsible_departments": [
                duty
                for department in matching_departments(candidate, departments)
                for duty in department_contract(department)
            ],
        }
        for candidate in candidates
    ]


def main() -> int:
    parser = argparse.ArgumentParser(description="Merge candidate and civic responsibility data.")
    parser.add_argument("--candidates", type=Path, default=CANDIDATES_PATH)
    parser.add_argument("--departments", type=Path, default=DEPARTMENTS_PATH)
    parser.add_argument("--output", type=Path, default=OUTPUT_PATH)
    args = parser.parse_args()
    output = merge(load_json(args.candidates), load_json(args.departments))
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(output, indent=2, ensure_ascii=True) + "\n", encoding="utf-8")
    print(f"Wrote {len(output)} civic records to {args.output}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
