export function AskView() {
  return `
    <div class="view" id="view-ask">
      <section class="page-heading">
        <p class="eyebrow">AI LEARNING SPACE</p>
        <h1>Ask AI</h1>
        <p>Have a conversation about English vocabulary, grammar, pronunciation, and natural usage.</p>
      </section>

      <section class="ask-layout">
        <article class="ai-chat ask-chat c-surface" id="ai-chat">
          <div class="ai-chat-heading">
            <div>
              <span class="section-label">ENGLISH COACH</span>
              <h2>What would you like to learn?</h2>
              <p>Ask follow-up questions and keep the conversation going.</p>
            </div>
            <span class="ai-chat-icon" aria-hidden="true">&#10022;</span>
          </div>
          <div class="ai-chat-messages" id="ai-chat-messages" aria-live="polite">
            <div class="ai-chat-message ai-chat-message-assistant">Hi! Ask me anything about English. I can explain a word, compare meanings, or help you practise a sentence.</div>
          </div>
          <form class="ai-chat-form" id="ai-chat-form">
            <label class="sr-only" for="ai-chat-input">Ask the AI assistant</label>
            <input id="ai-chat-input" name="message" type="text" placeholder="Ask a question..." maxlength="1200" autocomplete="off" required />
            <button class="primary-button c-button" id="ai-chat-submit" type="submit">Send <span>&rarr;</span></button>
          </form>
          <p class="ai-chat-status" id="ai-chat-status" role="status"></p>
          <p class="ai-chat-context" id="ai-chat-context">Context limit: 200,000 tokens &middot; automatic comparison enabled</p>
        </article>

        <aside class="ask-guide c-surface">
          <span class="section-label">TRY ASKING</span>
          <h3>Make your question specific</h3>
          <div class="ask-prompt"><strong>Compare meanings</strong><span>What is the difference between “adapt” and “adopt”?</span></div>
          <div class="ask-prompt"><strong>Explore word forms</strong><span>Explain “record” as a noun and a verb.</span></div>
          <div class="ask-prompt"><strong>Practise naturally</strong><span>Correct my sentence and give me two alternatives.</span></div>
          <p class="ask-guide-note">The conversation stays in this browser session. The context is automatically compared and managed up to 200,000 tokens.</p>
        </aside>
      </section>
    </div>
  `;
}
