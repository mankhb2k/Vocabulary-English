const JSON_HEADERS = { 'content-type': 'application/json; charset=utf-8' };
const MAX_CONTEXT_TOKENS = 200000;
const MAX_MESSAGE_CHARACTERS = 20000;

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
  return `${message.role}:${message.content.toLowerCase().replace(/\s+/g, ' ')}`;
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

  return {
    messages: retained,
    estimatedTokens,
    duplicateMessages,
    trimmedMessages,
  };
}

function responseText(content) {
  if (Array.isArray(content)) return content.map((part) => part?.text || '').join('').trim();
  return String(content || '').trim();
}

const SYSTEM_PROMPT = `You are the English Cards learning assistant.
Help the learner understand English vocabulary, word families, pronunciation, grammar, and natural usage.
Use English only. Keep answers clear, friendly, and concise for an English learner.
When explaining a word with multiple parts of speech, separate the meanings with labels such as Verb:, Noun:, Adjective:, or Adverb:.
Do not invent a personal vocabulary card or claim that you saved anything. The Add Word form handles saving.`;

export async function onRequestPost({ request, env }) {
  if (!env.AI_API_URL || !env.AI_API_KEY || !env.AI_MODEL) return json({ error: 'AI is not configured yet. Add AI_API_URL, AI_API_KEY, and AI_MODEL to the Cloudflare environment.' }, 503);

  let body;
  try {
    body = JSON.parse(await request.text());
  } catch {
    return json({ error: 'The chat request is invalid.' }, 400);
  }

  const messages = Array.isArray(body?.messages)
    ? body.messages
      .filter((message) => ['user', 'assistant'].includes(message?.role))
      .map((message) => ({ role: message.role, content: cleanText(message.content, MAX_MESSAGE_CHARACTERS) }))
      .filter((message) => message.content)
    : [];
  const context = compareContext(messages);
  if (!context.messages.length || context.messages[context.messages.length - 1].role !== 'user') return json({ error: 'Enter a question for the AI assistant.' }, 400);

  let upstream;
  try {
    upstream = await fetch(env.AI_API_URL, {
      method: 'POST',
      headers: {
        authorization: `Bearer ${env.AI_API_KEY}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: env.AI_MODEL,
        temperature: 0.4,
        max_tokens: 600,
        messages: [{ role: 'system', content: SYSTEM_PROMPT }, ...context.messages],
      }),
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
  return json({
    answer: answer.slice(0, 4000),
    context: {
      estimatedTokens: context.estimatedTokens,
      maxTokens: MAX_CONTEXT_TOKENS,
      duplicateMessages: context.duplicateMessages,
      trimmedMessages: context.trimmedMessages,
    },
  });
}
