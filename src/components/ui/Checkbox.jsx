import { useId } from 'react';
import styles from './controls.module.css';

export function Checkbox({ label, className = '', ...props }) {
  const labelId = useId();
  return <div className={[styles.checkbox, className].filter(Boolean).join(' ')}>
    <input {...props} type="checkbox" aria-labelledby={labelId} />
    <span id={labelId}>{label}</span>
  </div>;
}
