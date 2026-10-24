import { renderApp } from './components/app.js';
import { createTranslationSamples } from './mock/translation-samples.js';
import {
  BookPlus,
  Copy,
  createIcons,
  Languages,
  Library,
  MessageSquareText,
  PanelLeft,
  Send,
  Trash2,
  Volume2,
} from 'lucide';

const fallbackCards = []; /* Legacy card data moved to D1.
  { english: 'resilient', definition: 'Able to recover quickly from difficulties.', notes: 'Often used to describe a person, team, or system that adapts well to problems.', topic: 'work', category: 'CORE VOCABULARY', pronunciation: '/rɪˈzɪliənt/', example: 'She is resilient and never gives up.' },
  { english: 'curious', definition: 'Wanting to know or learn something.', notes: 'A positive word for someone who enjoys discovering new ideas.', topic: 'greetings', category: 'CORE VOCABULARY', pronunciation: '/ˈkjʊəriəs/', example: 'He is curious about how the machine works.' },
  { english: 'consistent', definition: 'Doing something in the same reliable way over time.', notes: 'Useful when talking about habits, effort, or quality.', topic: 'work', category: 'CORE VOCABULARY', pronunciation: '/kənˈsɪstənt/', example: 'Consistent practice leads to steady progress.' },
  { english: 'adapt', definition: 'To change your behaviour or methods to suit a new situation.', notes: 'A useful verb for change, learning, and problem-solving.', topic: 'work', category: 'CORE VOCABULARY', pronunciation: '/əˈdæpt/', example: 'Good learners adapt when a strategy does not work.' },
  { english: 'confident', definition: 'Feeling sure about your abilities or decisions.', notes: 'Commonly used for skills, communication, and performance.', topic: 'greetings', category: 'CORE VOCABULARY', pronunciation: '/ˈkɒnfɪdənt/', example: 'She feels more confident after practising every day.' },
  { english: 'patient', definition: 'Able to wait or deal with difficulties without becoming upset.', notes: 'This adjective can describe a person, attitude, or approach.', topic: 'greetings', category: 'CORE VOCABULARY', pronunciation: '/ˈpeɪʃənt/', example: 'Be patient with yourself while you learn.' },
  { english: 'improve', definition: 'To become better or make something better.', notes: 'A common verb for progress, skills, and performance.', topic: 'work', category: 'CORE VOCABULARY', pronunciation: '/ɪmˈpruːv/', example: 'Reading regularly can improve your vocabulary.' },
  { english: 'unwind', definition: 'To relax after a period of work or activity.', notes: 'Often used when talking about relaxing in the evening or at the weekend.', topic: 'travel', category: 'CORE VOCABULARY', pronunciation: '/ʌnˈwaɪnd/', example: 'I like to unwind with a short walk after work.' },
]; */

const wordFamilyExamples = []; /* Legacy family data moved to D1.
  { english: 'help', definition: 'To make it easier for someone to do something.', notes: 'The base word in this family.', topic: 'other', category: 'WORD FAMILY', pronunciation: '/help/', example: 'Can you help me with this task?', familyId: 'help' },
  { english: 'helpful', definition: 'Useful or able to provide help.', notes: 'The suffix -ful means “full of” or “providing”.', topic: 'other', category: 'WORD FAMILY', pronunciation: '/ˈhelpfəl/', example: 'The instructions were very helpful.', familyId: 'help', relationType: 'suffix', affix: '-ful' },
  { english: 'helpless', definition: 'Unable to help yourself or control a situation.', notes: 'The suffix -less means “without”.', topic: 'other', category: 'WORD FAMILY', pronunciation: '/ˈhelpləs/', example: 'He felt helpless during the emergency.', familyId: 'help', relationType: 'suffix', affix: '-less' },
  { english: 'helper', definition: 'A person who helps someone.', notes: 'The suffix -er can describe a person who does an action.', topic: 'other', category: 'WORD FAMILY', pronunciation: '/ˈhelpər/', example: 'She works as a classroom helper.', familyId: 'help', relationType: 'suffix', affix: '-er' },
  { english: 'helpfully', definition: 'In a way that provides useful help.', notes: 'The suffix -ly forms an adverb.', topic: 'other', category: 'WORD FAMILY', pronunciation: '/ˈhelpfəli/', example: 'He helpfully explained the next steps.', familyId: 'help', relationType: 'suffix', affix: '-fully' },
  { english: 'unhelpful', definition: 'Not useful or not providing the help that is needed.', notes: 'The prefix un- often gives a word the opposite meaning.', topic: 'other', category: 'WORD FAMILY', pronunciation: '/ʌnˈhelpfəl/', example: 'The reply was vague and unhelpful.', familyId: 'help', relationType: 'prefix', affix: 'un-' },
]; */

const state = {
  allCards: [],
  favorites: JSON.parse(localStorage.getItem('englishCardsFavorites') || '[]'),
  vocabularyCards: [],
  libraryTopic: 'all',
  librarySort: 'az',
  libraryRandomOrder: [],
  searchQuery: '',
  selectedCard: null,
  aiDraft: null,
  aiRootDraft: null,
  wordIndex: null,
  editingVocabulary: null,
  chatSessions: [],
  activeChatSessionId: null,
  aiChatMessages: [],
  translationDate: '',
  translationItems: [],
  translationSearch: '',
  translationRequestId: 0,
  translationPending: '',
  translationDaysRequestId: 0,
  translationDayGroups: [],
  translationCalendarMonth: '',
  translationSelectedDays: [],
  translationDraftSelectedDays: [],
  translationHistoryMode: false,
  translationNextCursor: null,
  translationHasMore: false,
  translationLoadingOlder: false,
  translationUsVoices: [],
};

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const PLACEHOLDER_IMAGE = '/api/vocabulary-image?key=placeholder-1.png';
const translationDemoItems = import.meta.env.DEV ? createTranslationSamples() : [];
const US_VOICE_STORAGE_KEY = 'englishCardsUsVoice';

function getUsVoices() {
  if (!('speechSynthesis' in window)) return [];
  return window.speechSynthesis.getVoices().filter((voice) => voice.lang.toLowerCase().replace('_', '-') === 'en-us');
}

function getPreferredUsVoice() {
  const voices = state.translationUsVoices.length ? state.translationUsVoices : getUsVoices();
  const savedVoiceUri = localStorage.getItem(US_VOICE_STORAGE_KEY);
  if (savedVoiceUri) {
    const savedVoice = voices.find((voice) => voice.voiceURI === savedVoiceUri);
    if (savedVoice) return savedVoice;
  }
  return voices.find((voice) => voice.default) || voices[0] || null;
}

function refreshUsVoiceOptions() {
  const select = $('#translation-voice-select');
  if (!select || !('speechSynthesis' in window)) return;
  const voices = getUsVoices();
  state.translationUsVoices = voices;
  const savedVoiceUri = localStorage.getItem(US_VOICE_STORAGE_KEY) || '';
  select.replaceChildren(new Option('Auto (US English)', ''));
  voices.forEach((voice) => {
    const option = new Option(`${voice.name} (${voice.lang})${voice.default ? ' — default' : ''}`, voice.voiceURI);
    select.add(option);
  });
  select.value = voices.some((voice) => voice.voiceURI === savedVoiceUri) ? savedVoiceUri : '';
  select.disabled = voices.length === 0;
  select.options[0].textContent = voices.length ? 'Auto (US English)' : 'No US voice found';
}

function speakEnglish(text, { rate = 1 } = {}) {
  if (!('speechSynthesis' in window) || !('SpeechSynthesisUtterance' in window)) {
    toast('Speech playback is not supported in this browser.');
    return;
  }
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'en-US';
  utterance.rate = rate;
  const voice = getPreferredUsVoice();
  if (voice) utterance.voice = voice;
  window.speechSynthesis.speak(utterance);
}

function cardKey(card) { return card.english; }

function cardImageUrl(card) { return card.imageUrl || PLACEHOLDER_IMAGE; }

function normalizeCard(chunk, topic, category) {
  const english = chunk.english || chunk.word || '';
  const topicLabel = toEnglishLabel(topic, 'Everyday English');
  const categoryLabel = toEnglishLabel(category, 'Everyday English');
  const topicName = `${topicLabel} ${categoryLabel}`.toLowerCase();
  const inferredTopic = topicName.includes('work') || topicName.includes('office') || topicName.includes('meeting') ? 'work' : topicName.includes('travel') || topicName.includes('transport') ? 'travel' : 'greetings';
  return { english, definition: chunk.definition || 'An English expression used in everyday communication.', notes: chunk.usageNote || 'Listen to the pronunciation and practise the expression in context.', topic: inferredTopic, category: categoryLabel.toUpperCase(), pronunciation: chunk.pronunciation || '', example: chunk.example || `Use “${english}” in a natural conversation.` };
}

function toEnglishLabel(value, fallback) {
  const text = String(value || '').trim();
  const parts = text.match(/^(.*?)\s*\(([^()]*)\)\s*$/);
  if (!parts) return /[^\x00-\x7F]/.test(text) ? fallback : text || fallback;
  return /[^\x00-\x7F]/.test(parts[1]) ? parts[2].trim() || fallback : parts[1].trim() || fallback;
}

