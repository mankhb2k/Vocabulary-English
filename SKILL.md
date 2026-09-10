---
name: english-vocabulary
description: Create, review, and save English vocabulary cards for the English Cards application.
---

# English Vocabulary Skill

Read this file before creating or saving a vocabulary item.

## Card contract

Each vocabulary item is one card. Return or save this shape:

```json
{
  "word": "resilient",
  "definition": "Able to recover quickly from difficulties.",
  "pronunciation": "/rɪˈzɪliənt/",
  "examples": [
    "She is resilient and never gives up.",
    "The team stayed resilient after the first plan failed.",
    "Regular practice can help learners become more resilient."
  ],
  "topic": "work",
  "familyRoot": ""
}
```

Required fields are `word`, `definition`, and at least three non-empty `examples`. `pronunciation`, `topic`, and `familyRoot` are optional but should be generated when they are useful.

## Content rules

- Use English only. Do not add Vietnamese translations or Vietnamese explanations.
- `word` can be a single word, phrasal verb, collocation, or useful vocabulary phrase. Do not create a full sentence as the card title.
- Write a clear English learner-friendly definition, not a translation.
- If the item has more than one common part of speech, explain each form separately in the definition with clear labels such as `Verb:`, `Noun:`, `Adjective:`, or `Adverb:`. Do not merge different forms into one vague definition.
- Write at least three natural English example sentences that demonstrate the item. Keep each sentence separate in the `examples` array; never leave it empty.
- Use one of these topic values: `greetings`, `work`, `travel`, or `other`.
- Use IPA when pronunciation is known; otherwise leave it empty rather than inventing a pronunciation.
- Examples belong inside the vocabulary card. Never create a separate Library card for an example sentence.

## Word families

- `familyRoot` must be the exact existing vocabulary item that the new item belongs to, ignoring case.
- Leave `familyRoot` empty when there is no confident existing family root.
- A family link is a relation between two existing cards; it must not create a duplicate root card.
- The Library displays family words, not prefix/suffix labels.

## Before saving

1. Normalize surrounding whitespace and collapse repeated spaces in `word`.
2. Check D1 for an existing item using a case-insensitive comparison.
3. If the item already exists, stop and report the existing word instead of creating another card.
4. If `familyRoot` is set, confirm that the root already exists in D1.
5. Generate the card draft first. Save it only after the user confirms the draft and supplies an image.

The application API is the final authority for duplicate checks, validation, image storage, and D1 relations.

## AI provider configuration

The AI draft endpoint uses an OpenAI-compatible chat-completions API. Configure these values as Cloudflare Pages environment variables; never put the API key in frontend code:

- `AI_API_URL`: the provider chat-completions endpoint
- `AI_API_KEY`: the provider secret
- `AI_MODEL`: the model name accepted by that endpoint

For local development, put the values in the ignored `.dev.vars` file. For production, add `AI_API_KEY` as a Pages secret and add the endpoint/model in the Pages environment settings. The AI endpoint creates a draft only; the user must review it, choose an image, and press Save vocabulary before D1 is changed.
