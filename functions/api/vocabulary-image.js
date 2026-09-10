export async function onRequestGet({ request, env }) {
  if (!env.VOCABULARY_IMAGES) return new Response('R2 binding chưa được cấu hình.', { status: 503 });

  const key = new URL(request.url).searchParams.get('key') || '';
  if (!key.startsWith('vocabulary/') || key.length > 180 || key.includes('..')) {
    return new Response('Key không hợp lệ.', { status: 400 });
  }

  const object = await env.VOCABULARY_IMAGES.get(key);
  if (!object) return new Response('Không tìm thấy ảnh.', { status: 404 });

  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set('cache-control', 'public, max-age=31536000, immutable');
  headers.set('etag', object.httpEtag);
  return new Response(object.body, { headers });
}
