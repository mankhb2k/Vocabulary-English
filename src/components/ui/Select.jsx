import { Children, isValidElement, useEffect, useId, useRef, useState } from 'react';
import { Check, ChevronDown } from 'lucide-react';
import styles from './controls.module.css';

function getOptions(children, options) {
  if (options) return options.map((option) => ({ value: String(option.value), label: option.label, disabled: option.disabled }));
  return Children.toArray(children)
    .filter((child) => isValidElement(child) && child.type === 'option')
    .map((child) => ({
      value: String(child.props.value ?? child.props.children),
      label: child.props.children,
      disabled: child.props.disabled,
    }));
}

export function Select({
  children,
  options: optionProps,
  className = '',
  value,
  defaultValue,
  onChange,
  id,
  name,
  disabled = false,
  required = false,
  placeholder = 'Select an option',
  ...props
}) {
  const generatedId = useId();
  const listboxId = `${id || generatedId}-options`;
  const rootRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const options = getOptions(children, optionProps);
  const controlled = value !== undefined;
  const [internalValue, setInternalValue] = useState(String(defaultValue ?? options[0]?.value ?? ''));
  const selectedValue = String(controlled ? value ?? '' : internalValue);
  const selectedOption = options.find((option) => option.value === selectedValue);

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

  const openList = () => {
    if (disabled) return;
    const selectedIndex = options.findIndex((option) => option.value === selectedValue);
    setActiveIndex(Math.max(0, selectedIndex));
    setOpen(true);
  };

  const chooseOption = (option) => {
    if (option.disabled) return;
    if (!controlled) setInternalValue(option.value);
    onChange?.({ target: { value: option.value, name } });
    setOpen(false);
  };

  const moveActive = (direction) => {
    if (!options.length) return;
    let next = activeIndex;
    for (let attempt = 0; attempt < options.length; attempt += 1) {
      next = (next + direction + options.length) % options.length;
      if (!options[next].disabled) break;
    }
    setActiveIndex(next);
  };

  const handleKeyDown = (event) => {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      if (!open) openList();
      else moveActive(event.key === 'ArrowDown' ? 1 : -1);
      return;
    }
    if (event.key === 'Home' || event.key === 'End') {
      event.preventDefault();
      const indexes = options.map((option, index) => option.disabled ? -1 : index).filter((index) => index >= 0);
      if (indexes.length) setActiveIndex(event.key === 'Home' ? indexes[0] : indexes[indexes.length - 1]);
      if (!open) setOpen(true);
      return;
    }
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      if (!open) openList();
      else if (options[activeIndex]) chooseOption(options[activeIndex]);
    }
  };

  return <div ref={rootRef} className={[styles.selectRoot, className].filter(Boolean).join(' ')}>
    {name && <input type="hidden" name={name} value={selectedValue} />}
    <button
      {...props}
      id={id}
      type="button"
      role="combobox"
      data-select-trigger=""
      aria-haspopup="listbox"
      aria-expanded={open}
      aria-controls={listboxId}
      aria-activedescendant={open ? `${listboxId}-option-${activeIndex}` : undefined}
      aria-required={required || undefined}
      disabled={disabled}
      className={styles.select}
      onClick={() => open ? setOpen(false) : openList()}
      onKeyDown={handleKeyDown}
    >
      <span>{selectedOption?.label ?? placeholder}</span>
      <ChevronDown size={16} aria-hidden="true" />
    </button>
    {open && <div id={listboxId} className={styles.selectListbox} role="listbox" aria-label={props['aria-label']}>
      {options.map((option, index) => <button
        key={`${option.value}-${index}`}
        id={`${listboxId}-option-${index}`}
        type="button"
        role="option"
        aria-selected={option.value === selectedValue}
        aria-disabled={option.disabled || undefined}
        tabIndex={-1}
        className={styles.selectOption}
        data-active={index === activeIndex || undefined}
        onMouseEnter={() => setActiveIndex(index)}
        onClick={() => chooseOption(option)}
        disabled={option.disabled}
      >
        <span>{option.label}</span>
        {option.value === selectedValue && <Check size={15} aria-hidden="true" />}
      </button>)}
    </div>}
  </div>;
}
