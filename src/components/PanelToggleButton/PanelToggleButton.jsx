import styles from './PanelToggleButton.module.css';
import { cx } from '../../lib/cx.js';
import { PanelRightClose, PanelRightOpen } from 'lucide-react';

export function PanelToggleButton({
  className = '',
  controls,
  expanded,
  label,
  onClick,
}) {
  const Icon = expanded ? PanelRightClose : PanelRightOpen;

  return <button
    className={cx(styles, 'panel-toggle-button', className)}
    type="button"
    aria-label={label}
    aria-controls={controls}
    aria-expanded={expanded}
    title={expanded ? 'Close sidebar' : 'Open sidebar'}
    onClick={onClick}
  >
    <Icon aria-hidden="true" size={21} strokeWidth={1.8} />
  </button>;
}
