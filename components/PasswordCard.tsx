import { useEffect, useRef, useState } from 'react';
import { getDisplayDomain } from '../lib/domain-matching';
import type { Credential } from '../lib/types';
import IconButton from './IconButton';
import { CheckIcon, CopyIcon, EyeIcon, EyeOffIcon, PencilIcon, TrashIcon } from './icons';

interface Props {
  credential: Credential;
  onCopy: (credential: Credential) => Promise<void>;
  onEdit: (credential: Credential) => void;
  onDelete: (credential: Credential) => void;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

export default function PasswordCard({ credential, onCopy, onEdit, onDelete }: Props) {
  const [revealed, setRevealed] = useState(false); // hidden by default, always
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'failed'>('idle');
  const timer = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => () => clearTimeout(timer.current), []);

  const handleCopy = async () => {
    try {
      await onCopy(credential);
      setCopyState('copied');
    } catch {
      setCopyState('failed');
    }
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setCopyState('idle'), 2000);
  };

  return (
    <li className="rounded-xl border border-ink-200 bg-white p-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{credential.siteName}</p>
          <p className="truncate text-xs text-ink-500">{getDisplayDomain(credential.siteUrl)}</p>
        </div>
        <div className="flex shrink-0 gap-0.5">
          <IconButton label={`Edit ${credential.siteName}`} onClick={() => onEdit(credential)}>
            <PencilIcon />
          </IconButton>
          <IconButton label={`Delete ${credential.siteName}`} tone="danger" onClick={() => onDelete(credential)}>
            <TrashIcon />
          </IconButton>
        </div>
      </div>

      <p className="mt-1 truncate text-sm text-ink-700">{credential.username}</p>

      <div className="mt-2 flex items-center gap-1.5">
        <code
          className="min-w-0 flex-1 overflow-x-auto whitespace-nowrap rounded-lg bg-ink-100 px-2.5 py-1.5 font-mono text-sm"
          aria-label={revealed ? 'Password' : 'Password hidden'}
        >
          {revealed ? credential.password : '••••••••••••'}
        </code>
        <IconButton
          label={revealed ? 'Hide password' : 'Show password'}
          aria-pressed={revealed}
          onClick={() => setRevealed((r) => !r)}
        >
          {revealed ? <EyeOffIcon /> : <EyeIcon />}
        </IconButton>
        <button
          type="button"
          onClick={handleCopy}
          aria-label={`Copy password for ${credential.siteName}`}
          className={`inline-flex shrink-0 items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-white ${
            copyState === 'failed' ? 'bg-alarm-700' : 'bg-vault-600 hover:bg-vault-700'
          }`}
        >
          {copyState === 'copied' ? <CheckIcon className="h-3.5 w-3.5" /> : <CopyIcon className="h-3.5 w-3.5" />}
          <span aria-live="polite">
            {copyState === 'copied' ? 'Copied' : copyState === 'failed' ? 'Copy failed' : 'Copy password'}
          </span>
        </button>
      </div>

      <p className="mt-2 text-[11px] text-ink-500">
        Added {formatDate(credential.createdAt)}
        {credential.updatedAt !== credential.createdAt && <> · Updated {formatDate(credential.updatedAt)}</>}
        {credential.firstLoginDate && <> · First login {formatDate(`${credential.firstLoginDate}T00:00:00`)}</>}
      </p>
    </li>
  );
}
