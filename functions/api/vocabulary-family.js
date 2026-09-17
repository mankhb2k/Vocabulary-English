const JSON_HEADERS = { 'content-type': 'application/json; charset=utf-8' };

function json(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: JSON_HEADERS });
}

function textField(value, maxLength = 500) {
  return String(value || '').trim().slice(0, maxLength);
}

function normalizeExamples(value) {
  const values = Array.isArray(value) ? value : [value];
  return values
    .flatMap((item) => String(item || '').split(/\r?\n/))
    .map((item) => item.replace(/^\s*(?:[-*]|\d+[.)])\s*/, '').trim())
    .filter(Boolean)
    .slice(0, 8);
}

function topic(value) {
  return ['greetings', 'work', 'travel', 'other'].includes(value) ? value : 'other';
}

function cardValues(card, fallbackWord = '') {
  const word = textField(card?.word || fallbackWord, 120).replace(/\s+/g, ' ');
  const definition = textField(card?.definition, 500);
  const pronunciation = textField(card?.pronunciation, 120);
  const examples = normalizeExamples(card?.examples ?? card?.example);
  const familyRoot = textField(card?.familyRoot, 120).replace(/\s+/g, ' ');
  return { word, definition, pronunciation, examples, topic: topic(card?.topic), familyRoot };
}

function publicItem(row, familyRoot = '') {
  return {
    id: row.id,
    word: row.word,
    definition: row.definition,
    pronunciation: row.pronunciation,
    example: row.example,
    topic: row.topic,
    imageUrl: '/api/vocabulary-image?key=placeholder-1.png',
    familyRoot,
    isFamilyRoot: Boolean(row.is_family_root),
  };
}

export async function onRequestPost({ request, env }) {
  if (!env.DB) return json({ error: 'The D1 database binding is not configured.' }, 503);

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'The family save request is invalid.' }, 400);
  }

  const child = cardValues(body?.item);
  const rootInput = body?.root;
  const requestedRoot = textField(child.familyRoot || rootInput?.word, 120).replace(/\s+/g, ' ');
  if (!child.word || !child.definition || child.examples.length < 3) {
    return json({ error: 'The vocabulary card must include a word, definition, and at least three examples.' }, 400);
  }
  if (!requestedRoot) return json({ error: 'Choose or generate a word family root before saving the family.' }, 400);
  if (requestedRoot.toLowerCase() === child.word.toLowerCase()) return json({ error: 'The family root must be a different vocabulary item.' }, 400);

  const duplicate = await env.DB.prepare(`
    SELECT id, word
    FROM vocabulary_entries
    WHERE lower(trim(word)) = lower(trim(?1))
    LIMIT 1
  `).bind(child.word).first();
  if (duplicate) return json({ error: `"${duplicate.word}" is already in your vocabulary.` }, 409);

  const rootRow = await env.DB.prepare(`
    SELECT id, word, definition, pronunciation, example, topic, image_key, is_family_root
    FROM vocabulary_entries
    WHERE lower(trim(word)) = lower(trim(?1))
    LIMIT 1
  `).bind(requestedRoot).first();

  let root = null;
  if (!rootRow) {
    if (!rootInput) return json({ error: `Generate the missing root card "${requestedRoot}" before saving the family.` }, 400);
    root = cardValues(rootInput, requestedRoot);
    if (!root.word || root.word.toLowerCase() !== requestedRoot.toLowerCase() || !root.definition || root.examples.length < 3) {
      return json({ error: 'The generated root card is incomplete. Generate it again before saving.' }, 400);
    }
  }

  const rootId = rootRow?.id || crypto.randomUUID();
  const childId = crypto.randomUUID();
  const relationId = crypto.randomUUID();
  const rootExample = root ? root.examples.join('\n') : rootRow.example;
  const childExample = child.examples.join('\n');
  const statements = [];

  if (!rootRow) {
    statements.push(env.DB.prepare(`
      INSERT INTO vocabulary_entries (id, word, definition, pronunciation, example, topic, image_key, is_family_root)
      VALUES (?1, ?2, ?3, ?4, ?5, ?6, 'placeholder-1.png', 1)
    `).bind(rootId, root.word, root.definition, root.pronunciation, rootExample, root.topic));
  }
  statements.push(env.DB.prepare(`
    INSERT INTO vocabulary_entries (id, word, definition, pronunciation, example, topic, image_key, is_family_root)
    VALUES (?1, ?2, ?3, ?4, ?5, ?6, 'placeholder-1.png', 0)
  `).bind(childId, child.word, child.definition, child.pronunciation, childExample, child.topic));
  statements.push(env.DB.prepare(`
    INSERT INTO word_relations (id, source_word_id, target_word_id, relation_type, affix)
    VALUES (?1, ?2, ?3, 'family', '')
  `).bind(relationId, rootId, childId));
  if (rootRow && !rootRow.is_family_root) {
    statements.push(env.DB.prepare('UPDATE vocabulary_entries SET is_family_root = 1 WHERE id = ?1').bind(rootId));
  }

  try {
    await env.DB.batch(statements);
  } catch {
    return json({ error: 'Unable to save the vocabulary family. Please try again.' }, 500);
  }

  return json({
    ok: true,
    root: publicItem(root || { ...rootRow, id: rootId, word: rootRow?.word, is_family_root: 1 }, ''),
    item: publicItem({ id: childId, word: child.word, definition: child.definition, pronunciation: child.pronunciation, example: childExample, topic: child.topic, is_family_root: 0 }, rootRow?.word || root.word),
  }, 201);
}