function flattenDataset(data) {
  const cards = [];
  const parts = data?.parts ? Object.values(data.parts) : [];
  parts.forEach((part) => (part.topics || []).forEach((topic) => {
    (topic.sub_topics || []).forEach((subTopic) => {
      (subTopic.chunks || []).forEach((chunk) => cards.push(normalizeCard(chunk, topic.name_english, subTopic.name)));
    });
  }));
  return cards.filter((card) => card && card.english && card.definition);
}

function customVocabularyCard(item) {
  return { english: item.word, definition: item.definition || 'A word added to your personal vocabulary.', notes: 'A custom card from your personal vocabulary.', topic: item.topic || 'other', category: 'MY VOCABULARY', pronunciation: item.pronunciation || '', example: item.example || `Use “${item.word}” in a natural conversation.`, imageUrl: item.imageUrl, isCustom: true };
}

function uniqueCards(cards) {
  return [...new Map(cards.map((card) => [card.english.toLowerCase(), card])).values()];
}

function mergeCustomVocabulary() {
  state.allCards = uniqueCards(state.vocabularyCards.map(databaseVocabularyCard));
  renderAll();
}

function databaseVocabularyCard(item) {
  const examples = item.examples || exampleList(item.example);
  const isUserCard = item.source !== 'system';
  const isFamilyCard = Boolean(item.familyRoot);
  return {
    id: item.id,
    english: item.word,
    definition: item.definition || 'A word added to your personal vocabulary.',
    notes: item.notes || (isUserCard ? 'A custom card from your personal vocabulary.' : 'Listen to the pronunciation and practise the word in context.'),
    topic: item.topic || 'other',
    category: item.isFamilyRoot ? 'WORD FAMILY ROOT' : (isUserCard ? 'MY VOCABULARY' : (isFamilyCard ? 'WORD FAMILY' : 'CORE VOCABULARY')),
    pronunciation: item.pronunciation || '',
    examples,
    example: examples.join('\n'),
    familyId: item.familyRoot || '',
    isFamilyRoot: Boolean(item.isFamilyRoot),
    imageUrl: item.imageUrl,
    isCustom: isUserCard,
  };
}

async function loadDataset() {
  // The old chunk dataset contains sentences and phrases, so it is intentionally
  // not loaded into the vocabulary-only Library. Entries come from vocabulary
  // cards, word-family data, and the user's D1 records instead.
}

async function loadCustomVocabulary() {
  try {
    const response = await fetch('/api/vocabulary?scope=all');
    if (!response.ok) return;
    const payload = await response.json();
    state.vocabularyCards = Array.isArray(payload.items) ? payload.items : [];
    mergeCustomVocabulary();
  } catch {
    // The form still works as a static UI when the API is unavailable.
  }
}

function libraryCardMarkup(card) {
  const topicLabel = card.topic === 'work' ? 'Work' : card.topic === 'travel' ? 'Travel' : card.topic === 'greetings' ? 'Conversation' : 'Other';
  const cardIndex = state.allCards.indexOf(card);
  return `<article class="library-card c-surface" data-card-index="${cardIndex}" tabindex="0" role="button" aria-label="View details for ${escapeHtml(card.english)}"><img class="library-card-image c-media" src="${escapeHtml(cardImageUrl(card))}" alt="Illustration for ${escapeHtml(card.english)}" loading="lazy" onerror="this.onerror=null;this.src='/placeholder-1.png'" /><div class="library-card-body"><div><div class="library-card-top"><span class="category-pill c-pill">${escapeHtml(card.category)}</span><span aria-hidden="true">${state.favorites.includes(cardKey(card)) ? '★' : '☆'}</span></div><h3>${escapeHtml(card.english)}</h3><p>${escapeHtml(card.definition)}</p></div><div class="library-card-footer"><span>${topicLabel}</span><span class="library-card-link">View details →</span></div></div></article>`;
}

function detailCardFromRelation(item) {
  return { english: item.word, definition: item.definition || 'A related English word.', notes: 'A related word from your vocabulary.', topic: item.topic || 'other', category: 'WORD FAMILY', pronunciation: item.pronunciation || '', examples: item.example ? [item.example] : [], imageUrl: item.imageUrl, relationType: item.relationType, affix: item.affix, familyId: item.sourceWord };
}

function renderDetailFamily(card, relatedCards) {
  const section = $('#detail-family-section');
  const list = $('#detail-family-list');
  const root = $('#detail-family-root');
  if (!section || !list || !root) return;
  const uniqueCards = [...new Map(relatedCards.filter((item) => item.english !== card.english).map((item) => [item.english, item])).values()];
  section.hidden = !uniqueCards.length && !card.isFamilyRoot;
  root.textContent = card.isFamilyRoot ? 'This card is a family root' : card.familyId ? `Root: ${card.familyId}` : '';
  list.innerHTML = uniqueCards.map((item) => `<button class="detail-family-word c-button" type="button" aria-label="Open ${escapeHtml(item.english)}"><strong>${escapeHtml(item.english)}</strong></button>`).join('');
  $$('.detail-family-word', list).forEach((button, index) => button.addEventListener('click', () => openCardDetails(uniqueCards[index])));
}

async function loadDetailFamily(card) {
  renderDetailFamily(card, []);
  try {
    const response = await fetch(`/api/word-relations?word=${encodeURIComponent(card.english)}`);
    if (!response.ok || state.selectedCard?.english !== card.english) return;
    const payload = await response.json();
    renderDetailFamily(card, (payload.items || []).map(detailCardFromRelation));
  } catch {
    // Related vocabulary is loaded from D1.
  }
}

function renderVocabularyDetail(card) {
  const detailImage = $('#detail-image');
  detailImage.onerror = () => { detailImage.onerror = null; detailImage.src = '/placeholder-1.png'; };
  detailImage.src = cardImageUrl(card);
  detailImage.alt = `Illustration for ${card.english}`;
  $('#detail-category').textContent = card.category || 'WORD';
  $('#detail-word').textContent = card.english;
  $('#detail-pronunciation').textContent = card.pronunciation || 'Press the speaker to listen';
  const editButton = $('#detail-edit');
  editButton.hidden = !card.english;
  $('#detail-definition').innerHTML = formatDefinition(card.definition || 'An English word used in everyday communication.');
  $('#detail-examples').innerHTML = cardExamples(card).map((example) => `<li>${escapeHtml(example)}</li>`).join('') || '<li>Practise this word in a natural sentence.</li>';
  $('#detail-notes').textContent = card.notes || '';
  $('#detail-notes-section').hidden = !card.notes;
  const saved = state.favorites.includes(cardKey(card));
  $('#detail-favorite').textContent = saved ? '★' : '☆';
  $('#detail-favorite').classList.toggle('is-favorite', saved);
  $('#detail-favorite').setAttribute('aria-pressed', String(saved));
  loadDetailFamily(card);
}

function appRouteUrl(viewName = 'library', card = null) {
  const hash = card ? `#library/${encodeURIComponent(card.english)}` : viewName === 'library' ? '' : `#${viewName}`;
  return `${window.location.pathname}${window.location.search}${hash}`;
}

function setAppRoute(viewName = 'library', card = null, replace = false) {
  const route = { app: 'english-cards', view: viewName };
  if (card) route.card = card;
  const method = replace ? 'replaceState' : 'pushState';
  window.history[method](route, '', appRouteUrl(viewName, card));
}

function openCardDetails(card, { pushHistory = true } = {}) {
  state.selectedCard = typeof card === 'string' ? state.allCards.find((item) => item.english === card) : card;
  if (!state.selectedCard) return;
  if (pushHistory) setAppRoute('library', state.selectedCard);
  $$('.view').forEach((view) => view.classList.toggle('is-visible', view.id === 'view-library'));
  $$('.nav-item').forEach((button) => button.classList.toggle('is-active', button.dataset.view === 'library'));
  $('#library-index').hidden = true;
  $('#vocabulary-detail').hidden = false;
  $('#detail-back').textContent = '← Back';
  renderVocabularyDetail(state.selectedCard);
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function closeVocabularyDetail() {
  state.selectedCard = null;
  $('#vocabulary-detail').hidden = true;
  $('#library-index').hidden = false;
}

function handleHistoryChange(event) {
  const route = event.state;
  if (route?.app === 'english-cards' && route.card) {
    openCardDetails(route.card, { pushHistory: false });
    return;
  }
  showView(route?.app === 'english-cards' ? route.view : 'library', { syncHistory: false });
}

function initHistory() {
  const hashCard = window.location.hash.startsWith('#library/')
    ? decodeURIComponent(window.location.hash.slice('#library/'.length))
    : '';
  const existingCard = window.history.state?.app === 'english-cards' ? window.history.state.card : null;
  const card = existingCard || state.allCards.find((item) => item.english.toLowerCase() === hashCard.toLowerCase());
  window.addEventListener('popstate', handleHistoryChange);
  if (card) {
    setAppRoute('library', null, true);
    setAppRoute('library', card);
    openCardDetails(card, { pushHistory: false });
    return;
  }
  const view = window.history.state?.app === 'english-cards' ? window.history.state.view : 'library';
  setAppRoute(view, null, true);
}

function renderLibrary() {
  let filtered = state.libraryTopic === 'all' ? state.allCards : state.allCards.filter((card) => card.topic === state.libraryTopic);
  if (state.searchQuery) filtered = filtered.filter((card) => `${card.english} ${card.definition}`.toLowerCase().includes(state.searchQuery));
  filtered = orderLibraryCards(filtered);
  $('#library-total').textContent = `${filtered.length.toLocaleString('en-US')} ${state.searchQuery ? 'results' : 'cards'}`;
  const cards = filtered.slice(0, 60);
  $('#library-grid').innerHTML = cards.length ? cards.map(libraryCardMarkup).join('') : '<div class="empty-state">No matching cards found.</div>';
  $$('.library-card').forEach((cardElement) => {
    const open = () => openCardDetails(state.allCards[Number(cardElement.dataset.cardIndex)]);
    cardElement.addEventListener('click', open);
    cardElement.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); open(); }
    });
  });
}

