import type { Settings } from '../lib/types';
import { ArrowLeftIcon } from './icons';

interface Props {
  settings: Settings;
  onChange: (patch: Partial<Settings>) => void;
  onBack: () => void;
}

const AUTOLOCK_OPTIONS = [1, 5, 15, 30, 60];
const CLIPBOARD_OPTIONS: Array<[number, string]> = [
  [30, '30 seconds'],
  [60, '1 minute'],
  [120, '2 minutes'],
  [0, 'Never'],
];

export default function SettingsPanel({ settings, onChange, onBack }: Props) {
  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onBack}
          aria-label="Back"
          className="rounded-lg p-1.5 text-ink-500 hover:bg-ink-100 hover:text-ink-900"
        >
          <ArrowLeftIcon />
        </button>
        <h2 className="text-base font-semibold">Settings</h2>
      </div>

      <div>
        <label htmlFor="autolock" className="mb-1 block text-sm font-medium">
          Lock the vault after inactivity
        </label>
        <select
          id="autolock"
          value={settings.autoLockMinutes}
          onChange={(e) => onChange({ autoLockMinutes: Number(e.target.value) })}
          className="w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm"
        >
          {AUTOLOCK_OPTIONS.map((m) => (
            <option key={m} value={m}>
              {m === 1 ? '1 minute' : `${m} minutes`}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="clipboard" className="mb-1 block text-sm font-medium">
          Clear the clipboard after copying
        </label>
        <select
          id="clipboard"
          value={settings.clipboardClearSeconds}
          onChange={(e) => onChange({ clipboardClearSeconds: Number(e.target.value) })}
          className="w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm"
        >
          {CLIPBOARD_OPTIONS.map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <p className="mt-1 text-xs text-ink-500">
          This is best-effort. Your browser or operating system (or a clipboard history tool) may keep a copy.
        </p>
      </div>

      <div className="rounded-lg bg-vault-50 p-3 text-xs text-ink-700">
        <p className="font-semibold text-vault-700">How your data is protected</p>
        <ul className="mt-1 list-disc space-y-1 pl-4">
          <li>Everything is encrypted on this device with AES-256-GCM before it is saved.</li>
          <li>Nothing is ever sent to a server. There is no account, no sync and no analytics.</li>
          <li>If you forget your master password, your logins cannot be recovered.</li>
        </ul>
      </div>
    </div>
  );
}
