const JSON_HEADERS = { 'content-type': 'application/json; charset=utf-8' };
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Map([
  ['image/jpeg', 'jpg'],
  ['image/png', 'png'],
  ['image/webp', 'webp'],
]);

function json(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: JSON_HEADERS });
}

function textField(form, name, maxLength = 500) {
  return String(form.get(name) || '').trim().slice(0, maxLength);
}

function topicName(topic) {
  return ({ greetings: 'Conversation', work: 'Work', travel: 'Travel', other: 'Other' })[topic] || 'Other';
}

function toClientItem(row) {
  return {
    id: row.id,
    word: row.word,
    definition: row.definition,
    pronunciation: row.pronunciation,
    example: row.example,
    topic: row.topic,
    topicName: topicName(row.topic),
    imageUrl: `/api/vocabulary-image?key=${encodeURIComponent(row.image_key || 'placeholder-1.png')}`,
    createdAt: row.created_at,
  };
}

export async function onRequestGet({ env }) {
  if (!env.DB) return json({ error: 'The D1 database binding is not configured.' }, 503);
  const result = await env.DB.prepare(`
    SELECT id, word, definition, pronunciation, example, topic, image_key, created_at
    FROM vocabulary_entries
    WHERE source = 'user'
      AND word <> ''
    ORDER BY created_at DESC
    LIMIT 100
  `).all();
  return json({ items: (result.results || []).map(toClientItem) });
}

export async function onRequestPost({ request, env }) {
  if (!env.DB || !env.VOCABULARY_IMAGES) return json({ error: 'The D1 or R2 binding is not configured.' }, 503);

  let form;
  try {
    form = await request.formData();
  } catch {
    return json({ error: 'The submitted data is invalid.' }, 400);
  }

  const word = textField(form, 'word', 120).replace(/\s+/g, ' ');
  const definition = textField(form, 'definition', 240);
  const pronunciation = textField(form, 'pronunciation', 120);
  const example = textField(form, 'example', 500);
  const familyRoot = textField(form, 'familyRoot', 120);
  const topic = ['greetings', 'work', 'travel', 'other'].includes(form.get('topic')) ? form.get('topic') : 'other';
  const file = form.get('image');

  if (!word || !definition) return json({ error: 'Word and English definition are required.' }, 400);
  const duplicate = await env.DB.prepare(`
    SELECT word
    FROM vocabulary_entries
    WHERE lower(trim(word)) = lower(trim(?1))
    LIMIT 1
  `).bind(word).first();
  if (duplicate) return json({ error: `"${duplicate.word}" is already in your vocabulary.` }, 409);
  if (familyRoot && familyRoot.toLowerCase() === word.toLowerCase()) return json({ error: 'The family root must be a different vocabulary item.' }, 400);
  if (!(file instanceof File) || !file.size) return json({ error: 'Please choose an image.' }, 400);
  if (!ALLOWED_IMAGE_TYPES.has(file.type)) return json({ error: 'Only JPG, PNG, or WEBP images are accepted.' }, 415);
  if (file.size > MAX_IMAGE_BYTES) return json({ error: 'The image must be smaller than 5MB.' }, 413);

  let familyRootRow;
  if (familyRoot) {
    familyRootRow = await env.DB.prepare(`
      SELECT id, word
      FROM vocabulary_entries
      WHERE lower(word) = lower(?1)
      LIMIT 1
    `).bind(familyRoot).first();
    if (!familyRootRow) return json({ error: 'The family root must match an existing vocabulary item.' }, 400);
  }

  const id = crypto.randomUUID();
  const key = `vocabulary/${id}.${ALLOWED_IMAGE_TYPES.get(file.type)}`;
  await env.VOCABULARY_IMAGES.put(key, file.stream(), {
    httpMetadata: { contentType: file.type, cacheControl: 'public, max-age=31536000, immutable' },
  });

  let inserted = false;
  try {
    const row = await env.DB.prepare(`
      INSERT INTO vocabulary_entries (id, word, definition, pronunciation, example, topic, image_key)
      VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)
      RETURNING id, word, definition, pronunciation, example, topic, image_key, created_at
    `).bind(id, word, definition, pronunciation, example, topic, key).first();
    inserted = true;
    if (familyRootRow) {
      await env.DB.prepare(`
        INSERT INTO word_relations (id, source_word_id, target_word_id, relation_type, affix)
        VALUES (?1, ?2, ?3, 'family', '')
      `).bind(crypto.randomUUID(), familyRootRow.id, row.id).run();
    }
    return json({ ok: true, item: toClientItem(row) }, 201);
  } catch (error) {
    if (inserted) await env.DB.prepare('DELETE FROM vocabulary_entries WHERE id = ?1').bind(id).run();
    await env.VOCABULARY_IMAGES.delete(key);
    return json({ error: 'Unable to save the vocabulary. Please try again.' }, 500);
  }
}
