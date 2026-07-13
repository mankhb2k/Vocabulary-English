import re
import sys
from pathlib import Path


def parse_chunk_line(text: str) -> dict:
    text = text.strip()
    m = re.match(r'^(.+?)\s*\(([^)]+)\)\s*--\s*(.+)$', text)
    if m:
        return {"english": m.group(1).strip(), "vietnamese": m.group(2).strip(), "notes": m.group(3).strip()}

    m = re.match(r'^(.+?)\s*\(([^)]+)\)$', text)
    if m:
        return {"english": m.group(1).strip(), "vietnamese": m.group(2).strip(), "notes": ""}

    m = re.match(r'^(.+?)\s*[-–—]\s*(.+)$', text)
    if m:
        return {"english": m.group(1).strip(), "vietnamese": m.group(2).strip(), "notes": ""}

    return {"english": text, "vietnamese": "", "notes": ""}


def normalize(text: str) -> str:
    text = text.replace('’', "'").replace('“', '"').replace('”', '"')
    return re.sub(r'\s+', ' ', text.strip()).lower()


def check_unique_chunks(file_path: str) -> list[dict]:
    path = Path(file_path)
    if not path.exists():
        raise FileNotFoundError(f"File not found: {path}")

    seen = {}
    duplicates = []
    with path.open('r', encoding='utf-8') as f:
        for line_no, raw_line in enumerate(f, start=1):
            stripped = raw_line.strip()
            match = re.match(r'^-\s+(.+)$', stripped)
            if not match:
                continue

            parsed = parse_chunk_line(match.group(1))
            key = normalize(parsed.get('english', ''))
            if not key:
                continue

            if key in seen:
                duplicates.append({
                    'line': line_no,
                    'english': parsed.get('english', ''),
                    'first_seen_at': seen[key],
                })
            else:
                seen[key] = line_no

    return duplicates


def main():
    file_path = sys.argv[1] if len(sys.argv) > 1 else 'docs/chunk-en-vi.md'
    duplicates = check_unique_chunks(file_path)
    if duplicates:
        print(f"Found {len(duplicates)} duplicate chunk entries in {file_path}:")
        for item in duplicates:
            print(f"- line {item['line']}: {item['english']} (first seen at line {item['first_seen_at']})")
    else:
        print(f"No duplicate chunk entries found in {file_path}")


if __name__ == '__main__':
    main()
