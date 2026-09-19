"""Read-only getters for optional civic master data consumers."""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any

DATA_PATH = Path(__file__).resolve().parents[1] / "data" / "civic_master_data.json"


def load_civic_data(path: Path = DATA_PATH) -> list[dict[str, Any]]:
    """Load merged civic records without mutating existing app data."""
    with path.open(encoding="utf-8") as handle:
        return json.load(handle)


def get_civic_data_by_ward(ward_name: str, path: Path = DATA_PATH) -> list[dict[str, Any]]:
    """Return records matching ward or constituency text."""
    needle = " ".join(ward_name.lower().split())
    return [
        record
        for record in load_civic_data(path)
        if needle in " ".join(str(record.get("ward_or_constituency", "")).lower().split())
    ]


def get_civic_data_by_candidate(candidate_name: str, path: Path = DATA_PATH) -> list[dict[str, Any]]:
    """Return records matching politician name text."""
    needle = " ".join(candidate_name.lower().split())
    return [
        record
        for record in load_civic_data(path)
        if needle in " ".join(str(record.get("politician", {}).get("full_name", "")).lower().split())
    ]
