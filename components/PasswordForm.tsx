import { useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { DuplicateCredentialError, ValidationError } from '../lib/errors';
import { generatePassword } from '../lib/password-generator';
import type { Credential, CredentialInput, FieldErrors } from '../lib/types';
import { todayISO, validateCredentialInput } from '../lib/validation';
import { RefreshIcon } from './icons';
import PasswordInput from './PasswordInput';

interface Props {
  /** Present when editing an existing entry. */
  initial?: Credential;
  /** Optional starting values for a new entry (e.g. the site you are currently on). */
  prefill?: Partial<CredentialInput>;
  onSave: (input: CredentialInput) => Promise<void>;
  onCancel: () => void;
}

function Field({
  id,
  label,
  error,
  hint,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-sm font-medium">
        {label}
      </label>
      {children}
      {hint && !error && <p className="mt-1 text-xs text-ink-500">{hint}</p>}
      {error && (
        <p id={`${id}-error`} role="alert" className="mt-1 text-xs text-alarm-700">
          {error}
        </p>
      )}
    </div>
  );
}

const inputClass = (invalid: boolean) =>
  `w-full rounded-lg border bg-white px-3 py-2 text-sm ${invalid ? 'border-alarm-700' : 'border-ink-200'}`;

/** Screen 4: add or edit a login. */
export default function PasswordForm({ initial, prefill, onSave, onCancel }: Props) {
  const [values, setValues] = useState<CredentialInput>({
    siteName: initial?.siteName ?? prefill?.siteName ?? '',
    siteUrl: initial?.siteUrl ?? prefill?.siteUrl ?? '',
    username: initial?.username ?? '',
    password: initial?.password ?? '',
    firstLoginDate: initial?.firstLoginDate ?? '',
  });
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [length, setLength] = useState(20);

  const update = (field: keyof CredentialInput) => (e: ChangeEvent<HTMLInputElement>) =>
    setValues((v) => ({ ...v, [field]: e.target.value }));

  const handleGenerate = () => {
    setValues((v) => ({ ...v, password: generatePassword({ length }) }));
    setShowPassword(true); // let the person see what was generated
    setErrors((e) => ({ ...e, password: undefined }));
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setFormError(null);
    const result = validateCredentialInput(values);
    if (!result.valid) return setErrors(result.errors);
    setErrors({});
    setBusy(true);
    try {
      await onSave(values);
    } catch (e) {
      if (e instanceof ValidationError) setErrors(e.errors);
      else if (e instanceof DuplicateCredentialError) setFormError(e.message);
      else setFormError('Could not save this entry. Please try again.');
      setBusy(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3 p-4" noValidate>
      <h2 className="text-base font-semibold">{initial ? 'Edit password' : 'Add password'}</h2>

      <Field id="siteName" label="Site name" error={errors.siteName}>
        <input
          id="siteName"
          value={values.siteName}
          onChange={update('siteName')}
          placeholder="GitHub"
          autoComplete="off"
          aria-invalid={!!errors.siteName}
          aria-describedby={errors.siteName ? 'siteName-error' : undefined}
          className={inputClass(!!errors.siteName)}
        />
      </Field>

      <Field id="siteUrl" label="Site URL" error={errors.siteUrl}>
        <input
          id="siteUrl"
          value={values.siteUrl}
          onChange={update('siteUrl')}
          placeholder="https://github.com"
          autoComplete="off"
          inputMode="url"
          aria-invalid={!!errors.siteUrl}
          aria-describedby={errors.siteUrl ? 'siteUrl-error' : undefined}
          className={inputClass(!!errors.siteUrl)}
        />
      </Field>

      <Field id="username" label="Username or email" error={errors.username}>
        <input
          id="username"
          value={values.username}
          onChange={update('username')}
          autoComplete="off"
          autoCapitalize="off"
          aria-invalid={!!errors.username}
          aria-describedby={errors.username ? 'username-error' : undefined}
          className={inputClass(!!errors.username)}
        />
      </Field>

      <Field id="password" label="Password" error={errors.password}>
        <PasswordInput
          id="password"
          value={values.password}
          onChange={update('password')}
          visible={showPassword}
          onVisibleChange={setShowPassword}
          autoComplete="off"
          invalid={!!errors.password}
          aria-describedby={errors.password ? 'password-error' : undefined}
        />
        <div className="mt-2 flex items-center gap-2 text-xs text-ink-700">
          <button
            type="button"
            onClick={handleGenerate}
            className="inline-flex items-center gap-1 rounded-lg border border-ink-200 px-2.5 py-1.5 font-medium hover:bg-ink-50"
          >
            <RefreshIcon className="h-3.5 w-3.5" /> Generate strong password
          </button>
          <label className="flex items-center gap-1">
            Length
            <select
              value={length}
              onChange={(e) => setLength(Number(e.target.value))}
              aria-label="Generated password length"
              className="rounded border border-ink-200 bg-white px-1 py-1"
            >
              {[12, 16, 20, 24, 32, 48].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </label>
        </div>
      </Field>

      <Field
        id="firstLoginDate"
        label="First login date (optional)"
        error={errors.firstLoginDate}
        hint="Only fill this in if you know it. Otherwise we just record when you added this entry."
      >
        <input
          id="firstLoginDate"
          type="date"
          value={values.firstLoginDate}
          max={todayISO()}
          onChange={update('firstLoginDate')}
          aria-invalid={!!errors.firstLoginDate}
          className={inputClass(!!errors.firstLoginDate)}
        />
      </Field>

      <p role="alert" aria-live="polite" className="min-h-[1rem] text-sm text-alarm-700">
        {formError}
      </p>

      <div className="flex justify-end gap-2 pt-1">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg border border-ink-200 px-4 py-2 text-sm font-medium hover:bg-ink-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={busy}
          className="rounded-lg bg-vault-600 px-4 py-2 text-sm font-semibold text-white hover:bg-vault-700 disabled:opacity-60"
        >
          {busy ? 'Saving…' : 'Save'}
        </button>
      </div>
    </form>
  );
}
