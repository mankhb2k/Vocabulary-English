"""
Convert MD vocabulary files to JSON.
Usage:
    python convert_md_to_json.py              # Convert both files
    python convert_md_to_json.py vocab        # Convert Vocabulary.md only
    python convert_md_to_json.py chunk        # Convert chunk-english.md only

Output:
    Vocabulary.md   → Vocabulary.json
    chunk-english.md → chunk-english.json
"""

import json
import re
import os
import sys

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DOCS_DIR = os.path.join(BASE_DIR, "docs")


# ============================================================
# 1. PARSE Vocabulary.md → Vocabulary.json
# ============================================================

def parse_vocabulary_md(filepath: str) -> dict:
    """
    Convert Vocabulary.md to structured JSON.

    Expected MD structure:
        ## A1 — Beginner
        ### 1. Topic Name (A1)
        word1, word2, word3, ...

        ## A2 — Elementary
        ### 14. Topic Name (A2)
        word1, word2, ...
    """
    with open(filepath, 'r', encoding='utf-8') as f:
        lines = f.readlines()

    result = {
        "title": "English Vocabulary — Practical Core",
        "description": "Giao tiếp hàng ngày + văn phòng / IT (A1 → B1)",
        "levels": {}
    }

    current_level = None
    current_topic = None

    for line in lines:
        stripped = line.strip()

        # Level header: ## A1 ... or ## A2 ... or ## B1 ...
        m = re.match(r'^##\s+(A[12]|B1)\b', stripped)
        if m:
            current_level = m.group(1)
            result["levels"].setdefault(current_level, {"level": current_level, "topics": []})
            continue

        # Topic header: ### N. Topic Name (Level)
        m = re.match(r'^###\s+(\d+)\.\s+(.+?)\s*\(([A-Z][0-9])\)', stripped)
        if m:
            topic_num = int(m.group(1))
            topic_name = m.group(2).strip()
            topic_level = m.group(3)
            current_topic = {"id": topic_num, "name": topic_name, "level": topic_level, "words": []}

            # Attach to current level, or fallback to level from header
            lvl = current_level if current_level and current_level in result["levels"] else topic_level
            result["levels"].setdefault(lvl, {"level": lvl, "topics": []})
            result["levels"][lvl]["topics"].append(current_topic)
            continue

        # Skip blank lines, comments (#, >), metadata (**...**), separators (---)
        if not stripped or stripped.startswith(('#', '>', '**', '---')):
            continue

        # Word line: comma-separated words for current topic
        if current_topic is not None and ',' in stripped:
            words = [w.strip() for w in stripped.split(',') if w.strip()]
            words = [w for w in words if not re.match(r'^\d+$', w)]
            current_topic["words"].extend(words)

    # Deduplicate words & compute stats
    total_words = 0
    total_topics = 0
    for lvl_data in result["levels"].values():
        for topic in lvl_data["topics"]:
            topic["words"] = list(dict.fromkeys(topic["words"]))  # preserve order, remove dups
            total_words += len(topic["words"])
        total_topics += len(lvl_data["topics"])

    result["total_words"] = total_words
    result["total_topics"] = total_topics

    return result


# ============================================================
# 2. PARSE chunk-english.md → chunk-english.json
# ============================================================

