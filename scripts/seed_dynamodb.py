#!/usr/bin/env python3
"""Load data/seed/*.json into the Nirvasan DynamoDB tables.

    python scripts/seed_dynamodb.py                         # dry run: validates files only
    python scripts/seed_dynamodb.py --only signals --apply  # writes just the named tables
    python scripts/seed_dynamodb.py --all --apply           # rewrites EVERY table (see warning)

WARNING: seeding overwrites items with the same key. Once the app is live, wards, assets and
evidence hold real activity (ratings, verified photos, asset statuses, cached summaries) that a
full re-seed would reset, so --apply needs --only <tables> or an explicit --all.

Uses your normal AWS credentials (AWS_PROFILE, after `aws sso login`).
Preflight checks every table's key schema and billing mode before any write,
and a re-run overwrites items with the same key, so it is safe to repeat.
Run scripts/build_seed_data.py first.
"""
import argparse
import json
import os
import sys
from decimal import Decimal
from pathlib import Path

SEED = Path(__file__).resolve().parent.parent / "data" / "seed"

# seed file -> (table name suffix, expected key attributes in order)
TABLES = {
    "wards.json": ("wards", ["ward_id"]),
    "assets.json": ("assets", ["asset_id"]),
    "politicians.json": ("politicians", ["politician_id"]),
    "officers.json": ("officers", ["officer_id"]),
    "signals.json": ("signals", ["signal_id"]),
}


def load(filename):
    with open(SEED / filename, encoding="utf-8") as handle:
        return json.load(handle, parse_float=Decimal)


def validate(data):
    """Check keys are present and unique, and that references resolve."""
    problems = []
    for filename, (suffix, keys) in TABLES.items():
        seen = set()
        for item in data[filename]:
            key = tuple(item.get(k) for k in keys)
            if any(part in (None, "") for part in key):
                problems.append(f"{filename}: item missing key {keys}: {str(item)[:80]}")
            elif key in seen:
                problems.append(f"{filename}: duplicate key {key}")
            seen.add(key)
    ward_ids = {w["ward_id"] for w in data["wards.json"]}
    for asset in data["assets.json"]:
        if asset["ward_id"] not in ward_ids:
            problems.append(f"asset {asset['asset_id']} points at unknown ward {asset['ward_id']}")
    for pol in data["politicians.json"]:
        if pol["ward_id"] not in ward_ids:
            problems.append(f"politician {pol['politician_id']} points at unknown ward {pol['ward_id']}")
    return problems


def count_items(table):
    total, kwargs = 0, {"Select": "COUNT"}
    while True:
        page = table.scan(**kwargs)
        total += page["Count"]
        if "LastEvaluatedKey" not in page:
            return total
        kwargs["ExclusiveStartKey"] = page["LastEvaluatedKey"]


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--apply", action="store_true", help="write to DynamoDB (default is a dry run)")
    parser.add_argument("--only", nargs="+", metavar="TABLE", choices=[suffix for suffix, _ in TABLES.values()],
                        help="write only these tables, e.g. --only signals")
    parser.add_argument("--all", action="store_true", help="allow --apply to rewrite every table")
    parser.add_argument("--prefix", default="nirvasan-", help="table name prefix")
    parser.add_argument("--region", default=os.environ.get("AWS_REGION", "ap-south-1"))
    args = parser.parse_args()

    data = {filename: load(filename) for filename in TABLES}
    for filename, (suffix, _) in TABLES.items():
        print(f"{filename:<18} {len(data[filename]):>4} items -> {args.prefix}{suffix}")

    problems = validate(data)
    if problems:
        print("\nValidation failed:")
        for problem in problems[:20]:
            print("  -", problem)
        sys.exit(1)
    print("Validation passed (keys present and unique, all ward references resolve).")

    if not args.apply:
        print("\nDry run only. Re-run with --apply to write to AWS.")
        return
    if not args.only and not args.all:
        sys.exit(
            "Refusing to rewrite every table: live ratings, verified photos and asset statuses would be reset.\n"
            "Name the tables (--only signals) or pass --all if that is really what you want."
        )
    selected = {f: v for f, v in TABLES.items() if not args.only or v[0] in args.only}

    import boto3  # imported late so the dry run works without it

    session = boto3.Session(region_name=args.region)
    identity = session.client("sts").get_caller_identity()
    print(f"\nAWS account {identity['Account']}, region {args.region}, profile {os.environ.get('AWS_PROFILE', '(default)')}")

    client = session.client("dynamodb")
    for filename, (suffix, keys) in selected.items():
        name = f"{args.prefix}{suffix}"
        table = client.describe_table(TableName=name)["Table"]
        actual = [k["AttributeName"] for k in table["KeySchema"]]
        billing = table.get("BillingModeSummary", {}).get("BillingMode", "PROVISIONED")
        if actual != keys or billing != "PAY_PER_REQUEST":
            sys.exit(f"Refusing to write: {name} has keys {actual} / billing {billing}, expected {keys} / PAY_PER_REQUEST")
    print("Preflight passed: all table keys and billing modes are correct.\n")

    resource = session.resource("dynamodb")
    for filename, (suffix, _) in selected.items():
        table = resource.Table(f"{args.prefix}{suffix}")
        with table.batch_writer() as batch:
            for item in data[filename]:
                batch.put_item(Item=item)
        print(f"wrote {len(data[filename]):>4} items to {table.name}; table now holds {count_items(table)}")


if __name__ == "__main__":
    main()
