import styles from './Sidebar.module.css';
import { cx } from '../../lib/cx.js';
import { BookOpenText, Languages, MessageSquareText, SquarePlus } from 'lucide-react';
const navItems = [
  ['library', 'Library', BookOpenText],
  ['translate', 'Translate', Languages],
  ['add', 'Add word', SquarePlus],
  ['ask', 'Chat AI', MessageSquareText],
];

export function Sidebar({ view, onNavigate }) {
  return <aside className={cx(styles, "sidebar")} aria-label="Main navigation">
    <a className={cx(styles, "brand")} href="#library" aria-label="English Cards - library home" onClick={(event) => { event.preventDefault(); onNavigate('library'); }}>
      <span className={cx(styles, "brand-mark")} aria-hidden="true"><span/><span/><span/></span><span>english<span className={cx(styles, "brand-dot")}>.</span></span>
    </a>
    <nav className={cx(styles, "main-nav")}>
      {navItems.map(([id, label, Icon]) => <button key={id} className={cx(styles, `nav-item c-button${view === id ? ' is-active' : ''}`)} type="button" onClick={() => onNavigate(id)}>
        <Icon size={22} strokeWidth={2} aria-hidden="true"/><span>{label}</span>
      </button>)}
    </nav>
  </aside>;
}
