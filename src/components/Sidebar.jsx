const navItems = [
  ['library', 'Library', <><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5v-15Z"/><path d="M4 7h16M8 11h8M8 14h5"/></>],
  ['translate', 'Translate', <><path d="m5 8 6 6M4 14l6-6 2-3M2 5h12M7 2h1M14 20l5-11 5 11M16 16h6"/></>],
  ['add', 'Add word', <><path d="M12 5v14M5 12h14"/><rect x="3.5" y="3.5" width="17" height="17" rx="4"/></>],
  ['ask', 'Chat AI', <><path d="M5 5.5A2.5 2.5 0 0 1 7.5 3H19a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2h-7l-4.5 4V17h-.5A2.5 2.5 0 0 1 5 14.5v-9Z"/><path d="M9 8h6M9 12h4"/></>],
];

export function Sidebar({ view, onNavigate }) {
  return <aside className="sidebar" aria-label="Main navigation">
    <a className="brand" href="#library" aria-label="English Cards - library home" onClick={(event) => { event.preventDefault(); onNavigate('library'); }}>
      <span className="brand-mark" aria-hidden="true"><span/><span/><span/></span><span>english<span className="brand-dot">.</span></span>
    </a>
    <nav className="main-nav">
      {navItems.map(([id, label, icon]) => <button key={id} className={`nav-item c-button${view === id ? ' is-active' : ''}`} type="button" onClick={() => onNavigate(id)}>
        <svg viewBox="0 0 24 24" aria-hidden="true">{icon}</svg><span>{label}</span>
      </button>)}
    </nav>
  </aside>;
}
