import { cloneElement, useEffect, useRef, useState } from 'react';
import styles from './controls.module.css';

export function Dropdown({
  trigger,
  children,
  label,
  id,
  className = '',
  panelClassName = '',
  align = 'end',
  open,
  onOpenChange,
}) {
  const [internalOpen, setInternalOpen] = useState(false);
  const rootRef = useRef(null);
  const controlled = open !== undefined;
  const isOpen = controlled ? open : internalOpen;

  const setOpen = (next) => {
    if (!controlled) setInternalOpen(next);
    onOpenChange?.(next);
  };

  useEffect(() => {
    if (!isOpen) return undefined;
    const closeOnOutside = (event) => {
      if (!rootRef.current?.contains(event.target)) setOpen(false);
    };
    const closeOnEscape = (event) => {
      if (event.key !== 'Escape') return;
      setOpen(false);
      rootRef.current?.querySelector('[aria-haspopup]')?.focus();
    };
    document.addEventListener('pointerdown', closeOnOutside);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('pointerdown', closeOnOutside);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [isOpen]);

  const dropdownTrigger = cloneElement(trigger, {
    'aria-haspopup': 'dialog',
    'aria-expanded': isOpen,
    'aria-controls': id,
    onClick: (event) => {
      trigger.props.onClick?.(event);
      if (!event.defaultPrevented) setOpen(!isOpen);
    },
  });

  return <div ref={rootRef} className={[styles.dropdown, className].filter(Boolean).join(' ')} data-open={isOpen || undefined}>
    {dropdownTrigger}
    <div id={id} role="dialog" aria-label={label} hidden={!isOpen} data-align={align} className={[styles.dropdownPanel, panelClassName].filter(Boolean).join(' ')}>
      {children}
    </div>
  </div>;
}
