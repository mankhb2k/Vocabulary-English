CREATE TABLE IF NOT EXISTS hard_words (
  word TEXT PRIMARY KEY NOT NULL COLLATE NOCASE,
  part_of_speech TEXT NOT NULL,
  group_name TEXT NOT NULL,
  meaning_vi TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS hard_word_examples (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  word TEXT NOT NULL,
  position INTEGER NOT NULL,
  english TEXT NOT NULL,
  vietnamese TEXT NOT NULL DEFAULT '',
  FOREIGN KEY (word) REFERENCES hard_words(word) ON DELETE CASCADE,
  UNIQUE(word, position)
);

CREATE TABLE IF NOT EXISTS hard_word_relations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  word TEXT NOT NULL,
  relation_type TEXT NOT NULL CHECK (relation_type IN ('synonym', 'antonym')),
  value TEXT NOT NULL,
  FOREIGN KEY (word) REFERENCES hard_words(word) ON DELETE CASCADE,
  UNIQUE(word, relation_type, value)
);

CREATE INDEX IF NOT EXISTS idx_hard_word_examples_word_position
  ON hard_word_examples(word, position);
CREATE INDEX IF NOT EXISTS idx_hard_word_relations_word_type
  ON hard_word_relations(word, relation_type);
