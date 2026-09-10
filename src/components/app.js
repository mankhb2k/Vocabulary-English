import { Sidebar } from './sidebar.js';
import { Topbar } from './topbar.js';
import { StudyView } from './study-view.js';
import { LibraryView } from './library-view.js';
import { StatsView } from './stats-view.js';
import { AddView } from './add-view.js';

export function renderApp(root) {
  root.innerHTML = `<div class="app-shell">${Sidebar()}<main class="main-content">${Topbar()}${StudyView()}${LibraryView()}${StatsView()}${AddView()}</main></div><div class="toast" id="toast" role="status" aria-live="polite"></div>`;
}
