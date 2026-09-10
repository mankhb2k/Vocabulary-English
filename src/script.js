import { renderApp } from './components/app.js';

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
  reviewed: Number(localStorage.getItem('englishCardsReviewed') || 3),
  favorites: JSON.parse(localStorage.getItem('englishCardsFavorites') || '[]'),
  customVocabulary: [],
  vocabularyCards: [],
  libraryTopic: 'all',
  librarySort: 'az',
  libraryRandomOrder: [],
  searchQuery: '',
  selectedCard: null,
  aiDraft: null,
  editingVocabulary: null,
  chatSessions: [],
  activeChatSessionId: null,
  aiChatMessages: [],
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
    category: isUserCard ? 'MY VOCABULARY' : (isFamilyCard ? 'WORD FAMILY' : 'CORE VOCABULARY'),
    pronunciation: item.pronunciation || '',
    examples,
    example: examples.join('\n'),
    familyId: item.familyRoot || '',
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
    state.customVocabulary = state.vocabularyCards.filter((item) => item.source !== 'system');
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
  section.hidden = !uniqueCards.length;
  root.textContent = card.familyId ? `Root: ${card.familyId}` : '';
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
  const button = $('#library-shuffle');
  if (button) {
    button.classList.remove('is-spinning');
    requestAnimationFrame(() => button.classList.add('is-spinning'));
  }
  renderLibrary();
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

function renderAiDraft(item = state.aiDraft) {
  const preview = $('#ai-draft-preview');
  if (!preview) return;
  state.aiDraft = item;
  preview.hidden = !item;
  if (!item) return;
  $('#ai-draft-word').textContent = item.word;
  $('#ai-draft-definition').textContent = item.definition;
  $('#ai-draft-pronunciation').textContent = item.pronunciation || 'Pronunciation not provided';
  $('#ai-draft-topic').textContent = item.topic || 'other';
  $('#ai-draft-family').textContent = item.familyRoot ? `Family root: ${item.familyRoot}` : 'No family link suggested';
  $('#ai-draft-example').textContent = `“${item.example}”`;
}

async function generateAiDraft(event) {
  event.preventDefault();
  const button = $('#generate-ai-vocabulary');
  const prompt = $('#ai-word-prompt').value.trim();
  if (!prompt) return;
  button.disabled = true;
  setAiStatus('Generating a vocabulary draft…');
  try {
    const response = await fetch('/api/ai/vocabulary', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ prompt }),
    });
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.error || 'Unable to generate the vocabulary draft.');
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
  $('#vocab-example').value = formatExampleSentences(cardExamples(card));
  resetImagePreview();
  setVocabularyFormMode(true);
  renderAiDraft(null);
  setFormStatus(`Editing ${card.english}. Save to create your personal version of this card.`, 'success');
  $('#vocab-word').focus();
}

function renderAll() {
  renderLibrary();
  renderChart();
  renderCustomVocabulary();
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
  $$('.nav-item').forEach((button) => button.addEventListener('click', () => {
    if (button.dataset.view === 'add') prepareNewVocabulary();
    showView(button.dataset.view);
  }));
  $('#ai-vocabulary-form').addEventListener('submit', generateAiDraft);
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
}

async function init() {
  renderApp(document.querySelector('#app'));
  initEvents();
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
  const element = document.querySelector('#ai-chat-status');
  if (!element) return;
  element.textContent = message;
  element.className = `ai-chat-status${type ? ` is-${type}` : ''}`;
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
  const sessionButton = event.target.closest('[data-session-id]');
  if (sessionButton) loadChatSession(sessionButton.dataset.sessionId);
  const deleteButton = event.target.closest('[data-delete-session-id]');
  if (deleteButton) {
    event.stopPropagation();
    deleteChatSession(deleteButton.dataset.deleteSessionId).catch((error) => setAiChatStatus(error.message, 'error'));
  }
  if (event.target.closest('#new-chat')) createChatSession();
});

init();
