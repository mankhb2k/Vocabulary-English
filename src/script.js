import { renderApp } from './components/app.js';

const fallbackCards = [
  { english: 'How is it going?', definition: 'Used to ask someone how they are or how things are going.', notes: 'A friendly phrase commonly used in everyday conversation.', topic: 'greetings', category: 'EVERYDAY ENGLISH', pronunciation: '/haʊ ɪz ɪt ˈɡoʊɪŋ/', example: 'Hey, long time no see! How is it going?' },
  { english: 'I really appreciate it.', definition: 'Used to show sincere thanks for something someone has done.', notes: 'A warm and natural way to express gratitude.', topic: 'greetings', category: 'EVERYDAY ENGLISH', pronunciation: '/əˈpriːʃieɪt/', example: 'Thanks for your help. I really appreciate it.' },
  { english: 'Could you give me a hand?', definition: 'A polite way to ask someone to help you.', notes: 'Useful when asking for help in everyday or work situations.', topic: 'work', category: 'WORK & MEETINGS', pronunciation: '/kəd juː ɡɪv mi ə hænd/', example: 'Could you give me a hand with this report?' },
  { english: 'Let me get back to you.', definition: 'Used to say that you will reply after checking or considering something.', notes: 'A useful phrase when you need more time before answering.', topic: 'work', category: 'WORK & MEETINGS', pronunciation: '/let mi ɡet bæk tə juː/', example: 'I need to check the details. Let me get back to you.' },
  { english: 'I’m looking forward to it.', definition: 'Used to say that you are excited about something that will happen.', notes: 'Commonly used when talking about future plans.', topic: 'travel', category: 'TRAVEL', pronunciation: '/aɪm ˈlʊkɪŋ ˈfɔːrwərd tə ɪt/', example: 'Our trip is next week. I’m looking forward to it!' },
  { english: 'Is there anything I should know?', definition: 'A question asking whether there is important information you need to know.', notes: 'Useful when you want to understand a situation before starting.', topic: 'work', category: 'WORK & MEETINGS', pronunciation: '/ɪz ðer ˈeniθɪŋ aɪ ʃəd noʊ/', example: 'Before we start, is there anything I should know?' },
  { english: 'That sounds like a plan.', definition: 'Used to agree with a suggestion or proposed plan.', notes: 'A friendly way to show that you agree with an idea.', topic: 'greetings', category: 'EVERYDAY ENGLISH', pronunciation: '/ðæt saʊndz laɪk ə plæn/', example: 'Let’s meet at six. That sounds like a plan.' },
  { english: 'Could I have the bill, please?', definition: 'A polite request for the bill at a restaurant.', notes: 'Use this phrase when you are ready to pay for a meal.', topic: 'travel', category: 'TRAVEL', pronunciation: '/kəd aɪ hæv ðə bɪl pliːz/', example: 'Everything was delicious. Could I have the bill, please?' },
  { english: 'I’m just browsing.', definition: 'Used to say that you are looking around a shop without needing help.', notes: 'A natural response when a shop assistant offers help.', topic: 'travel', category: 'TRAVEL', pronunciation: '/aɪm dʒʌst ˈbraʊzɪŋ/', example: 'Thanks, I’m just browsing for now.' },
  { english: 'It slipped my mind.', definition: 'Used to say that you forgot something.', notes: 'A natural phrase for explaining that you forgot to do or remember something.', topic: 'work', category: 'WORK & MEETINGS', pronunciation: '/ɪt slɪpt maɪ maɪnd/', example: 'Sorry, it slipped my mind. I’ll do it now.' },
];

const state = {
  allCards: [...fallbackCards],
  activeTopic: 'all',
  deck: [...fallbackCards],
  index: 0,
  reviewed: Number(localStorage.getItem('englishCardsReviewed') || 3),
  correct: Number(localStorage.getItem('englishCardsCorrect') || 0),
  favorites: JSON.parse(localStorage.getItem('englishCardsFavorites') || '[]'),
  customVocabulary: [],
  flipped: false,
  libraryTopic: 'all',
  userId: localStorage.getItem('englishCardsUserId') || createUserId(),
};

