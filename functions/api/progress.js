const JSON_HEADERS = { 'content-type': 'application/json; charset=utf-8' };

function json(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: JSON_HEADERS });
}

function validateUserId(userId) {
  return typeof userId === 'string' && /^[a-zA-Z0-9_-]{8,80}$/.test(userId);
}

export async function onRequestGet({ request, env }) {
  if (!env.DB) return json({ error: 'The D1 database binding is not configured.' }, 503);
  const userId = new URL(request.url).searchParams.get('userId');
  if (!validateUserId(userId)) return json({ error: 'Invalid user ID.' }, 400);

  const row = await env.DB.prepare(
    'SELECT reviewed_count, correct_count, favorites_json FROM user_progress WHERE user_id = ?1',
  ).bind(userId).first();

  return json({
    reviewed: row?.reviewed_count || 0,
    correct: row?.correct_count || 0,
    favorites: row?.favorites_json ? JSON.parse(row.favorites_json) : [],
  });
}

export async function onRequestPost({ request, env }) {
  if (!env.DB) return json({ error: 'The D1 database binding is not configured.' }, 503);

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Request body must be valid JSON.' }, 400);
  }

  const userId = body?.userId;
  const reviewed = Number.isInteger(body?.reviewed) ? Math.max(0, body.reviewed) : 0;
  const correct = Number.isInteger(body?.correct) ? Math.max(0, Math.min(body.correct, reviewed)) : 0;
  const favorites = Array.isArray(body?.favorites) ? body.favorites.filter((item) => typeof item === 'string').slice(0, 1000) : [];

  if (!validateUserId(userId)) return json({ error: 'Invalid user ID.' }, 400);

  await env.DB.prepare(`
    INSERT INTO user_progress (user_id, reviewed_count, correct_count, favorites_json, updated_at)
    VALUES (?1, ?2, ?3, ?4, CURRENT_TIMESTAMP)
    ON CONFLICT(user_id) DO UPDATE SET
      reviewed_count = excluded.reviewed_count,
      correct_count = excluded.correct_count,
      favorites_json = excluded.favorites_json,
      updated_at = CURRENT_TIMESTAMP
  `).bind(userId, reviewed, correct, JSON.stringify(favorites)).run();

  return json({ ok: true });
}
