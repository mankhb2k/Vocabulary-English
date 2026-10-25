export function cx(styles, ...values) {
  return values
    .filter(Boolean)
    .join(' ')
    .split(/\s+/)
    .filter(Boolean)
    .map((name) => {
      const key = name.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
      return styles[key] || name;
    })
    .join(' ');
}
