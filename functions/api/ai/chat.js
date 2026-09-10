const JSON_HEADERS = { 'content-type': 'application/json; charset=utf-8' };
const MAX_CONTEXT_TOKENS = 200000;
const MAX_MESSAGE_CHARACTERS = 20000;
const MAX_TITLE_CHARACTERS = 60;

function json(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: JSON_HEADERS });
}

function cleanText(value, maxLength = 1200) {
  return String(value || '').trim().slice(0, maxLength);
}

function estimateTokens(value) {
  return Math.ceil(String(value || '').length / 3.5) + 4;
}

function messageSignature(message) {
  return message.role + ':' + message.content.toLowerCase().replace(/\s+/g, ' ');
}

function compareContext(messages) {
  const retained = [];
  const signatures = new Set();
  let estimatedTokens = estimateTokens(SYSTEM_PROMPT);
  let duplicateMessages = 0;
  let trimmedMessages = 0;

  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const message = messages[index];
    const signature = messageSignature(message);
    if (signatures.has(signature)) {
      duplicateMessages += 1;
      continue;
    }
    const messageTokens = estimateTokens(message.content) + 4;
    if (estimatedTokens + messageTokens > MAX_CONTEXT_TOKENS) {
      trimmedMessages += 1;
      continue;
    }
    signatures.add(signature);
    retained.unshift(message);
    estimatedTokens += messageTokens;
  }
  return { messages: retained, estimatedTokens, duplicateMessages, trimmedMessages };
}

function responseText(content) {
  if (Array.isArray(content)) return content.map((part) => part?.text || '').join('').trim();
  return String(content || '').trim();
}

function messageFromRow(row) {
  return { id: row.id, role: row.role, content: row.content, createdAt: row.created_at };
}

function sessionFromRow(row) {
  return { id: row.id, title: row.title, createdAt: row.created_at, updatedAt: row.updated_at };
}

function titleFromMessage(content) {
  const title = cleanText(content, MAX_TITLE_CHARACTERS).replace(/\s+/g, ' ');
  return title || 'New chat';
}

async function getSession(env, sessionId) {
  if (!sessionId) return null;
  return env.DB.prepare('SELECT id, title, created_at, updated_at FROM chat_sessions WHERE id = ?1').bind(sessionId).first();
}

async function getMessages(env, sessionId) {
  const result = await env.DB.prepare(
    'SELECT id, role, content, created_at FROM chat_messages WHERE session_id = ?1 ORDER BY created_at ASC, rowid ASC',
  ).bind(sessionId).all();
  return result.results || [];
}

async function createSession(env, title = 'New chat') {
  const id = crypto.randomUUID();
  return env.DB.prepare(
    'INSERT INTO chat_sessions (id, title) VALUES (?1, ?2) RETURNING id, title, created_at, updated_at',
  ).bind(id, title).first();
}

const SYSTEM_PROMPT = 'You are the English Cards learning assistant.\n' +
  'Help the learner understand English vocabulary, word families, pronunciation, grammar, and natural usage.\n' +
  'Use English only. Keep answers clear, friendly, and concise for an English learner.\n' +
  'When explaining a word with multiple parts of speech, separate the meanings with labels such as Verb:, Noun:, Adjective:, or Adverb:.\n' +
  'Do not invent a personal vocabulary card or claim that you saved anything. The Add Word form handles saving.';

export async function onRequestGet({ request, env }) {
  if (!env.DB) return json({ error: 'The D1 database binding is not configured.' }, 503);
  const sessionId = new URL(request.url).searchParams.get('sessionId');
  if (sessionId) {
    const session = await getSession(env, sessionId);
    if (!session) return json({ error: 'Chat session not found.' }, 404);
    return json({ session: sessionFromRow(session), messages: (await getMessages(env, sessionId)).map(messageFromRow) });
  }
  const result = await env.DB.prepare(
    'SELECT id, title, created_at, updated_at FROM chat_sessions ORDER BY updated_at DESC, created_at DESC LIMIT 100',
  ).all();
  return json({ sessions: (result.results || []).map(sessionFromRow) });
}

