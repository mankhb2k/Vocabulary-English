INSERT OR IGNORE INTO hard_words (word, part_of_speech, group_name, meaning_vi, pronounce)
VALUES ('complicated', 'Adjective', 'Abstract adjectives', 'phức tạp, rắc rối', '/ˈkɑːmplɪkeɪtɪd/');

INSERT OR IGNORE INTO hard_word_examples (word, position, english, vietnamese)
VALUES
  ('complicated', 1, 'The instructions look complicated, but each step is simple.', 'Hướng dẫn trông có vẻ phức tạp, nhưng từng bước đều đơn giản.'),
  ('complicated', 2, 'We need to explain this complicated idea with a clear example.', 'Chúng ta cần giải thích ý tưởng phức tạp này bằng một ví dụ rõ ràng.');

INSERT OR IGNORE INTO hard_word_relations (word, relation_type, value)
VALUES
  ('complicated', 'synonym', 'complex'),
  ('complicated', 'antonym', 'simple'),
  ('complicated', 'antonym', 'straightforward');
