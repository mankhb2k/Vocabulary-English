"""
Validate vocabulary/chunk data before or after editing Markdown source files.

Usage:
    # Kiểm tra toàn bộ file MD (cấu trúc, số cụm, trùng lặp)
    python validate_data.py md docs/chunk-en-vi.md

    # Kiểm tra file nháp TRƯỚC KHI gộp vào MD
    python validate_data.py draft drafts/new-chunks.md --against docs/chunk-en-vi.md

    # Kiểm tra file JSON nháp
    python validate_data.py json drafts/new-chunks.json --against docs/chunk-en-vi.md

    # Kiểm tra phrasal verbs từ CSV chưa có trong MD
    python validate_data.py csv common-phrasals-verbs.csv --against docs/chunk-en-vi.md

Exit code: 0 = pass, 1 = có lỗi
"""

from __future__ import annotations

import argparse
import csv
import json
import re
import sys
from dataclasses import dataclass, field
from pathlib import Path

from check_unique_chunks import check_unique_chunks, normalize, parse_chunk_line
from convert_md_to_json import parse_chunk_english_md


# ── Result types ──────────────────────────────────────────────

@dataclass
class Issue:
    level: str  # error | warning
    code: str
    message: str
    line: int | None = None

    def format(self) -> str:
        loc = f" (line {self.line})" if self.line else ""
        icon = "ERROR" if self.level == "error" else "WARN "
        return f"[{icon}] {self.code}{loc}: {self.message}"


@dataclass
class Report:
    issues: list[Issue] = field(default_factory=list)

    @property
    def ok(self) -> bool:
        return not any(i.level == "error" for i in self.issues)

    def error(self, code: str, message: str, line: int | None = None) -> None:
        self.issues.append(Issue("error", code, message, line))

    def warn(self, code: str, message: str, line: int | None = None) -> None:
        self.issues.append(Issue("warning", code, message, line))


# ── Shared patterns (theo README) ─────────────────────────────

PART_RE = re.compile(r'^#\s+(🟢\s+PHẦN\s+1|🌟\s+PHẦN\s+2)')
TOPIC_RE = re.compile(r'^##\s+([\dA-Z]+)\.\s+(.+)$')
SUBTOPIC_RE = re.compile(r'^###\s+(.+)$')
CHUNK_RE = re.compile(r'^-\s+(.+)$')
COUNT_RE = re.compile(r'(\d+)\s*cụm')
LEVEL_RE = re.compile(r'^##\s+(A[12]|B1)\b')
VOCAB_TOPIC_RE = re.compile(r'^###\s+(\d+)\.\s+(.+?)\s*\((A[12]|B1)\)')


def validate_chunk_line(text: str, line_no: int, report: Report) -> dict | None:
    """Kiểm tra một dòng chunk theo mẫu README."""
    if re.search(r'\([^()]*\([^()]*\)[^()]*\)', text):
        report.warn(
            "NESTED_PARENTHESES",
            f'Nên tránh ngoặc lồng nhau, dùng "--" cho ghi chú: `- English (dịch) -- ghi chú`',
            line_no,
        )

    parsed = parse_chunk_line(text)

    if not parsed["english"]:
        report.error("EMPTY_ENGLISH", "Chunk không có nội dung tiếng Anh", line_no)
        return None

    if not parsed["vietnamese"]:
        report.error(
            "MISSING_VIETNAMESE",
            f'Thiếu bản dịch tiếng Việt. Mẫu đúng: `- {parsed["english"]} (dịch tiếng Việt)`',
            line_no,
        )
        return None

    if parsed["english"].startswith("(") or parsed["english"].endswith(")"):
        report.warn("SUSPICIOUS_ENGLISH", f'English có vẻ sai format: "{parsed["english"]}"', line_no)

    return parsed


def is_vocab_chunk_line(stripped: str) -> bool:
    """Bỏ qua bullet mô tả/intro, chỉ lấy chunk từ vựng thật."""
    if not CHUNK_RE.match(stripped):
        return False
    if stripped.startswith("- **") or stripped.startswith("- *"):
        return False
    return True


