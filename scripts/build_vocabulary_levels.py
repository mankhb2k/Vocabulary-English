"""Build docs/Vocabulary-levels.md from Oxford CEFR data + Vocabulary-topics.md."""
from __future__ import annotations

import csv
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
TOPICS_MD = ROOT / "docs" / "Vocabulary-topics.md"
OXFORD_CSV = ROOT / "docs" / "Oxford-3000-by-CEFR.csv"
LEVELS_MD = ROOT / "docs" / "Vocabulary-levels.md"

LEVEL_LABELS = {
    "A1": "Beginner",
    "A2": "Elementary",
    "B1": "Intermediate",
    "B2": "Upper Intermediate",
}

POS_PATTERN = re.compile(
    r"\s+(?:n\.|v\.|adj\.|adv\.|prep\.|conj\.|pron\.|det\.|exclam\.|modal v\.|auxiliary v\.|number)"
)

SKIP_HEAD = re.compile(
    r"^(indefinite article|definite article|modal v\.|auxiliary v\.|number)$",
    re.I,
)


def normalize(word: str) -> str:
    return re.sub(r"\s+", " ", word.strip().lower())


def extract_headwords(entry: str) -> list[str]:
    head = POS_PATTERN.split(entry, maxsplit=1)[0]
    words: list[str] = []
    for part in head.split(","):
        cleaned = re.sub(r"\s*\([^)]*\)", "", part).strip()
        cleaned = re.sub(r"\d+$", "", cleaned).strip()
        if cleaned and not SKIP_HEAD.match(cleaned):
            words.append(cleaned)
    return words


def load_oxford_levels() -> dict[str, str]:
    mapping: dict[str, str] = {}
    with OXFORD_CSV.open(encoding="utf-8") as f:
        for row in csv.DictReader(f):
            for word in extract_headwords(row["entry"]):
                key = normalize(word)
                if key not in mapping:
                    mapping[key] = row["level"]
    return mapping


def load_topics_words() -> list[str]:
    words: list[str] = []
    for line in TOPICS_MD.read_text(encoding="utf-8").splitlines():
        stripped = line.strip()
        if not stripped or stripped.startswith(("#", ">", "**", "---")):
            continue
        if stripped.startswith("### "):
            continue
        if "," in stripped:
            words.extend(w.strip() for w in stripped.split(",") if w.strip())
    return words


def assign_levels(topic_words: list[str], oxford: dict[str, str]) -> dict[str, list[str]]:
    result: dict[str, list[str]] = {lvl: [] for lvl in LEVEL_LABELS}
    seen: set[str] = set()

    for word in topic_words:
        key = normalize(word)
        if not key or key in seen:
            continue
        level = oxford.get(key)
        if not level:
            continue
        result[level].append(word)
        seen.add(key)

    for key, level in oxford.items():
        if key in seen or level not in result:
            continue
        result[level].append(key)
        seen.add(key)

    for level in result:
        result[level] = sorted(set(result[level]), key=str.lower)

    return result


def write_levels_md(levels: dict[str, list[str]]) -> None:
    total = sum(len(words) for words in levels.values())
    lines = [
        "# English Vocabulary — By CEFR Level",
        "",
        "> Từ vựng theo trình độ CEFR (A1 → B2). Nguồn: Oxford 3000 + từ trong Vocabulary-topics có mapping Oxford.",
        "",
        "> Copy sang Notion — tự thêm Pronounce · Meaning · Image.",
        "",
        f"**Tổng:** {total} từ/cụm unique · "
        + " · ".join(f"{lvl}: {len(levels[lvl])}" for lvl in LEVEL_LABELS),
        "",
        "---",
        "",
    ]

    for level, label in LEVEL_LABELS.items():
        words = levels[level]
        lines.append(f"## {level} — {label}")
        lines.append("")
        lines.append(", ".join(words))
        lines.append("")

    LEVELS_MD.write_text("\n".join(lines), encoding="utf-8")


def main() -> None:
    oxford = load_oxford_levels()
    topic_words = load_topics_words()
    levels = assign_levels(topic_words, oxford)
    write_levels_md(levels)
    print(f"Wrote {LEVELS_MD}")
    for lvl in LEVEL_LABELS:
        print(f"  {lvl}: {len(levels[lvl])} words")


if __name__ == "__main__":
    main()
