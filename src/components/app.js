import { Sidebar } from './sidebar.js';
import { LibraryView } from './library-view.js';
import { TranslationView } from './translation-view.js';
import { AddView } from './add-view.js';
import { AskView } from './ask-view.js';

export function renderApp(root) {
  root.innerHTML = `<div class="app-shell">${Sidebar()}<main class="main-content">${LibraryView()}${TranslationView()}${AddView()}${AskView()}</main></div><div class="toast" id="toast" role="status" aria-live="polite"></div>`;
}
