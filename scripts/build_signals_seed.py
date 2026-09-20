#!/usr/bin/env python3
"""Write data/seed/signals.json: a small snapshot of REAL news items from Google News RSS.

    python scripts/build_signals_seed.py

Only the headline, source, link and date are kept (never article text). Each pick is found by a
search query plus the start of its headline, so the file is reproducible while the story is still
in the feed. Nothing is invented: if a headline is not found the script stops.
"""
import email.utils
import hashlib
import html
import json
import re
import sys
import urllib.parse
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

OUT = Path(__file__).resolve().parent.parent / "data" / "seed" / "signals.json"
HEADERS = {"User-Agent": "Mozilla/5.0 (compatible; NirvasanSnapshot/1.0)"}

# (why it is here, search query, start of the headline)
PICKS = [
    ("in the user's ward, structure story", '"RK Puram" Delhi building collapse when:60d', "Delhi building collapse: 2 rescued, many feared trapped; RK Puram"),
    ("ward with a structure asset, accountability angle", 'Saket building collapse inquiry MCD fabricated records when:90d', "Saket building collapse: Inquiry holds MCD"),
    ("streetlight hazard, no ward named", "Delhi electric shock streetlight pole Somnath Marg when:14d", "DELHI: 28-YEAR-OLD MAN DIES AFTER ELECTRIC SHOCK FROM STREETLIGHT POLE"),
    ("ward named, but not a tracked asset type", 'Vasant Kunj open drain student death FIR when:90d', "3 days after student"),
]


def fetch_items(query):
    url = "https://news.google.com/rss/search?" + urllib.parse.urlencode(
        {"q": query, "hl": "en-IN", "gl": "IN", "ceid": "IN:en"}
    )
    with urllib.request.urlopen(urllib.request.Request(url, headers=HEADERS), timeout=30) as response:
        xml = response.read().decode("utf-8", "ignore")
    for match in re.finditer(r"<item>.*?</item>", xml, re.S):
        item = match.group(0)
        pick = lambda tag: html.unescape(re.sub(r"<!\[CDATA\[|\]\]>", "", (re.search(rf"<{tag}[^>]*>(.*?)</{tag}>", item, re.S) or [0, ""])[1])).strip()
        yield pick("title"), pick("source"), pick("link"), pick("pubDate")


def main():
    fetched_at = datetime.now(timezone.utc).isoformat(timespec="seconds")
    signals = []
    for why, query, prefix in PICKS:
        for title, source, link, pub in fetch_items(query):
            if title.startswith(prefix):
                break
        else:
            sys.exit(f"not found in the feed any more: {prefix!r} ({why})")
        suffix = f" - {source}"
        clean = title[: -len(suffix)] if source and title.endswith(suffix) else title
        signals.append({
            "signal_id": "sig-" + hashlib.sha1(link.encode("utf-8")).hexdigest()[:12],
            "title": clean,
            "source": source or "unknown",
            "url": link,
            "published_at": email.utils.parsedate_to_datetime(pub).astimezone(timezone.utc).isoformat(timespec="seconds"),
            "fetched_at": fetched_at,
            "origin": "rss_snapshot",
            "feed": "google_news_search",
            "data_source_tag": "real",
            "review_state": "needs_review",
        })
        print(f"ok  {signals[-1]['published_at'][:10]}  {clean[:90]}  [{source}]")
    OUT.write_text(json.dumps(signals, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"wrote {len(signals)} signals to {OUT}")


if __name__ == "__main__":
    main()
