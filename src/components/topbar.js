export function Topbar() {
  return `
    <header class="topbar">
      <div class="mobile-brand brand"><span class="brand-mark" aria-hidden="true"><span></span><span></span><span></span></span><span>english<span class="brand-dot">.</span></span></div>
      <div class="topbar-search">
        <label class="sr-only" for="search-input">Tìm trong bộ thẻ</label>
        <div class="search-input-wrap">
          <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.8" cy="10.8" r="6.8"/><path d="m16 16 4.5 4.5"/></svg>
          <input id="search-input" type="search" placeholder="Ví dụ: meeting, cảm ơn..." autocomplete="off" />
        </div>
      </div>
      <div class="topbar-actions">
        <div class="profile-chip"><span class="avatar">AN</span><span class="profile-name">An Nguyen</span><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m7 10 5 5 5-5"/></svg></div>
      </div>
    </header>`;
}