def collect_chunks_from_lines(lines: list[str], report: Report, vocab_only: bool = False) -> list[dict]:
    """Parse chunks từ danh sách dòng, ghi lỗi format."""
    chunks = []
    in_vocab_section = not vocab_only

    for i, raw in enumerate(lines, start=1):
        stripped = raw.strip()
        if PART_RE.match(stripped):
            in_vocab_section = True
            continue
        if not in_vocab_section:
            continue
        if not is_vocab_chunk_line(stripped):
            continue

        m = CHUNK_RE.match(stripped)
        parsed = validate_chunk_line(m.group(1), i, report)
        if parsed:
            chunks.append({**parsed, "line": i, "raw": stripped})
    return chunks


def collect_existing_english(md_path: Path) -> dict[str, int]:
    """Lấy tất cả english keys đã có trong file MD đích."""
    seen: dict[str, int] = {}
    with md_path.open(encoding="utf-8") as f:
        for line_no, raw in enumerate(f, start=1):
            m = CHUNK_RE.match(raw.strip())
            if not m:
                continue
            parsed = parse_chunk_line(m.group(1))
            key = normalize(parsed.get("english", ""))
            if key and key not in seen:
                seen[key] = line_no
    return seen


def check_duplicates_against(chunks: list[dict], existing: dict[str, int], report: Report, source: str) -> None:
    """Kiểm tra trùng trong draft và trùng với file MD đích."""
    draft_seen: dict[str, int] = {}

    for chunk in chunks:
        key = normalize(chunk["english"])
        if not key:
            continue

        if key in draft_seen:
            report.error(
                "DUPLICATE_IN_DRAFT",
                f'Trùng trong draft: "{chunk["english"]}" (lần đầu ở dòng {draft_seen[key]})',
                chunk["line"],
            )
        else:
            draft_seen[key] = chunk["line"]

        if key in existing:
            report.error(
                "DUPLICATE_IN_TARGET",
                f'Đã tồn tại trong MD đích: "{chunk["english"]}" (dòng {existing[key]})',
                chunk["line"],
            )


def validate_md_structure(lines: list[str], report: Report) -> None:
    """Kiểm tra cấu trúc heading theo README."""
    in_part = False
    has_topic = False
    has_subtopic = False

    for i, raw in enumerate(lines, start=1):
        stripped = raw.strip()
        if not stripped:
            continue

        if PART_RE.match(stripped):
            in_part = True
            has_topic = False
            has_subtopic = False
            continue

        if not in_part:
            continue

        m = TOPIC_RE.match(stripped)
        if m:
            has_topic = True
            has_subtopic = False
            name = m.group(2)
            if not COUNT_RE.search(name):
                report.warn("MISSING_CHUNK_COUNT", f'Topic thiếu "- N cụm" trong tiêu đề: "{name}"', i)
            continue

        m = SUBTOPIC_RE.match(stripped)
        if m:
            if not has_topic:
                report.error("SUBTOPIC_WITHOUT_TOPIC", f'Sub-topic không thuộc topic nào: "{m.group(1)}"', i)
            has_subtopic = True
            continue

        if is_vocab_chunk_line(stripped):
            if not has_topic:
                report.error("CHUNK_WITHOUT_TOPIC", "Chunk nằm ngoài topic (## ...)", i)
            elif not has_subtopic:
                report.warn(
                    "CHUNK_WITHOUT_SUBTOPIC",
                    "Chunk nên nằm dưới ### sub-topic (theo README)",
                    i,
                )
            continue


def validate_chunk_counts(md_path: Path, report: Report) -> None:
    """So sánh số cụm trong header với số thực tế."""
    data = parse_chunk_english_md(str(md_path))
    for part in data["parts"].values():
        for topic in part["topics"]:
            actual = sum(len(s["chunks"]) for s in topic["sub_topics"])
            expected = topic["estimated_chunks"]
            if expected and expected != actual:
                report.warn(
                    "CHUNK_COUNT_MISMATCH",
                    f'Section {topic["code"]}. {topic["name_english"]}: '
                    f'header ghi {expected} cụm, thực tế {actual} cụm',
                )
            for sub in topic["sub_topics"]:
                if sub["name"] == "Main":
                    report.warn(
                        "IMPLICIT_SUBTOPIC",
                        f'Section {topic["code"]} dùng sub-topic ngầm "Main" — nên thêm ###',
                    )


# ── Validators ────────────────────────────────────────────────

