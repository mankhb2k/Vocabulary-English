# Vocabulary-English

Repo này dùng để quản lý bộ từ vựng tiếng Anh theo 2 file nguồn:

- [docs/Vocabulary.md](docs/Vocabulary.md): từ vựng theo level A1 → B1
- [docs/chunk-english.md](docs/chunk-english.md): cụm từ theo phần, chủ đề và sub-topic

Sau khi chỉnh xong, hãy chạy:

```bash
python convert_md_to_json.py
```

Script sẽ tự tạo lại [Vocabulary.json](Vocabulary.json) và [chunk-english.json](chunk-english.json).

---

## 1) Quy định thêm từ mới vào [docs/Vocabulary.md](docs/Vocabulary.md)

### Cấu trúc bắt buộc

```md
## A1 — Beginner

### 1. Greetings & Self (A1)

hello, hi, good morning, nice to meet you
```

### Rules

- Mỗi level phải bắt đầu bằng heading dạng:
  - `## A1 — Beginner`
  - `## A2 — Elementary`
  - `## B1 — Intermediate`
- Mỗi chủ đề phải bắt đầu bằng heading:
  - `### <số>. <Tên chủ đề> (A1|A2|B1)`
- Dòng nội dung dưới mỗi topic là danh sách từ/cụm, cách nhau bằng dấu phẩy.
- Mỗi mục phải là một từ hoặc cụm từ riêng biệt; không dùng dấu phẩy bên trong một mục.
- Nếu thêm topic mới ở B1, nên dùng số tiếp theo, ví dụ `### 50. New Topic (B1)`.
- Nên giữ đúng level trong ngoặc: `A1`, `A2`, `B1`.

### Ví dụ thêm topic mới

```md
## B1 — Intermediate

### 50. New Topic (B1)

word one, word two, multi word phrase, another-word
```

---

## 2) Quy định thêm chủ đề mới vào [docs/chunk-english.md](docs/chunk-english.md)

### Cấu trúc bắt buộc

```md
# 🟢 PHẦN 1: TỪ VỰNG CƠ BẢN

## 20. New Topic (Chủ đề mới) - 5 cụm

### Sub Topic Name

- Hello world (Xin chào thế giới)
- Good morning (Chào buổi sáng) -- ghi chú
```

### Rules

- Phần đầu tiên phải có heading:
  - `# 🟢 PHẦN 1: TỪ VỰNG CƠ BẢN`
  - `# 🌟 PHẦN 2: TỪ VỰNG NÂNG CAO`
- Mỗi chủ đề mới bắt đầu bằng:
  - `## <số hoặc chữ>. <Tên chủ đề> - <số> cụm`
  - Ví dụ: `## 20. New Topic (Chủ đề mới) - 5 cụm`
- Mỗi sub-topic bắt đầu bằng:
  - `### <Tên sub-topic>`
- Mỗi chunk bắt đầu bằng dấu gạch đầu dòng `-` theo mẫu:
  - `- English phrase (Vietnamese translation)`
  - `- English phrase (Vietnamese translation) -- note`
- Nếu cần ghi chú, dùng `--` sau phần dịch tiếng Việt.

### Ví dụ thêm chunk mới

```md
## 21. New Topic (Chủ đề mới) - 3 cụm

### Sub Topic A

- Hello there (Xin chào)
- See you later (Hẹn gặp lại) -- dùng khi tạm biệt
```

---

## 3) Sau khi thêm xong

Chạy lệnh sau từ thư mục gốc:

```bash
python convert_md_to_json.py
```

Nếu thành công, bạn sẽ thấy:

- [Vocabulary.json](Vocabulary.json) được tạo lại
- [chunk-english.json](chunk-english.json) được tạo lại

---

## 4) Lưu ý quan trọng

- Luôn lưu file bằng UTF-8 để giữ tiếng Việt đúng.
- Không chỉnh file JSON bằng tay; để script tự sinh lại.
- Nếu parser báo lỗi, kiểm tra lại:
  - heading đúng format,
  - dấu phẩy dùng đúng chỗ,
  - mỗi chunk bắt đầu bằng `-`,
  - topic heading có đúng cấu trúc `### ... (A1|A2|B1)` hoặc `## ... - N cụm`.
