import { useEffect, useId, useRef, useState } from 'react';
import { Input } from './Input.jsx';
import styles from './controls.module.css';

export function Autocomplete({ options = [], value = '', onChange, name, id, className = '', onKeyDown, ...props }) {
  const generatedId = useId();
  const listboxId = `${id || generatedId}-suggestions`;
  const rootRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const query = String(value || '').trim().toLocaleLowerCase();
  const matches = query
    ? options.filter((option) => String(option).toLocaleLowerCase().includes(query) && String(option).toLocaleLowerCase() !== query).slice(0, 8)
    : [];

  useEffect(() => {
    if (!open) return undefined;
    const closeOnOutside = (event) => {
      if (!rootRef.current?.contains(event.target)) setOpen(false);
    };
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('pointerdown', closeOnOutside);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('pointerdown', closeOnOutside);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [open]);

  const choose = (option) => {
    onChange?.({ target: { value: option, name } });
    setOpen(false);
  };

  const handleKeyDown = (event) => {
    onKeyDown?.(event);
    if (event.defaultPrevented) return;
    if (event.key === 'ArrowDown' && matches.length) {
      event.preventDefault();
      const wasOpen = open;
      setOpen(true);
      setActiveIndex((index) => wasOpen ? (index + 1) % matches.length : 0);
    } else if (event.key === 'ArrowUp' && matches.length) {
      event.preventDefault();
      const wasOpen = open;
      setOpen(true);
      setActiveIndex((index) => wasOpen ? (index - 1 + matches.length) % matches.length : matches.length - 1);
    } else if (event.key === 'Enter' && open && matches[activeIndex]) {
      event.preventDefault();
      choose(matches[activeIndex]);
    } else if (event.key === 'Escape') {
      setOpen(false);
    }
  };

  return <div ref={rootRef} className={[styles.autocompleteRoot, className].filter(Boolean).join(' ')}>
    <Input
      {...props}
      id={id}
      name={name}
      value={value}
      onChange={(event) => {
        onChange?.(event);
        setActiveIndex(0);
        setOpen(true);
      }}
      onFocus={() => { if (matches.length) setOpen(true); }}
      onKeyDown={handleKeyDown}
      role="combobox"
      aria-autocomplete="list"
      aria-expanded={open && matches.length > 0}
      aria-controls={listboxId}
      aria-activedescendant={open && matches.length ? `${listboxId}-option-${activeIndex}` : undefined}
      className={className}
    />
    {open && matches.length > 0 && <div id={listboxId} className={styles.selectListbox} role="listbox" aria-label={props['aria-label'] || 'Suggestions'}>
      {matches.map((option, index) => <button
        key={option}
        id={`${listboxId}-option-${index}`}
        type="button"
        role="option"
        aria-selected={index === activeIndex}
        tabIndex={-1}
        className={styles.selectOption}
        data-active={index === activeIndex || undefined}
        onMouseEnter={() => setActiveIndex(index)}
        onMouseDown={(event) => event.preventDefault()}
        onClick={() => choose(option)}
      >{option}</button>)}
    </div>}
  </div>;
}
