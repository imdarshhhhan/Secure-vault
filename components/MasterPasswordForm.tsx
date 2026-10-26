import { useState } from 'react';
import type { FormEvent } from 'react';
import { DecryptionError } from '../lib/errors';
import { MIN_MASTER_PASSWORD_LENGTH, validateMasterPassword } from '../lib/validation';
import Logo from './Logo';
import PasswordInput from './PasswordInput';

interface Props {
  mode: 'setup' | 'unlock';
  onSubmit: (masterPassword: string) => Promise<void>;
}

export default function MasterPasswordForm({ mode, onSubmit }: Props) {
  const isSetup = mode === 'setup';
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [acknowledged, setAcknowledged] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    if (isSetup) {
      const problem = validateMasterPassword(password, confirm);
      if (problem) return setError(problem);
      if (!acknowledged) return setError('Please confirm that you understand the master password cannot be recovered.');
    } else if (!password) {
      return setError('Enter your master password.');
    }

    setBusy(true);
    try {
      await onSubmit(password);
    } catch (e) {
      setError(
        e instanceof DecryptionError
          ? 'Incorrect master password. Try again.'
          : 'Something went wrong while opening the vault. Please try again.',
      );
      setBusy(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-5" noValidate>
      <div className="flex flex-col items-center gap-2 text-center">
        <Logo className="h-12 w-12" />
        <h2 className="text-lg font-semibold">{isSetup ? 'Create your master password' : 'Unlock your vault'}</h2>
        <p className="text-sm text-ink-700">
          {isSetup
            ? 'Your master password locks everything you save here. It stays on this device and is never sent anywhere.'
            : 'Enter your master password to see your saved logins.'}
        </p>
      </div>

      <div>
        <label htmlFor="master-password" className="mb-1 block text-sm font-medium">
          Master password
        </label>
        <PasswordInput
          id="master-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete={isSetup ? 'new-password' : 'current-password'}
          autoFocus
          invalid={!!error}
        />
        {isSetup && (
          <p className="mt-1 text-xs text-ink-500">
            At least {MIN_MASTER_PASSWORD_LENGTH} characters. A few random words in a row is strong and easy to remember.
          </p>
        )}
      </div>

      {isSetup && (
        <>
          <div>
            <label htmlFor="master-confirm" className="mb-1 block text-sm font-medium">
              Confirm master password
            </label>
            <PasswordInput
              id="master-confirm"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              autoComplete="new-password"
            />
          </div>
          <div className="rounded-lg bg-brass-100 p-3 text-xs text-brass-700">
            <strong>There is no “forgot password” option.</strong> Nothing is stored in the cloud, so if you lose your
            master password your saved logins cannot be recovered by anyone.
            <label className="mt-2 flex items-start gap-2 text-ink-900">
              <input
                type="checkbox"
                checked={acknowledged}
                onChange={(e) => setAcknowledged(e.target.checked)}
                className="mt-0.5"
              />
              <span>I understand and I will keep my master password safe.</span>
            </label>
          </div>
        </>
      )}

      <p role="alert" aria-live="polite" className="min-h-[1rem] text-sm text-alarm-700">
        {error}
      </p>

      <button
        type="submit"
        disabled={busy}
        className="w-full rounded-lg bg-vault-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-vault-700 disabled:opacity-60"
      >
        {busy ? (isSetup ? 'Creating vault…' : 'Unlocking…') : isSetup ? 'Create vault' : 'Unlock'}
      </button>
    </form>
  );
}
