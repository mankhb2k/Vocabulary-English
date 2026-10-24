CREATE TABLE IF NOT EXISTS translation_entries (
  id TEXT PRIMARY KEY NOT NULL,
  source_text TEXT NOT NULL,
  translated_text TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_translation_entries_created_at
  ON translation_entries(created_at DESC);
