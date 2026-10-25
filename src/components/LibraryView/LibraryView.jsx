import styles from './LibraryView.module.css';
import { cx } from '../../lib/cx.js';
import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, Search, Shuffle, Star, Volume2 } from 'lucide-react';
import { apiJson, cardFromDatabase, definitionLines, exampleText, PLACEHOLDER_IMAGE, topicLabel, uniqueCards } from '../../lib/vocabulary.js';

const topics = [['all', 'All'], ['greetings', 'Conversation'], ['work', 'Work'], ['travel', 'Travel']];

function CardTile({ card, favorite, onOpen }) {
  const [image, setImage] = useState(card.imageUrl || PLACEHOLDER_IMAGE);
  return <article className={cx(styles, "library-card c-surface")} tabIndex={0} role="button" aria-label={`View details for ${card.english}`} onClick={onOpen} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); onOpen(); } }}>
    <img className={cx(styles, "library-card-image c-media")} src={image} onError={() => setImage('/placeholder-1.png')} alt={`Illustration for ${card.english}`} loading="lazy"/>
    <div className={cx(styles, "library-card-body")}><div><div className={cx(styles, "library-card-top")}><span className={cx(styles, "category-pill c-pill")}>{card.category}</span><Star className={cx(styles, "favorite-icon")} size={16} fill={favorite ? "currentColor" : "none"} aria-hidden="true" /></div><h3>{card.english}</h3><p>{card.definition}</p></div><div className={cx(styles, "library-card-footer")}><span>{topicLabel(card.topic)}</span><span className={cx(styles, "library-card-link")}>View details <ArrowRight size={14} aria-hidden="true" /></span></div></div>
  </article>;
}

function Definition({ value }) {
  return <>{definitionLines(value).map((line, index) => <span className={cx(styles, "definition-line")} key={`${line.label}-${index}`}>{line.label && <strong>{line.label} </strong>}{line.text}</span>)}</>;
}

