import styles from './controls.module.css';

export function Select({ children, options, className = '', ...props }) {
  return <select {...props} className={[styles.select, className].filter(Boolean).join(' ')}>
    {children || options?.map((option) => <option key={option.value} value={option.value} disabled={option.disabled}>{option.label}</option>)}
  </select>;
}
