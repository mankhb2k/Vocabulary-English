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

function isVocabularyWord(value) {
  return /^[A-Za-z]+(?:[-'][A-Za-z]+)*$/.test(String(value || '').trim());
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
      AND word NOT GLOB '*[^A-Za-z''-]*'
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

  const word = textField(form, 'word', 120);
  const definition = textField(form, 'definition', 240);
  const pronunciation = textField(form, 'pronunciation', 120);
  const example = textField(form, 'example', 500);
  const topic = ['greetings', 'work', 'travel', 'other'].includes(form.get('topic')) ? form.get('topic') : 'other';
  const file = form.get('image');

  if (!word || !definition) return json({ error: 'Word and English definition are required.' }, 400);
  if (!isVocabularyWord(word)) return json({ error: 'Please enter one English word, not a phrase or sentence.' }, 400);
  if (!(file instanceof File) || !file.size) return json({ error: 'Please choose an image.' }, 400);
  if (!ALLOWED_IMAGE_TYPES.has(file.type)) return json({ error: 'Only JPG, PNG, or WEBP images are accepted.' }, 415);
  if (file.size > MAX_IMAGE_BYTES) return json({ error: 'The image must be smaller than 5MB.' }, 413);

  const id = crypto.randomUUID();
  const key = `vocabulary/${id}.${ALLOWED_IMAGE_TYPES.get(file.type)}`;
  await env.VOCABULARY_IMAGES.put(key, file.stream(), {
    httpMetadata: { contentType: file.type, cacheControl: 'public, max-age=31536000, immutable' },
  });

  try {
    const row = await env.DB.prepare(`
      INSERT INTO vocabulary_entries (id, word, definition, pronunciation, example, topic, image_key)
      VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)
      RETURNING id, word, definition, pronunciation, example, topic, image_key, created_at
    `).bind(id, word, definition, pronunciation, example, topic, key).first();
    return json({ ok: true, item: toClientItem(row) }, 201);
  } catch (error) {
    await env.VOCABULARY_IMAGES.delete(key);
    return json({ error: 'Unable to save the vocabulary. Please try again.' }, 500);
  }
}
