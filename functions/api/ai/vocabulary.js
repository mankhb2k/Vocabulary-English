const JSON_HEADERS = { 'content-type': 'application/json; charset=utf-8' };

function json(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: JSON_HEADERS });
}

function text(value, maxLength = 500) {
  return String(value || '').trim().slice(0, maxLength);
}

function normalizeWord(value) {
  return text(value, 120).replace(/\s+/g, ' ');
}

function parseJsonContent(content) {
  if (content && typeof content === 'object') return content;
  const raw = Array.isArray(content)
    ? content.map((part) => part?.text || '').join('')
    : String(content || '');
  const cleaned = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  if (start < 0 || end < start) return null;
  try {
    return JSON.parse(cleaned.slice(start, end + 1));
  } catch {
    return null;
  }
}

function topic(value) {
  return ['greetings', 'work', 'travel', 'other'].includes(value) ? value : 'other';
}

const SYSTEM_PROMPT = `You create English vocabulary cards for a learner.
Follow the English Vocabulary Skill contract exactly.
Return one JSON object only, with these keys: word, definition, pronunciation, example, topic, familyRoot.
Use English only. A word may be a single word, phrasal verb, collocation, or useful vocabulary phrase, but never a full sentence as the card title.
The definition must be a clear English learner-friendly definition. The example must be a natural English sentence.
If the item has more than one common part of speech, explain each form separately in the single definition string with clear labels such as "Verb:", "Noun:", "Adjective:", or "Adverb:". Do not merge different forms into one vague definition, and include only forms that are genuinely common for the requested item.
Choose topic from greetings, work, travel, or other.
Use familyRoot only when it exactly matches one of the existing vocabulary items supplied by the application; otherwise use an empty string.
Do not include markdown, translations, extra keys, or commentary.`;

export async function onRequestPost({ request, env }) {
  if (!env.DB) return json({ error: 'The D1 database binding is not configured.' }, 503);
  if (!env.AI_API_URL || !env.AI_API_KEY || !env.AI_MODEL) return json({ error: 'AI is not configured yet. Add AI_API_URL, AI_API_KEY, and AI_MODEL to the Cloudflare environment.' }, 503);

  let body;
  try {
    body = JSON.parse(await request.text());
  } catch {
    return json({ error: 'The AI request is invalid.' }, 400);
  }

  const prompt = normalizeWord(body?.prompt);
  if (!prompt) return json({ error: 'Enter a word or vocabulary item for the AI.' }, 400);

  const duplicate = await env.DB.prepare(`
    SELECT word
    FROM vocabulary_entries
    WHERE lower(trim(word)) = lower(trim(?1))
    LIMIT 1
  `).bind(prompt).first();
  if (duplicate) return json({ error: `"${duplicate.word}" is already in your vocabulary.` }, 409);

  const existingResult = await env.DB.prepare(`
    SELECT word
    FROM vocabulary_entries
    ORDER BY created_at DESC
    LIMIT 200
  `).all();
  const existingWords = (existingResult.results || []).map((row) => row.word).filter(Boolean);
  const existingLookup = new Map(existingWords.map((word) => [normalizeWord(word).toLowerCase(), word]));

  const upstreamBody = {
    model: env.AI_MODEL,
    temperature: 0.2,
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: `Create a vocabulary card for: ${prompt}\n\nExisting vocabulary items that may be used as familyRoot:\n${existingWords.join(', ') || '(none)'}` },
    ],
  };

  let upstream;
  try {
    upstream = await fetch(env.AI_API_URL, {
      method: 'POST',
      headers: {
        authorization: `Bearer ${env.AI_API_KEY}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify(upstreamBody),
    });
  } catch {
    return json({ error: 'The AI provider could not be reached.' }, 502);
  }

  if (!upstream.ok) return json({ error: 'The AI provider rejected the request.' }, 502);

  let upstreamPayload;
  try {
    upstreamPayload = await upstream.json();
  } catch {
    return json({ error: 'The AI provider returned an invalid response.' }, 502);
  }

  const content = upstreamPayload?.choices?.[0]?.message?.content ?? upstreamPayload?.output_text ?? upstreamPayload?.content;
  const generated = parseJsonContent(content);
  if (!generated) return json({ error: 'The AI response did not match the vocabulary format.' }, 502);

  const word = normalizeWord(generated.word || prompt);
  const definition = text(generated.definition, 500);
  const example = text(generated.example, 500);
  if (!word || !definition || !example) return json({ error: 'The AI response is missing a word, definition, or example.' }, 502);

  const generatedDuplicate = await env.DB.prepare(`
    SELECT word
    FROM vocabulary_entries
    WHERE lower(trim(word)) = lower(trim(?1))
    LIMIT 1
  `).bind(word).first();
  if (generatedDuplicate) return json({ error: `"${generatedDuplicate.word}" is already in your vocabulary.` }, 409);

  const suggestedRoot = normalizeWord(generated.familyRoot);
  const familyRoot = existingLookup.get(suggestedRoot.toLowerCase()) || '';
  return json({
    item: {
      word,
      definition,
      pronunciation: text(generated.pronunciation, 120),
      example,
      topic: topic(generated.topic),
      familyRoot: familyRoot === word ? '' : familyRoot,
    },
  });
}
