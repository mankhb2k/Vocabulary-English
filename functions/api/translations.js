const JSON_HEADERS = { 'content-type': 'application/json; charset=utf-8' };
const MAX_SOURCE_LENGTH = 8000;
const MAX_HISTORY_ITEMS = 500;
const DEFAULT_HISTORY_PAGE_SIZE = 30;

function json(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: JSON_HEADERS });
}

function responseText(content) {
  if (Array.isArray(content)) {
    return content.map((part) => typeof part === 'string' ? part : part?.text ?? part?.content ?? '').join('').trim();
  }
  return String(content || '').trim();
}

function dateTimeForDatabase(value) {
  const input = String(value || '');
  const normalized = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(input)
    ? `${input.replace(' ', 'T')}Z`
    : input;
  const timestamp = Date.parse(normalized);
  if (!Number.isFinite(timestamp)) return null;
  return new Date(timestamp).toISOString().slice(0, 19).replace('T', ' ');
}

function providerRequestBody(model, messages) {
  const body = { model, messages };
  if (/^gpt-5(?:[.-]|$)/i.test(model)) {
    body.max_completion_tokens = 700;
    body.reasoning_effort = 'minimal';
  } else {
    body.temperature = 0.2;
    body.max_tokens = 700;
  }
  return body;
}

const SYSTEM_PROMPT = `Translate Vietnamese into concise, natural English for informal developer-to-developer chat.
Preserve the speaker's meaning, tone, technical terms, code identifiers, product names, and proper nouns. Keep the wording direct and conversational, not formal or overly polished.
Return exactly one English translation. Do not add a preface, explanation, alternatives, quotation marks, or markdown.`;

function itemFromRow(row) {
  return {
    id: row.id,
    sourceText: row.source_text,
    translatedText: row.translated_text,
    createdAt: row.created_at,
  };
}

export async function onRequestGet({ request, env }) {
  if (!env.DB) return json({ error: 'The D1 database binding is not configured.' }, 503);

  const url = new URL(request.url);
  if (url.searchParams.get('group') === 'days') {
    const clientOffset = Number.parseInt(url.searchParams.get('offsetMinutes') || '0', 10);
    if (!Number.isInteger(clientOffset) || Math.abs(clientOffset) > 840) return json({ error: 'The time zone offset is invalid.' }, 400);
    const offset = -clientOffset;
    const sign = offset >= 0 ? '+' : '-';
    const absoluteOffset = Math.abs(offset);
    const modifier = `${sign}${String(Math.floor(absoluteOffset / 60)).padStart(2, '0')}:${String(absoluteOffset % 60).padStart(2, '0')}`;
    const result = await env.DB.prepare(`
      WITH ranked AS (
        SELECT
          date(created_at, ?1) AS local_day,
          source_text,
          translated_text,
          created_at,
          ROW_NUMBER() OVER (
            PARTITION BY date(created_at, ?1)
            ORDER BY created_at DESC, rowid DESC
          ) AS row_number
        FROM translation_entries
      )
      SELECT
        local_day AS day,
        COUNT(*) AS count,
        MAX(created_at) AS latest_at,
        MAX(CASE WHEN row_number = 1 THEN source_text END) AS latest_source,
        MAX(CASE WHEN row_number = 1 THEN translated_text END) AS latest_translation
      FROM ranked
      GROUP BY local_day
      ORDER BY local_day DESC
      LIMIT 1000
    `).bind(modifier).all();
    return json({ days: result.results || [] });
  }

  const fromParam = url.searchParams.get('from');
  const toParam = url.searchParams.get('to');
  if (Boolean(fromParam) !== Boolean(toParam)) return json({ error: 'Both date range values are required.' }, 400);

  const limit = Math.max(1, Math.min(Number.parseInt(url.searchParams.get('limit') || `${DEFAULT_HISTORY_PAGE_SIZE}`, 10) || DEFAULT_HISTORY_PAGE_SIZE, MAX_HISTORY_ITEMS));
  if (fromParam && toParam) {
    const from = dateTimeForDatabase(fromParam);
    const to = dateTimeForDatabase(toParam);
    if (!from || !to || from >= to) return json({ error: 'The date range is invalid.' }, 400);
    const result = await env.DB.prepare(`
      SELECT id, source_text, translated_text, created_at
      FROM translation_entries
      WHERE created_at >= ?1 AND created_at < ?2
      ORDER BY created_at DESC, rowid DESC
      LIMIT ?3
    `).bind(from, to, limit).all();
    return json({ items: (result.results || []).map(itemFromRow) });
  }

  const before = url.searchParams.get('before');
  const beforeId = url.searchParams.get('beforeId');
  if (Boolean(before) !== Boolean(beforeId)) return json({ error: 'Both pagination cursor values are required.' }, 400);
  const cursorTime = before ? dateTimeForDatabase(before) : null;
  if (before && !cursorTime) return json({ error: 'The pagination cursor is invalid.' }, 400);

  const queryLimit = limit + 1;
  const result = before
    ? await env.DB.prepare(`
        SELECT id, source_text, translated_text, created_at
        FROM translation_entries
        WHERE created_at < ?1 OR (created_at = ?1 AND id < ?2)
        ORDER BY created_at DESC, id DESC
        LIMIT ?3
      `).bind(cursorTime, beforeId, queryLimit).all()
    : await env.DB.prepare(`
        SELECT id, source_text, translated_text, created_at
        FROM translation_entries
        ORDER BY created_at DESC, id DESC
        LIMIT ?1
      `).bind(queryLimit).all();
  const rows = result.results || [];
  const hasMore = rows.length > limit;
  const pageRows = rows.slice(0, limit);
  const oldest = pageRows.at(-1);
  return json({
    items: pageRows.map(itemFromRow),
    hasMore,
    nextCursor: hasMore && oldest ? { createdAt: oldest.created_at, id: oldest.id } : null,
  });
}

