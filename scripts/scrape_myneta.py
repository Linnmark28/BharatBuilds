#!/usr/bin/env python3
"""Scrape publicly available MyNeta candidate listing pages into JSON.

Usage:
  python scripts/scrape_myneta.py --url https://www.myneta.info/delhi2022/
  python scripts/scrape_myneta.py --url https://www.myneta.info/delhi2022/ --year 2022

Use only public pages, respect site terms and robots.txt, and keep request rates low.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import random
import re
import sys
import time
from pathlib import Path
from typing import Iterable
from urllib.parse import urljoin, urlparse

import requests
from bs4 import BeautifulSoup

USER_AGENT = "Nirvasan civic research importer/1.0 (+local civic data project)"
DEFAULT_OUTPUT = Path(__file__).resolve().parents[1] / "data" / "candidates.json"
MISSING = ""


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Scrape MyNeta candidate pages.")
    parser.add_argument("--url", action="append", required=True, help="Public MyNeta election/listing URL. Repeat for more pages.")
    parser.add_argument("--year", type=int, help="Election year to attach when page does not expose one.")
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT)
    parser.add_argument("--max-pages", type=int, default=100, help="Maximum candidate detail pages per listing URL.")
    return parser.parse_args()


def request_with_backoff(session: requests.Session, url: str, attempts: int = 4) -> requests.Response:
    last_error: Exception | None = None
    for attempt in range(attempts):
        try:
            response = session.get(url, timeout=30)
            response.raise_for_status()
            return response
        except requests.RequestException as error:
            last_error = error
            if attempt == attempts - 1:
                break
            time.sleep(min(30, 2**attempt + random.uniform(0.2, 0.8)))
    raise RuntimeError(f"Could not fetch {url}: {last_error}") from last_error


def clean(value: str | None) -> str:
    return re.sub(r"\s+", " ", value or "").strip()


def text_after_label(soup: BeautifulSoup, labels: Iterable[str]) -> str:
    wanted = {label.lower() for label in labels}
    for cell in soup.select("td, th, dt, dd, li"):
        label = clean(cell.get_text(" ", strip=True)).lower().rstrip(":")
        if label not in wanted:
            continue
        sibling = cell.find_next_sibling(["td", "th", "dd"])
        if sibling:
            return clean(sibling.get_text(" ", strip=True))
        next_text = cell.find_next(string=True)
        return clean(next_text)
    return MISSING


def number_from(value: str) -> int | None:
    digits = re.sub(r"[^0-9]", "", value)
    return int(digits) if digits else None


def candidate_id(name: str, affidavit_url: str, page_url: str) -> str:
    source = affidavit_url or page_url or name
    slug = re.sub(r"[^a-z0-9]+", "-", name.lower()).strip("-")
    return f"{slug}-{hashlib.sha1(source.encode()).hexdigest()[:10]}"


def detail_links(soup: BeautifulSoup, base_url: str) -> list[str]:
    links = []
    for anchor in soup.select("a[href]"):
        href = urljoin(base_url, anchor["href"])
        parsed = urlparse(href)
        if parsed.netloc.endswith("myneta.info") and href not in links:
            links.append(href)
    return links


def parse_candidate(soup: BeautifulSoup, page_url: str, fallback_year: int | None) -> dict:
    page_text = " | ".join(soup.stripped_strings)
    title_text = clean(soup.title.get_text(" ", strip=True) if soup.title else "")
    name_match = re.match(r"(.+?)\s*\(.*?\):Constituency", title_text)
    name = clean(name_match.group(1) if name_match else "")
    name = clean(soup.select_one("h1, h2, .candidate-name") and soup.select_one("h1, h2, .candidate-name").get_text(" ", strip=True)) or name
    if not name:
        name = text_after_label(soup, ["Name", "Candidate Name"])
    party_match = re.search(r"Party:\s*\|\s*([^|]+)", page_text)
    constituency_match = re.search(r"\|\s*([^|]+)\s+\([^|]+\)\s*\|\s*Party:", page_text)
    party = clean(party_match.group(1) if party_match else text_after_label(soup, ["Party", "Political Party"]))
    constituency = clean(constituency_match.group(1) if constituency_match else text_after_label(soup, ["Constituency", "Ward", "Constituency / Ward"]))
    year_text = text_after_label(soup, ["Election Year", "Year"])
    affidavit = next((urljoin(page_url, a["href"]) for a in soup.select("a[href]") if "affidavit" in clean(a.get_text(" ", strip=True)).lower()), "")
    criminal_match = re.search(r"([0-9]+)\s+criminal case", page_text, re.IGNORECASE)
    criminal_cases = int(criminal_match.group(1)) if criminal_match else (0 if "No criminal cases" in page_text else None)
    assets_match = re.search(r"Assets:\s*\|\s*Rs\s*([^|]+)", page_text)
    liabilities_match = re.search(r"Liabilities:\s*\|\s*([^|]+)", page_text)
    education_match = re.search(r"Educational Details\s*\|\s*(.*?)\s*\|\s*Details of PAN", page_text)
    return {
        "id": candidate_id(name, affidavit, page_url),
        "full_name": name,
        "party": party,
        "constituency_or_ward": constituency,
        "election_year": number_from(year_text) or fallback_year,
        "criminal_cases_count": criminal_cases,
        "education_qualification": clean(education_match.group(1) if education_match else text_after_label(soup, ["Education", "Educational Qualification"])),
        "total_assets_inr": number_from(assets_match.group(1)) if assets_match else number_from(text_after_label(soup, ["Total Assets", "Assets"])),
        "total_liabilities_inr": number_from(liabilities_match.group(1)) if liabilities_match else number_from(text_after_label(soup, ["Total Liabilities", "Liabilities"])),
        "affidavit_url": affidavit,
        "source_url": page_url,
        "scraped_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
    }


def scrape(urls: list[str], year: int | None, max_pages: int) -> list[dict]:
    session = requests.Session()
    session.headers.update({"User-Agent": USER_AGENT, "Accept": "text/html,application/xhtml+xml"})
    records: list[dict] = []
    for listing_url in urls:
        if urlparse(listing_url).netloc.lower() not in {"myneta.info", "www.myneta.info"}:
            print(f"warning: skipped non-MyNeta URL {listing_url}", file=sys.stderr)
            continue
        try:
            listing = request_with_backoff(session, listing_url)
            listing_soup = BeautifulSoup(listing.text, "html.parser")
            constituency_links = [link for link in detail_links(listing_soup, listing_url) if "action=show_candidates" in link]
            links = []
            for constituency_url in constituency_links:
                constituency_page = request_with_backoff(session, constituency_url)
                links.extend([
                    link for link in detail_links(BeautifulSoup(constituency_page.text, "html.parser"), constituency_url)
                    if "candidate.php?candidate_id=" in link
                ])
                if len(links) >= max_pages:
                    break
                time.sleep(random.uniform(1.5, 3.0))
            links = list(dict.fromkeys(links))[:max_pages]
        except RuntimeError as error:
            print(f"warning: {error}", file=sys.stderr)
            continue
        for index, page_url in enumerate(links):
            if index:
                time.sleep(random.uniform(1.5, 3.0))
            try:
                page = request_with_backoff(session, page_url)
                record = parse_candidate(BeautifulSoup(page.text, "html.parser"), page_url, year)
                if record["full_name"]:
                    records.append(record)
            except (RuntimeError, requests.RequestException) as error:
                print(f"warning: skipped {page_url}: {error}", file=sys.stderr)
    return list({record["id"]: record for record in records}.values())


def main() -> int:
    args = parse_args()
    records = scrape(args.url, args.year, args.max_pages)
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(records, indent=2, ensure_ascii=True) + "\n", encoding="utf-8")
    print(f"Wrote {len(records)} candidate records to {args.output}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
