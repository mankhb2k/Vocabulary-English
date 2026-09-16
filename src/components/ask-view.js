export function AskView() {
  return `
    <div class="view" id="view-ask">
      <section class="ask-chat-shell">
        <aside class="chat-sessions" id="chat-sessions" aria-label="Chat sessions">
          <button class="new-chat-button" id="new-chat" type="button">+ New chat</button>
          <div class="chat-session-list" id="chat-session-list"></div>
        </aside>
        <section class="simple-chat-page">
          <button class="chat-sessions-toggle" id="chat-sessions-toggle" type="button" aria-label="Open chat history" aria-controls="chat-sessions" aria-expanded="false">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 7.5h14M5 12h14M5 16.5h9" /></svg>
          </button>
          <div class="simple-chat-messages ai-chat-messages" id="ai-chat-messages" aria-live="polite"></div>
          <div class="simple-chat-composer">
            <form class="ai-chat-form" id="ai-chat-form">
              <label class="sr-only" for="ai-chat-input">Ask the AI assistant</label>
              <input id="ai-chat-input" name="message" type="text" placeholder="Ask anything" maxlength="20000" autocomplete="off" required />
              <button class="simple-chat-send" id="ai-chat-submit" type="submit" aria-label="Send message">&uarr;</button>
            </form>
            <p class="simple-chat-disclaimer">English Cards AI can make mistakes. Check important information.</p>
            <p class="ai-chat-status" id="ai-chat-status" role="status"></p>
            <p class="ai-chat-context" id="ai-chat-context"></p>
          </div>
        </section>
      </section>
    </div>
  `;
}
