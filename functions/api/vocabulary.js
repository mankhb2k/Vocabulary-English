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

function normalizeExamples(value) {
  return String(value || '')
    .split(/\r?\n/)
    .map((item) => item.replace(/^\s*(?:[-*]|\d+[.)])\s*/, '').trim())
    .filter(Boolean)
    .slice(0, 8);
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
    example: normalizeExamples(row.example).join('\n'),
    examples: normalizeExamples(row.example),
    topic: row.topic,
    topicName: topicName(row.topic),
    notes: row.usage_note || '',
    source: row.source || 'user',
    imageUrl: `/api/vocabulary-image?key=${encodeURIComponent(row.image_key || 'placeholder-1.png')}`,
    createdAt: row.created_at,
    familyRoot: row.family_root || '',
  };
}

export async function onRequestGet({ env, request }) {
  if (!env.DB) return json({ error: 'The D1 database binding is not configured.' }, 503);
  const scope = new URL(request.url).searchParams.get('scope') === 'all' ? 'all' : 'user';
  const sourceFilter = scope === 'all' ? "entry.source IN ('user', 'system')" : "entry.source = 'user'";
  const result = await env.DB.prepare(`
    SELECT entry.id, entry.word, entry.definition, entry.pronunciation, entry.example, entry.topic, entry.image_key, entry.created_at, entry.usage_note, entry.source,
      (
        SELECT root.word
        FROM word_relations AS relation
        JOIN vocabulary_entries AS root ON root.id = relation.source_word_id
        WHERE relation.target_word_id = entry.id
          AND relation.relation_type IN ('family', 'suffix', 'prefix')
        LIMIT 1
      ) AS family_root
    FROM vocabulary_entries AS entry
    WHERE ${sourceFilter}
      AND entry.word <> ''
    ORDER BY entry.created_at DESC
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
  const definition = textField(form, 'definition', 500);
  const pronunciation = textField(form, 'pronunciation', 120);
  const example = normalizeExamples(textField(form, 'example', 1500));
  const familyRoot = textField(form, 'familyRoot', 120);
  const topic = ['greetings', 'work', 'travel', 'other'].includes(form.get('topic')) ? form.get('topic') : 'other';
  const file = form.get('image');
  const replaceExisting = form.get('replaceExisting') === 'true';
  const existingWord = textField(form, 'existingWord', 120);
  const hasFile = file instanceof File && file.size > 0;

  if (!word || !definition) return json({ error: 'Word and English definition are required.' }, 400);
  if (example.length < 3) return json({ error: 'Add at least three example sentences, one per line.' }, 400);
  const duplicate = await env.DB.prepare(`
    SELECT id, word, source
    FROM vocabulary_entries
    WHERE lower(trim(word)) = lower(trim(?1))
    LIMIT 1
  `).bind(word).first();
  const canCreatePersonalVersion = replaceExisting
    && existingWord
    && duplicate
    && duplicate.source === 'system'
    && duplicate.word.toLowerCase() === existingWord.toLowerCase();
  if (duplicate && !canCreatePersonalVersion) return json({ error: `"${duplicate.word}" is already in your vocabulary.` }, 409);
  if (familyRoot && familyRoot.toLowerCase() === word.toLowerCase()) return json({ error: 'The family root must be a different vocabulary item.' }, 400);
  if (hasFile && !ALLOWED_IMAGE_TYPES.has(file.type)) return json({ error: 'Only JPG, PNG, or WEBP images are accepted.' }, 415);
  if (hasFile && file.size > MAX_IMAGE_BYTES) return json({ error: 'The image must be smaller than 5MB.' }, 413);

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
  const key = hasFile ? `vocabulary/${id}.${ALLOWED_IMAGE_TYPES.get(file.type)}` : 'placeholder-1.png';
  if (hasFile) {
    await env.VOCABULARY_IMAGES.put(key, file.stream(), {
      httpMetadata: { contentType: file.type, cacheControl: 'public, max-age=31536000, immutable' },
    });
  }

  let inserted = false;
  try {
    const row = await env.DB.prepare(`
      INSERT INTO vocabulary_entries (id, word, definition, pronunciation, example, topic, image_key)
      VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)
      RETURNING id, word, definition, pronunciation, example, topic, image_key, created_at
    `).bind(id, word, definition, pronunciation, example.join('\n'), topic, key).first();
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
    if (hasFile) await env.VOCABULARY_IMAGES.delete(key);
    return json({ error: 'Unable to save the vocabulary. Please try again.' }, 500);
  }
}

export async function onRequestPut({ request, env }) {
  if (!env.DB || !env.VOCABULARY_IMAGES) return json({ error: 'The D1 or R2 binding is not configured.' }, 503);

  let form;
  try {
    form = await request.formData();
  } catch {
    return json({ error: 'The submitted data is invalid.' }, 400);
  }

  const id = textField(form, 'id', 120);
  const word = textField(form, 'word', 120).replace(/\s+/g, ' ');
  const definition = textField(form, 'definition', 500);
  const pronunciation = textField(form, 'pronunciation', 120);
  const example = normalizeExamples(textField(form, 'example', 1500));
  const familyRoot = textField(form, 'familyRoot', 120);
  const topic = ['greetings', 'work', 'travel', 'other'].includes(form.get('topic')) ? form.get('topic') : 'other';
  const file = form.get('image');
  const hasFile = file instanceof File && file.size > 0;

  if (!id || !word || !definition) return json({ error: 'Vocabulary id, word, and English definition are required.' }, 400);
  if (example.length < 3) return json({ error: 'Add at least three example sentences, one per line.' }, 400);
  if (familyRoot && familyRoot.toLowerCase() === word.toLowerCase()) return json({ error: 'The family root must be a different vocabulary item.' }, 400);
  if (hasFile && !ALLOWED_IMAGE_TYPES.has(file.type)) return json({ error: 'Only JPG, PNG, or WEBP images are accepted.' }, 415);
  if (hasFile && file.size > MAX_IMAGE_BYTES) return json({ error: 'The image must be smaller than 5MB.' }, 413);

  const current = await env.DB.prepare(`
    SELECT id, image_key
    FROM vocabulary_entries
    WHERE id = ?1 AND source = 'user'
    LIMIT 1
  `).bind(id).first();
  if (!current) return json({ error: 'This personal vocabulary item could not be found.' }, 404);

  const duplicate = await env.DB.prepare(`
    SELECT word
    FROM vocabulary_entries
    WHERE lower(trim(word)) = lower(trim(?1))
      AND id <> ?2
    LIMIT 1
  `).bind(word, id).first();
  if (duplicate) return json({ error: `"${duplicate.word}" is already in your vocabulary.` }, 409);

  let familyRootRow;
  if (familyRoot) {
    familyRootRow = await env.DB.prepare(`
      SELECT id, word
      FROM vocabulary_entries
      WHERE lower(word) = lower(?1)
      LIMIT 1
    `).bind(familyRoot).first();
    if (!familyRootRow) return json({ error: 'The family root must match an existing vocabulary item.' }, 400);
    if (familyRootRow.id === id) return json({ error: 'The family root must be a different vocabulary item.' }, 400);
  }

  let imageKey = current.image_key;
  let replacementKey = '';
  if (hasFile) {
    replacementKey = `vocabulary/${id}-${crypto.randomUUID()}.${ALLOWED_IMAGE_TYPES.get(file.type)}`;
    imageKey = replacementKey;
    await env.VOCABULARY_IMAGES.put(replacementKey, file.stream(), {
      httpMetadata: { contentType: file.type, cacheControl: 'public, max-age=31536000, immutable' },
    });
  }

  try {
    const row = await env.DB.prepare(`
      UPDATE vocabulary_entries
      SET word = ?1, definition = ?2, pronunciation = ?3, example = ?4, topic = ?5, image_key = ?6
      WHERE id = ?7
      RETURNING id, word, definition, pronunciation, example, topic, image_key, created_at
    `).bind(word, definition, pronunciation, example.join('\n'), topic, imageKey, id).first();

    await env.DB.prepare('DELETE FROM word_relations WHERE source_word_id = ?1 OR target_word_id = ?1').bind(id).run();
    if (familyRootRow) {
      await env.DB.prepare(`
        INSERT INTO word_relations (id, source_word_id, target_word_id, relation_type, affix)
        VALUES (?1, ?2, ?3, 'family', '')
      `).bind(crypto.randomUUID(), familyRootRow.id, id).run();
    }

    return json({ ok: true, item: toClientItem(row) });
  } catch {
    if (replacementKey) await env.VOCABULARY_IMAGES.delete(replacementKey);
    return json({ error: 'Unable to update the vocabulary. Please try again.' }, 500);
  }
}
