# Vocabulary-English

## English

This repository contains a practical English vocabulary collection organized in Markdown source files and generated JSON outputs.

- Source files:
  - [docs/Vocabulary-topics.md](docs/Vocabulary-topics.md) for vocabulary by topic (no CEFR level)
  - [docs/Vocabulary-levels.md](docs/Vocabulary-levels.md) for vocabulary by CEFR level (A1 → B2)
  - [docs/chunk-en-vi.md](docs/chunk-en-vi.md) for everyday EN→VI chunks and subtopics
  - Multi-language chunk naming: `chunk-<source>-<target>.md` (e.g. future `chunk-en-ja.md`, `chunk-en-ko.md`)
- Generated JSON files:
  - [json/Vocabulary-topics.json](json/Vocabulary-topics.json)
  - [json/Vocabulary-levels.json](json/Vocabulary-levels.json)
  - [json/chunk-en-vi.json](json/chunk-en-vi.json)

### Rough size (approximate, not exact)

The collection is intended to support practical daily communication. The size is not stated as a precise count; instead, the repository uses rough estimates so it can be updated easily as content grows.

- Vocabulary items: about 3,000 words/phrases, roughly in the 2,500–3,500 range, and it may be a bit higher or lower over time.
- Chunks: about 500 chunks, roughly in the 500–1,000 range, and it may be a bit higher or lower over time.

### How to work with the data

- Edit the Markdown source files first.
- **Validate new data before merging** with `python validate_data.py` (see below).
- Run `python convert_md_to_json.py` to regenerate the JSON files.
- Run `python check_unique_chunks.py docs/chunk-en-vi.md` to check for duplicate chunk entries.

### Validate data before adding to MD

The [validate_data.py](validate_data.py) script checks data **before** you copy it into `chunk-en-vi.md`:

```bash
# 1) Validate a draft .md file (format + duplicates against target MD)
python validate_data.py draft drafts/example-chunks.md --against docs/chunk-en-vi.md

# 2) Validate a draft .json file and print an MD snippet on pass
python validate_data.py json drafts/example-chunks.json --against docs/chunk-en-vi.md --render

# 3) Validate the full MD file (structure, chunk counts, duplicates)
python validate_data.py md docs/chunk-en-vi.md

# 4) List phrasal verbs in CSV that are not yet in MD
python validate_data.py csv common-phrasals-verbs.csv --against docs/chunk-en-vi.md
```

Suggested workflow when adding new content:

1. Create a draft file in `drafts/` (`.md` or `.json`).
2. Run `validate_data.py draft` or `validate_data.py json`.
3. If the result is `PASS`, copy the content into `docs/chunk-en-vi.md`.
4. Run `validate_data.py md` and `convert_md_to_json.py`.

Draft JSON schema:

```json
{
  "topic": {
    "code": "24",
    "name_english": "Health & Body",
    "name_vietnamese": "Sức khỏe & Cơ thể",
    "estimated_chunks": 3
  },
  "sub_topics": [
    {
      "name": "Triệu chứng",
      "chunks": [
        { "english": "Throw up", "vietnamese": "Nôn / Ói" }
      ]
    }
  ]
}
```

Exit codes: `0` = PASS, `1` = FAIL (errors must be fixed; warnings are advisory).

---

## Tiếng Việt

Repo này chứa bộ từ vựng tiếng Anh thực dụng, được tổ chức theo các file Markdown nguồn và các file JSON đã được sinh ra từ đó.

- File nguồn:
  - [docs/Vocabulary-topics.md](docs/Vocabulary-topics.md) cho từ vựng theo chủ đề (không gắn level CEFR)
  - [docs/Vocabulary-levels.md](docs/Vocabulary-levels.md) cho từ vựng theo level CEFR (A1 → B2)
  - [docs/chunk-en-vi.md](docs/chunk-en-vi.md) cho các cụm từ EN→VI và subtopic dùng trong giao tiếp hàng ngày
  - Quy ước đặt tên chunk đa ngôn ngữ: `chunk-<nguồn>-<đích>.md` (ví dụ sau này: `chunk-en-ja.md`, `chunk-en-ko.md`)
- File JSON:
  - [json/Vocabulary-topics.json](json/Vocabulary-topics.json)
  - [json/Vocabulary-levels.json](json/Vocabulary-levels.json)
  - [json/chunk-en-vi.json](json/chunk-en-vi.json)

### Ước tính sơ bộ (không ghi là số chính xác)

Bộ dữ liệu này được thiết kế để hỗ trợ học tiếng Anh giao tiếp hàng ngày. Thay vì ghi số chính xác, repo dùng cách ghi ước lượng sơ bộ để tránh sai lệch khi nội dung vẫn đang được cập nhật.

