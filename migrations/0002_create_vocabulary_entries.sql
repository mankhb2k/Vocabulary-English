CREATE TABLE IF NOT EXISTS vocabulary_entries (
  id TEXT PRIMARY KEY NOT NULL,
  word TEXT NOT NULL,
  meaning TEXT NOT NULL,
  pronunciation TEXT NOT NULL DEFAULT '',
  example TEXT NOT NULL DEFAULT '',
  topic TEXT NOT NULL DEFAULT 'other',
  image_key TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_vocabulary_entries_created_at
  ON vocabulary_entries(created_at DESC);