export async function onRequestPost({ request, env }) {
  if (!env.DB) return json({ error: 'The D1 database binding is not configured.' }, 503);
  if (!env.AI_API_URL || !env.AI_API_KEY || !env.AI_MODEL) {
    return json({ error: 'AI is not configured yet. Add AI_API_URL, AI_API_KEY, and AI_MODEL to the Cloudflare environment.' }, 503);
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'The translation request is invalid.' }, 400);
  }

  const sourceText = String(body?.sourceText || '').trim();
  if (!sourceText) return json({ error: 'Enter a Vietnamese sentence to translate.' }, 400);
  if (sourceText.length > MAX_SOURCE_LENGTH) return json({ error: `Keep the source text under ${MAX_SOURCE_LENGTH} characters.` }, 400);

  let upstream;
  try {
    upstream = await fetch(env.AI_API_URL, {
      method: 'POST',
      headers: {
        authorization: `Bearer ${env.AI_API_KEY}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify(providerRequestBody(env.AI_MODEL, [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: sourceText },
      ])),
    });
  } catch {
    return json({ error: 'The AI provider could not be reached.' }, 502);
  }
  if (!upstream.ok) return json({ error: 'The AI provider rejected the translation request.' }, 502);

  let upstreamPayload;
  try {
    upstreamPayload = await upstream.json();
  } catch {
    return json({ error: 'The AI provider returned an invalid response.' }, 502);
  }

  const translatedText = responseText(
    upstreamPayload?.choices?.[0]?.message?.content ?? upstreamPayload?.output_text ?? upstreamPayload?.content,
  ).replace(/^```(?:text|markdown)?\s*/i, '').replace(/\s*```$/, '').trim();
  if (!translatedText) return json({ error: 'The AI returned an empty translation.' }, 502);

  const id = crypto.randomUUID();
  const row = await env.DB.prepare(`
    INSERT INTO translation_entries (id, source_text, translated_text)
    VALUES (?1, ?2, ?3)
    RETURNING id, source_text, translated_text, created_at
  `).bind(id, sourceText, translatedText).first();

  return json({ item: itemFromRow(row) }, 201);
}

export async function onRequestDelete({ request, env }) {
  if (!env.DB) return json({ error: 'The D1 database binding is not configured.' }, 503);

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'The delete request is invalid.' }, 400);
  }
  const id = String(body?.id || '').trim();
  if (!id) return json({ error: 'A translation ID is required.' }, 400);

  const deleted = await env.DB.prepare(
    'DELETE FROM translation_entries WHERE id = ?1 RETURNING id',
  ).bind(id).first();
  if (!deleted) return json({ error: 'Translation not found.' }, 404);
  return json({ ok: true, id: deleted.id });
}
