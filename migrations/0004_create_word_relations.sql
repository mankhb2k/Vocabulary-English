ALTER TABLE vocabulary_entries
  ADD COLUMN source TEXT NOT NULL DEFAULT 'user';

CREATE TABLE IF NOT EXISTS word_relations (
  id TEXT PRIMARY KEY NOT NULL,
  source_word_id TEXT NOT NULL,
  target_word_id TEXT NOT NULL,
  relation_type TEXT NOT NULL,
  affix TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(source_word_id, target_word_id, relation_type),
  FOREIGN KEY (source_word_id) REFERENCES vocabulary_entries(id),
  FOREIGN KEY (target_word_id) REFERENCES vocabulary_entries(id)
);

CREATE INDEX IF NOT EXISTS idx_word_relations_source
  ON word_relations(source_word_id);

CREATE INDEX IF NOT EXISTS idx_word_relations_target
  ON word_relations(target_word_id);

INSERT OR IGNORE INTO vocabulary_entries
  (id, word, definition, pronunciation, example, topic, image_key, source)
VALUES
  ('demo-help', 'help', 'To make it easier for someone to do something.', '/help/', 'Can you help me with this task?', 'other', 'placeholder-1.png', 'system'),
  ('demo-helpful', 'helpful', 'Useful or able to provide help.', '/ˈhelpfəl/', 'The instructions were very helpful.', 'other', 'placeholder-1.png', 'system'),
  ('demo-helpless', 'helpless', 'Unable to help yourself or control a situation.', '/ˈhelpləs/', 'He felt helpless during the emergency.', 'other', 'placeholder-1.png', 'system'),
  ('demo-helper', 'helper', 'A person who helps someone.', '/ˈhelpər/', 'She works as a classroom helper.', 'other', 'placeholder-1.png', 'system'),
  ('demo-helpfully', 'helpfully', 'In a way that provides useful help.', '/ˈhelpfəli/', 'He helpfully explained the next steps.', 'other', 'placeholder-1.png', 'system'),
  ('demo-unhelpful', 'unhelpful', 'Not useful or not providing the help that is needed.', '/ʌnˈhelpfəl/', 'The reply was vague and unhelpful.', 'other', 'placeholder-1.png', 'system');

INSERT OR IGNORE INTO word_relations
  (id, source_word_id, target_word_id, relation_type, affix)
VALUES
  ('demo-rel-helpful', 'demo-help', 'demo-helpful', 'suffix', '-ful'),
  ('demo-rel-helpless', 'demo-help', 'demo-helpless', 'suffix', '-less'),
  ('demo-rel-helper', 'demo-help', 'demo-helper', 'suffix', '-er'),
  ('demo-rel-helpfully', 'demo-help', 'demo-helpfully', 'suffix', '-fully'),
  ('demo-rel-unhelpful', 'demo-help', 'demo-unhelpful', 'prefix', 'un-');