export async function onRequestPost({ request, env }) {
  if (!env.DB) return json({ error: 'The D1 database binding is not configured.' }, 503);
  let body;
  try {
    body = JSON.parse(await request.text());
  } catch {
    return json({ error: 'The chat request is invalid.' }, 400);
  }

  if (body?.action === 'create' || (!body?.message && !Array.isArray(body?.messages))) {
    const session = await createSession(env);
    return json({ session: sessionFromRow(session), messages: [] }, 201);
  }

  let session = await getSession(env, cleanText(body?.sessionId, 120));
  if (!session) session = await createSession(env);
  const previousRows = await getMessages(env, session.id);
  const requestedMessage = body?.message || (Array.isArray(body?.messages) ? body.messages.at(-1)?.content : '');
  const content = cleanText(requestedMessage, MAX_MESSAGE_CHARACTERS);
  if (!content) return json({ error: 'Enter a question for the AI assistant.' }, 400);

  const messages = previousRows.map((row) => ({ role: row.role, content: row.content }));
  messages.push({ role: 'user', content });
  const context = compareContext(messages);
  if (!context.messages.length || context.messages[context.messages.length - 1].role !== 'user') return json({ error: 'Enter a question for the AI assistant.' }, 400);

  const userMessageId = crypto.randomUUID();
  const title = session.title === 'New chat' ? titleFromMessage(content) : session.title;
  await env.DB.batch([
    env.DB.prepare('INSERT INTO chat_messages (id, session_id, role, content) VALUES (?1, ?2, ?3, ?4)').bind(userMessageId, session.id, 'user', content),
    env.DB.prepare('UPDATE chat_sessions SET title = ?1, updated_at = CURRENT_TIMESTAMP WHERE id = ?2').bind(title, session.id),
  ]);

  if (!env.AI_API_URL || !env.AI_API_KEY || !env.AI_MODEL) return json({ error: 'AI is not configured yet. Add AI_API_URL, AI_API_KEY, and AI_MODEL to the Cloudflare environment.' }, 503);

  let upstream;
  try {
    upstream = await fetch(env.AI_API_URL, {
      method: 'POST',
      headers: { authorization: 'Bearer ' + env.AI_API_KEY, 'content-type': 'application/json' },
      body: JSON.stringify({ model: env.AI_MODEL, temperature: 0.4, max_tokens: 600, messages: [{ role: 'system', content: SYSTEM_PROMPT }, ...context.messages] }),
    });
  } catch {
    return json({ error: 'The AI provider could not be reached.' }, 502);
  }
  if (!upstream.ok) return json({ error: 'The AI provider rejected the request.' }, 502);

  let payload;
  try {
    payload = await upstream.json();
  } catch {
    return json({ error: 'The AI provider returned an invalid response.' }, 502);
  }
  const answer = responseText(payload?.choices?.[0]?.message?.content ?? payload?.output_text ?? payload?.content);
  if (!answer) return json({ error: 'The AI returned an empty answer.' }, 502);

  const assistantMessageId = crypto.randomUUID();
  await env.DB.batch([
    env.DB.prepare('INSERT INTO chat_messages (id, session_id, role, content) VALUES (?1, ?2, ?3, ?4)').bind(assistantMessageId, session.id, 'assistant', answer.slice(0, 4000)),
    env.DB.prepare('UPDATE chat_sessions SET updated_at = CURRENT_TIMESTAMP WHERE id = ?1').bind(session.id),
  ]);
  session = await getSession(env, session.id);
  return json({
    session: sessionFromRow(session),
    message: { id: assistantMessageId, role: 'assistant', content: answer.slice(0, 4000) },
    context: { estimatedTokens: context.estimatedTokens, maxTokens: MAX_CONTEXT_TOKENS, duplicateMessages: context.duplicateMessages, trimmedMessages: context.trimmedMessages },
  });
}

export async function onRequestDelete({ request, env }) {
  if (!env.DB) return json({ error: 'The D1 database binding is not configured.' }, 503);
  let body;
  try {
    body = await request.json();
  } catch {
    body = {};
  }
  const sessionId = cleanText(body?.sessionId || new URL(request.url).searchParams.get('sessionId'), 120);
  if (!sessionId) return json({ error: 'A chat session is required.' }, 400);
  await env.DB.prepare('DELETE FROM chat_sessions WHERE id = ?1').bind(sessionId).run();
  return json({ ok: true });
}