function createUserId() {
  const id = `user_${crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}_${Math.random().toString(36).slice(2)}`}`;
  localStorage.setItem('englishCardsUserId', id);
  return id;
}

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

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
  return cards.filter((card) => card.english && card.definition);
}

function customVocabularyCard(item) {
  return {
    english: item.word,
    definition: item.definition || 'A word added to your personal vocabulary.',
    notes: 'A custom card from your personal vocabulary.',
    topic: item.topic || 'other',
    category: 'MY VOCABULARY',
    pronunciation: item.pronunciation || '',
    example: item.example || `Use “${item.word}” in a natural conversation.`,
    imageUrl: item.imageUrl,
    isCustom: true,
  };
}

function mergeCustomVocabulary() {
  const staticCards = state.allCards.filter((card) => !card.isCustom);
  state.allCards = [...staticCards, ...state.customVocabulary.map(customVocabularyCard)];
  setDeck();
  renderAll();
}

async function loadDataset() {
  const paths = ['./chunk-en-vi.json', './json/chunk-en-vi.json', '../json/chunk-en-vi.json'];
  for (const path of paths) {
    try {
      const response = await fetch(path);
      if (!response.ok) continue;
      const cards = flattenDataset(await response.json());
      if (cards.length) {
        state.allCards = [...cards, ...state.customVocabulary.map(customVocabularyCard)];
        setDeck();
        renderAll();
        toast(`Loaded ${cards.length.toLocaleString('en-US')} English expressions into your library.`);
        return;
      }
    } catch (error) {
      // The fallback cards keep the app usable when opened directly from the file system.
    }
  }
}

async function loadCustomVocabulary() {
  try {
    const response = await fetch('/api/vocabulary');
    if (!response.ok) return;
    const payload = await response.json();
    state.customVocabulary = Array.isArray(payload.items) ? payload.items : [];
    mergeCustomVocabulary();
  } catch {
    // The form becomes active after the Pages Function is deployed with D1/R2 bindings.
  }
}

function setDeck() {
  const source = state.activeTopic === 'all' ? state.allCards : state.allCards.filter((card) => card.topic === state.activeTopic);
  state.deck = source.length ? source : [...fallbackCards];
  state.index = Math.min(state.index, state.deck.length - 1);
  state.flipped = false;
}

function currentCard() { return state.deck[state.index] || fallbackCards[0]; }
function cardKey(card) { return card.english; }

function renderCard() {
  const card = currentCard();
  $('#card-english').textContent = card.english;
  $('#card-definition').textContent = card.definition;
  $('#card-category').textContent = card.category;
  $('#pronunciation-text').textContent = card.pronunciation || 'Press the speaker to listen';
  $('#card-note').textContent = card.notes;
  $('#card-example').textContent = card.example;
  $('#card-count').textContent = `${String(state.index + 1).padStart(2, '0')} / ${String(state.deck.length).padStart(2, '0')}`;
  $('#flashcard').classList.toggle('is-flipped', state.flipped);
  $('#flashcard').setAttribute('aria-label', state.flipped ? 'Back of flashcard, tap to flip back' : 'Front of flashcard, tap to flip');
  $('#flip-label-text').textContent = state.flipped ? 'Back' : 'Front';
  $('#favorite-button').classList.toggle('is-favorite', state.favorites.includes(cardKey(card)));
  $('#favorite-button').setAttribute('aria-pressed', String(state.favorites.includes(cardKey(card))));
  updatePronunciation(card.english);
}

function updateProgress() {
  const today = Math.min(state.reviewed, 10);
  const percent = Math.min(today * 10, 100);
  $('#completed-count').textContent = today;
  $('#daily-progress').textContent = `${percent}%`;
  $('#progress-ring').style.setProperty('--progress', `${percent}%`);
  $('#session-bar-fill').style.width = `${percent}%`;
  $('#session-reviewed').textContent = today;
  $('#session-left').textContent = Math.max(10 - today, 0);
  $('#session-accuracy').textContent = state.reviewed ? `${Math.round((state.correct / state.reviewed) * 100)}%` : '—';
  $('#sidebar-streak').textContent = '4 days';
  $('#streak-number').textContent = '4';
  $('#favorite-count').textContent = `${state.favorites.length} saved cards`;
  $('#stats-reviewed').textContent = state.reviewed;
  $('#stats-favorites').textContent = state.favorites.length;
  $('#stats-streak').textContent = '4 days';
}

function renderAll() {
  renderCard();
  updateProgress();
  renderLibrary();
  renderChart();
  renderCustomVocabulary();
}

function flipCard() {
  state.flipped = !state.flipped;
  renderCard();
}

function nextCard(isCorrect) {
  state.reviewed += 1;
  if (isCorrect) state.correct += 1;
  localStorage.setItem('englishCardsReviewed', state.reviewed);
  localStorage.setItem('englishCardsCorrect', state.correct);
  syncProgress();
  state.index = (state.index + 1) % state.deck.length;
  state.flipped = false;
  renderAll();
  toast(isCorrect ? 'Nice work — your next card is ready.' : 'No worries — we will review this card again later.');
}

function toggleFavorite() {
  const key = cardKey(currentCard());
  const found = state.favorites.indexOf(key);
  if (found >= 0) state.favorites.splice(found, 1);
  else state.favorites.push(key);
  localStorage.setItem('englishCardsFavorites', JSON.stringify(state.favorites));
  syncProgress();
  renderAll();
  toast(found >= 0 ? 'Removed from favorites.' : 'Saved to favorites.');
}

async function loadRemoteProgress() {
  try {
    const response = await fetch(`/api/progress?userId=${encodeURIComponent(state.userId)}`);
    if (!response.ok) return;
    const remote = await response.json();
    state.reviewed = Math.max(state.reviewed, Number(remote.reviewed) || 0);
    state.correct = Math.max(state.correct, Number(remote.correct) || 0);
    if (Array.isArray(remote.favorites)) state.favorites = [...new Set([...state.favorites, ...remote.favorites])];
    localStorage.setItem('englishCardsReviewed', state.reviewed);
    localStorage.setItem('englishCardsCorrect', state.correct);
    localStorage.setItem('englishCardsFavorites', JSON.stringify(state.favorites));
    updateProgress();
  } catch {
    // GitHub Pages/local static preview has no /api route, so localStorage remains the fallback.
  }
}

async function syncProgress() {
  try {
    await fetch('/api/progress', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ userId: state.userId, reviewed: state.reviewed, correct: state.correct, favorites: state.favorites }),
    });
  } catch {
    // Cloud sync is optional; the local copy is already saved before this request.
  }
}

function speakCurrent() {
  if (!('speechSynthesis' in window)) return toast('Your browser does not support pronunciation playback.');
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(currentCard().english);
  utterance.lang = 'en-US';
  utterance.rate = .86;
  window.speechSynthesis.speak(utterance);
}

function selectTopic(topic) {
  state.activeTopic = topic;
  state.index = 0;
  $$('.topic-tab').forEach((button) => button.classList.toggle('is-active', button.dataset.topic === topic));
  $('#deck-title').textContent = topic === 'all' ? 'Daily conversations' : topic === 'work' ? 'Work & meetings' : topic === 'travel' ? 'Travel essentials' : 'Everyday conversations';
  setDeck();
  renderAll();
}

function renderLibrary() {
  const filtered = state.libraryTopic === 'all' ? state.allCards : state.allCards.filter((card) => card.topic === state.libraryTopic);
  $('#library-total').textContent = `${filtered.length.toLocaleString('en-US')} cards`;
  const cards = filtered.slice(0, 60);
  $('#library-grid').innerHTML = cards.length ? cards.map((card, index) => `
    <article class="library-card">
      <div><div class="library-card-top"><span class="category-pill">${escapeHtml(card.category)}</span><span aria-hidden="true">${state.favorites.includes(cardKey(card)) ? '★' : '☆'}</span></div>
      <h3>${escapeHtml(card.english)}</h3><p>${escapeHtml(card.definition)}</p></div>
      <div class="library-card-footer"><span>${escapeHtml(card.topic === 'work' ? 'Work' : card.topic === 'travel' ? 'Travel' : 'Conversation')}</span><button type="button" data-study-index="${state.allCards.indexOf(card)}">Study this card →</button></div>
    </article>`).join('') : '<div class="empty-state">No matching cards found.</div>';
  $$('.library-card button').forEach((button) => button.addEventListener('click', () => {
    const target = Number(button.dataset.studyIndex);
    state.activeTopic = 'all';
    state.deck = [...state.allCards];
    state.index = Math.max(0, target);
    showView('study');
    renderAll();
  }));
}

function renderChart() {
  const values = [4, 6, 3, 8, 5, 3, Math.min(state.reviewed, 10)];
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  $('#week-chart').innerHTML = values.map((value, index) => `<div class="chart-day"><div class="chart-bar ${index === values.length - 1 ? 'is-today' : ''}" style="height:${Math.max(value * 10, 7)}%" title="${value} cards"></div><small>${days[index]}</small></div>`).join('');
}

function renderCustomVocabulary() {
  const grid = $('#custom-vocabulary-grid');
  if (!grid) return;
  $('#custom-vocabulary-total').textContent = `${state.customVocabulary.length} cards`;
  if (!state.customVocabulary.length) {
    grid.innerHTML = '<div class="empty-state">You have not added any words yet. Start with one useful word.</div>';
    return;
  }
  grid.innerHTML = state.customVocabulary.map((item) => {
    const date = item.createdAt ? new Date(item.createdAt).toLocaleDateString('en-US') : 'Just added';
    return `<article class="custom-vocab-card">
      <img class="custom-vocab-image" src="${escapeHtml(item.imageUrl)}" alt="Illustration for ${escapeHtml(item.word)}" loading="lazy" />
      <div class="custom-vocab-content"><span class="category-pill">${escapeHtml(item.topicName || 'OTHER')}</span><h3>${escapeHtml(item.word)}</h3><p>${escapeHtml(item.definition || '')}</p>${item.example ? `<small>${escapeHtml(item.example)}</small>` : ''}<small>Added ${escapeHtml(date)}</small></div>
    </article>`;
  }).join('');
}

function setFormStatus(message = '', type = '') {
  const element = $('#form-status');
  element.textContent = message;
  element.className = type ? `is-${type}` : '';
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
  const preview = $('#image-preview');
  $('#image-preview-img').src = URL.createObjectURL(file);
  $('#image-preview-name').textContent = `${file.name} · ${(file.size / 1024 / 1024).toFixed(2)}MB`;
  preview.hidden = false;
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

function showView(viewName) {
  $$('.view').forEach((view) => view.classList.toggle('is-visible', view.id === `view-${viewName}`));
  $$('.nav-item').forEach((button) => button.classList.toggle('is-active', button.dataset.view === viewName));
  if (viewName === 'library') renderLibrary();
  if (viewName === 'stats') renderChart();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function escapeHtml(value) {
  return String(value).replace(/[&<>'"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#039;', '"': '&quot;' }[char]));
}

let toastTimer;
function toast(message) {
  const element = $('#toast');
  element.textContent = message;
  element.classList.add('is-visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => element.classList.remove('is-visible'), 2600);
}

function shuffleDeck() {
  for (let index = state.deck.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(Math.random() * (index + 1));
    [state.deck[index], state.deck[swap]] = [state.deck[swap], state.deck[index]];
  }
  state.index = 0;
  state.flipped = false;
  renderCard();
  toast('Deck shuffled.');
}

function initEvents() {
  $$('.nav-item').forEach((button) => button.addEventListener('click', () => showView(button.dataset.view)));
  $$('.topic-tab').forEach((button) => button.addEventListener('click', () => selectTopic(button.dataset.topic)));
  $$('.filter-chip').forEach((button) => button.addEventListener('click', () => {
    state.libraryTopic = button.dataset.libraryTopic;
    $$('.filter-chip').forEach((chip) => chip.classList.toggle('is-active', chip === button));
    renderLibrary();
  }));
  $('#flashcard').addEventListener('click', (event) => { if (!event.target.closest('button')) flipCard(); });
  $('#flashcard').addEventListener('keydown', (event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); flipCard(); } });
  $('#reveal-hint').addEventListener('click', flipCard);
  $('#speak-button').addEventListener('click', (event) => { event.stopPropagation(); speakCurrent(); });
  $('#favorite-button').addEventListener('click', (event) => { event.stopPropagation(); toggleFavorite(); });
  $('#again-button').addEventListener('click', () => nextCard(false));
  $('#good-button').addEventListener('click', () => nextCard(true));
  $('#shuffle-button').addEventListener('click', shuffleDeck);
  $('#favorites-button').addEventListener('click', () => {
    if (!state.favorites.length) return toast('Tap ☆ to save cards you like.');
    state.libraryTopic = 'all';
    showView('library');
    $('#library-grid').innerHTML = state.allCards.filter((card) => state.favorites.includes(cardKey(card))).map((card) => `<article class="library-card"><div><div class="library-card-top"><span class="category-pill">${escapeHtml(card.category)}</span><span>★</span></div><h3>${escapeHtml(card.english)}</h3><p>${escapeHtml(card.definition)}</p></div></article>`).join('');
  });
  $('#search-input').addEventListener('input', (event) => {
    const query = event.target.value.trim().toLowerCase();
    if (!query) return renderLibrary();
    const matches = state.allCards.filter((card) => `${card.english} ${card.definition}`.toLowerCase().includes(query));
    state.libraryTopic = 'all';
    showView('library');
    $('#library-total').textContent = `${matches.length.toLocaleString('en-US')} results`;
    $('#library-grid').innerHTML = matches.slice(0, 60).map((card) => `<article class="library-card"><div><div class="library-card-top"><span class="category-pill">${escapeHtml(card.category)}</span><span>${state.favorites.includes(cardKey(card)) ? '★' : '☆'}</span></div><h3>${escapeHtml(card.english)}</h3><p>${escapeHtml(card.definition)}</p></div></article>`).join('') || '<div class="empty-state">No matching expressions found.</div>';
  });
  $('#theme-toggle').addEventListener('click', () => {
    document.body.classList.toggle('dark-mode');
    localStorage.setItem('englishCardsDarkMode', document.body.classList.contains('dark-mode') ? '1' : '0');
  });
  $('#vocabulary-form').addEventListener('submit', submitVocabulary);
  $('#vocab-image').addEventListener('change', (event) => previewImage(event.target.files[0]));
  $('#clear-image').addEventListener('click', resetImagePreview);
  document.addEventListener('keydown', (event) => {
    if (event.target.matches('input')) return;
    if (event.key === ' ') { event.preventDefault(); flipCard(); }
    if (event.key === '1') nextCard(false);
    if (event.key === '3') nextCard(true);
  });
}

function init() {
  if (localStorage.getItem('englishCardsDarkMode') === '1') document.body.classList.add('dark-mode');
  renderApp(document.querySelector('#app'));
  initEvents();
  renderAll();
  loadRemoteProgress();
  loadDataset().then(loadCustomVocabulary);
}

init();