- Từ/vựng: khoảng 3,000 từ hoặc cụm từ, ước lượng vào khoảng 2,500–3,500, có thể nhiều hơn hoặc ít hơn một chút.
- Chunks: khoảng 500 cụm, ước lượng vào khoảng 500–1,000, có thể nhiều hơn hoặc ít hơn một chút.

### Cách làm việc với dữ liệu

- Chỉnh sửa file Markdown nguồn trước.
- **Kiểm tra trước khi gộp dữ liệu mới** bằng `python validate_data.py` (xem bên dưới).
- Chạy `python convert_md_to_json.py` để sinh lại file JSON.
- Chạy `python check_unique_chunks.py docs/chunk-en-vi.md` để kiểm tra xem có dòng chunk nào bị trùng không.

### Validate dữ liệu trước khi đưa vào MD

Script [validate_data.py](validate_data.py) giúp kiểm tra dữ liệu **trước** khi copy vào `chunk-en-vi.md`:

```bash
# 1) Kiểm tra file nháp .md (format + trùng với MD đích)
python validate_data.py draft drafts/example-chunks.md --against docs/chunk-en-vi.md

# 2) Kiểm tra file nháp .json và in ra MD snippet nếu pass
python validate_data.py json drafts/example-chunks.json --against docs/chunk-en-vi.md --render

# 3) Kiểm tra toàn bộ file MD (cấu trúc, số cụm, trùng lặp)
python validate_data.py md docs/chunk-en-vi.md

# 4) Xem phrasal verbs trong CSV chưa có trong MD
python validate_data.py csv common-phrasals-verbs.csv --against docs/chunk-en-vi.md
```

Quy trình đề xuất khi thêm nội dung mới:

1. Tạo file nháp trong thư mục `drafts/` (`.md` hoặc `.json`).
2. Chạy `validate_data.py draft` hoặc `validate_data.py json`.
3. Nếu `PASS`, copy nội dung vào `docs/chunk-en-vi.md`.
4. Chạy `validate_data.py md` và `convert_md_to_json.py`.

File JSON nháp theo schema:

```json
{
  "topic": {
    "code": "24",
    "name_english": "Health & Body",
    "name_vietnamese": "Sức khỏe & Cơ thể",
    "estimated_chunks": 3
  },
  "sub_topics": [
    {
      "name": "Triệu chứng",
      "chunks": [
        { "english": "Throw up", "vietnamese": "Nôn / Ói" }
      ]
    }
  ]
}
```

---

## Quy định thêm nội dung mới

### 1) Thêm từ mới vào [docs/Vocabulary-topics.md](docs/Vocabulary-topics.md)

Cấu trúc cơ bản:

```md
### 1. Greetings & Self

hello, hi, good morning, nice to meet you
```

- Mỗi chủ đề bắt đầu bằng heading `### <số>. <Tên chủ đề>` — **không** ghi level CEFR.
- Nội dung dưới mỗi topic là danh sách từ/cụm, cách nhau bằng dấu phẩy.
- Level CEFR xem tại [docs/Vocabulary-levels.md](docs/Vocabulary-levels.md).
- Nếu thêm topic mới, dùng số tiếp theo như `### 55. New Topic`.

### 1b) Cập nhật [docs/Vocabulary-levels.md](docs/Vocabulary-levels.md)

File này được sinh tự động từ `Vocabulary-topics.md` + Oxford CEFR:

```bash
python scripts/build_vocabulary_levels.py
python convert_md_to_json.py vocab
```

Cấu trúc:

```md
## A1 — Beginner

hello, hi, good morning

## B2 — Upper Intermediate

abandon, absolute, accompany
```

### 2) Thêm chủ đề mới vào [docs/chunk-en-vi.md](docs/chunk-en-vi.md)

Cấu trúc cơ bản:

```md
# 🟢 PHẦN 1: TỪ VỰNG CƠ BẢN

## 20. New Topic (Chủ đề mới) - 5 cụm

### Sub Topic Name

- Hello world (Xin chào thế giới)
- Good morning (Chào buổi sáng) -- ghi chú
```

- Mỗi phần bắt đầu bằng `# 🟢 PHẦN 1: TỪ VỰNG CƠ BẢN` hoặc `# 🌟 PHẦN 2: TỪ VỰNG NÂNG CAO`.
- Mỗi chủ đề mới bắt đầu bằng `## <số hoặc chữ>. <Tên chủ đề> - <số> cụm`.
- Mỗi sub-topic bắt đầu bằng `### <Tên sub-topic>`.
- Mỗi chunk bắt đầu bằng `-` theo mẫu `- English phrase (Vietnamese translation)` hoặc `- English phrase (Vietnamese translation) -- note`.
