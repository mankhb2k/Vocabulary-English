export function Sidebar() {
  return `
    <aside class="sidebar" aria-label="Main navigation">
      <a class="brand" href="#library" aria-label="English Cards - library home">
        <span class="brand-mark" aria-hidden="true"><span></span><span></span><span></span></span>
        <span>english<span class="brand-dot">.</span></span>
      </a>
      <nav class="main-nav">
        <button class="nav-item c-button is-active" data-view="library" type="button"><i data-lucide="library" aria-hidden="true"></i><span>Library</span></button>
        <button class="nav-item c-button" data-view="translate" type="button"><i data-lucide="languages" aria-hidden="true"></i><span>Translate</span></button>
        <button class="nav-item c-button" data-view="add" type="button"><i data-lucide="book-plus" aria-hidden="true"></i><span>Add word</span></button>
        <button class="nav-item c-button" data-view="ask" type="button"><i data-lucide="message-square-text" aria-hidden="true"></i><span>Chat AI</span></button>
      </nav>
    </aside>`;
}