def validate_md(md_path: Path) -> Report:
    report = Report()
    lines = md_path.read_text(encoding="utf-8").splitlines()

    validate_md_structure(lines, report)
    collect_chunks_from_lines(lines, report, vocab_only=True)

    for dup in check_unique_chunks(str(md_path)):
        report.error(
            "DUPLICATE_CHUNK",
            f'Trùng chunk: "{dup["english"]}" (lần đầu ở dòng {dup["first_seen_at"]})',
            dup["line"],
        )

    validate_chunk_counts(md_path, report)

    # Thử parse JSON — nếu fail thì là lỗi nghiêm trọng
    try:
        parse_chunk_english_md(str(md_path))
    except Exception as exc:
        report.error("PARSE_FAILED", f'Không parse được MD: {exc}')

    return report


def validate_draft(draft_path: Path, against: Path) -> Report:
    report = Report()
    lines = draft_path.read_text(encoding="utf-8").splitlines()

    validate_md_structure(lines, report)
    chunks = collect_chunks_from_lines(lines, report)

    if against.exists():
        existing = collect_existing_english(against)
        check_duplicates_against(chunks, existing, report, source=str(draft_path))
    else:
        report.warn("TARGET_NOT_FOUND", f'Không tìm thấy file đích để so trùng: {against}')

    if not chunks:
        report.warn("NO_CHUNKS", "Draft không có chunk nào (- English (Vietnamese))")

    return report


def validate_json_draft(json_path: Path, against: Path) -> Report:
    """Validate file JSON nháp trước khi convert sang MD."""
    report = Report()

    try:
        data = json.loads(json_path.read_text(encoding="utf-8"))
    except json.JSONDecodeError as exc:
        report.error("INVALID_JSON", str(exc))
        return report

    # Hỗ trợ 2 schema: list chunks hoặc full topic
    raw_chunks: list[dict] = []

    if isinstance(data, list):
        raw_chunks = data
    elif isinstance(data, dict):
        if "chunks" in data:
            raw_chunks = data["chunks"]
        elif "sub_topics" in data:
            for sub in data["sub_topics"]:
                raw_chunks.extend(sub.get("chunks", []))
        else:
            report.error("INVALID_SCHEMA", 'JSON cần có "chunks" hoặc "sub_topics"')
            return report
    else:
        report.error("INVALID_SCHEMA", "JSON phải là list hoặc object")
        return report

    chunks = []
    for i, item in enumerate(raw_chunks, start=1):
        if not isinstance(item, dict):
            report.error("INVALID_CHUNK", f'Chunk #{i} phải là object', i)
            continue

        english = str(item.get("english", "")).strip()
        vietnamese = str(item.get("vietnamese", "")).strip()
        notes = str(item.get("notes", "")).strip()

        if not english:
            report.error("EMPTY_ENGLISH", f'Chunk #{i} thiếu "english"', i)
            continue
        if not vietnamese:
            report.error("MISSING_VIETNAMESE", f'Chunk #{i} thiếu "vietnamese": "{english}"', i)
            continue

        chunks.append({"english": english, "vietnamese": vietnamese, "notes": notes, "line": i})

    if against.exists():
        existing = collect_existing_english(against)
        check_duplicates_against(chunks, existing, report, source=str(json_path))

    return report


def validate_csv(csv_path: Path, against: Path, limit: int = 50) -> Report:
    """Liệt kê phrasal verbs trong CSV chưa có trong MD."""
    report = Report()

    if not against.exists():
        report.error("TARGET_NOT_FOUND", f'Không tìm thấy: {against}')
        return report

    existing_text = against.read_text(encoding="utf-8").lower()
    existing_keys = collect_existing_english(against)

    missing = []
    with csv_path.open(encoding="utf-8") as f:
        reader = csv.DictReader(f, delimiter="\t")
        seen_phrasals: set[str] = set()
        for row in reader:
            phrasal = row.get("phrasal", "").strip().lower()
            if not phrasal or phrasal in seen_phrasals:
                continue
            seen_phrasals.add(phrasal)

            pattern = r"\b" + re.escape(phrasal) + r"\b"
            if phrasal in existing_keys or re.search(pattern, existing_text):
                continue

            missing.append({
                "phrasal": phrasal,
                "meaning": row.get("meaning", "").strip(),
            })

    if missing:
        report.warn(
            "CSV_NOT_IN_MD",
            f'Có {len(missing)} phrasal verb trong CSV chưa có trong MD (hiện {len(seen_phrasals) - len(missing)}/{len(seen_phrasals)} đã có)',
        )
        for item in missing[:limit]:
            report.warn("CSV_MISSING", f'{item["phrasal"]}: {item["meaning"][:70]}')
        if len(missing) > limit:
            report.warn("CSV_MISSING_MORE", f'... và {len(missing) - limit} cụm khác')
    else:
        report.issues.append(Issue("warning", "CSV_ALL_COVERED", "Tất cả phrasal verbs trong CSV đã có trong MD"))

    return report