def parse_chunk_english_md(filepath: str) -> dict:
    """
    Convert chunk-english.md to structured JSON.

    Expected MD structure:
        # 🟢 PHẦN 1: ...
        ## 1. Greetings & Farewells (Chào hỏi & Tạm biệt) - 22 cụm
        *Description...*
        ### Chào hỏi (Greetings)
        - Hello! / Hi there! (Xin chào!)
        - Good morning. (Chào buổi sáng.)
        ...
        # 🌟 PHẦN 2: ...
        ## A. Storytelling & Kể chuyện - 18 cụm
        ...
    """
    with open(filepath, 'r', encoding='utf-8') as f:
        lines = f.readlines()

    result = {
        "title": "Bộ Từ Vựng & Cụm Từ Tiếng Anh Giao Tiếp Hàng Ngày",
        "description": "2000+ Chunks — Học theo cụm từ (chunks)",
        "parts": {}
    }

    current_part = None
    current_topic = None
    current_sub_topic = None
    part_topic_count = {}

    for line in lines:
        stripped = line.strip()

        # ── Part header ──
        m1 = re.match(r'^#\s+🟢\s+PHẦN\s+1', stripped)
        m2 = re.match(r'^#\s+🌟\s+PHẦN\s+2', stripped)
        m = m1 or m2
        if m:
            part_key = "part1" if m1 else "part2"
            part_title = "PHẦN 1: TỪ VỰNG CƠ BẢN" if m1 else "PHẦN 2: TỪ VỰNG NÂNG CAO"
            part_desc = "Dùng trong 90% hội thoại" if m1 else "Cách diễn đạt tự nhiên như người bản xứ"
            current_part = part_key
            result["parts"][part_key] = {
                "id": part_key, "title": part_title, "description": part_desc, "topics": []
            }
            part_topic_count[part_key] = 0
            current_topic = None
            current_sub_topic = None
            continue

        # ── Topic header (## N. ... or ## A. ...) ──
        m = re.match(r'^##\s+([\dA-Z]+)\.\s+(.+?)(?:\s*—\s*(.+))?$', stripped)
        if m and current_part:
            code = m.group(1)
            raw_name = m.group(2).strip()
            meta_text = m.group(3) or ""

            # Extract chunk count from name or meta
            chunk_count = 0
            count_m = re.search(r'(\d+)\s*cụm', meta_text) or re.search(r'(\d+)\s*cụm', raw_name)
            if count_m:
                chunk_count = int(count_m.group(1))

            # Split English / Vietnamese name
            name_split = re.match(r'^(.+?)\s*[-—]\s*(.+)', raw_name)
            if name_split:
                eng, vie = name_split.group(1).strip(), name_split.group(2).strip()
            else:
                # Try "(Vietnamese)" at end
                paren = re.match(r'^(.+?)\s*\((.+?)\)$', raw_name)
                eng, vie = (paren.group(1).strip(), paren.group(2).strip()) if paren else (raw_name, "")

            part_topic_count[current_part] += 1
            current_topic = {
                "id": part_topic_count[current_part],
                "code": code,
                "name_english": eng,
                "name_vietnamese": vie,
                "estimated_chunks": chunk_count,
                "description": "",
                "sub_topics": []
            }
            current_sub_topic = None
            result["parts"][current_part]["topics"].append(current_topic)
            continue

        # ── Sub-topic header (### ...) ──
        m = re.match(r'^###\s+(.+)$', stripped)
        if m and current_topic is not None:
            current_sub_topic = {"name": m.group(1).strip(), "description": "", "chunks": []}
            current_topic["sub_topics"].append(current_sub_topic)
            continue

        # ── Italic description line (*...*) ──
        m = re.match(r'^\*\s*(.+?)\*?$', stripped)
        if m:
            desc = m.group(1).strip().rstrip('*').rstrip()
            if current_sub_topic and not current_sub_topic.get("chunks"):
                current_sub_topic["description"] = desc
            elif current_topic and not current_topic.get("description") and not current_topic.get("sub_topics"):
                current_topic["description"] = desc
            continue

        # ── Chunk entry (- English (Vietnamese)) ──
        m = re.match(r'^-\s+(.+)$', stripped)
        if m:
            raw = m.group(1).strip()

            # Parse: "...english... (...vietnamese...)" at end
            parsed = _parse_chunk_line(raw)
            chunk = {
                "english": parsed["english"],
                "vietnamese": parsed["vietnamese"],
                "notes": parsed.get("notes", "")
            }

            if current_sub_topic is not None:
                current_sub_topic["chunks"].append(chunk)
            elif current_topic is not None:
                current_topic.setdefault("direct_chunks", []).append(chunk)

    # ── Post-process: move direct_chunks into sub_topics ──
    for part_data in result["parts"].values():
        for topic in part_data["topics"]:
            dc = topic.pop("direct_chunks", None)
            if dc:
                if topic["sub_topics"]:
                    topic["sub_topics"][-1]["chunks"].extend(dc)
                else:
                    topic["sub_topics"].append({"name": "Main", "description": "", "chunks": dc})

    # ── Stats ──
    total_chunks = 0
    total_sections = 0
    for part_data in result["parts"].values():
        for topic in part_data["topics"]:
            for sub in topic["sub_topics"]:
                total_chunks += len(sub["chunks"])
        total_sections += len(part_data["topics"])

    result["total_chunks"] = total_chunks
    result["total_sections"] = total_sections

    return result


