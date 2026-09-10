export function LibraryView() {
  return `
    <div class="view view-library is-visible" id="view-library">
      <div class="library-index" id="library-index">
        <section class="page-heading">
          <p class="eyebrow">YOUR LIBRARY</p>
          <h1>Find your next word</h1>
          <p>Choose a topic or search for an English word to practise today.</p>
        </section>
        <div class="library-toolbar">
          <div class="library-filters" id="library-filters">
            <button class="filter-chip c-button is-active" data-library-topic="all" type="button">All</button>
            <button class="filter-chip c-button" data-library-topic="greetings" type="button">Conversation</button>
            <button class="filter-chip c-button" data-library-topic="work" type="button">Work</button>
            <button class="filter-chip c-button" data-library-topic="travel" type="button">Travel</button>
          </div>
          <span class="library-total" id="library-total"></span>
        </div>
        <div class="library-grid" id="library-grid"></div>
      </div>

      <section class="vocabulary-detail" id="vocabulary-detail" hidden aria-live="polite">
        <button class="detail-back c-button" id="detail-back" type="button">&larr; Back</button>
        <article class="detail-card c-surface">
          <div class="detail-hero">
            <img class="detail-image c-media" id="detail-image" alt="" />
            <div class="detail-heading">
              <div class="detail-heading-top">
                <span class="category-pill c-pill" id="detail-category">WORD</span>
                <div class="detail-actions">
                  <button class="detail-edit c-button" id="detail-edit" type="button" hidden>Edit</button>
                  <button class="detail-favorite c-icon-button" id="detail-favorite" type="button" aria-label="Save this card" aria-pressed="false">&#9734;</button>
                </div>
              </div>
              <h2 id="detail-word"></h2>
              <div class="detail-pronunciation">
                <span id="detail-pronunciation">Press the speaker to listen</span>
                <button class="c-icon-button" id="detail-speak" type="button" aria-label="Play pronunciation">
                  <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 10v4h4l5 4V6l-5 4H4ZM16 9.5a4 4 0 0 1 0 5M18.5 7a7.3 7.3 0 0 1 0 10"/></svg>
                </button>
              </div>
            </div>
          </div>
          <div class="detail-content">
            <section class="detail-section">
              <span class="section-label">ENGLISH DEFINITION</span>
              <p class="detail-definition" id="detail-definition"></p>
            </section>
            <section class="detail-section">
              <span class="section-label">EXAMPLES</span>
              <ol class="detail-examples" id="detail-examples"></ol>
            </section>
            <section class="detail-section detail-notes-section" id="detail-notes-section">
              <span class="section-label">USAGE NOTE</span>
              <p class="detail-notes" id="detail-notes"></p>
            </section>
            <section class="detail-section detail-family-section" id="detail-family-section" hidden>
              <div class="detail-family-heading">
                <span class="section-label">WORD FAMILY</span>
                <span class="detail-family-root" id="detail-family-root"></span>
              </div>
              <div class="detail-family-list" id="detail-family-list"></div>
            </section>
          </div>
        </article>
      </section>
    </div>
  `;
}
