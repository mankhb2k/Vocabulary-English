export function TranslationView() {
  return `
    <div class="view" id="view-translate">
      <section class="translation-chat-shell">
        <div class="translation-top-actions">
          <div class="translation-voice-menu">
            <button class="translation-voice-toggle c-button" id="translation-voice-toggle" type="button" aria-label="Choose US English voice" aria-controls="translation-voice-panel" aria-expanded="false" title="US English voice">
              <i data-lucide="volume-2" aria-hidden="true"></i><span>US</span>
            </button>
            <div class="translation-voice-panel" id="translation-voice-panel" hidden>
              <label for="translation-voice-select">US English voice</label>
              <select id="translation-voice-select" aria-label="US English voice">
                <option value="">Auto (US English)</option>
              </select>
              <button class="translation-voice-preview c-button" id="translation-voice-preview" type="button">Preview voice</button>
              <p>Voices available on this device</p>
            </div>
          </div>
          <button class="translation-history-toggle c-button" id="translation-history-toggle" type="button" aria-label="Open translation history" aria-controls="translation-history-panel" aria-expanded="false">
            <i data-lucide="panel-left" aria-hidden="true"></i>
          </button>
        </div>
        <div class="translation-messages" id="translation-list" aria-live="polite"></div>
        <div class="translation-composer">
          <button class="translation-new c-button" id="translation-new" type="button" hidden>
            <i data-lucide="languages" aria-hidden="true"></i><span>New Translate</span>
          </button>
          <form id="translation-form">
            <label class="sr-only" for="translation-source">Vietnamese message</label>
            <textarea id="translation-source" name="sourceText" lang="vi" rows="2" maxlength="8000" placeholder="Nhập câu tiếng Việt…" required></textarea>
            <button class="translation-send c-button" id="translation-generate" type="submit" aria-label="Send message">
              <i data-lucide="send" aria-hidden="true"></i>
            </button>
          </form>
          <div class="translation-compose-meta">
            <p class="translation-status" id="translation-status" role="status" aria-live="polite"></p>
            <span class="translation-hint"><span id="translation-character-count">0</span> / 8,000</span>
          </div>
        </div>
      </section>
      <button class="translation-history-backdrop" id="translation-history-backdrop" type="button" aria-label="Close translation history" hidden></button>
      <aside class="translation-history-panel" id="translation-history-panel" aria-label="Translation history by day" hidden>
        <div class="translation-history-panel-heading">
          <div><strong>History</strong><span class="translation-count" id="translation-count"></span></div>
          <button class="c-button" id="translation-history-close" type="button" aria-label="Close history">&times;</button>
        </div>
        <div class="translation-history-filters">
          <div class="translation-date-filter">
            <span>Go to day</span>
            <button class="translation-calendar-trigger" id="translation-date-trigger" type="button" aria-haspopup="dialog" aria-expanded="false" aria-controls="translation-calendar">All dates</button>
            <div class="translation-calendar" id="translation-calendar" role="dialog" aria-label="Filter history by date" hidden>
              <div class="translation-calendar-header">
                <button class="translation-calendar-all" id="translation-calendar-all" type="button">All</button>
                <button class="translation-calendar-step" type="button" data-calendar-step="-1" aria-label="Previous month">‹</button>
                <select id="translation-calendar-month" aria-label="Month"></select>
                <select id="translation-calendar-year" aria-label="Year"></select>
                <button class="translation-calendar-step" type="button" data-calendar-step="1" aria-label="Next month">›</button>
              </div>
              <div class="translation-calendar-weekdays" aria-hidden="true"><span>Su</span><span>Mo</span><span>Tu</span><span>We</span><span>Th</span><span>Fr</span><span>Sa</span></div>
              <div class="translation-calendar-days" id="translation-calendar-days"></div>
              <div class="translation-calendar-footer">
                <span class="translation-calendar-selected-count" id="translation-calendar-selected-count"></span>
                <button class="translation-calendar-cancel" id="translation-calendar-cancel" type="button">Cancel</button>
                <button id="translation-calendar-apply" type="button">Apply filter</button>
              </div>
            </div>
          </div>
          <label class="translation-search-filter"><span class="sr-only">Search Vietnamese and English messages</span><input id="translation-search" type="search" placeholder="Search history" autocomplete="off" /></label>
        </div>
        <div class="translation-day-list" id="translation-day-list" aria-live="polite"></div>
      </aside>
    </div>
  `;
}