export function LibraryView({ active, cardWord, refreshKey, onNavigate, onEdit, onToast }) {
  const [cards, setCards] = useState([]);
  const [query, setQuery] = useState('');
  const [topic, setTopic] = useState('all');
  const [sort, setSort] = useState('az');
  const [randomOrder, setRandomOrder] = useState([]);
  const [selected, setSelected] = useState(null);
  const [related, setRelated] = useState([]);
  const [favorites, setFavorites] = useState(() => JSON.parse(localStorage.getItem('englishCardsFavorites') || '[]'));
  const [detailImage, setDetailImage] = useState('');

  useEffect(() => {
    let cancelled = false;
    apiJson('/api/vocabulary?scope=all').then((payload) => {
      if (!cancelled) setCards(uniqueCards((payload.items || []).map(cardFromDatabase)));
    }).catch(() => {});
    return () => { cancelled = true; };
  }, [refreshKey]);

  const filtered = useMemo(() => {
    let result = cards.filter((card) => (topic === 'all' || card.topic === topic) && (!query || `${card.english} ${card.definition}`.toLowerCase().includes(query.trim().toLowerCase())));
    if (sort === 'random') {
      const lookup = new Map(result.map((card) => [card.id || card.english.toLowerCase(), card]));
      result = randomOrder.map((id) => lookup.get(id)).filter(Boolean).concat(result.filter((card) => !randomOrder.includes(card.id || card.english.toLowerCase())));
    } else result.sort((a, b) => a.english.localeCompare(b.english, undefined, { sensitivity: 'base' }));
    return result;
  }, [cards, topic, query, sort, randomOrder]);

  useEffect(() => {
    if (!cardWord) { setSelected(null); return; }
    const found = cards.find((item) => item.english.toLowerCase() === cardWord.toLowerCase());
    setSelected(found || null);
  }, [cardWord, cards]);

  useEffect(() => {
    if (!selected) { setRelated([]); return; }
    setDetailImage(selected.imageUrl || PLACEHOLDER_IMAGE);
    let cancelled = false;
    apiJson(`/api/word-relations?word=${encodeURIComponent(selected.english)}`).then((payload) => {
      if (!cancelled) setRelated((payload.items || []).filter((item) => item.word !== selected.english));
    }).catch(() => { if (!cancelled) setRelated([]); });
    return () => { cancelled = true; };
  }, [selected]);

  const openCard = (card) => { setSelected(card); onNavigate('library', card.english); };
  const toggleFavorite = () => {
    const next = favorites.includes(selected.english) ? favorites.filter((word) => word !== selected.english) : [...favorites, selected.english];
    setFavorites(next);
    localStorage.setItem('englishCardsFavorites', JSON.stringify(next));
  };
  const shuffle = () => {
    const ids = cards.map((card) => card.id || card.english.toLowerCase());
    for (let i = ids.length - 1; i > 0; i -= 1) { const j = Math.floor(Math.random() * (i + 1)); [ids[i], ids[j]] = [ids[j], ids[i]]; }
    setSort('random'); setRandomOrder(ids);
  };
  const speak = () => {
    if (!('speechSynthesis' in window)) return onToast('Your browser does not support pronunciation playback.');
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(selected.english); utterance.lang = 'en-US'; utterance.rate = 0.86; window.speechSynthesis.speak(utterance);
  };

  return <div className={cx(styles, `view view-library${active ? ' is-visible' : ''}`)} id="view-library">
    {!selected ? <div className={cx(styles, "library-index")}>
      <section className={cx(styles, "page-heading")}><p className={cx(styles, "eyebrow")}>YOUR LIBRARY</p><h1>Find your next word</h1><p>Choose a topic or search for an English word to practise today.</p></section>
      <div className={cx(styles, "library-search")}><label className={cx(styles, "sr-only")} htmlFor="search-input">Search your library</label><div className={cx(styles, "search-input-wrap")}><Search size={17} aria-hidden="true" /><input className={cx(styles, "c-control")} id="search-input" type="search" value={query} onChange={(event) => { setQuery(event.target.value); if (topic !== 'all') setTopic('all'); }} placeholder="Search words..." autoComplete="off"/></div></div>
      <div className={cx(styles, "library-toolbar")}><div className={cx(styles, "library-filters")}>{topics.map(([id, label]) => <button key={id} className={cx(styles, `filter-chip c-button${topic === id ? ' is-active' : ''}`)} type="button" onClick={() => setTopic(id)}>{label}</button>)}</div><div className={cx(styles, "library-tools")}><label className={cx(styles, "library-sort-label")} htmlFor="library-sort">Sort by</label><select className={cx(styles, "library-sort")} id="library-sort" value={sort} onChange={(event) => setSort(event.target.value)} aria-label="Sort library cards"><option value="az">A–Z</option><option value="random">Random</option></select><button className={cx(styles, "library-shuffle c-button")} type="button" onClick={shuffle} aria-label="Shuffle cards" title="Shuffle cards"><Shuffle size={16} aria-hidden="true" /></button><span className={cx(styles, "library-total")}>{filtered.length.toLocaleString('en-US')} {query ? 'results' : 'cards'}</span></div></div>
      <div className={cx(styles, "library-grid")}>{filtered.length ? filtered.slice(0, 60).map((card) => <CardTile key={card.id || card.english} card={card} favorite={favorites.includes(card.english)} onOpen={() => openCard(card)}/>) : <div className={cx(styles, "empty-state")}>No matching cards found.</div>}</div>
    </div> : <section className={cx(styles, "vocabulary-detail is-visible")} aria-live="polite">
      <button className={cx(styles, "detail-back c-button")} type="button" onClick={() => onNavigate("library")}><ArrowLeft size={16} aria-hidden="true" /> Back</button><article className={cx(styles, "detail-card c-surface")}><div className={cx(styles, "detail-hero")}><img className={cx(styles, "detail-image c-media")} src={detailImage || selected.imageUrl || PLACEHOLDER_IMAGE} onError={() => setDetailImage('/placeholder-1.png')} alt={`Illustration for ${selected.english}`}/><div className={cx(styles, "detail-heading")}><div className={cx(styles, "detail-heading-top")}><span className={cx(styles, "category-pill c-pill")}>{selected.category || 'WORD'}</span><div className={cx(styles, "detail-actions")}><button className={cx(styles, "detail-edit c-button")} type="button" onClick={() => onEdit(selected)}>Edit</button><button className={cx(styles, `detail-favorite c-icon-button${favorites.includes(selected.english) ? ' is-favorite' : ''}`)} type="button" onClick={toggleFavorite} aria-label="Save this card" aria-pressed={favorites.includes(selected.english)}><Star size={20} fill={favorites.includes(selected.english) ? "currentColor" : "none"} aria-hidden="true" /></button></div></div><h2>{selected.english}</h2><div className={cx(styles, "detail-pronunciation")}><span>{selected.pronunciation || 'Press the speaker to listen'}</span><button className={cx(styles, "c-icon-button")} type="button" onClick={speak} aria-label="Play pronunciation"><Volume2 size={16} aria-hidden="true" /></button></div></div></div><div className={cx(styles, "detail-content")}><section className={cx(styles, "detail-section")}><span className={cx(styles, "section-label")}>ENGLISH DEFINITION</span><p className={cx(styles, "detail-definition")}><Definition value={selected.definition}/></p></section><section className={cx(styles, "detail-section")}><span className={cx(styles, "section-label")}>EXAMPLES</span><ol className={cx(styles, "detail-examples")}>{(exampleText(selected).length ? exampleText(selected) : ['Practise this word in a natural sentence.']).map((example, index) => <li key={index}>{example}</li>)}</ol></section>{selected.notes && <section className={cx(styles, "detail-section detail-notes-section")}><span className={cx(styles, "section-label")}>USAGE NOTE</span><p className={cx(styles, "detail-notes")}>{selected.notes}</p></section>} {(related.length > 0 || selected.isFamilyRoot || selected.familyId) && <section className={cx(styles, "detail-section detail-family-section")}><div className={cx(styles, "detail-family-heading")}><span className={cx(styles, "section-label")}>WORD FAMILY</span><span className={cx(styles, "detail-family-root")}>{selected.isFamilyRoot ? 'This card is a family root' : selected.familyId ? `Root: ${selected.familyId}` : ''}</span></div><div className={cx(styles, "detail-family-list")}>{related.map((item) => <button key={item.id || item.word} className={cx(styles, "detail-family-word c-button")} type="button" onClick={() => { const card = cards.find((value) => value.english === item.word) || cardFromDatabase({ ...item, source: 'system' }); openCard(card); }}><strong>{item.word}</strong></button>)}</div></section>}</div></article>
    </section>}
  </div>;
}
