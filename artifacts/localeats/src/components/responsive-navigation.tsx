import { useEffect, useId, useState, type ReactNode } from 'react';
import { useLocation } from 'wouter';

export function ResponsiveNavigation({ children, label, className }: { children: ReactNode; label: string; className: string }) {
  const [open, setOpen] = useState(false);
  const [location] = useLocation();
  const id = useId();
  useEffect(() => setOpen(false), [location]);
  return <div className="roco-navigation">
    <button type="button" className="roco-button roco-menu-toggle" aria-expanded={open} aria-controls={id} onClick={() => setOpen(value => !value)}>Menu</button>
    <nav id={id} className={`${className} roco-responsive-nav${open ? ' is-open' : ''}`} aria-label={label} onKeyDown={event => { if (event.key === 'Escape') { setOpen(false); event.currentTarget.parentElement?.querySelector('button')?.focus(); } }}>{children}</nav>
  </div>;
}
