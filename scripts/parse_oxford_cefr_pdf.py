"""Parse Oxford 3000 by CEFR level PDF into CSV/JSON."""
from __future__ import annotations

import csv
import json
import re
from collections import Counter
from pathlib import Path

from pypdf import PdfReader

ROOT = Path(__file__).resolve().parents[1]
PDF = ROOT / "docs" / "Oxford-3000-by-CEFR-level.pdf"
OUT_CSV = ROOT / "docs" / "Oxford-3000-by-CEFR.csv"
OUT_JSON = ROOT / "docs" / "Oxford-3000-by-CEFR.json"


def extract_text(pdf_path: Path) -> str:
    reader = PdfReader(str(pdf_path))
    text = ""
    for page in reader.pages:
        t = page.extract_text() or ""
        t = re.sub(r"© Oxford University Press \d+ / \d+", "", t)
        t = re.sub(r"The Oxford 3000™ by CEFR level", "", t)
        t = re.sub(
            r"The Oxford 3000 is the list of the 3000 most important words to learn in English, from A 1 to B2 level\.",
            "",
            t,
        )
        text += t + "\n"
    return text


def parse_entries(text: str) -> list[dict[str, str]]:
    parts = re.split(r"\n(A1|A2|B1|B2)\n", text)
    entries: list[dict[str, str]] = []
    for i in range(1, len(parts), 2):
        level = parts[i]
        block = parts[i + 1]
        for raw_line in block.splitlines():
            line = raw_line.strip()
            if not line or "Oxford University Press" in line:
                continue
            entries.append({"level": level, "entry": line})
    return entries


def main() -> None:
    text = extract_text(PDF)
    entries = parse_entries(text)
    counts = Counter(e["level"] for e in entries)
    print(f"Total entries: {len(entries)}")
    print(f"By level: {dict(counts)}")

    with OUT_CSV.open("w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=["level", "entry"])
        writer.writeheader()
        writer.writerows(entries)

    with OUT_JSON.open("w", encoding="utf-8") as f:
        json.dump(entries, f, ensure_ascii=False, indent=2)

    print(f"Wrote {OUT_CSV}")
    print(f"Wrote {OUT_JSON}")


if __name__ == "__main__":
    main()