function libraryCardId(card) {
  return card.id || card.english.toLowerCase();
}

function shuffledCards(cards) {
  const result = [...cards];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
  }
  return result;
}

function orderLibraryCards(cards) {
  if (state.librarySort === 'random') {
    const lookup = new Map(cards.map((card) => [libraryCardId(card), card]));
    const ordered = state.libraryRandomOrder.filter((id) => lookup.has(id)).map((id) => lookup.get(id));
    const missing = cards.filter((card) => !state.libraryRandomOrder.includes(libraryCardId(card)));
    if (missing.length) {
      const added = shuffledCards(missing);
      state.libraryRandomOrder = [...state.libraryRandomOrder, ...added.map(libraryCardId)];
      return [...ordered, ...added];
    }
    return ordered;
  }
  return [...cards].sort((left, right) => left.english.localeCompare(right.english, undefined, { sensitivity: 'base' }));
}

function shuffleLibrary() {
  state.librarySort = 'random';
  state.libraryRandomOrder = shuffledCards(state.allCards).map(libraryCardId);
  const select = $('#library-sort');
  if (select) select.value = 'random';
  renderLibrary();
}

function localDateValue(date = new Date()) {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 10);
}

function localDateRange(dateValue) {
  const [year, month, day] = dateValue.split('-').map(Number);
  const start = new Date(year, month - 1, day);
  const end = new Date(year, month - 1, day + 1);
  return { from: start.toISOString(), to: end.toISOString() };
}

function translationDate(dateValue) {
  const timestamp = new Date(`${String(dateValue || '').replace(' ', 'T')}Z`);
  return Number.isNaN(timestamp.getTime()) ? new Date() : timestamp;
}

function renderTranslationHistory({ scrollToBottom = true, preserveScroll = null } = {}) {
  const list = $('#translation-list');
  if (!list) return;
  const previousHeight = preserveScroll ? list.scrollHeight : 0;
  const query = state.translationSearch.trim().toLocaleLowerCase();
  const items = state.translationItems
    .filter((item) => !query || `${item.sourceText} ${item.translatedText}`.toLocaleLowerCase().includes(query))
    .sort((left, right) => translationDate(left.createdAt) - translationDate(right.createdAt));
  $('#translation-count').textContent = `${items.length} ${items.length === 1 ? 'translation' : 'translations'}`;

  let previousDay = '';
  const entries = items.map((item) => {
    const time = translationDate(item.createdAt);
    const day = localDateValue(time);
    const dateDivider = day === previousDay ? '' : `<div class="translation-day-divider"><span>${escapeHtml(time.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }))}</span></div>`;
    previousDay = day;
    const id = escapeHtml(item.id);
    return `${dateDivider}<article class="translation-turn">
      <div class="translation-user-row"><div class="translation-user-bubble">${escapeHtml(item.sourceText)}</div></div>
      <div class="translation-user-meta"><time>${escapeHtml(time.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }))}</time><button class="c-button" type="button" data-copy-source="${id}">Copy</button></div>
      <div class="translation-ai-row"><span class="translation-ai-mark" aria-hidden="true">✦</span><span>English translation</span>${item.isMock ? '<span class="translation-demo-badge">DEMO</span>' : ''}</div>
      <div class="translation-ai-bubble">${escapeHtml(item.translatedText)}</div>
      <div class="translation-message-actions">
        <button class="translation-action-button c-button" type="button" data-copy-translation="${id}" aria-label="Copy English translation" title="Copy English"><i data-lucide="copy" aria-hidden="true"></i></button>
        <button class="translation-action-button c-button" type="button" data-speak-translation="${id}" aria-label="Read English aloud" title="Read aloud"><i data-lucide="volume-2" aria-hidden="true"></i></button>
        ${item.isMock ? '' : `<button class="translation-action-button translation-delete c-button" type="button" data-delete-translation="${id}" aria-label="Delete translation" title="Delete"><i data-lucide="trash-2" aria-hidden="true"></i></button>`}
      </div>
    </article>`;
  });
  if (state.translationPending) {
    entries.push(`<article class="translation-turn is-pending">
      <div class="translation-user-row"><div class="translation-user-bubble">${escapeHtml(state.translationPending)}</div></div>
      <div class="translation-ai-row"><span class="translation-ai-mark" aria-hidden="true">✦</span><span>English translation</span></div>
      <div class="translation-ai-bubble">Translating…</div>
    </article>`);
  }
  if (!entries.length) {
    list.innerHTML = `<div class="translation-empty">${query ? 'No saved messages match your search.' : 'Your translations will appear here. Send a Vietnamese sentence to get started.'}</div>`;
    return;
  }
  list.innerHTML = entries.join('');
  createIcons({ icons: { Copy, Volume2, Trash2 } });
  if (preserveScroll) list.scrollTop = preserveScroll.top + (list.scrollHeight - previousHeight);
  else if (scrollToBottom) list.scrollTop = list.scrollHeight;
}

function setTranslationHistoryMode(isHistory) {
  state.translationHistoryMode = isHistory;
  $('.translation-composer').classList.toggle('is-history', isHistory);
  $('#translation-form').hidden = isHistory;
  $('#translation-new').hidden = !isHistory;
}

function setTranslationStatus(message = '', type = '') {
  const element = $('#translation-status');
  element.textContent = message;
  element.className = `translation-status${type ? ` is-${type}` : ''}`;
}

function renderTranslationDays() {
  const list = $('#translation-day-list');
  if (!list) return;
  const query = state.translationSearch.trim().toLocaleLowerCase();
  const groups = state.translationDayGroups
    .filter((day) => !state.translationSelectedDays.length || state.translationSelectedDays.includes(day.day))
    .filter((day) => !query || `${day.latest_source || ''} ${day.latest_translation || ''}`.toLocaleLowerCase().includes(query));
  if (!groups.length) {
    $('#translation-count').textContent = '0 translations';
    const emptyMessage = query ? 'No chats match your search.' : (state.translationSelectedDays.length ? 'No chats saved for the selected days.' : 'No chats saved yet.');
    list.innerHTML = `<p class="translation-day-empty">${emptyMessage}</p>`;
    return;
  }
  const total = groups.reduce((count, day) => count + Number(day.count || 0), 0);
  $('#translation-count').textContent = `${total} ${total === 1 ? 'translation' : 'translations'}`;
  list.innerHTML = groups.map((day) => {
    const date = new Date(`${day.day}T12:00:00`);
    const dateLabel = date.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const count = Number(day.count || 0);
    return `<button class="translation-day-item c-button" type="button" data-translation-chat-day="${escapeHtml(day.day)}">
      <span class="translation-day-heading"><strong>${escapeHtml(dateLabel)}</strong><small>${count} ${count === 1 ? 'translation' : 'translations'}${day.isMock ? ' · DEMO' : ''}</small></span>
      <span class="translation-day-preview"><span>${escapeHtml(day.latest_source || '')}</span><span>${escapeHtml(day.latest_translation || '')}</span></span>
    </button>`;
  }).join('');
}

function includeTranslationDemos(items, dateValue = '') {
  const combined = new Map(items.map((item) => [item.id, item]));
  for (const item of translationDemoItems) {
    if (!dateValue || localDateValue(translationDate(item.createdAt)) === dateValue) combined.set(item.id, item);
  }
  return [...combined.values()];
}

async function loadTranslationDays() {
  const list = $('#translation-day-list');
  const requestId = ++state.translationDaysRequestId;
  list.innerHTML = '<p class="translation-day-empty">Loading history…</p>';
  try {
    const params = new URLSearchParams({ group: 'days', offsetMinutes: String(new Date().getTimezoneOffset()) });
    const response = await fetch(`/api/translations?${params}`);
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.error || 'Unable to load translation history.');
    if (requestId !== state.translationDaysRequestId) return;
    state.translationDayGroups = mergeTranslationDayGroups(Array.isArray(payload.days) ? payload.days : []);
    renderTranslationDayFilter();
    renderTranslationDays();
  } catch (error) {
    if (requestId !== state.translationDaysRequestId) return;
    if (translationDemoItems.length) {
      state.translationDayGroups = mergeTranslationDayGroups([]);
      renderTranslationDayFilter();
      renderTranslationDays();
    } else {
      list.innerHTML = `<p class="translation-day-empty">${escapeHtml(error.message || 'Unable to load translation history.')}</p>`;
    }
  }
}

