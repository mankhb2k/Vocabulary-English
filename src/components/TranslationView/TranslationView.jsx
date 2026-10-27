import styles from './TranslationView.module.css';
import { cx } from '../../lib/cx.js';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ArrowUp, Check, ChevronDown, ChevronLeft, ChevronRight, Copy, Plus, Sparkles, Volume2, X } from 'lucide-react';
import { apiJson } from '../../lib/vocabulary.js';
import { PanelToggleButton } from '../PanelToggleButton/PanelToggleButton.jsx';
import { HistorySidebar } from '../HistorySidebar/HistorySidebar.jsx';
import { useSidebarOpen } from '../../hooks/useSidebarOpen.js';
import { createTranslationSamples } from '../../mock/translation-samples.js';

const devSamples = import.meta.env.DEV ? createTranslationSamples() : [];
const localDate = (date = new Date()) => new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
const asDate = (value) => { const date = new Date(`${String(value || '').replace(' ', 'T')}Z`); return Number.isNaN(date.getTime()) ? new Date() : date; };
const dateRange = (value) => { const [year, month, day] = value.split('-').map(Number); return { from: new Date(year, month - 1, day).toISOString(), to: new Date(year, month - 1, day + 1).toISOString() }; };

function withDevSamples(items, day = '') {
  const merged = new Map(items.map((item) => [item.id, item]));
  devSamples.filter((item) => !day || localDate(asDate(item.createdAt)) === day).forEach((item) => merged.set(item.id, item));
  return [...merged.values()];
}

function addDemoDays(days) {
  const merged = new Map(days.map((item) => [item.day, { ...item, count: Number(item.count || 0) }]));
  for (const item of devSamples) {
    const day = localDate(asDate(item.createdAt));
    const current = merged.get(day) || { day, count: 0, latest_at: item.createdAt, latest_source: '', latest_translation: '' };
    current.count += 1;
    if (!current.latest_at || asDate(item.createdAt) >= asDate(current.latest_at)) {
      current.latest_at = item.createdAt; current.latest_source = item.sourceText; current.latest_translation = item.translatedText;
    }
    merged.set(day, current);
  }
  return [...merged.values()].sort((a, b) => b.day.localeCompare(a.day));
}

