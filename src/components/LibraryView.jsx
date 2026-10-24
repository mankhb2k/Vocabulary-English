import { useEffect, useMemo, useState } from 'react';
import { apiJson, cardFromDatabase, definitionLines, exampleText, PLACEHOLDER_IMAGE, topicLabel, uniqueCards } from '../lib/vocabulary.js';

const topics = [['all', 'All'], ['greetings', 'Conversation'], ['work', 'Work'], ['travel', 'Travel']];

function CardTile({ card, favorite, onOpen }) {
  const [image, setImage] = useState(card.imageUrl || PLACEHOLDER_IMAGE);
  return <article className="library-card c-surface" tabIndex={0} role="button" aria-label={`View details for ${card.english}`} onClick={onOpen} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); onOpen(); } }}>
    <img className="library-card-image c-media" src={image} onError={() => setImage('/placeholder-1.png')} alt={`Illustration for ${card.english}`} loading="lazy"/>
    <div className="library-card-body"><div><div className="library-card-top"><span className="category-pill c-pill">{card.category}</span><span aria-hidden="true">{favorite ? '★' : '☆'}</span></div><h3>{card.english}</h3><p>{card.definition}</p></div><div className="library-card-footer"><span>{topicLabel(card.topic)}</span><span className="library-card-link">View details →</span></div></div>
  </article>;
}

function Definition({ value }) {
  return <>{definitionLines(value).map((line, index) => <span className="definition-line" key={`${line.label}-${index}`}>{line.label && <strong>{line.label} </strong>}{line.text}</span>)}</>;
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

  return <div className={`view view-library${active ? ' is-visible' : ''}`} id="view-library">
    {!selected ? <div className="library-index">
      <section className="page-heading"><p className="eyebrow">YOUR LIBRARY</p><h1>Find your next word</h1><p>Choose a topic or search for an English word to practise today.</p></section>
      <div className="library-search"><label className="sr-only" htmlFor="search-input">Search your library</label><div className="search-input-wrap"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.8" cy="10.8" r="6.8"/><path d="m16 16 4.5 4.5"/></svg><input className="c-control" id="search-input" type="search" value={query} onChange={(event) => { setQuery(event.target.value); if (topic !== 'all') setTopic('all'); }} placeholder="Search words..." autoComplete="off"/></div></div>
      <div className="library-toolbar"><div className="library-filters">{topics.map(([id, label]) => <button key={id} className={`filter-chip c-button${topic === id ? ' is-active' : ''}`} type="button" onClick={() => setTopic(id)}>{label}</button>)}</div><div className="library-tools"><label className="library-sort-label" htmlFor="library-sort">Sort by</label><select className="library-sort" id="library-sort" value={sort} onChange={(event) => setSort(event.target.value)} aria-label="Sort library cards"><option value="az">A–Z</option><option value="random">Random</option></select><button className="library-shuffle c-button" type="button" onClick={shuffle} aria-label="Shuffle cards" title="Shuffle cards">↻</button><span className="library-total">{filtered.length.toLocaleString('en-US')} {query ? 'results' : 'cards'}</span></div></div>
      <div className="library-grid">{filtered.length ? filtered.slice(0, 60).map((card) => <CardTile key={card.id || card.english} card={card} favorite={favorites.includes(card.english)} onOpen={() => openCard(card)}/>) : <div className="empty-state">No matching cards found.</div>}</div>
    </div> : <section className="vocabulary-detail is-visible" aria-live="polite">
      <button className="detail-back c-button" type="button" onClick={() => onNavigate('library')}>← Back</button><article className="detail-card c-surface"><div className="detail-hero"><img className="detail-image c-media" src={detailImage || selected.imageUrl || PLACEHOLDER_IMAGE} onError={() => setDetailImage('/placeholder-1.png')} alt={`Illustration for ${selected.english}`}/><div className="detail-heading"><div className="detail-heading-top"><span className="category-pill c-pill">{selected.category || 'WORD'}</span><div className="detail-actions"><button className="detail-edit c-button" type="button" onClick={() => onEdit(selected)}>Edit</button><button className={`detail-favorite c-icon-button${favorites.includes(selected.english) ? ' is-favorite' : ''}`} type="button" onClick={toggleFavorite} aria-label="Save this card" aria-pressed={favorites.includes(selected.english)}>{favorites.includes(selected.english) ? '★' : '☆'}</button></div></div><h2>{selected.english}</h2><div className="detail-pronunciation"><span>{selected.pronunciation || 'Press the speaker to listen'}</span><button className="c-icon-button" type="button" onClick={speak} aria-label="Play pronunciation"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 10v4h4l5 4V6l-5 4H4ZM16 9.5a4 4 0 0 1 0 5M18.5 7a7.3 7.3 0 0 1 0 10"/></svg></button></div></div></div><div className="detail-content"><section className="detail-section"><span className="section-label">ENGLISH DEFINITION</span><p className="detail-definition"><Definition value={selected.definition}/></p></section><section className="detail-section"><span className="section-label">EXAMPLES</span><ol className="detail-examples">{(exampleText(selected).length ? exampleText(selected) : ['Practise this word in a natural sentence.']).map((example, index) => <li key={index}>{example}</li>)}</ol></section>{selected.notes && <section className="detail-section detail-notes-section"><span className="section-label">USAGE NOTE</span><p className="detail-notes">{selected.notes}</p></section>} {(related.length > 0 || selected.isFamilyRoot || selected.familyId) && <section className="detail-section detail-family-section"><div className="detail-family-heading"><span className="section-label">WORD FAMILY</span><span className="detail-family-root">{selected.isFamilyRoot ? 'This card is a family root' : selected.familyId ? `Root: ${selected.familyId}` : ''}</span></div><div className="detail-family-list">{related.map((item) => <button key={item.id || item.word} className="detail-family-word c-button" type="button" onClick={() => { const card = cards.find((value) => value.english === item.word) || cardFromDatabase({ ...item, source: 'system' }); openCard(card); }}><strong>{item.word}</strong></button>)}</div></section>}</div></article>
    </section>}
  </div>;
}