function mergeTranslationDayGroups(groups) {
  const merged = new Map(groups.map((day) => [day.day, { ...day, count: Number(day.count || 0), isMock: false }]));
  for (const item of translationDemoItems) {
    const dayKey = localDateValue(translationDate(item.createdAt));
    const current = merged.get(dayKey) || {
      day: dayKey,
      count: 0,
      latest_at: item.createdAt,
      latest_source: item.sourceText,
      latest_translation: item.translatedText,
      isMock: false,
    };
    current.count += 1;
    if (translationDate(item.createdAt) >= translationDate(current.latest_at)) {
      current.latest_at = item.createdAt;
      current.latest_source = item.sourceText;
      current.latest_translation = item.translatedText;
    }
    current.isMock = true;
    merged.set(dayKey, current);
  }
  return [...merged.values()].sort((left, right) => right.day.localeCompare(left.day));
}

function renderTranslationDayFilter() {
  if (state.translationDate !== 'all' && !state.translationDayGroups.some((day) => day.day === state.translationDate)) {
    state.translationDate = 'all';
  }
  const availableDates = new Set(state.translationDayGroups.map((day) => day.day));
  state.translationSelectedDays = state.translationSelectedDays.filter((day) => availableDates.has(day));
  state.translationDraftSelectedDays = state.translationDraftSelectedDays.filter((day) => availableDates.has(day));
  if (!state.translationCalendarMonth) state.translationCalendarMonth = localDateValue().slice(0, 7);
  const [year, month] = state.translationCalendarMonth.split('-').map(Number);
  const monthSelect = $('#translation-calendar-month');
  const yearSelect = $('#translation-calendar-year');
  const monthNames = Array.from({ length: 12 }, (_, index) => new Date(2020, index, 1).toLocaleDateString('en-US', { month: 'long' }));
  monthSelect.innerHTML = monthNames.map((name, index) => `<option value="${index + 1}">${name}</option>`).join('');

  const currentYear = new Date().getFullYear();
  const yearsInData = state.translationDayGroups.map((day) => Number(day.day.slice(0, 4)));
  const firstYear = Math.min(currentYear - 5, year, ...yearsInData);
  const lastYear = Math.max(currentYear + 1, year, ...yearsInData);
  yearSelect.innerHTML = Array.from({ length: lastYear - firstYear + 1 }, (_, index) => firstYear + index)
    .map((value) => `<option value="${value}">${value}</option>`).join('');
  monthSelect.value = String(month);
  yearSelect.value = String(year);

  const selectedDate = state.translationSelectedDays.length
    ? `${state.translationSelectedDays.length} ${state.translationSelectedDays.length === 1 ? 'day' : 'days'} selected`
    : 'All dates';
  $('#translation-date-trigger').textContent = selectedDate;
  $('#translation-date-trigger').setAttribute('aria-label', `History filter: ${selectedDate}`);
  renderTranslationCalendar();
}

function renderTranslationCalendar() {
  const [year, month] = state.translationCalendarMonth.split('-').map(Number);
  const firstWeekday = new Date(year, month - 1, 1).getDay();
  const daysInMonth = new Date(year, month, 0).getDate();
  const cellCount = Math.ceil((firstWeekday + daysInMonth) / 7) * 7;
  const availableDates = new Set(state.translationDayGroups.map((day) => day.day));
  const cells = [];

  for (let index = 0; index < cellCount; index += 1) {
    const dayNumber = index - firstWeekday + 1;
    if (dayNumber < 1 || dayNumber > daysInMonth) {
      const adjacentDay = dayNumber < 1
        ? new Date(year, month - 1, dayNumber).getDate()
        : new Date(year, month, dayNumber - daysInMonth).getDate();
      cells.push(`<span class="translation-calendar-day is-outside" aria-hidden="true">${adjacentDay}</span>`);
      continue;
    }

    const dateValue = `${year}-${String(month).padStart(2, '0')}-${String(dayNumber).padStart(2, '0')}`;
    const hasData = availableDates.has(dateValue);
    const selected = state.translationDraftSelectedDays.includes(dateValue);
    cells.push(`<button class="translation-calendar-day${hasData ? ' has-data' : ''}${selected ? ' is-selected' : ''}" type="button" data-calendar-day="${dateValue}"${hasData ? '' : ' disabled'} aria-label="${dateValue}${hasData ? ', has saved translations' : ', no saved translations'}" aria-pressed="${selected}">${dayNumber}${selected ? '<span class="translation-calendar-check" aria-hidden="true">✓</span>' : hasData ? '<span></span>' : ''}</button>`);
  }

  $('#translation-calendar-days').innerHTML = cells.join('');
  const selectedCount = state.translationDraftSelectedDays.length;
  $('#translation-calendar-selected-count').textContent = selectedCount ? `${selectedCount} selected` : 'All dates';
}

function setTranslationCalendarOpen(isOpen) {
  state.translationDraftSelectedDays = [...state.translationSelectedDays];
  $('#translation-calendar').hidden = !isOpen;
  $('#translation-date-trigger').setAttribute('aria-expanded', String(isOpen));
  if (isOpen) renderTranslationCalendar();
}

function setTranslationHistoryOpen(isOpen) {
  const panel = $('#translation-history-panel');
  const backdrop = $('#translation-history-backdrop');
  const toggle = $('#translation-history-toggle');
  panel.hidden = !isOpen;
  backdrop.hidden = !isOpen;
  toggle.setAttribute('aria-expanded', String(isOpen));
  document.body.style.overflow = isOpen ? 'hidden' : '';
  if (isOpen) loadTranslationDays();
}

async function loadTranslationHistory() {
  const dateValue = state.translationDate !== 'all' ? state.translationDate : localDateValue();
  state.translationDate = dateValue;
  const requestId = ++state.translationRequestId;
  const { from, to } = localDateRange(dateValue);
  const list = $('#translation-list');
  list.innerHTML = '<div class="translation-empty c-surface">Loading saved translations…</div>';
  try {
    const params = new URLSearchParams({ from, to, limit: '500' });
    const response = await fetch(`/api/translations?${params}`);
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.error || 'Unable to load translation history.');
    if (requestId !== state.translationRequestId) return;
    state.translationItems = includeTranslationDemos(Array.isArray(payload.items) ? payload.items : [], dateValue);
    renderTranslationHistory();
    if (!$('#translation-history-panel').hidden) loadTranslationDays();
  } catch (error) {
    if (requestId !== state.translationRequestId) return;
    if (translationDemoItems.length) {
      state.translationItems = translationDemoItems.filter((item) => localDateValue(translationDate(item.createdAt)) === dateValue);
      renderTranslationHistory();
    } else {
      state.translationItems = [];
      list.innerHTML = `<div class="translation-empty c-surface">${escapeHtml(error.message || 'Unable to load translation history.')}</div>`;
      $('#translation-count').textContent = '';
    }
  }
}

async function loadAllTranslationHistory({ reset = true } = {}) {
  if (!reset && (state.translationLoadingOlder || !state.translationHasMore || state.translationHistoryMode)) return;
  const requestId = reset ? ++state.translationRequestId : state.translationRequestId;
  const preserveScroll = reset ? null : { top: $('#translation-list').scrollTop };
  if (reset) {
    state.translationItems = [];
    state.translationNextCursor = null;
    state.translationHasMore = false;
    state.translationLoadingOlder = false;
    renderTranslationHistory();
  } else {
    state.translationLoadingOlder = true;
  }

  try {
    const params = new URLSearchParams({ limit: '30' });
    if (state.translationNextCursor) {
      params.set('before', state.translationNextCursor.createdAt);
      params.set('beforeId', state.translationNextCursor.id);
    }
    const response = await fetch(`/api/translations?${params}`);
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.error || 'Unable to load translation history.');
    if (requestId !== state.translationRequestId) return;

    const incoming = Array.isArray(payload.items) ? payload.items : [];
    const merged = new Map(state.translationItems.map((item) => [item.id, item]));
    incoming.forEach((item) => merged.set(item.id, item));
    state.translationItems = includeTranslationDemos([...merged.values()]);
    state.translationHasMore = Boolean(payload.hasMore);
    state.translationNextCursor = payload.nextCursor || null;
    renderTranslationHistory({ scrollToBottom: reset, preserveScroll });
  } catch (error) {
    if (requestId !== state.translationRequestId) return;
    if (translationDemoItems.length && reset) {
      state.translationItems = [...translationDemoItems];
      state.translationHasMore = false;
      state.translationNextCursor = null;
      renderTranslationHistory();
    } else if (reset) {
      $('#translation-list').innerHTML = `<div class="translation-empty c-surface">${escapeHtml(error.message || 'Unable to load translation history.')}</div>`;
      $('#translation-count').textContent = '';
    }
  } finally {
    if (requestId === state.translationRequestId) state.translationLoadingOlder = false;
  }
}