def render_md_from_json(data: dict) -> str:
    """Chuyển JSON nháp thành MD snippet để copy vào chunk-en-vi.md."""
    lines: list[str] = []

    topic = data.get("topic")
    if topic:
        code = topic.get("code", "N")
        name_en = topic.get("name_english", "New Topic")
        name_vi = topic.get("name_vietnamese", "")
        count = topic.get("estimated_chunks", 0)
        title = f"## {code}. {name_en} ({name_vi}) - {count} cụm" if name_vi else f"## {code}. {name_en} - {count} cụm"
        lines.append(title)
        lines.append("")

    sub_topics = data.get("sub_topics", [])
    if sub_topics:
        for sub in sub_topics:
            lines.append(f"### {sub['name']}")
            lines.append("")
            for chunk in sub.get("chunks", []):
                line = f"- {chunk['english']} ({chunk['vietnamese']})"
                if chunk.get("notes"):
                    line += f" -- {chunk['notes']}"
                lines.append(line)
            lines.append("")
    elif data.get("chunks"):
        lines.append("### Main")
        lines.append("")
        for chunk in data["chunks"]:
            line = f"- {chunk['english']} ({chunk['vietnamese']})"
            if chunk.get("notes"):
                line += f" -- {chunk['notes']}"
            lines.append(line)

    return "\n".join(lines).rstrip() + "\n"


def print_report(report: Report) -> None:
    errors = [i for i in report.issues if i.level == "error"]
    warnings = [i for i in report.issues if i.level == "warning"]

    for issue in report.issues:
        print(issue.format())

    print()
    print(f"Kết quả: {len(errors)} lỗi, {len(warnings)} cảnh báo")
    print("PASS" if report.ok else "FAIL")


def main() -> int:
    parser = argparse.ArgumentParser(description="Validate vocabulary/chunk data before editing Markdown")
    sub = parser.add_subparsers(dest="command", required=True)

    p_md = sub.add_parser("md", help="Kiểm tra file Markdown đầy đủ")
    p_md.add_argument("file", type=Path)

    p_draft = sub.add_parser("draft", help="Kiểm tra file MD nháp trước khi gộp")
    p_draft.add_argument("file", type=Path)
    p_draft.add_argument("--against", type=Path, default=Path("docs/chunk-en-vi.md"))

    p_json = sub.add_parser("json", help="Kiểm tra file JSON nháp")
    p_json.add_argument("file", type=Path)
    p_json.add_argument("--against", type=Path, default=Path("docs/chunk-en-vi.md"))
    p_json.add_argument("--render", action="store_true", help="In ra MD snippet nếu pass")

    p_csv = sub.add_parser("csv", help="So sánh phrasal verbs CSV với MD")
    p_csv.add_argument("file", type=Path)
    p_csv.add_argument("--against", type=Path, default=Path("docs/chunk-en-vi.md"))
    p_csv.add_argument("--limit", type=int, default=50)

    args = parser.parse_args()

    if args.command == "md":
        report = validate_md(args.file)
    elif args.command == "draft":
        report = validate_draft(args.file, args.against)
    elif args.command == "json":
        report = validate_json_draft(args.file, args.against)
        if report.ok and args.render:
            data = json.loads(args.file.read_text(encoding="utf-8"))
            print("\n--- MD snippet ---")
            print(render_md_from_json(data))
    elif args.command == "csv":
        report = validate_csv(args.file, args.against, args.limit)
    else:
        parser.print_help()
        return 1

    print_report(report)
    return 0 if report.ok else 1


if __name__ == "__main__":
    sys.exit(main())
