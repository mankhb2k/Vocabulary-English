const JSON_HEADERS = { 'content-type': 'application/json; charset=utf-8' };

function json(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: JSON_HEADERS });
}

function imageUrl(key) {
  return `/api/vocabulary-image?key=${encodeURIComponent(key || 'placeholder-1.png')}`;
}

export async function onRequestGet({ request, env }) {
  if (!env.DB) return json({ error: 'The D1 database binding is not configured.' }, 503);

  const word = new URL(request.url).searchParams.get('word')?.trim().slice(0, 120);
  if (!word) return json({ items: [] });

  const result = await env.DB.prepare(`
    SELECT
      relation.id AS relation_id,
      relation.relation_type,
      relation.affix,
      CASE WHEN lower(source.word) = lower(?1) THEN target.id ELSE source.id END AS related_id,
      CASE WHEN lower(source.word) = lower(?1) THEN target.word ELSE source.word END AS related_word,
      CASE WHEN lower(source.word) = lower(?1) THEN target.definition ELSE source.definition END AS related_definition,
      CASE WHEN lower(source.word) = lower(?1) THEN target.pronunciation ELSE source.pronunciation END AS related_pronunciation,
      CASE WHEN lower(source.word) = lower(?1) THEN target.example ELSE source.example END AS related_example,
      CASE WHEN lower(source.word) = lower(?1) THEN target.topic ELSE source.topic END AS related_topic,
      CASE WHEN lower(source.word) = lower(?1) THEN target.image_key ELSE source.image_key END AS related_image_key,
      CASE WHEN lower(source.word) = lower(?1) THEN source.word ELSE target.word END AS source_word
    FROM word_relations AS relation
    JOIN vocabulary_entries AS source ON source.id = relation.source_word_id
    JOIN vocabulary_entries AS target ON target.id = relation.target_word_id
    WHERE (lower(source.word) = lower(?1) OR lower(target.word) = lower(?1))
      AND source.source IN ('user', 'system')
      AND target.source IN ('user', 'system')
    ORDER BY related_word ASC
  `).bind(word).all();

  return json({
    items: (result.results || []).map((row) => ({
      id: row.related_id,
      word: row.related_word,
      definition: row.related_definition,
      pronunciation: row.related_pronunciation,
      example: row.related_example,
      topic: row.related_topic,
      relationType: row.relation_type,
      affix: row.affix,
      imageUrl: imageUrl(row.related_image_key),
      sourceWord: row.source_word,
      relationId: row.relation_id,
    })),
  });
}
