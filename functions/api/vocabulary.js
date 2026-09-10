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
  return ({ greetings: 'Giao tiếp', work: 'Công việc', travel: 'Du lịch', other: 'Khác' })[topic] || 'Khác';
}

function toClientItem(row) {
  return {
    id: row.id,
    word: row.word,
    meaning: row.meaning,
    pronunciation: row.pronunciation,
    example: row.example,
    topic: row.topic,
    topicName: topicName(row.topic),
    imageUrl: `/api/vocabulary-image?key=${encodeURIComponent(row.image_key)}`,
    createdAt: row.created_at,
  };
}

export async function onRequestGet({ env }) {
  if (!env.DB) return json({ error: 'D1 binding DB chưa được cấu hình.' }, 503);
  const result = await env.DB.prepare(`
    SELECT id, word, meaning, pronunciation, example, topic, image_key, created_at
    FROM vocabulary_entries
    ORDER BY created_at DESC
    LIMIT 100
  `).all();
  return json({ items: (result.results || []).map(toClientItem) });
}

export async function onRequestPost({ request, env }) {
  if (!env.DB || !env.VOCABULARY_IMAGES) return json({ error: 'D1 hoặc R2 binding chưa được cấu hình.' }, 503);

  let form;
  try {
    form = await request.formData();
  } catch {
    return json({ error: 'Dữ liệu gửi lên không hợp lệ.' }, 400);
  }

  const word = textField(form, 'word', 120);
  const meaning = textField(form, 'meaning', 240);
  const pronunciation = textField(form, 'pronunciation', 120);
  const example = textField(form, 'example', 500);
  const topic = ['greetings', 'work', 'travel', 'other'].includes(form.get('topic')) ? form.get('topic') : 'other';
  const file = form.get('image');

  if (!word || !meaning) return json({ error: 'Từ và nghĩa tiếng Việt là bắt buộc.' }, 400);
  if (!(file instanceof File) || !file.size) return json({ error: 'Bạn cần chọn ảnh minh họa.' }, 400);
  if (!ALLOWED_IMAGE_TYPES.has(file.type)) return json({ error: 'Chỉ chấp nhận ảnh JPG, PNG hoặc WEBP.' }, 415);
  if (file.size > MAX_IMAGE_BYTES) return json({ error: 'Ảnh phải nhỏ hơn 5MB.' }, 413);

  const id = crypto.randomUUID();
  const key = `vocabulary/${id}.${ALLOWED_IMAGE_TYPES.get(file.type)}`;
  await env.VOCABULARY_IMAGES.put(key, file.stream(), {
    httpMetadata: { contentType: file.type, cacheControl: 'public, max-age=31536000, immutable' },
  });

  try {
    const row = await env.DB.prepare(`
      INSERT INTO vocabulary_entries (id, word, meaning, pronunciation, example, topic, image_key)
      VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)
      RETURNING id, word, meaning, pronunciation, example, topic, image_key, created_at
    `).bind(id, word, meaning, pronunciation, example, topic, key).first();
    return json({ ok: true, item: toClientItem(row) }, 201);
  } catch (error) {
    await env.VOCABULARY_IMAGES.delete(key);
    return json({ error: 'Không thể lưu từ vựng. Vui lòng thử lại.' }, 500);
  }
}
