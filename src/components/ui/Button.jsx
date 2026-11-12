import styles from './controls.module.css';

const variantClasses = {
  primary: styles.primary,
  secondary: styles.secondary,
  outline: styles.outline,
  ghost: styles.ghost,
  danger: styles.danger,
  icon: styles.icon,
};

const sizeClasses = {
  small: styles.small,
  medium: styles.medium,
  large: styles.large,
};

export function Button({ variant, size, className = '', type = 'button', ...props }) {
  const classes = [styles.button, variantClasses[variant], sizeClasses[size], className].filter(Boolean).join(' ');
  return <button {...props} className={classes} type={type} />;
}

export function IconButton({ label, title = label, ...props }) {
  const accessibleLabel = label || props['aria-label'];
  return <Button {...props} variant={props.variant || 'icon'} aria-label={accessibleLabel} title={title} />;
}
