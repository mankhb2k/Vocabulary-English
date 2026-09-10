export function AddView() {
  return `
    <div class="view" id="view-add">
      <section class="page-heading">
        <p class="eyebrow">YOUR VOCABULARY</p>
        <h1>Add a new vocabulary item</h1>
        <p>Save a word, phrase, its English definition, and a memorable image to make learning personal.</p>
      </section>

      <section class="ai-assistant c-surface" id="ai-assistant">
        <div class="ai-assistant-heading">
          <div>
            <span class="section-label">AI ASSISTANT</span>
            <h2>Build a vocabulary card</h2>
            <p>Ask your configured AI to prepare a structured English vocabulary draft.</p>
          </div>
          <span class="ai-spark" aria-hidden="true">&#10022;</span>
        </div>
        <form class="ai-form" id="ai-vocabulary-form">
          <label class="form-field">
            <span>Word or vocabulary item</span>
            <input id="ai-word-prompt" name="prompt" type="text" placeholder="For example: sustainable" maxlength="120" required />
          </label>
          <button class="secondary-button c-button" id="generate-ai-vocabulary" type="submit">Generate draft <span>&rarr;</span></button>
        </form>
        <p class="ai-status" id="ai-status" role="status"></p>
        <div class="ai-draft-preview" id="ai-draft-preview" hidden>
          <div class="ai-draft-heading">
            <span class="section-label">AI DRAFT</span>
            <button class="secondary-button c-button" id="ai-apply-draft" type="button">Use this draft</button>
          </div>
          <h3 id="ai-draft-word"></h3>
          <p id="ai-draft-definition"></p>
          <div class="ai-draft-meta">
            <span id="ai-draft-pronunciation"></span>
            <span id="ai-draft-topic"></span>
            <span id="ai-draft-family"></span>
          </div>
          <p class="ai-draft-example" id="ai-draft-example"></p>
        </div>
      </section>

      <section class="vocab-form-layout">
        <form class="vocab-form c-surface" id="vocabulary-form">
          <div class="form-heading">
            <div>
              <span class="section-label">VOCABULARY DETAILS</span>
              <h2>Create a new card</h2>
            </div>
            <span class="form-required">* required</span>
          </div>
          <div class="form-grid">
            <label class="form-field form-field-wide">
              <span>Word or vocabulary item <b>*</b></span>
              <input id="vocab-word" name="word" type="text" placeholder="For example: resilient or take a break" required maxlength="120" />
              <small>Words, phrasal verbs, and useful vocabulary items are welcome.</small>
            </label>
            <label class="form-field form-field-wide">
              <span>English definition <b>*</b></span>
              <textarea id="vocab-definition" name="definition" rows="3" placeholder="Able to recover quickly from difficulties." required maxlength="500"></textarea>
            </label>
            <label class="form-field">
              <span>Pronunciation</span>
              <input id="vocab-pronunciation" name="pronunciation" type="text" placeholder="/r&#618;&#712;z&#618;li&#601;nt/" maxlength="120" />
            </label>
            <label class="form-field">
              <span>Topic</span>
              <select id="vocab-topic" name="topic">
                <option value="greetings">Conversation</option>
                <option value="work">Work</option>
                <option value="travel">Travel</option>
                <option value="other">Other</option>
              </select>
            </label>
            <label class="form-field form-field-wide">
              <span>Word family root</span>
              <input id="vocab-family-root" name="familyRoot" type="text" list="family-root-options" placeholder="For example: help" maxlength="120" />
              <small>Optional. Link this item to an existing word family root.</small>
              <datalist id="family-root-options"></datalist>
            </label>
            <label class="form-field form-field-wide">
              <span>Example sentences <b>*</b></span>
              <textarea id="vocab-example" name="example" rows="5" placeholder="Write at least 3 sentences, one per line." required maxlength="1500"></textarea>
              <small>Write at least three natural sentences, one per line.</small>
            </label>
          </div>
          <label class="image-upload" for="vocab-image">
            <span class="upload-icon">&uarr;</span>
            <span><strong>Choose an image <b id="vocab-image-required">(optional)</b></strong><small>PNG, JPG or WEBP &middot; max 5MB · Falls back to placeholder-1.png</small></span>
            <input id="vocab-image" name="image" type="file" accept="image/png,image/jpeg,image/webp" />
          </label>
          <div class="image-preview" id="image-preview" hidden>
            <img id="image-preview-img" alt="Selected image preview" />
            <span id="image-preview-name"></span>
            <button id="clear-image" type="button" aria-label="Remove selected image">&times;</button>
          </div>
          <div class="form-actions">
            <span class="form-status" id="form-status" role="status"></span>
            <button class="primary-button c-button" id="save-vocabulary" type="submit">Save vocabulary <span>&rarr;</span></button>
          </div>
        </form>

        <aside class="add-tip">
          <span class="tip-icon">&#10022;</span>
          <span class="section-label">MEMORY TIP</span>
          <h3>The closer an image is to real experience, the easier the word is to remember.</h3>
          <p>Choose an image with one clear detail and write example sentences connected to your life.</p>
        </aside>
      </section>

      <section class="recent-vocabulary">
        <div class="section-heading">
          <div>
            <span class="section-label">RECENTLY ADDED</span>
            <h2>Your vocabulary</h2>
          </div>
          <span class="library-total" id="custom-vocabulary-total">0 cards</span>
        </div>
        <div class="custom-vocabulary-grid" id="custom-vocabulary-grid">
          <div class="empty-state">You have not added any vocabulary yet. Start with one useful item.</div>
        </div>
      </section>
    </div>
  `;
}
