import { test } from 'node:test';
import assert from 'node:assert/strict';
import { onRequestPost } from './vocabulary.js';

function mockDb({ existingWords = [], duplicateWord = null } = {}) {
  return {
    prepare(sql) {
      const stmt = {
        args: [],
        bind(...args) {
          this.args = args;
          return this;
        },
        async first() {
          const word = String(stmt.args[0] || '').trim().toLowerCase();
          if (duplicateWord && word === duplicateWord.toLowerCase()) return { word: duplicateWord };
          return null;
        },
        async all() {
          return { results: existingWords.map((word) => ({ word })) };
        },
      };
      return stmt;
    },
  };
}

function mockUpstream(generated) {
  return async () => new Response(JSON.stringify({
    choices: [{ message: { content: JSON.stringify(generated) } }],
  }), { status: 200 });
}

function request(prompt) {
  return new Request('http://localhost/api/ai/vocabulary', {
    method: 'POST',
    body: JSON.stringify({ prompt }),
  });
}

function withMockedFetch(fetchImpl, run) {
  const original = globalThis.fetch;
  globalThis.fetch = fetchImpl;
  return run().finally(() => {
    globalThis.fetch = original;
  });
}

test('does not attach an unrelated familyRoot/rootSuggestion when the AI marks the word as its own root', async () => {
  const env = {
    DB: mockDb({ existingWords: ['value'] }),
    AI_API_URL: 'https://example.test/ai',
    AI_API_KEY: 'test-key',
    AI_MODEL: 'test-model',
  };
  const generated = {
    word: 'capable',
    definition: 'Adjective: able to do something.',
    examples: ['She is capable of this.', 'He is capable of that.', 'They are capable of it.'],
    topic: 'work',
    isFamilyRoot: true,
    // Contradictory AI output: claims capable is its own root but also links it to "value".
    rootSuggestion: 'value',
    familyRoot: 'value',
  };

  await withMockedFetch(mockUpstream(generated), async () => {
    const response = await onRequestPost({ request: request('capable'), env });
    const payload = await response.json();

    assert.equal(response.status, 200);
    assert.equal(payload.item.isFamilyRoot, true);
    assert.equal(payload.item.familyRoot, '');
    assert.equal(payload.item.rootSuggestion, '');
  });
});

test('keeps a valid familyRoot for a word that is not itself a family root', async () => {
  const env = {
    DB: mockDb({ existingWords: ['value'] }),
    AI_API_URL: 'https://example.test/ai',
    AI_API_KEY: 'test-key',
    AI_MODEL: 'test-model',
  };
  const generated = {
    word: 'evaluate',
    definition: 'Verb: to judge the value of something.',
    examples: ['We evaluate the results.', 'They evaluate the risk.', 'I will evaluate it tomorrow.'],
    topic: 'work',
    isFamilyRoot: false,
    rootSuggestion: 'value',
    familyRoot: 'value',
  };

  await withMockedFetch(mockUpstream(generated), async () => {
    const response = await onRequestPost({ request: request('evaluate'), env });
    const payload = await response.json();

    assert.equal(response.status, 200);
    assert.equal(payload.item.isFamilyRoot, false);
    assert.equal(payload.item.familyRoot, 'value');
    assert.equal(payload.item.rootSuggestion, 'value');
  });
});

test('keeps an unlisted related root as a rootSuggestion', async () => {
  const env = {
    DB: mockDb({ existingWords: ['value'] }),
    AI_API_URL: 'https://example.test/ai',
    AI_API_KEY: 'test-key',
    AI_MODEL: 'test-model',
  };
  const generated = {
    word: 'wrangler',
    definition: 'Noun: a person who wrangles.',
    examples: ['The wrangler checked the horses.', 'A wrangler works on the ranch.', 'The wrangler prepared the cattle for the journey.'],
    topic: 'work',
    isFamilyRoot: false,
    rootSuggestion: 'wrangle',
    familyRoot: 'wrangle',
  };

  await withMockedFetch(mockUpstream(generated), async () => {
    const response = await onRequestPost({ request: request('wrangler'), env });
    const payload = await response.json();

    assert.equal(response.status, 200);
    assert.equal(payload.item.rootSuggestion, 'wrangle');
    assert.equal(payload.item.familyRoot, '');
  });
});

test('rejects a prompt that already exists in the vocabulary', async () => {
  const env = {
    DB: mockDb({ duplicateWord: 'capable' }),
    AI_API_URL: 'https://example.test/ai',
    AI_API_KEY: 'test-key',
    AI_MODEL: 'test-model',
  };

  const response = await onRequestPost({ request: request('capable'), env });
  assert.equal(response.status, 409);
});

test('reports 503 when the AI environment is not configured', async () => {
  const env = { DB: mockDb() };
  const response = await onRequestPost({ request: request('capable'), env });
  assert.equal(response.status, 503);
});
