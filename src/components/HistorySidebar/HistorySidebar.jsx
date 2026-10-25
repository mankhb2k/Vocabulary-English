import styles from './HistorySidebar.module.css';
import { cx } from '../../lib/cx.js';

export function HistorySidebar({ id, label, open = true, openClassName = '', className = '', children }) {
  return (
    <aside
      id={id}
      className={cx(styles, 'history-sidebar', className, open && openClassName)}
      aria-label={label}
    >
      {children}
    </aside>
  );
}
