import { useState } from 'react';
import type { InputHTMLAttributes } from 'react';
import { EyeIcon, EyeOffIcon } from './icons';

interface Props extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  visible?: boolean;
  onVisibleChange?: (visible: boolean) => void;
  invalid?: boolean;
}

export default function PasswordInput({ visible, onVisibleChange, invalid, className = '', ...rest }: Props) {
  const [internal, setInternal] = useState(false);
  const shown = visible ?? internal;
  const toggle = () => (onVisibleChange ? onVisibleChange(!shown) : setInternal(!shown));

  return (
    <div className="relative">
      <input
        {...rest}
        type={shown ? 'text' : 'password'}
        aria-invalid={invalid || undefined}
        spellCheck={false}
        autoCapitalize="off"
        className={`w-full rounded-lg border bg-white py-2 pl-3 pr-10 font-mono text-sm ${
          invalid ? 'border-alarm-700' : 'border-ink-200'
        } ${className}`}
      />
      <button
        type="button"
        onClick={toggle}
        aria-label={shown ? 'Hide password' : 'Show password'}
        aria-pressed={shown}
        className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-ink-500 hover:text-ink-900"
      >
        {shown ? <EyeOffIcon /> : <EyeIcon />}
      </button>
    </div>
  );
}
