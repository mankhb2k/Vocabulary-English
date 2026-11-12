import styles from './controls.module.css';

export function Input({ className = '', ...props }) {
  return <input {...props} className={[styles.input, className].filter(Boolean).join(' ')} />;
}

export function TextArea({ className = '', ...props }) {
  return <textarea {...props} className={[styles.input, styles.textarea, className].filter(Boolean).join(' ')} />;
}
