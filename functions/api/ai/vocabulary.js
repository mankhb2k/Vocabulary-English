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

function normalizeExamples(value) {
  const values = Array.isArray(value) ? value : [value];
  return values
    .flatMap((item) => String(item || '').split(/\r?\n/))
    .map((item) => item.replace(/^\s*(?:[-*]|\d+[.)])\s*/, '').trim())
    .filter(Boolean)
    .slice(0, 8);
}

function normalizeDefinition(value) {
  return String(value || '')
    .replace(/\r\n/g, '\n')
    .replace(/\s+(?=(?:Noun|Verb|Adjective|Adverb|Pronoun|Preposition|Conjunction|Interjection|Determiner|Phrase|Phrasal verb):)/gi, '\n')
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean)
    .join('\n')
    .slice(0, 500);
}

function parseJsonContent(content) {
  if (content && typeof content === 'object') return content;
  const raw = Array.isArray(content)
    ? content.map((part) => typeof part === 'string' ? part : part?.text ?? part?.content ?? '').join('')
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

function providerRequestBody(model, messages, maxTokens, temperature) {
  const body = { model, messages };
  if (/^gpt-5(?:[.-]|$)/i.test(model)) {
    body.max_completion_tokens = maxTokens;
    body.reasoning_effort = 'minimal';
  }
  else {
    body.temperature = temperature;
    body.max_tokens = maxTokens;
  }
  return body;
}

const SYSTEM_PROMPT = `You create English vocabulary cards for a learner.
Follow the English Vocabulary Skill contract exactly.
Return one JSON object only, with these keys: word, definition, pronunciation, examples, topic, rootSuggestion, isFamilyRoot, familyRoot.
Use English only. A word may be a single word, phrasal verb, collocation, or useful vocabulary phrase, but never a full sentence as the card title.
The definition must be a clear English learner-friendly definition. Each example must be a natural English sentence.
If the item has more than one common part of speech, explain each form separately in the single definition string with clear labels such as "Verb:", "Noun:", "Adjective:", or "Adverb:". Put each labeled form on its own line using a newline character, with no numbering or bullets. Do not merge different forms into one vague definition, and include only forms that are genuinely common for the requested item.
Always provide at least three non-empty, natural example sentences in the examples array. Each sentence must demonstrate the requested word or phrase in context. Never return an empty examples array and never use one sentence repeated three times. The application will display the examples as a numbered list, one sentence per line.
Choose topic from greetings, work, travel, or other.
rootSuggestion is the most useful standalone English base word for the word family, even when it is not in the existing vocabulary list. Infer it from the requested word's actual meaning and morphology; never choose an existing vocabulary item merely because it appears in the list. For example, evaluate may belong to the value family, but wrangler belongs to the wrangle family, not the value family. For wrangler, return rootSuggestion "wrangle". Leave rootSuggestion empty when the relationship is uncertain.
Set isFamilyRoot to true when the requested item is itself a useful standalone base word that can serve as the root of a word family; otherwise set it to false. This is a suggestion for the learner to review.
When isFamilyRoot is true, the item is its own root: leave both rootSuggestion and familyRoot empty, even if a related word exists in the vocabulary list.
Use familyRoot only when the suggested root is genuinely related to the requested word and exactly matches one of the existing vocabulary items supplied by the application; otherwise use an empty string. If the related root is not in the existing list, keep it in rootSuggestion and leave familyRoot empty. Do not use "value" for unrelated words such as wrangler.
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
    ...providerRequestBody(env.AI_MODEL, [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: `Create a vocabulary card for: ${prompt}\n\nExisting vocabulary items that may be used as familyRoot:\n${existingWords.join(', ') || '(none)'}` },
    ], 1600, 0.2),
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
  const definition = normalizeDefinition(generated.definition);
  const examples = normalizeExamples(generated.examples ?? generated.example);
  if (!word || !definition || examples.length < 3) return json({ error: 'The AI response must include a word, definition, and at least three example sentences.' }, 502);

  const generatedDuplicate = await env.DB.prepare(`
    SELECT word
    FROM vocabulary_entries
    WHERE lower(trim(word)) = lower(trim(?1))
    LIMIT 1
  `).bind(word).first();
  if (generatedDuplicate) return json({ error: `"${generatedDuplicate.word}" is already in your vocabulary.` }, 409);

  const isFamilyRoot = generated.isFamilyRoot === true;
  const rootSuggestion = normalizeWord(generated.rootSuggestion || generated.familyRoot);
  const suggestedRoots = [generated.familyRoot, generated.rootSuggestion]
    .map((value) => normalizeWord(value).toLowerCase())
    .filter(Boolean);
  const familyRoot = suggestedRoots
    .map((value) => existingLookup.get(value) || '')
    .find(Boolean) || '';
  return json({
    item: {
      word,
      definition,
      pronunciation: text(generated.pronunciation, 120),
      examples,
      example: examples.map((sentence, index) => `${index + 1}. ${sentence}`).join('\n'),
      topic: topic(generated.topic),
      // A word that is itself a family root cannot also descend from another root.
      rootSuggestion: isFamilyRoot || rootSuggestion === word ? '' : rootSuggestion,
      isFamilyRoot,
      familyRoot: isFamilyRoot || familyRoot === word ? '' : familyRoot,
    },
  });
}
