ALTER TABLE vocabulary_entries
  ADD COLUMN is_family_root INTEGER NOT NULL DEFAULT 0;

UPDATE vocabulary_entries
SET is_family_root = 1
WHERE id IN (
  SELECT DISTINCT source_word_id
  FROM word_relations
  WHERE relation_type IN ('family', 'suffix', 'prefix')
);