async function generateTranslation(event) {
  event.preventDefault();
  const sourceInput = $('#translation-source');
  const button = $('#translation-generate');
  const sourceText = sourceInput.value.trim();
  if (!sourceText) return;

  button.disabled = true;
  state.translationSearch = '';
  $('#translation-search').value = '';
  state.translationPending = sourceText;
  renderTranslationHistory();
  setTranslationStatus('Translating and saving…');
  sourceInput.disabled = true;
  try {
    const response = await fetch('/api/translations', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ sourceText }),
    });
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.error || 'Unable to translate this sentence.');

    sourceInput.value = '';
    $('#translation-character-count').textContent = '0';
    state.translationPending = '';
    await loadAllTranslationHistory();
    if (!$('#translation-history-panel').hidden) loadTranslationDays();
    setTranslationStatus('Translation saved to your history.', 'success');
  } catch (error) {
    if (translationDemoItems.length) {
      const mockItem = {
        id: `demo-${crypto.randomUUID()}`,
        sourceText,
        translatedText: `Mock English translation for preview: ${sourceText}`,
        createdAt: new Date().toISOString().slice(0, 19).replace('T', ' '),
        isMock: true,
      };
      translationDemoItems.unshift(mockItem);
      state.translationItems = [mockItem, ...state.translationItems];
      state.translationPending = '';
      sourceInput.value = '';
      $('#translation-character-count').textContent = '0';
      renderTranslationHistory();
      if (!$('#translation-history-panel').hidden) loadTranslationDays();
      setTranslationStatus('Development demo only — this sample was not sent to AI or saved to D1.', 'success');
    } else {
      state.translationPending = '';
      await loadAllTranslationHistory();
      if (!$('#translation-history-panel').hidden) loadTranslationDays();
      setTranslationStatus(error.message || 'Something went wrong while translating.', 'error');
    }
  } finally {
    sourceInput.disabled = false;
    button.disabled = false;
  }
}

async function handleTranslationHistoryAction(event) {
  const chatDayButton = event.target.closest('[data-translation-chat-day]');
  if (chatDayButton) {
    state.translationSearch = '';
    $('#translation-search').value = '';
    state.translationDate = chatDayButton.dataset.translationChatDay;
    state.translationCalendarMonth = state.translationDate.slice(0, 7);
    renderTranslationDayFilter();
    setTranslationCalendarOpen(false);
    setTranslationHistoryMode(true);
    setTranslationHistoryOpen(false);
    await loadTranslationHistory();
    return;
  }

  const sourceButton = event.target.closest('[data-copy-source]');
  if (sourceButton) {
    const item = state.translationItems.find((entry) => entry.id === sourceButton.dataset.copySource);
    if (!item) return;
    try {
      await navigator.clipboard.writeText(item.sourceText);
      toast('Vietnamese message copied.');
    } catch {
      toast('Unable to copy this message.');
    }
    return;
  }

  const copyButton = event.target.closest('[data-copy-translation]');
  if (copyButton) {
    const item = state.translationItems.find((entry) => entry.id === copyButton.dataset.copyTranslation);
    if (!item) return;
    try {
      await navigator.clipboard.writeText(item.translatedText);
      toast('English translation copied.');
    } catch {
      toast('Unable to copy this translation.');
    }
    return;
  }

  const speakButton = event.target.closest('[data-speak-translation]');
  if (speakButton) {
    const item = state.translationItems.find((entry) => entry.id === speakButton.dataset.speakTranslation);
    if (!item) return;
    speakEnglish(item.translatedText);
    return;
  }

  const deleteButton = event.target.closest('[data-delete-translation]');
  if (!deleteButton) return;
  deleteButton.disabled = true;
  try {
    const response = await fetch('/api/translations', {
      method: 'DELETE',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ id: deleteButton.dataset.deleteTranslation }),
    });
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.error || 'Unable to delete this translation.');
    state.translationItems = state.translationItems.filter((item) => item.id !== payload.id);
    renderTranslationHistory();
    if (!$('#translation-history-panel').hidden) loadTranslationDays();
    toast('Translation deleted.');
  } catch (error) {
    toast(error.message || 'Unable to delete this translation.');
    deleteButton.disabled = false;
  }
}

function renderCustomVocabulary() {
  const grid = $('#custom-vocabulary-grid');
  if (!grid) return;
  $('#custom-vocabulary-total').textContent = `${state.customVocabulary.length} cards`;
  if (!state.customVocabulary.length) { grid.innerHTML = '<div class="empty-state">You have not added any words yet. Start with one useful word.</div>'; return; }
  grid.innerHTML = state.customVocabulary.map((item) => {
    const date = item.createdAt ? new Date(item.createdAt).toLocaleDateString('en-US') : 'Just added';
    return `<article class="custom-vocab-card c-surface"><img class="custom-vocab-image c-media" src="${escapeHtml(item.imageUrl || PLACEHOLDER_IMAGE)}" alt="Illustration for ${escapeHtml(item.word)}" loading="lazy" onerror="this.onerror=null;this.src='/placeholder-1.png'" /><div class="custom-vocab-content"><span class="category-pill c-pill">${escapeHtml(item.topicName || 'OTHER')}</span><h3>${escapeHtml(item.word)}</h3><p>${escapeHtml(item.definition || '')}</p>${item.example ? `<small>${escapeHtml(item.example)}</small>` : ''}<small>Added ${escapeHtml(date)}</small></div></article>`;
  }).join('');
}

function renderFamilyRootOptions() {
  const datalist = $('#family-root-options');
  if (!datalist) return;
  const roots = uniqueCards(state.allCards)
    .map((card) => card.english)
    .sort((left, right) => left.localeCompare(right));
  datalist.innerHTML = roots.map((word) => `<option value="${escapeHtml(word)}"></option>`).join('');
}

function setAiStatus(message = '', type = '') {
  const element = $('#ai-status');
  element.textContent = message;
  element.className = `ai-status${type ? ` is-${type}` : ''}`;
}

function normalizeLookupWord(value) {
  return String(value || '').trim().toLowerCase().replace(/\s+/g, ' ');
}

async function loadWordIndex() {
  if (state.wordIndex) return state.wordIndex;
  const response = await fetch('/word-index.json', { cache: 'force-cache' });
  if (!response.ok) throw new Error('The vocabulary dictionary could not be loaded.');
  const words = await response.json();
  if (!Array.isArray(words)) throw new Error('The vocabulary dictionary is invalid.');
  state.wordIndex = new Set(words.map(normalizeLookupWord).filter(Boolean));
  return state.wordIndex;
}

function editDistanceWithin(left, right, limit = 2) {
  if (Math.abs(left.length - right.length) > limit) return limit + 1;
  let previous = Array.from({ length: right.length + 1 }, (_, index) => index);
  for (let row = 1; row <= left.length; row += 1) {
    const current = [row];
    let smallest = current[0];
    for (let column = 1; column <= right.length; column += 1) {
      const cost = left[row - 1] === right[column - 1] ? 0 : 1;
      const value = Math.min(
        previous[column] + 1,
        current[column - 1] + 1,
        previous[column - 1] + cost,
      );
      current.push(value);
      smallest = Math.min(smallest, value);
    }
    if (smallest > limit) return limit + 1;
    previous = current;
  }
  return previous[right.length];
}

function findWordSuggestions(input, words) {
  const suggestions = [];
  for (const word of words) {
    if (Math.abs(word.length - input.length) > 2) continue;
    const distance = editDistanceWithin(input, word);
    if (distance <= 2) suggestions.push({ word, distance });
  }
  return suggestions
    .sort((left, right) => left.distance - right.distance || left.word.length - right.word.length || left.word.localeCompare(right.word))
    .slice(0, 5)
    .map((item) => item.word);
}

async function validateAiPrompt(prompt) {
  const dictionary = await loadWordIndex();
  const normalized = normalizeLookupWord(prompt);
  if (dictionary.has(normalized)) return true;
  const suggestions = findWordSuggestions(normalized, dictionary);
  const suggestionText = suggestions.length ? ` Did you mean: ${suggestions.join(', ')}?` : '';
  setAiStatus(`This word was not found in the dictionary.${suggestionText}`, 'error');
  return false;
}

function renderAiDraft(item = state.aiDraft) {
  const preview = $('#ai-draft-preview');
  if (!preview) return;
  state.aiDraft = item;
  preview.hidden = !item;
  if (!item) {
    renderAiRootDraft(null);
    return;
  }
  $('#ai-draft-word').textContent = item.word;
  $('#ai-draft-definition').innerHTML = formatDefinition(item.definition);
  $('#ai-draft-pronunciation').textContent = item.pronunciation || 'Pronunciation not provided';
  $('#ai-draft-topic').textContent = item.topic || 'other';
  $('#ai-draft-family').textContent = item.isFamilyRoot
    ? `Family root card: ${item.word}`
    : item.familyRoot
      ? `Family root: ${item.familyRoot}`
      : item.rootSuggestion
        ? `Root suggestion: ${item.rootSuggestion} (add the root card first to link it)`
        : 'No confident root suggestion';
  $('#ai-draft-example').textContent = `“${item.example}”`;
  const actions = $('#ai-family-actions');
  const status = $('#ai-family-status');
  const createRoot = $('#ai-create-root');
  const saveRootWord = $('#ai-save-root-word');
  const needsRootDraft = Boolean(item.rootSuggestion && !item.familyRoot && item.rootSuggestion.toLowerCase() !== item.word.toLowerCase());
  actions.hidden = !needsRootDraft && !item.familyRoot && !state.aiRootDraft;
  createRoot.hidden = !needsRootDraft || Boolean(state.aiRootDraft);
  saveRootWord.hidden = !state.aiRootDraft;
  status.textContent = item.familyRoot
    ? `Existing root found: ${item.familyRoot}. Apply this draft, then save the vocabulary item.`
    : state.aiRootDraft
      ? `Review the complete root draft, then save ${state.aiRootDraft.word} as a root word.`
      : needsRootDraft
        ? `Root card “${item.rootSuggestion}” is not in your vocabulary yet.`
        : '';
}

