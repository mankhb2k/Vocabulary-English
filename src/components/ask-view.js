export function AskView() {
  return `
    <div class="view" id="view-ask">
      <section class="simple-chat-page">
        <div class="simple-chat-messages ai-chat-messages" id="ai-chat-messages" aria-live="polite">
          <div class="ai-chat-message ai-chat-message-assistant">How can I help you learn English today?</div>
        </div>
        <div class="simple-chat-composer">
          <form class="ai-chat-form" id="ai-chat-form">
            <label class="sr-only" for="ai-chat-input">Ask the AI assistant</label>
            <input id="ai-chat-input" name="message" type="text" placeholder="Ask anything" maxlength="1200" autocomplete="off" required />
            <button class="simple-chat-send" id="ai-chat-submit" type="submit" aria-label="Send message">&uarr;</button>
          </form>
          <p class="simple-chat-disclaimer">English Cards AI can make mistakes. Check important information.</p>
          <p class="ai-chat-status" id="ai-chat-status" role="status"></p>
        </div>
      </section>
    </div>
  `;
}
