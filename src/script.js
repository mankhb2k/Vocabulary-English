import { renderApp } from './components/app.js';

const fallbackCards = [
  { english: 'resilient', definition: 'Able to recover quickly from difficulties.', notes: 'Often used to describe a person, team, or system that adapts well to problems.', topic: 'work', category: 'CORE VOCABULARY', pronunciation: '/rɪˈzɪliənt/', example: 'She is resilient and never gives up.' },
  { english: 'curious', definition: 'Wanting to know or learn something.', notes: 'A positive word for someone who enjoys discovering new ideas.', topic: 'greetings', category: 'CORE VOCABULARY', pronunciation: '/ˈkjʊəriəs/', example: 'He is curious about how the machine works.' },
  { english: 'consistent', definition: 'Doing something in the same reliable way over time.', notes: 'Useful when talking about habits, effort, or quality.', topic: 'work', category: 'CORE VOCABULARY', pronunciation: '/kənˈsɪstənt/', example: 'Consistent practice leads to steady progress.' },
  { english: 'adapt', definition: 'To change your behaviour or methods to suit a new situation.', notes: 'A useful verb for change, learning, and problem-solving.', topic: 'work', category: 'CORE VOCABULARY', pronunciation: '/əˈdæpt/', example: 'Good learners adapt when a strategy does not work.' },
  { english: 'confident', definition: 'Feeling sure about your abilities or decisions.', notes: 'Commonly used for skills, communication, and performance.', topic: 'greetings', category: 'CORE VOCABULARY', pronunciation: '/ˈkɒnfɪdənt/', example: 'She feels more confident after practising every day.' },
  { english: 'patient', definition: 'Able to wait or deal with difficulties without becoming upset.', notes: 'This adjective can describe a person, attitude, or approach.', topic: 'greetings', category: 'CORE VOCABULARY', pronunciation: '/ˈpeɪʃənt/', example: 'Be patient with yourself while you learn.' },
  { english: 'improve', definition: 'To become better or make something better.', notes: 'A common verb for progress, skills, and performance.', topic: 'work', category: 'CORE VOCABULARY', pronunciation: '/ɪmˈpruːv/', example: 'Reading regularly can improve your vocabulary.' },
  { english: 'unwind', definition: 'To relax after a period of work or activity.', notes: 'Often used when talking about relaxing in the evening or at the weekend.', topic: 'travel', category: 'CORE VOCABULARY', pronunciation: '/ʌnˈwaɪnd/', example: 'I like to unwind with a short walk after work.' },
];

const wordFamilyExamples = [
  { english: 'help', definition: 'To make it easier for someone to do something.', notes: 'The base word in this family.', topic: 'other', category: 'WORD FAMILY', pronunciation: '/help/', example: 'Can you help me with this task?', familyId: 'help' },
  { english: 'helpful', definition: 'Useful or able to provide help.', notes: 'The suffix -ful means “full of” or “providing”.', topic: 'other', category: 'WORD FAMILY', pronunciation: '/ˈhelpfəl/', example: 'The instructions were very helpful.', familyId: 'help', relationType: 'suffix', affix: '-ful' },
  { english: 'helpless', definition: 'Unable to help yourself or control a situation.', notes: 'The suffix -less means “without”.', topic: 'other', category: 'WORD FAMILY', pronunciation: '/ˈhelpləs/', example: 'He felt helpless during the emergency.', familyId: 'help', relationType: 'suffix', affix: '-less' },
  { english: 'helper', definition: 'A person who helps someone.', notes: 'The suffix -er can describe a person who does an action.', topic: 'other', category: 'WORD FAMILY', pronunciation: '/ˈhelpər/', example: 'She works as a classroom helper.', familyId: 'help', relationType: 'suffix', affix: '-er' },
  { english: 'helpfully', definition: 'In a way that provides useful help.', notes: 'The suffix -ly forms an adverb.', topic: 'other', category: 'WORD FAMILY', pronunciation: '/ˈhelpfəli/', example: 'He helpfully explained the next steps.', familyId: 'help', relationType: 'suffix', affix: '-fully' },
  { english: 'unhelpful', definition: 'Not useful or not providing the help that is needed.', notes: 'The prefix un- often gives a word the opposite meaning.', topic: 'other', category: 'WORD FAMILY', pronunciation: '/ʌnˈhelpfəl/', example: 'The reply was vague and unhelpful.', familyId: 'help', relationType: 'prefix', affix: 'un-' },
];