def _parse_chunk_line(text: str) -> dict:
    """Parse one chunk line like 'Hello! / Hi there! (Xin chào!)'

    Supported formats:
        English (Vietnamese)
        English (Vietnamese) -- note
        English - Vietnamese
    """

    # Case: "... (translation) -- note" — note separated by -- after closing paren
    m = re.match(r'^(.+?)\s*\(([^)]+)\)\s*--\s*(.+)$', text)
    if m:
        return {
            "english": m.group(1).strip(),
            "vietnamese": m.group(2).strip(),
            "notes": m.group(3).strip()
        }

    # Case: "... (translation)" — last parenthesized group
    m = re.match(r'^(.+?)\s*\(([^)]+)\)$', text)
    if m:
        return {"english": m.group(1).strip(), "vietnamese": m.group(2).strip(), "notes": ""}

    # Case: "... - translation"
    m = re.match(r'^(.+?)\s*[-–—]\s*(.+)$', text)
    if m:
        return {"english": m.group(1).strip(), "vietnamese": m.group(2).strip(), "notes": ""}

    return {"english": text, "vietnamese": "", "notes": ""}


# ============================================================
# 3. MAIN
# ============================================================

def main():
    targets = sys.argv[1:] if len(sys.argv) > 1 else ["all"]

    if "vocab" in targets or "all" in targets:
        inp = os.path.join(DOCS_DIR, "Vocabulary.md")
        out = os.path.join(BASE_DIR, "Vocabulary.json")
        if not os.path.exists(inp):
            print(f"❌ Not found: {inp}")
        else:
            print(f"📖 Parsing {inp} ...")
            data = parse_vocabulary_md(inp)
            with open(out, 'w', encoding='utf-8') as f:
                json.dump(data, f, ensure_ascii=False, indent=2)
            print(f"   ✅ {out}")
            for lvl, ld in data["levels"].items():
                print(f"      {lvl}: {len(ld['topics'])} topics, "
                      f"{sum(len(t['words']) for t in ld['topics'])} words")
            print(f"      Total: {data['total_topics']} topics, {data['total_words']} words")

    if "chunk" in targets or "all" in targets:
        inp = os.path.join(DOCS_DIR, "chunk-english.md")
        out = os.path.join(BASE_DIR, "chunk-english.json")
        if not os.path.exists(inp):
            print(f"❌ Not found: {inp}")
        else:
            print(f"\n📖 Parsing {inp} ...")
            data = parse_chunk_english_md(inp)
            with open(out, 'w', encoding='utf-8') as f:
                json.dump(data, f, ensure_ascii=False, indent=2)
            print(f"   ✅ {out}")
            for pk, pd in data["parts"].items():
                print(f"      {pd['title']}: {len(pd['topics'])} sections, "
                      f"{sum(sum(len(s['chunks']) for s in t['sub_topics']) for t in pd['topics'])} chunks")
            print(f"      Total: {data['total_sections']} sections, {data['total_chunks']} chunks")


if __name__ == "__main__":
    main()