function renderAiRootDraft(item = state.aiRootDraft) {
  const preview = $('#ai-root-draft');
  if (!preview) return;
  state.aiRootDraft = item;
  preview.hidden = !item;
  if (!item) return;
  $('#ai-root-draft-word').textContent = item.word;
  $('#ai-root-draft-definition').innerHTML = formatDefinition(item.definition);
  $('#ai-root-draft-pronunciation').textContent = item.pronunciation || 'Pronunciation not provided';
  $('#ai-root-draft-topic').textContent = item.topic || 'other';
  $('#ai-root-draft-example').textContent = `“${item.example}”`;
}

async function generateAiRootDraft() {
  const rootWord = state.aiDraft?.rootSuggestion;
  const button = $('#ai-create-root');
  if (!rootWord || !button) return;
  button.disabled = true;
  setAiStatus(`Generating the root card “${rootWord}”…`);
  try {
    const response = await fetch('/api/ai/vocabulary', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ prompt: rootWord }),
    });
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.error || 'Unable to generate the root card.');
    renderAiRootDraft(payload.item);
    renderAiDraft(state.aiDraft);
    setAiStatus('Root draft ready. Review it, then save the root word.', 'success');
  } catch (error) {
    setAiStatus(error.message || 'Unable to generate the root card.', 'error');
  } finally {
    button.disabled = false;
  }
}

async function saveAiRootWord() {
  const root = state.aiRootDraft;
  const button = $('#ai-save-root-word');
  if (!root || !button) {
    setAiStatus('Generate the root card before saving it.', 'error');
    return;
  }
  button.disabled = true;
  setAiStatus(`Saving root word “${root.word}”…`);
  try {
    const formData = new FormData();
    formData.append('word', root.word || '');
    formData.append('definition', root.definition || '');
    formData.append('pronunciation', root.pronunciation || '');
    formData.append('topic', root.topic || 'other');
    formData.append('example', root.examples?.length ? root.examples.join('\n') : root.example || '');
    formData.append('isFamilyRoot', 'true');
    const response = await fetch('/api/vocabulary', { method: 'POST', body: formData });
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.error || 'Unable to save the root word.');
    state.aiDraft.familyRoot = payload.item.word || root.word;
    state.aiDraft.rootSuggestion = '';
    state.aiRootDraft = null;
    renderAiRootDraft(null);
    renderAiDraft(state.aiDraft);
    setAiStatus(`Root word “${state.aiDraft.familyRoot}” saved. Apply the vocabulary draft and save it next.`, 'success');
    await loadCustomVocabulary();
  } catch (error) {
    setAiStatus(error.message || 'Unable to save the root word.', 'error');
  } finally {
    button.disabled = false;
  }
}

async function generateAiDraft(event) {
  event.preventDefault();
  const button = $('#generate-ai-vocabulary');
  const prompt = $('#ai-word-prompt').value.trim();
  if (!prompt) return;
  button.disabled = true;
  setAiStatus('Checking the dictionary…');
  try {
    renderAiDraft(null);
    if (!(await validateAiPrompt(prompt))) return;
    setAiStatus('Generating a vocabulary draft…');
    const response = await fetch('/api/ai/vocabulary', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ prompt }),
    });
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.error || 'Unable to generate the vocabulary draft.');
    state.aiRootDraft = null;
    renderAiRootDraft(null);
    renderAiDraft(payload.item);
    setAiStatus('Draft ready. Review it, then use it in the vocabulary form.', 'success');
  } catch (error) {
    renderAiDraft(null);
    setAiStatus(error.message || 'Something went wrong while contacting the AI.', 'error');
  } finally {
    button.disabled = false;
  }
}

function applyAiDraft() {
  if (!state.aiDraft) return;
  const draft = state.aiDraft;
  $('#vocab-word').value = draft.word || '';
  $('#vocab-definition').value = draft.definition || '';
  $('#vocab-pronunciation').value = draft.pronunciation || '';
  $('#vocab-topic').value = draft.topic || 'other';
  $('#vocab-family-root').value = draft.familyRoot || '';
  $('#vocab-is-family-root').checked = Boolean(draft.isFamilyRoot);
  $('#vocab-example').value = formatExampleSentences(draft.examples?.length ? draft.examples : draft.example);
  setFormStatus('AI draft copied into the form. Review it and save the card.', 'success');
  $('#vocab-word').focus();
}

function setVocabularyFormMode(editing = false) {
  const button = $('#save-vocabulary');
  const image = $('#vocab-image');
  const imageRequired = $('#vocab-image-required');
  if (button) button.innerHTML = editing ? 'Update vocabulary <span>&rarr;</span>' : 'Save vocabulary <span>&rarr;</span>';
  if (image) image.required = false;
  if (imageRequired) imageRequired.textContent = '(optional)';
}

function prepareNewVocabulary() {
  state.editingVocabulary = null;
  const form = $('#vocabulary-form');
  if (form) form.reset();
  resetImagePreview();
  setVocabularyFormMode(false);
  setFormStatus('');
  renderAiDraft(null);
}

function startEditingVocabulary(card) {
  if (!card?.english) return;
  showView('add');
  state.editingVocabulary = { ...card, isStaticEdit: !card.id };
  $('#vocab-word').value = card.english || '';
  $('#vocab-definition').value = card.definition || '';
  $('#vocab-pronunciation').value = card.pronunciation || '';
  $('#vocab-topic').value = card.topic || 'other';
  $('#vocab-family-root').value = card.familyId || '';
  $('#vocab-is-family-root').checked = Boolean(card.isFamilyRoot);
  $('#vocab-example').value = formatExampleSentences(cardExamples(card));
  resetImagePreview();
  setVocabularyFormMode(true);
  renderAiDraft(null);
  setFormStatus(`Editing ${card.english}. Save to create your personal version of this card.`, 'success');
  $('#vocab-word').focus();
}

function renderAll() {
  renderLibrary();
  renderFamilyRootOptions();
}

function setFormStatus(message = '', type = '') {
  const element = $('#form-status');
  element.textContent = message;
  element.className = `form-status${type ? ` is-${type}` : ''}`;
}

function resetImagePreview() {
  const input = $('#vocab-image');
  const preview = $('#image-preview');
  const name = $('#image-preview-name');
  input.value = '';
  preview.hidden = true;
  $('#image-preview-img').removeAttribute('src');
  name.textContent = '';
  name.removeAttribute('title');
}

function getDisplayFileName(fileName, maxLength = 28) {
  if (fileName.length <= maxLength) return fileName;
  const extensionStart = fileName.lastIndexOf('.');
  const extension = extensionStart > 0 ? fileName.slice(extensionStart) : '';
  const base = extensionStart > 0 ? fileName.slice(0, extensionStart) : fileName;
  const availableBaseLength = Math.max(8, maxLength - extension.length - 3);
  return `${base.slice(0, availableBaseLength)}...${extension}`;
}

function previewImage(file) {
  if (!file) return resetImagePreview();
  const name = $('#image-preview-name');
  $('#image-preview-img').src = URL.createObjectURL(file);
  name.textContent = `${getDisplayFileName(file.name)} · ${(file.size / 1024 / 1024).toFixed(2)}MB`;
  name.title = file.name;
  $('#image-preview').hidden = false;
}

async function submitVocabulary(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const button = $('#save-vocabulary');
  const file = $('#vocab-image').files[0];
  const isEditing = Boolean(state.editingVocabulary);
  const isPersistedEdit = Boolean(state.editingVocabulary?.id);
  if (file && file.size > 5 * 1024 * 1024) return setFormStatus('The image must be smaller than 5MB.', 'error');
  button.disabled = true;
  setFormStatus(isEditing ? 'Updating the vocabulary...' : (file ? 'Uploading the image and saving the vocabulary...' : 'Saving the vocabulary with the fallback image...'));
  try {
    const formData = new FormData(form);
    if (isPersistedEdit) formData.append('id', state.editingVocabulary.id);
    if (isEditing) {
      formData.append('replaceExisting', 'true');
      formData.append('existingWord', state.editingVocabulary.english || '');
    }
    const response = await fetch('/api/vocabulary', { method: isPersistedEdit ? 'PUT' : 'POST', body: formData });
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.error || (isEditing ? 'Unable to update the vocabulary.' : 'Unable to save the vocabulary.'));
    form.reset();
    resetImagePreview();
    renderAiDraft(null);
    state.editingVocabulary = null;
    setVocabularyFormMode(false);
    setFormStatus(isEditing ? 'Vocabulary updated successfully.' : 'New vocabulary saved successfully.', 'success');
    await loadCustomVocabulary();
  } catch (error) {
    setFormStatus(error.message || 'Something went wrong. Please try again.', 'error');
  } finally {
    button.disabled = false;
  }
}

