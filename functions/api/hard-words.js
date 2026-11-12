const JSON_HEADERS = { 'content-type': 'application/json; charset=utf-8' };

function json(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: JSON_HEADERS });
}

export async function onRequestGet({ env }) {
  if (!env.DB) return json({ error: 'The D1 database binding is not configured.' }, 503);

  const [wordRows, exampleRows, relationRows] = await Promise.all([
    env.DB.prepare(`
      SELECT word, part_of_speech, group_name, meaning_vi
      FROM hard_words
      ORDER BY word COLLATE NOCASE
    `).all(),
    env.DB.prepare(`
      SELECT word, position, english, vietnamese
      FROM hard_word_examples
      ORDER BY word COLLATE NOCASE, position
    `).all(),
    env.DB.prepare(`
      SELECT word, relation_type, value
      FROM hard_word_relations
      ORDER BY word COLLATE NOCASE, relation_type, value COLLATE NOCASE
    `).all(),
  ]);

  const items = new Map((wordRows.results || []).map((row) => [row.word, {
    word: row.word,
    partOfSpeech: row.part_of_speech,
    group: row.group_name,
    meaning: row.meaning_vi,
    examples: [],
    synonyms: [],
    antonyms: [],
  }]));

  for (const row of exampleRows.results || []) {
    items.get(row.word)?.examples.push({ english: row.english, vietnamese: row.vietnamese });
  }
  for (const row of relationRows.results || []) {
    const item = items.get(row.word);
    if (item) item[row.relation_type === 'synonym' ? 'synonyms' : 'antonyms'].push(row.value);
  }

  return json({ items: [...items.values()] });
}