const state = {
  allCards: [...fallbackCards, ...wordFamilyExamples],
  reviewed: Number(localStorage.getItem('englishCardsReviewed') || 3),
  favorites: JSON.parse(localStorage.getItem('englishCardsFavorites') || '[]'),
  customVocabulary: [],
  libraryTopic: 'all',
  searchQuery: '',
  selectedCard: null,
};

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const PLACEHOLDER_IMAGE = '/api/vocabulary-image?key=placeholder-1.png';

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
  const staticCards = state.allCards.filter((card) => !card.isCustom);
  state.allCards = uniqueCards([...staticCards, ...state.customVocabulary.map(customVocabularyCard)]);
  renderAll();
}

async function loadDataset() {
  // The old chunk dataset contains sentences and phrases, so it is intentionally
  // not loaded into the vocabulary-only Library. Entries come from vocabulary
  // cards, word-family data, and the user's D1 records instead.
}

async function loadCustomVocabulary() {
  try {
    const response = await fetch('/api/vocabulary');
    if (!response.ok) return;
    const payload = await response.json();
    state.customVocabulary = Array.isArray(payload.items) ? payload.items : [];
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

function cardExamples(card) {
  const examples = Array.isArray(card.examples) ? card.examples : [card.example];
  return examples.filter(Boolean);
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
  section.hidden = !uniqueCards.length;
  root.textContent = card.familyId ? `Root: ${card.familyId}` : '';
  list.innerHTML = uniqueCards.map((item) => `<button class="detail-family-word c-button" type="button" aria-label="Open ${escapeHtml(item.english)}"><strong>${escapeHtml(item.english)}</strong></button>`).join('');
  $$('.detail-family-word', list).forEach((button, index) => button.addEventListener('click', () => openCardDetails(uniqueCards[index])));
}

async function loadDetailFamily(card) {
  const localRelated = wordFamilyExamples.filter((item) => item.familyId && item.familyId === card.familyId);
  renderDetailFamily(card, localRelated);
  try {
    const response = await fetch(`/api/word-relations?word=${encodeURIComponent(card.english)}`);
    if (!response.ok || state.selectedCard?.english !== card.english) return;
    const payload = await response.json();
    renderDetailFamily(card, [...localRelated, ...(payload.items || []).map(detailCardFromRelation)]);
  } catch {
    // Local examples remain visible when the API is unavailable.
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
  $('#detail-definition').textContent = card.definition || 'An English word used in everyday communication.';
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

function renderChart() {
  const chart = $('#week-chart');
  if (!chart) return;
  const values = [4, 6, 3, 8, 5, 3, Math.min(state.reviewed, 10)];
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  chart.innerHTML = values.map((value, index) => `<div class="chart-day"><div class="chart-bar ${index === values.length - 1 ? 'is-today' : ''}" style="height:${Math.max(value * 10, 7)}%" title="${value} cards"></div><small>${days[index]}</small></div>`).join('');
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

function renderAll() {
  renderLibrary();
  renderChart();
  renderCustomVocabulary();
}

function setFormStatus(message = '', type = '') {
  const element = $('#form-status');
  element.textContent = message;
  element.className = `form-status${type ? ` is-${type}` : ''}`;
}

function resetImagePreview() {
  const input = $('#vocab-image');
  const preview = $('#image-preview');
  input.value = '';
  preview.hidden = true;
  $('#image-preview-img').removeAttribute('src');
  $('#image-preview-name').textContent = '';
}

function previewImage(file) {
  if (!file) return resetImagePreview();
  $('#image-preview-img').src = URL.createObjectURL(file);
  $('#image-preview-name').textContent = `${file.name} · ${(file.size / 1024 / 1024).toFixed(2)}MB`;
  $('#image-preview').hidden = false;
}

async function submitVocabulary(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const button = $('#save-vocabulary');
  const file = $('#vocab-image').files[0];
  if (!file) return setFormStatus('Please choose an image.', 'error');
  if (file.size > 5 * 1024 * 1024) return setFormStatus('The image must be smaller than 5MB.', 'error');
  button.disabled = true;
  setFormStatus('Uploading the image and saving the vocabulary…');
  try {
    const response = await fetch('/api/vocabulary', { method: 'POST', body: new FormData(form) });
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.error || 'Unable to save the vocabulary.');
    form.reset();
    resetImagePreview();
    setFormStatus('New vocabulary saved successfully.', 'success');
    await loadCustomVocabulary();
  } catch (error) {
    setFormStatus(error.message || 'Something went wrong. Please try again.', 'error');
  } finally {
    button.disabled = false;
  }
}

function showView(viewName, { syncHistory = true } = {}) {
  if (state.selectedCard) closeVocabularyDetail();
  if (syncHistory) setAppRoute(viewName, null, true);
  $$('.view').forEach((view) => view.classList.toggle('is-visible', view.id === `view-${viewName}`));
  $$('.nav-item').forEach((button) => button.classList.toggle('is-active', button.dataset.view === viewName));
  if (viewName === 'library') renderLibrary();
  if (viewName === 'stats') renderChart();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function escapeHtml(value) {
  return String(value).replace(/[&<>'"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#039;', '"': '&quot;' }[char]));
}

function speakWord(word) {
  if (!('speechSynthesis' in window)) return toast('Your browser does not support pronunciation playback.');
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(word);
  utterance.lang = 'en-US';
  utterance.rate = .86;
  window.speechSynthesis.speak(utterance);
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
  $$('.nav-item').forEach((button) => button.addEventListener('click', () => showView(button.dataset.view)));
  $$('.filter-chip').forEach((button) => button.addEventListener('click', () => {
    state.libraryTopic = button.dataset.libraryTopic;
    state.searchQuery = '';
    $('#search-input').value = '';
    $$('.filter-chip').forEach((chip) => chip.classList.toggle('is-active', chip === button));
    renderLibrary();
  }));
  $('#detail-back').addEventListener('click', () => {
    if (window.history.state?.app === 'english-cards' && window.history.state.card) window.history.back();
    else showView('library');
  });
  $('#detail-speak').addEventListener('click', () => { if (state.selectedCard) speakWord(state.selectedCard.english); });
  $('#detail-favorite').addEventListener('click', () => { if (state.selectedCard) toggleCardFavorite(state.selectedCard); });
  $('#search-input').addEventListener('input', (event) => {
    state.searchQuery = event.target.value.trim().toLowerCase();
    state.libraryTopic = 'all';
    showView('library');
    $$('.filter-chip').forEach((chip) => chip.classList.toggle('is-active', chip.dataset.libraryTopic === 'all'));
    renderLibrary();
  });
  $('#theme-toggle').addEventListener('click', () => {
    document.body.classList.toggle('dark-mode');
    localStorage.setItem('englishCardsDarkMode', document.body.classList.contains('dark-mode') ? '1' : '0');
  });
  $('#vocabulary-form').addEventListener('submit', submitVocabulary);
  $('#vocab-image').addEventListener('change', (event) => previewImage(event.target.files[0]));
  $('#clear-image').addEventListener('click', resetImagePreview);
}

function init() {
  if (localStorage.getItem('englishCardsDarkMode') === '1') document.body.classList.add('dark-mode');
  renderApp(document.querySelector('#app'));
  initEvents();
  renderAll();
  initHistory();
  loadCustomVocabulary();
}

init();