function showView(viewName, { syncHistory = true } = {}) {
  if (viewName === 'stats') viewName = 'translate';
  if (state.selectedCard) closeVocabularyDetail();
  setChatSessionsOpen(false);
  if (syncHistory) setAppRoute(viewName, null, true);
  $$('.view').forEach((view) => view.classList.toggle('is-visible', view.id === `view-${viewName}`));
  $$('.nav-item').forEach((button) => button.classList.toggle('is-active', button.dataset.view === viewName));
  if (viewName === 'library') renderLibrary();
  if (viewName === 'translate') {
    if (state.translationHistoryMode) {
      loadTranslationHistory();
    } else if (state.translationItems.length) {
      const messages = $('#translation-list');
      messages.scrollTop = messages.scrollHeight;
    } else {
      loadAllTranslationHistory();
    }
  }
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function escapeHtml(value) {
  return String(value).replace(/[&<>'"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#039;', '"': '&quot;' }[char]));
}

function formatDefinition(value) {
  const labels = 'Noun|Verb|Adjective|Adverb|Pronoun|Preposition|Conjunction|Interjection|Determiner|Phrase|Phrasal verb';
  const lines = String(value || '')
    .replace(/\r\n/g, '\n')
    .replace(new RegExp(`\\s+(?=(${labels}):)`, 'gi'), '\n')
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean);

  return lines.map((line) => {
    const match = line.match(new RegExp(`^(${labels}):\\s*(.*)$`, 'i'));
    if (!match) return `<span class="definition-line">${escapeHtml(line)}</span>`;
    return `<span class="definition-line"><strong>${escapeHtml(match[1])}:</strong> ${escapeHtml(match[2])}</span>`;
  }).join('');
}

function speakWord(word) {
  speakEnglish(word, { rate: .86 });
}

let toastTimer;
function toast(message) {
  const element = $('#toast');
  element.textContent = message;
  element.classList.add('is-visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => element.classList.remove('is-visible'), 2600);
}

function toggleCardFavorite(card) {
  const key = cardKey(card);
  const found = state.favorites.indexOf(key);
  if (found >= 0) state.favorites.splice(found, 1);
  else state.favorites.push(key);
  localStorage.setItem('englishCardsFavorites', JSON.stringify(state.favorites));
  renderVocabularyDetail(card);
  renderLibrary();
}

function initEvents() {
  $$('.nav-item').forEach((button) => button.addEventListener('click', () => {
    if (button.dataset.view === 'add') prepareNewVocabulary();
    showView(button.dataset.view);
  }));
  $('#ai-vocabulary-form').addEventListener('submit', generateAiDraft);
  $('#translation-form').addEventListener('submit', generateTranslation);
  $('#translation-source').addEventListener('input', (event) => {
    $('#translation-character-count').textContent = event.target.value.length.toLocaleString('en-US');
  });
  $('#translation-date-trigger').addEventListener('click', () => {
    setTranslationCalendarOpen($('#translation-calendar').hidden);
  });
  $('#translation-calendar-all').addEventListener('click', () => {
    state.translationDraftSelectedDays = [];
    renderTranslationCalendar();
  });
  $('#translation-calendar').addEventListener('click', (event) => {
    // Day clicks rerender the grid, detaching the original target before the
    // document-level outside-click handler runs. Keep calendar clicks inside.
    event.stopPropagation();
    const dayButton = event.target.closest('[data-calendar-day]');
    if (dayButton) {
      const selectedDays = new Set(state.translationDraftSelectedDays);
      if (selectedDays.has(dayButton.dataset.calendarDay)) selectedDays.delete(dayButton.dataset.calendarDay);
      else selectedDays.add(dayButton.dataset.calendarDay);
      state.translationDraftSelectedDays = [...selectedDays].sort();
      renderTranslationCalendar();
      return;
    }
    const stepButton = event.target.closest('[data-calendar-step]');
    if (!stepButton) return;
    const [year, month] = state.translationCalendarMonth.split('-').map(Number);
    const nextMonth = new Date(year, month - 1 + Number(stepButton.dataset.calendarStep), 1);
    state.translationCalendarMonth = `${nextMonth.getFullYear()}-${String(nextMonth.getMonth() + 1).padStart(2, '0')}`;
    renderTranslationDayFilter();
  });
  const updateCalendarMonth = () => {
    state.translationCalendarMonth = `${$('#translation-calendar-year').value}-${String($('#translation-calendar-month').value).padStart(2, '0')}`;
    renderTranslationCalendar();
  };
  $('#translation-calendar-month').addEventListener('change', updateCalendarMonth);
  $('#translation-calendar-year').addEventListener('change', updateCalendarMonth);
  $('#translation-calendar-cancel').addEventListener('click', () => setTranslationCalendarOpen(false));
  $('#translation-calendar-apply').addEventListener('click', () => {
    state.translationSelectedDays = [...state.translationDraftSelectedDays];
    renderTranslationDayFilter();
    renderTranslationDays();
    setTranslationCalendarOpen(false);
  });
  $('#translation-new').addEventListener('click', async () => {
    setTranslationHistoryMode(false);
    state.translationDate = 'all';
    state.translationSelectedDays = [];
    state.translationDraftSelectedDays = [];
    state.translationCalendarMonth = localDateValue().slice(0, 7);
    state.translationSearch = '';
    $('#translation-search').value = '';
    renderTranslationDayFilter();
    setTranslationStatus('');
    await loadAllTranslationHistory();
    $('#translation-source').focus();
  });
  $('#translation-history-toggle').addEventListener('click', () => {
    setTranslationHistoryOpen($('#translation-history-panel').hidden);
  });
  $('#translation-voice-toggle').addEventListener('click', () => {
    const panel = $('#translation-voice-panel');
    const isOpening = panel.hidden;
    panel.hidden = !isOpening;
    $('#translation-voice-toggle').setAttribute('aria-expanded', String(isOpening));
    if (isOpening) refreshUsVoiceOptions();
  });
  $('#translation-voice-select').addEventListener('change', (event) => {
    if (event.target.value) localStorage.setItem(US_VOICE_STORAGE_KEY, event.target.value);
    else localStorage.removeItem(US_VOICE_STORAGE_KEY);
  });
  $('#translation-voice-preview').addEventListener('click', () => {
    speakEnglish('This is a sample of the selected US English voice.');
  });
  $('#translation-history-close').addEventListener('click', () => setTranslationHistoryOpen(false));
  $('#translation-history-backdrop').addEventListener('click', () => setTranslationHistoryOpen(false));
  $('#translation-search').addEventListener('input', (event) => {
    state.translationSearch = event.target.value;
    renderTranslationHistory();
    renderTranslationDays();
  });
  $('#translation-list').addEventListener('click', handleTranslationHistoryAction);
  $('#translation-list').addEventListener('scroll', () => {
    if (state.translationListScrollFrame) cancelAnimationFrame(state.translationListScrollFrame);
    state.translationListScrollFrame = requestAnimationFrame(() => {
      const list = $('#translation-list');
      if (!state.translationHistoryMode && list.scrollTop < 80) loadAllTranslationHistory({ reset: false });
    });
  }, { passive: true });
  $('#translation-day-list').addEventListener('click', handleTranslationHistoryAction);
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && !$('#translation-calendar').hidden) {
      setTranslationCalendarOpen(false);
      return;
    }
    if (event.key === 'Escape' && !$('#translation-history-panel').hidden) setTranslationHistoryOpen(false);
  });
  document.addEventListener('click', (event) => {
    if (!event.target.closest('.translation-voice-menu')) {
      $('#translation-voice-panel').hidden = true;
      $('#translation-voice-toggle').setAttribute('aria-expanded', 'false');
    }
    if (!event.target.closest('.translation-date-filter') && !$('#translation-calendar').hidden) {
      setTranslationCalendarOpen(false);
    }
  });
  $('#ai-apply-draft').addEventListener('click', applyAiDraft);
  $$('.filter-chip').forEach((button) => button.addEventListener('click', () => {
    state.libraryTopic = button.dataset.libraryTopic;
    state.searchQuery = '';
    $('#search-input').value = '';
    $$('.filter-chip').forEach((chip) => chip.classList.toggle('is-active', chip === button));
    renderLibrary();
  }));
  $('#library-sort').addEventListener('change', (event) => {
    state.librarySort = event.target.value;
    if (state.librarySort === 'random' && !state.libraryRandomOrder.length) state.libraryRandomOrder = shuffledCards(state.allCards).map(libraryCardId);
    renderLibrary();
  });
  $('#library-shuffle').addEventListener('click', shuffleLibrary);
  $('#detail-back').addEventListener('click', () => {
    if (window.history.state?.app === 'english-cards' && window.history.state.card) window.history.back();
    else showView('library');
  });
  $('#detail-speak').addEventListener('click', () => { if (state.selectedCard) speakWord(state.selectedCard.english); });
  $('#detail-favorite').addEventListener('click', () => { if (state.selectedCard) toggleCardFavorite(state.selectedCard); });
  $('#detail-edit').addEventListener('click', () => { if (state.selectedCard) startEditingVocabulary(state.selectedCard); });
  $('#search-input').addEventListener('input', (event) => {
    state.searchQuery = event.target.value.trim().toLowerCase();
    state.libraryTopic = 'all';
    showView('library');
    $$('.filter-chip').forEach((chip) => chip.classList.toggle('is-active', chip.dataset.libraryTopic === 'all'));
    renderLibrary();
  });
  $('#vocabulary-form').addEventListener('submit', submitVocabulary);
  $('#vocab-image').addEventListener('change', (event) => previewImage(event.target.files[0]));
  $('#clear-image').addEventListener('click', resetImagePreview);
  $('#ai-create-root').addEventListener('click', generateAiRootDraft);
  $('#ai-save-root-word').addEventListener('click', saveAiRootWord);
}

