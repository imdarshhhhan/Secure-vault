import type { ButtonHTMLAttributes, ReactNode } from 'react';

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
  children: ReactNode;
  tone?: 'default' | 'danger';
}

/** Icon-only button that always has an accessible name and a tooltip. */
export default function IconButton({ label, children, tone = 'default', className = '', ...rest }: Props) {
  const colors =
    tone === 'danger'
      ? 'text-ink-500 hover:bg-alarm-100 hover:text-alarm-700'
      : 'text-ink-500 hover:bg-ink-100 hover:text-ink-900';
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={`inline-flex h-8 w-8 items-center justify-center rounded-lg transition-colors ${colors} ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}
