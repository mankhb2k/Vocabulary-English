import { useCallback, useEffect, useRef, useState } from 'react';
import { Sidebar } from './Sidebar.jsx';
import { LibraryView } from './LibraryView.jsx';
import { TranslationView } from './TranslationView.jsx';
import { AddView } from './AddView.jsx';
import { AskView } from './AskView.jsx';

function readRoute() {
  const hash = decodeURIComponent(window.location.hash.slice(1));
  if (hash.startsWith('library/')) return { view: 'library', card: hash.slice('library/'.length) };
  return { view: ['library', 'translate', 'add', 'ask'].includes(hash) ? hash : 'library', card: '' };
}

export function App() {
  const [route, setRoute] = useState(readRoute);
  const [toast, setToast] = useState('');
  const [editingCard, setEditingCard] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const toastTimer = useRef(null);

  useEffect(() => {
    const onPopState = () => setRoute(readRoute());
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  const navigate = useCallback((view, card = '') => {
    const hash = card ? `#library/${encodeURIComponent(card)}` : view === 'library' ? '' : `#${view}`;
    const routeState = { app: 'english-cards', view, ...(card ? { card } : {}) };
    window.history.pushState(routeState, '', `${window.location.pathname}${window.location.search}${hash}`);
    setRoute({ view, card });
    if (view !== 'add') setEditingCard(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const notify = useCallback((message) => {
    setToast(message);
    window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(''), 2600);
  }, []);

  useEffect(() => () => window.clearTimeout(toastTimer.current), []);

  const editCard = useCallback((card) => {
    setEditingCard(card);
    navigate('add');
  }, [navigate]);

  return <div className="app-shell">
      <Sidebar view={route.view} onNavigate={(view) => { if (view === 'add') setEditingCard(null); navigate(view); }}/>
    <main className="main-content">
      <LibraryView active={route.view === 'library'} cardWord={route.card} refreshKey={refreshKey} onNavigate={navigate} onEdit={editCard} onToast={notify}/>
      <TranslationView active={route.view === 'translate'} onToast={notify}/>
      <AddView active={route.view === 'add'} editingCard={editingCard} onVocabularyChanged={() => setRefreshKey((value) => value + 1)} onSaved={() => { setEditingCard(null); setRefreshKey((value) => value + 1); navigate('library'); }} onToast={notify}/>
      <AskView active={route.view === 'ask'} onToast={notify}/>
    </main>
    <div className={`toast${toast ? ' is-visible' : ''}`} role="status" aria-live="polite">{toast}</div>
  </div>;
}
