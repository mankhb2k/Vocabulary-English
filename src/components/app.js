import { Sidebar } from './sidebar.js';
import { Topbar } from './topbar.js';
import { LibraryView } from './library-view.js';
import { StatsView } from './stats-view.js';
import { AddView } from './add-view.js';
import { AskView } from './ask-view.js';

export function renderApp(root) {
  root.innerHTML = `<div class="app-shell">${Sidebar()}<main class="main-content">${Topbar()}${LibraryView()}${StatsView()}${AddView()}${AskView()}</main></div><div class="toast" id="toast" role="status" aria-live="polite"></div>`;
}