export function TranslationView({ active, onToast }) {
  const [items, setItems] = useState([]);
  const [groups, setGroups] = useState([]);
  const [source, setSource] = useState('');
  const [search, setSearch] = useState('');
  const [busy, setBusy] = useState(false);
  const [historyOpen, setHistoryOpen] = useSidebarOpen();
  const [historyMode, setHistoryMode] = useState(false);
  const [date, setDate] = useState('all');
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [month, setMonth] = useState(localDate().slice(0, 7));
  const [selectedDays, setSelectedDays] = useState([]);
  const [draftDays, setDraftDays] = useState([]);
  const [voices, setVoices] = useState([]);
  const [voiceUri, setVoiceUri] = useState(() => localStorage.getItem('englishCardsUsVoice') || '');
  const [voiceOpen, setVoiceOpen] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [cursor, setCursor] = useState(null);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const previousPageHeight = useRef(null);
  const shouldScrollToBottom = useRef(false);
  const paginationLock = useRef(false);
  const lastPageScrollY = useRef(0);
  const requestId = useRef(0);
  const [copiedItemId, setCopiedItemId] = useState(null);
  const copiedTimer = useRef(null);
  const textareaRef = useRef(null);

  const visibleItems = useMemo(() => items.filter((item) => !search || `${item.sourceText} ${item.translatedText}`.toLocaleLowerCase().includes(search.trim().toLocaleLowerCase())).sort((a, b) => asDate(a.createdAt) - asDate(b.createdAt)), [items, search]);
  const filteredGroups = useMemo(() => groups.filter((group) => (!selectedDays.length || selectedDays.includes(group.day)) && (!search || `${group.latest_source || ''} ${group.latest_translation || ''}`.toLocaleLowerCase().includes(search.trim().toLocaleLowerCase()))), [groups, selectedDays, search]);

  const loadDays = useCallback(async () => {
    try {
      const params = new URLSearchParams({ group: 'days', offsetMinutes: String(new Date().getTimezoneOffset()) });
      const payload = await apiJson(`/api/translations?${params}`);
      setGroups(addDemoDays(payload.days || []));
    } catch (error) { if (devSamples.length) setGroups(addDemoDays([])); else onToast(error.message); }
  }, [onToast]);

  const loadAll = useCallback(async ({ reset = true } = {}) => {
    if (!reset && (loadingOlder || paginationLock.current || !hasMore || historyMode)) return;
    const id = reset ? ++requestId.current : requestId.current;
    if (reset) { previousPageHeight.current = null; setItems(withDevSamples([])); setCursor(null); setHasMore(false); }
    else {
      paginationLock.current = true;
      previousPageHeight.current = document.documentElement.scrollHeight;
      setLoadingOlder(true);
    }
    try {
      const params = new URLSearchParams({ limit: '30' });
      if (!reset && cursor) { params.set('before', cursor.createdAt); params.set('beforeId', cursor.id); }
      const payload = await apiJson(`/api/translations?${params}`);
      if (id !== requestId.current) return;
      setItems((current) => {
        const merged = new Map((reset ? [] : current).map((item) => [item.id, item]));
        (payload.items || []).forEach((item) => merged.set(item.id, item));
        return withDevSamples([...merged.values()]);
      });
      setHasMore(Boolean(payload.hasMore)); setCursor(payload.nextCursor || null);
    } catch (error) {
      if (id === requestId.current) {
        if (devSamples.length && reset) { setItems(devSamples); setHasMore(false); setCursor(null); }
        else onToast(error.message);
      }
    }
    finally {
      if (id === requestId.current) setLoadingOlder(false);
      paginationLock.current = false;
    }
  }, [cursor, hasMore, historyMode, loadingOlder, onToast]);

  const loadDate = useCallback(async (day) => {
    const id = ++requestId.current;
    setItems([]); setBusy(true);
    try {
      const range = dateRange(day);
      const params = new URLSearchParams({ ...range, limit: '500' });
      const payload = await apiJson(`/api/translations?${params}`);
      if (id === requestId.current) setItems(withDevSamples(payload.items || [], day));
    } catch (error) { if (id === requestId.current) { if (devSamples.length) setItems(withDevSamples([], day)); else onToast(error.message); } }
    finally { if (id === requestId.current) setBusy(false); }
  }, [onToast]);

  useEffect(() => {
    if (!active) return;
    shouldScrollToBottom.current = true;
    if (historyMode && date !== 'all') loadDate(date);
    else loadAll({ reset: true });
  // The request helpers intentionally stay out of this dependency list: state
  // updates during pagination must not restart the active history request.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, historyMode, date]);

  useEffect(() => {
    if (!active && !historyOpen) return;
    loadDays();
  }, [active, historyOpen, loadDays]);

  useEffect(() => {
    if (!('speechSynthesis' in window)) return undefined;
    const refresh = () => setVoices(window.speechSynthesis.getVoices().filter((voice) => voice.lang.toLowerCase().replace('_', '-') === 'en-us'));
    refresh(); window.speechSynthesis.addEventListener('voiceschanged', refresh);
    return () => window.speechSynthesis.removeEventListener('voiceschanged', refresh);
  }, []);

  useEffect(() => () => window.clearTimeout(copiedTimer.current), []);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = 'auto';
    textarea.style.height = `${textarea.scrollHeight}px`;
  }, [source]);

  useEffect(() => {
    if (loadingOlder) return;
    if (previousPageHeight.current !== null) {
      const addedHeight = document.documentElement.scrollHeight - previousPageHeight.current;
      window.scrollTo(0, window.scrollY + addedHeight);
      previousPageHeight.current = null;
      return;
    }
    if (shouldScrollToBottom.current && items.length) {
      window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'smooth' });
      shouldScrollToBottom.current = false;
    }
  }, [items, loadingOlder]);

  useEffect(() => {
    if (!active || historyMode || !hasMore || loadingOlder) return undefined;
    lastPageScrollY.current = window.scrollY;
    const handlePageScroll = () => {
      const currentY = window.scrollY;
      const scrollingUp = currentY < lastPageScrollY.current;
      lastPageScrollY.current = currentY;
      if (scrollingUp && currentY < 120) loadAll({ reset: false });
    };
    window.addEventListener('scroll', handlePageScroll, { passive: true });
    return () => window.removeEventListener('scroll', handlePageScroll);
  }, [active, historyMode, hasMore, loadingOlder, loadAll]);

  const isNearBottom = () => document.documentElement.scrollHeight - window.scrollY - window.innerHeight < 400;

  const submit = async (event) => {
    event.preventDefault(); const sourceText = source.trim(); if (!sourceText) return;
    const pendingId = `pending-${crypto.randomUUID()}`;
    const replacePending = (item) => setItems((current) => current.flatMap((entry) => (entry.id === pendingId ? (item ? [item] : []) : [entry])));
    // Chat-style send: clear the input and show the bubble immediately.
    setSearch(''); setSource('');
    shouldScrollToBottom.current = true;
    setItems((current) => [...current, { id: pendingId, sourceText, translatedText: '', createdAt: new Date().toISOString(), pending: true }]);
    try {
      const payload = await apiJson('/api/translations', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ sourceText }) });
      shouldScrollToBottom.current = isNearBottom();
      replacePending(payload.item || payload.translation);
      loadDays();
    } catch (error) {
      shouldScrollToBottom.current = isNearBottom();
      if (import.meta.env.DEV) {
        replacePending({ id: crypto.randomUUID(), sourceText, translatedText: `Mock English translation for preview: ${sourceText}`, createdAt: new Date().toISOString(), isMock: true });
      } else {
        replacePending(null); setSource((current) => current || sourceText); onToast(error.message);
      }
    }
  };

  const speak = (text) => {
    if (!('speechSynthesis' in window)) return onToast('Speech playback is not supported in this browser.');
    window.speechSynthesis.cancel(); const utterance = new SpeechSynthesisUtterance(text); utterance.lang = 'en-US';
    const voice = voices.find((item) => item.voiceURI === voiceUri) || voices.find((item) => item.default) || voices[0]; if (voice) utterance.voice = voice;
    window.speechSynthesis.speak(utterance);
  };
  const copy = async (text, message, itemId = null) => {
    try {
      await navigator.clipboard.writeText(text);
      if (itemId) {
        setCopiedItemId(itemId);
        window.clearTimeout(copiedTimer.current);
        copiedTimer.current = window.setTimeout(() => setCopiedItemId(null), 2000);
      }
      onToast(message);
    } catch { onToast('Unable to copy this message.'); }
  };
  const openDay = (day) => { shouldScrollToBottom.current = true; setDate(day); setMonth(day.slice(0, 7)); setHistoryMode(true); if (window.matchMedia('(max-width: 590px)').matches) setHistoryOpen(false); setCalendarOpen(false); };
  const changeMonth = (amount) => { const [year, monthValue] = month.split('-').map(Number); const next = new Date(year, monthValue - 1 + amount, 1); setMonth(`${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, '0')}`); };
  const yearNum = Number(month.slice(0, 4)); const monthNum = Number(month.slice(5, 7));
  const calendarCells = useMemo(() => { const first = new Date(yearNum, monthNum - 1, 1).getDay(); const count = new Date(yearNum, monthNum, 0).getDate(); return [...Array(first).fill(null), ...Array.from({ length: count }, (_, index) => `${month}-${String(index + 1).padStart(2, '0')}`)]; }, [month, yearNum, monthNum]);
  const activeDateLabel = selectedDays.length ? `${selectedDays.length} ${selectedDays.length === 1 ? 'day' : 'days'} selected` : 'All dates';

  return <div className={cx(styles, `view translation-view${active ? ' is-visible' : ''}`)} id="view-translate">
    <section className={cx(styles, "translation-chat-shell", historyOpen && "is-history-open")}>
      <div className={cx(styles, "translation-main")}><div className={cx(styles, "translation-top-actions")}><div className={cx(styles, "translation-voice-menu")}><button className={cx(styles, "translation-voice-toggle c-button")} type="button" aria-label="Choose US English voice" aria-expanded={voiceOpen} onClick={() => setVoiceOpen((value) => !value)}><Volume2 aria-hidden="true" /><span>US</span></button><div className={cx(styles, "translation-voice-panel")} id="translation-voice-panel" hidden={!voiceOpen}><label htmlFor="translation-voice-select">US English voice</label><select id="translation-voice-select" value={voiceUri} onChange={(event) => { setVoiceUri(event.target.value); if (event.target.value) localStorage.setItem('englishCardsUsVoice', event.target.value); else localStorage.removeItem('englishCardsUsVoice'); }}><option value="">Auto (US English)</option>{voices.map((voice) => <option key={voice.voiceURI} value={voice.voiceURI}>{voice.name} ({voice.lang}){voice.default ? ' — default' : ''}</option>)}</select><button className={cx(styles, "translation-voice-preview c-button")} type="button" onClick={() => speak('This is a sample of the selected US English voice.')}>Preview voice</button><p>Voices available on this device</p></div></div><PanelToggleButton className={cx(styles, "translation-history-toggle")} controls="translation-history-panel" expanded={historyOpen} label={historyOpen ? "Close translation history" : "Open translation history"} onClick={() => setHistoryOpen((value) => !value)}/> </div>
      <div className={cx(styles, "translation-messages")} id="translation-list" aria-live="polite">{visibleItems.length ? visibleItems.map((item) => <article className={cx(styles, `translation-turn${item.pending ? ' is-pending' : ''}`)} key={item.id}><div className={cx(styles, "translation-user-row")}><div className={cx(styles, "translation-user-bubble")}>{item.sourceText}</div></div><div className={cx(styles, "translation-user-meta")}><time>{asDate(item.createdAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</time><button className={cx(styles, "c-button")} type="button" onClick={() => copy(item.sourceText, 'Vietnamese message copied.')}>Copy</button></div><div className={cx(styles, "translation-ai-row")}><span className={cx(styles, "translation-ai-mark")} aria-hidden="true"><Sparkles size={14} aria-hidden="true" /></span><span>English translation</span>{item.isMock && <span className={cx(styles, "translation-demo-badge")}>DEMO</span>}</div><div className={cx(styles, "translation-ai-bubble")}>{item.pending ? <span className={cx(styles, "translation-typing")} role="status" aria-label="Translating"><span /><span /><span /></span> : item.translatedText}</div>{!item.pending && <div className={cx(styles, "translation-message-actions")}><button className={cx(styles, `translation-action-button c-button${copiedItemId === item.id ? ' is-copied' : ''}`)} type="button" onClick={() => copy(item.translatedText, 'English translation copied.', item.id)} aria-label={copiedItemId === item.id ? 'Translation copied' : 'Copy English translation'} title={copiedItemId === item.id ? 'Copied' : 'Copy English'}>{copiedItemId === item.id ? <Check size={20} aria-hidden="true" /> : <Copy size={20} aria-hidden="true" />}</button><button className={cx(styles, "translation-action-button c-button")} type="button" onClick={() => speak(item.translatedText)} aria-label="Read English aloud" title="Read aloud"><Volume2 size={20} aria-hidden="true" /></button></div>}</article>) : <div className={cx(styles, "translation-empty")}>{busy ? 'Loading translations…' : 'Your translations will appear here. Send a Vietnamese sentence to get started.'}</div>}{loadingOlder && <p className={cx(styles, "translation-day-empty")}>Loading older translations…</p>}</div>
      <div className={cx(styles, "translation-composer", historyMode && "is-history")}>{historyMode && <button className={cx(styles, "translation-new c-button")} type="button" onClick={() => { setHistoryMode(false); setDate("all"); setSearch(""); setSource(""); }}><Plus size={17} aria-hidden="true" /> New Translate</button>}<form id="translation-form" onSubmit={submit}><label className={cx(styles, "sr-only")} htmlFor="translation-source">Vietnamese message</label><textarea ref={textareaRef} id="translation-source" name="sourceText" lang="vi" rows="1" maxLength="8000" placeholder="Nhập câu tiếng Việt..." value={source} onChange={(event) => setSource(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) { event.preventDefault(); event.currentTarget.form?.requestSubmit(); } }}/><button className={cx(styles, "translation-send c-button")} type="submit" aria-label="Send message" disabled={!source.trim()}><ArrowUp size={19} aria-hidden="true" /></button></form></div>
      </div>
      <HistorySidebar className={cx(styles, "translation-history-sidebar")} openClassName={styles.isOpen} id="translation-history-panel" label="Translation history by day" open={historyOpen}><div className={cx(styles, "translation-history-panel-heading")}><div><strong>History</strong><span className={cx(styles, "translation-count")}>{filteredGroups.reduce((total, item) => total + Number(item.count || 0), 0)} translations</span></div><button className={cx(styles, "c-button")} type="button" aria-label="Close history" onClick={() => setHistoryOpen(false)}><X size={18} aria-hidden="true" /></button></div><div className={cx(styles, "translation-history-filters")}><div className={cx(styles, "translation-date-filter")}><span>Go to day</span><button className={cx(styles, "translation-calendar-trigger")} type="button" aria-haspopup="dialog" aria-expanded={calendarOpen} onClick={() => setCalendarOpen((value) => !value)}><span>{activeDateLabel}</span><ChevronDown size={16} aria-hidden="true" /></button>{calendarOpen && <div className={cx(styles, "translation-calendar")} role="dialog" aria-label="Filter history by date"><div className={cx(styles, "translation-calendar-header")}><button type="button" onClick={() => { setSelectedDays([]); setDraftDays([]); }}>All</button><button type="button" onClick={() => changeMonth(-1)} aria-label="Previous month"><ChevronLeft size={16} aria-hidden="true" /></button><select aria-label="Month" value={monthNum} onChange={(event) => setMonth(`${yearNum}-${String(event.target.value).padStart(2, '0')}`)}>{Array.from({ length: 12 }, (_, index) => <option key={index + 1} value={index + 1}>{new Date(2020, index, 1).toLocaleDateString('en-US', { month: 'long' })}</option>)}</select><select aria-label="Year" value={yearNum} onChange={(event) => setMonth(`${event.target.value}-${String(monthNum).padStart(2, '0')}`)}>{Array.from({ length: Math.max(5, yearNum - 2018 + 1) }, (_, index) => 2018 + index).map((year) => <option key={year}>{year}</option>)}</select><button type="button" onClick={() => changeMonth(1)} aria-label="Next month"><ChevronRight size={16} aria-hidden="true" /></button></div><div className={cx(styles, "translation-calendar-weekdays")} aria-hidden="true">{['Su','Mo','Tu','We','Th','Fr','Sa'].map((day) => <span key={day}>{day}</span>)}</div><div className={cx(styles, "translation-calendar-days")}>{calendarCells.map((day, index) => day ? <button key={day} type="button" className={cx(styles, `translation-calendar-day${draftDays.includes(day) ? ' is-selected' : ''}`)} onClick={() => setDraftDays((current) => current.includes(day) ? current.filter((value) => value !== day) : [...current, day])}>{Number(day.slice(-2))}</button> : <span key={`blank-${index}`}/>)}</div><div className={cx(styles, "translation-calendar-footer")}><span className={cx(styles, "translation-calendar-selected-count")}>{draftDays.length ? `${draftDays.length} selected` : 'All dates'}</span><button type="button" onClick={() => { setDraftDays(selectedDays); setCalendarOpen(false); }}>Cancel</button><button type="button" onClick={() => { setSelectedDays(draftDays); setCalendarOpen(false); }}>Apply filter</button></div></div>}</div><label className={cx(styles, "translation-search-filter")}><span className={cx(styles, "sr-only")}>Search Vietnamese and English messages</span><input type="search" placeholder="Search history" autoComplete="off" value={search} onChange={(event) => setSearch(event.target.value)}/></label></div><div className={cx(styles, "translation-day-list")} aria-live="polite">{filteredGroups.length ? filteredGroups.map((group) => <button key={group.day} className={cx(styles, "translation-day-item c-button")} type="button" onClick={() => { setSearch(''); openDay(group.day); }}><span className={cx(styles, "translation-day-heading")}><strong>{asDate(`${group.day} 12:00:00`).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })}</strong><small>{group.count} translations</small></span><span className={cx(styles, "translation-day-preview")}><span>{group.latest_source}</span><span>{group.latest_translation}</span></span></button>) : <p className={cx(styles, "translation-day-empty")}>{groups.length ? 'No chats match your search.' : 'No chats saved yet.'}</p>}</div></HistorySidebar>
    </section>
  </div>;
}
