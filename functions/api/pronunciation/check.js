const JSON_HEADERS = { 'content-type': 'application/json; charset=utf-8' };
const maxAudioBytes = 8 * 1024 * 1024;

function json(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: JSON_HEADERS });
}

async function openAiError(response) {
  const payload = await response.json().catch(() => ({}));
  return payload.error?.message || `OpenAI request failed (${response.status}).`;
}

export async function onRequestPost({ request, env }) {
  if (!env.AI_API_KEY || !env.AI_API_URL || !env.AI_MODEL) {
    return json({ error: 'The AI service is not configured on Cloudflare.' }, 503);
  }

  let form;
  try {
    form = await request.formData();
  }
  catch {
    return json({ error: 'Send an audio recording and the word you are practising.' }, 400);
  }

  const audio = form.get('audio');
  const target = String(form.get('target') || '').trim();
  if (!(audio instanceof File) || !audio.size || !audio.type.startsWith('audio/')) {
    return json({ error: 'Record your pronunciation before asking for feedback.' }, 400);
  }
  if (audio.size > maxAudioBytes) return json({ error: 'The recording is too large. Keep it under 8 MB.' }, 413);
  if (!target || target.length > 100) return json({ error: 'The practice word is missing or too long.' }, 400);

  const token = env.AI_API_KEY;
  const transcriptionForm = new FormData();
  transcriptionForm.append('file', audio, audio.name || 'pronunciation.webm');
  transcriptionForm.append('model', 'gpt-4o-mini-transcribe');
  transcriptionForm.append('language', 'en');

  let transcriptionResponse;
  try {
    transcriptionResponse = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: { authorization: `Bearer ${token}` },
      body: transcriptionForm,
    });
  }
  catch {
    return json({ error: 'Could not reach the speech recognition service. Please try again.' }, 502);
  }
  if (!transcriptionResponse.ok) return json({ error: await openAiError(transcriptionResponse) }, 502);

  const transcription = await transcriptionResponse.json().catch(() => ({}));
  const transcript = String(transcription.text || '').trim();
  if (!transcript) return json({ error: 'I could not hear a clear word. Try speaking a little closer to the microphone.' }, 422);

  let gradingResponse;
  try {
    gradingResponse = await fetch(env.AI_API_URL, {
      method: 'POST',
      headers: {
        authorization: `Bearer ${token}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: env.AI_MODEL,
        reasoning_effort: 'low',
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'system',
            content: 'You coach an English learner. You receive only the intended word and an automatic speech recognition transcript, not the audio. Evaluate how clearly the intended word was recognized. Never claim to hear accent, stress, rhythm, or individual sounds. Return only JSON with: score (integer 0-100), passed (boolean; true only if the transcript clearly contains the intended word), feedback (one concise sentence in Vietnamese that accurately compares the transcript with the target), and tip (one practical Vietnamese retry tip). Be forgiving of harmless punctuation and capitalization, but do not treat a different recognized word as correct.',
          },
          {
            role: 'user',
            content: JSON.stringify({ target, transcript }),
          },
        ],
        max_completion_tokens: 180,
      }),
    });
  }
  catch {
    return json({ error: 'Could not reach the pronunciation coach. Please try again.' }, 502);
  }
  if (!gradingResponse.ok) return json({ error: await openAiError(gradingResponse) }, 502);

  const gradingPayload = await gradingResponse.json().catch(() => ({}));
  const content = gradingPayload.choices?.[0]?.message?.content || '{}';
  let grade;
  try {
    grade = JSON.parse(content);
  }
  catch {
    return json({ error: 'The pronunciation coach returned an invalid result. Please try again.' }, 502);
  }

  const score = Math.max(0, Math.min(100, Math.round(Number(grade.score) || 0)));
  return json({
    target,
    transcript,
    score,
    passed: Boolean(grade.passed),
    feedback: String(grade.feedback || '').slice(0, 240),
    tip: String(grade.tip || '').slice(0, 240),
  });
}
