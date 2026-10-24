export const PLACEHOLDER_IMAGE = '/api/vocabulary-image?key=placeholder-1.png';

export function cardFromDatabase(item) {
  const examples = exampleList(item.examples || item.example);
  const isUserCard = item.source !== 'system';
  const isFamilyCard = Boolean(item.familyRoot);
  return {
    id: item.id,
    english: item.word,
    definition: item.definition || 'A word added to your personal vocabulary.',
    notes: item.notes || (isUserCard ? 'A custom card from your personal vocabulary.' : 'Listen to the pronunciation and practise the word in context.'),
    topic: item.topic || 'other',
    category: item.isFamilyRoot ? 'WORD FAMILY ROOT' : isUserCard ? 'MY VOCABULARY' : isFamilyCard ? 'WORD FAMILY' : 'CORE VOCABULARY',
    pronunciation: item.pronunciation || '',
    examples,
    imageUrl: item.imageUrl,
    familyId: item.familyRoot || '',
    isFamilyRoot: Boolean(item.isFamilyRoot),
    isCustom: isUserCard,
  };
}

export function exampleList(value) {
  const values = Array.isArray(value) ? value : String(value || '').split(/\r?\n/);
  return values.flatMap((item) => String(item || '').split(/\r?\n/))
    .map((item) => item.replace(/^\s*(?:[-*]|\d+[.)])\s*/, '').trim()).filter(Boolean);
}

export function exampleText(card) {
  return exampleList(card.examples?.length ? card.examples : card.example);
}

export function definitionLines(value) {
  const labels = /^(Noun|Verb|Adjective|Adverb|Pronoun|Preposition|Conjunction|Interjection|Determiner|Phrase|Phrasal verb):\s*(.*)$/i;
  return String(value || '').replace(/\r\n/g, '\n').replace(/\s+(?=(Noun|Verb|Adjective|Adverb|Pronoun|Preposition|Conjunction|Interjection|Determiner|Phrase|Phrasal verb):)/gi, '\n')
    .split(/\n+/).map((line) => line.trim()).filter(Boolean).map((line) => {
      const match = line.match(labels);
      return match ? { label: `${match[1]}:`, text: match[2] } : { label: '', text: line };
    });
}

export async function apiJson(url, options) {
  const response = await fetch(url, options);
  const payload = await response.json();
  if (!response.ok) throw new Error(payload.error || 'Something went wrong. Please try again.');
  return payload;
}

export function topicLabel(topic) {
  return ({ greetings: 'Conversation', work: 'Work', travel: 'Travel' })[topic] || 'Other';
}

export function uniqueCards(cards) {
  return [...new Map(cards.map((card) => [card.english.toLowerCase(), card])).values()];
}