async function init() {
  renderApp(document.querySelector('#app'));
  createIcons({ icons: { Library, Languages, BookPlus, MessageSquareText, Send, PanelLeft, Volume2 } });
  state.translationDate = 'all';
  state.translationSelectedDays = [];
  state.translationDraftSelectedDays = [];
  state.translationCalendarMonth = localDateValue().slice(0, 7);
  renderTranslationDayFilter();
  setTranslationHistoryMode(false);
  $('#translation-source').addEventListener('keydown', (event) => {
    if (event.key === 'Enter' && !event.shiftKey && !event.isComposing) {
      event.preventDefault();
      $('#translation-form').requestSubmit();
    }
  });
  initEvents();
  refreshUsVoiceOptions();
  if ('speechSynthesis' in window) window.speechSynthesis.addEventListener('voiceschanged', refreshUsVoiceOptions);
  renderAll();
  await loadCustomVocabulary();
  initHistory();
  renderAiChat();
  loadChatSessions();
}

function exampleList(value) {
  const values = Array.isArray(value) ? value : String(value || '').split(/\r?\n/);
  return values
    .flatMap((item) => String(item || '').split(/\r?\n/))
    .map((item) => item.replace(/^\s*(?:[-*]|\d+[.)])\s*/, '').trim())
    .filter(Boolean);
}

function cardExamples(card) {
  return exampleList(card.examples?.length ? card.examples : card.example);
}

function formatExampleSentences(value) {
  return exampleList(value).map((sentence, index) => `${index + 1}. ${sentence}`).join('\n');
}

function setAiChatStatus(message = '', type = '') {
  if (message && type === 'error') toast(message);
}

function setChatSessionsOpen(isOpen) {
  const panel = document.querySelector('.chat-sessions');
  const toggle = document.querySelector('#chat-sessions-toggle');
  if (!panel || !toggle) return;
  panel.classList.toggle('is-open', isOpen);
  toggle.setAttribute('aria-expanded', String(isOpen));
}

function renderAiChat() {
  const messages = document.querySelector('#ai-chat-messages');
  if (!messages) return;
  const history = Array.isArray(state.aiChatMessages) ? state.aiChatMessages : [];
  messages.innerHTML = history.length
    ? history.map((message) => `<div class="ai-chat-message ai-chat-message-${message.role}">${escapeHtml(message.content)}</div>`).join('')
    : '<div class="ai-chat-message ai-chat-message-assistant">Hi! Ask me anything about English vocabulary, grammar, pronunciation, or natural usage.</div>';
  messages.scrollTop = messages.scrollHeight;
}

function renderChatSessions() {
  const list = document.querySelector('#chat-session-list');
  if (!list) return;
  list.innerHTML = state.chatSessions.length
    ? state.chatSessions.map((session) => `<div class="chat-session-item ${session.id === state.activeChatSessionId ? 'is-active' : ''}"><button class="chat-session-title" type="button" data-session-id="${escapeHtml(session.id)}">${escapeHtml(session.title || 'New chat')}</button><button class="chat-session-delete" type="button" data-delete-session-id="${escapeHtml(session.id)}" aria-label="Delete ${escapeHtml(session.title || 'chat')}">&times;</button></div>`).join('')
    : '<p class="chat-session-empty">No chats yet.</p>';
}

async function loadChatSessions() {
  try {
    const response = await fetch('/api/ai/chat');
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.error || 'Unable to load chat sessions.');
    state.chatSessions = Array.isArray(payload.sessions) ? payload.sessions : [];
    renderChatSessions();
    if (!state.chatSessions.length) return createChatSession();
    const active = state.chatSessions.find((session) => session.id === state.activeChatSessionId) || state.chatSessions[0];
    return loadChatSession(active.id);
  } catch (error) {
    setAiChatStatus(error.message || 'Unable to load chat sessions.', 'error');
  }
}

async function createChatSession() {
  try {
    const response = await fetch('/api/ai/chat', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ action: 'create' }) });
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.error || 'Unable to create a chat session.');
    state.chatSessions = [payload.session, ...state.chatSessions.filter((session) => session.id !== payload.session.id)];
    state.activeChatSessionId = payload.session.id;
    state.aiChatMessages = [];
    renderChatSessions();
    renderAiChat();
    setAiChatStatus('');
    document.querySelector('#ai-chat-input')?.focus();
  } catch (error) {
    setAiChatStatus(error.message || 'Unable to create a chat session.', 'error');
  }
}

async function loadChatSession(sessionId) {
  if (!sessionId) return;
  try {
    const response = await fetch(`/api/ai/chat?sessionId=${encodeURIComponent(sessionId)}`);
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.error || 'Unable to load this chat.');
    state.activeChatSessionId = payload.session.id;
    state.aiChatMessages = Array.isArray(payload.messages) ? payload.messages : [];
    renderChatSessions();
    renderAiChat();
    setAiChatStatus('');
  } catch (error) {
    setAiChatStatus(error.message || 'Unable to load this chat.', 'error');
  }
}

async function deleteChatSession(sessionId) {
  const response = await fetch('/api/ai/chat', { method: 'DELETE', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ sessionId }) });
  const payload = await response.json();
  if (!response.ok) throw new Error(payload.error || 'Unable to delete this chat.');
  state.chatSessions = state.chatSessions.filter((session) => session.id !== sessionId);
  if (state.activeChatSessionId === sessionId) {
    state.activeChatSessionId = null;
    state.aiChatMessages = [];
    renderAiChat();
    if (state.chatSessions.length) await loadChatSession(state.chatSessions[0].id);
    else await createChatSession();
  }
  renderChatSessions();
}

async function submitAiChat(event) {
  event.preventDefault();
  const input = document.querySelector('#ai-chat-input');
  const button = document.querySelector('#ai-chat-submit');
  const content = input.value.trim();
  if (!content || button.disabled) return;
  state.aiChatMessages.push({ role: 'user', content });
  renderAiChat();
  input.value = '';
  button.disabled = true;
  setAiChatStatus('Thinking...');
  try {
    const response = await fetch('/api/ai/chat', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ sessionId: state.activeChatSessionId, message: content }),
    });
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.error || 'Unable to contact the AI assistant.');
    state.aiChatMessages.push(payload.message || { role: 'assistant', content: 'The AI returned an empty answer.' });
    if (payload.session) {
      state.activeChatSessionId = payload.session.id;
      state.chatSessions = [payload.session, ...state.chatSessions.filter((session) => session.id !== payload.session.id)];
      renderChatSessions();
    }
    renderAiChat();
    const context = payload.context;
    if (context) {
      const comparison = context.duplicateMessages || context.trimmedMessages
        ? ` · compared ${context.duplicateMessages || 0} duplicate, trimmed ${context.trimmedMessages || 0}`
        : ' · compared';
      const contextElement = document.querySelector('#ai-chat-context');
      if (contextElement) contextElement.textContent = `Context: ${context.estimatedTokens.toLocaleString('en-US')} / ${context.maxTokens.toLocaleString('en-US')} tokens${comparison}`;
      if (contextElement && context.summaryUpdated) contextElement.textContent = `Context: ${context.estimatedTokens.toLocaleString('en-US')} / ${context.maxTokens.toLocaleString('en-US')} tokens · summarized ${context.summarizedMessages || 0} older messages`;
      else if (contextElement && context.summaryUsed) contextElement.textContent = `Context: ${context.estimatedTokens.toLocaleString('en-US')} / ${context.maxTokens.toLocaleString('en-US')} tokens · using saved summary`;
    }
    setAiChatStatus('');
  } catch (error) {
    setAiChatStatus(error.message || 'Something went wrong while contacting the AI.', 'error');
  } finally {
    button.disabled = false;
    input.focus();
  }
}

document.addEventListener('submit', (event) => {
  if (event.target.id === 'ai-chat-form') submitAiChat(event);
});
document.addEventListener('click', (event) => {
  const sessionsToggle = event.target.closest('#chat-sessions-toggle');
  if (sessionsToggle) {
    const panel = document.querySelector('.chat-sessions');
    setChatSessionsOpen(!panel?.classList.contains('is-open'));
    return;
  }
  const sessionButton = event.target.closest('[data-session-id]');
  if (sessionButton) {
    setChatSessionsOpen(false);
    loadChatSession(sessionButton.dataset.sessionId);
  }
  const deleteButton = event.target.closest('[data-delete-session-id]');
  if (deleteButton) {
    event.stopPropagation();
    deleteChatSession(deleteButton.dataset.deleteSessionId).catch((error) => setAiChatStatus(error.message, 'error'));
  }
  if (event.target.closest('#new-chat')) {
    setChatSessionsOpen(false);
    createChatSession();
  }
});

init();
