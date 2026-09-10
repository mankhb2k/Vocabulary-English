export function Sidebar() {
  return `
    <aside class="sidebar" aria-label="Main navigation">
      <a class="brand" href="#library" aria-label="English Cards - library home">
        <span class="brand-mark" aria-hidden="true"><span></span><span></span><span></span></span>
        <span>english<span class="brand-dot">.</span></span>
      </a>
      <nav class="main-nav">
        <button class="nav-item c-button is-active" data-view="library" type="button"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5v-15Z"/><path d="M4 7h16M8 11h8M8 14h5"/></svg><span>Library</span></button>
        <button class="nav-item c-button" data-view="stats" type="button"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 19V5M4 19h16"/><path d="m7 15 3-4 3 2 5-7"/></svg><span>Progress</span></button>
        <button class="nav-item c-button" data-view="add" type="button"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14"/><rect x="3.5" y="3.5" width="17" height="17" rx="4"/></svg><span>Add word</span></button>
        <button class="nav-item c-button" data-view="ask" type="button"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 5.5A2.5 2.5 0 0 1 7.5 3H19a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2h-7l-4.5 4V17h-.5A2.5 2.5 0 0 1 5 14.5v-9Z"/><path d="M9 8h6M9 12h4"/></svg><span>Ask AI</span></button>
      </nav>
      <div class="sidebar-bottom">
        <div class="mini-streak"><div class="mini-streak-icon">✦</div><div><strong id="sidebar-streak">4 days</strong><span>current streak</span></div></div>
      </div>
    </aside>`;
}
