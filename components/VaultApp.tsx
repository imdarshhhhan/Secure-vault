import { useEffect, useState } from 'react';
import { copyToClipboard, getActiveTabUrl, openFullApp } from '../lib/browser';
import { getDisplayDomain, normalizeUrl } from '../lib/domain-matching';
import type { Credential, CredentialInput, SortMode } from '../lib/types';
import { useVault } from '../hooks/useVault';
import ConfirmDialog from './ConfirmDialog';
import Dashboard from './Dashboard';
import IconButton from './IconButton';
import { LockIcon, SlidersIcon } from './icons';
import Logo from './Logo';
import MasterPasswordForm from './MasterPasswordForm';
import PasswordForm from './PasswordForm';
import PopupHome from './PopupHome';
import SettingsPanel from './SettingsPanel';

type View = { name: 'list' } | { name: 'add' } | { name: 'edit'; id: string } | { name: 'settings' };

interface Props {
  mode: 'popup' | 'full';
}

export default function VaultApp({ mode }: Props) {
  const vault = useVault();
  const [view, setView] = useState<View>({ name: 'list' });
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<SortMode>('alphabetical');
  const [pendingDelete, setPendingDelete] = useState<Credential | null>(null);
  const [currentUrl, setCurrentUrl] = useState<string | null | undefined>(undefined);

  useEffect(() => {
    if (mode !== 'popup') return;
    getActiveTabUrl()
      .then(setCurrentUrl)
      .catch(() => setCurrentUrl(null));
  }, [mode]);

  useEffect(() => {
    if (vault.status !== 'unlocked') {
      setView({ name: 'list' });
      setQuery('');
    }
  }, [vault.status]);

  const backToList = () => setView({ name: 'list' });
  const handleCopy = (c: Credential) => copyToClipboard(c.password, vault.settings.clipboardClearSeconds);

  const handleSave = async (input: CredentialInput) => {
    if (view.name === 'edit') await vault.update(view.id, input);
    else await vault.add(input);
    backToList();
  };

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    await vault.remove(pendingDelete.id);
    setPendingDelete(null);
  };

  const prefill = (() => {
    if (mode !== 'popup' || !currentUrl) return undefined;
    const normalized = normalizeUrl(currentUrl);
    if (!normalized) return undefined;
    const domain = getDisplayDomain(normalized);
    const base = domain.split('.').slice(-2, -1)[0] ?? domain;
    return { siteUrl: new URL(normalized).origin, siteName: base.charAt(0).toUpperCase() + base.slice(1) };
  })();

  const editing = view.name === 'edit' ? vault.credentials.find((c) => c.id === view.id) : undefined;
  const unlocked = vault.status === 'unlocked';

  const shell =
    mode === 'popup'
      ? 'w-[380px] bg-white'
      : 'mx-auto min-h-screen w-full max-w-3xl bg-white sm:my-6 sm:min-h-0 sm:rounded-2xl sm:shadow-lg sm:ring-1 sm:ring-ink-200';

  return (
    <div className={shell}>
      <header className="flex items-center justify-between border-b border-ink-100 px-4 py-3">
        <div className="flex items-center gap-2">
          <Logo />
          <h1 className="text-sm font-semibold">Secure Vault</h1>
        </div>
        <div className="flex items-center gap-1">
          <span
            className={`mr-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${
              unlocked ? 'bg-vault-100 text-vault-700' : 'bg-ink-100 text-ink-700'
            }`}
          >
            {vault.status === 'loading' ? 'Loading' : unlocked ? 'Unlocked' : 'Locked'}
          </span>
          {unlocked && (
            <>
              <IconButton label="Settings" onClick={() => setView({ name: 'settings' })}>
                <SlidersIcon />
              </IconButton>
              <IconButton label="Lock vault" onClick={() => void vault.lock()}>
                <LockIcon />
              </IconButton>
            </>
          )}
        </div>
      </header>

      <main>
        {vault.status === 'loading' && <p className="p-6 text-center text-sm text-ink-500">Loading…</p>}
        {vault.status === 'setup' && <MasterPasswordForm mode="setup" onSubmit={vault.setup} />}
        {vault.status === 'locked' && <MasterPasswordForm mode="unlock" onSubmit={vault.unlock} />}

        {unlocked && view.name === 'settings' && (
          <SettingsPanel settings={vault.settings} onChange={(p) => void vault.changeSettings(p)} onBack={backToList} />
        )}

        {unlocked && view.name === 'add' && (
          <PasswordForm prefill={prefill} onSave={handleSave} onCancel={backToList} />
        )}

        {unlocked && view.name === 'edit' && editing && (
          <PasswordForm key={editing.id} initial={editing} onSave={handleSave} onCancel={backToList} />
        )}

        {unlocked && view.name === 'list' && mode === 'popup' && (
          <PopupHome
            credentials={vault.credentials}
            currentUrl={currentUrl}
            query={query}
            onQueryChange={setQuery}
            onCopy={handleCopy}
            onEdit={(c) => setView({ name: 'edit', id: c.id })}
            onDelete={setPendingDelete}
            onAdd={() => setView({ name: 'add' })}
            onViewAll={openFullApp}
          />
        )}

        {unlocked && view.name === 'list' && mode === 'full' && (
          <Dashboard
            credentials={vault.credentials}
            query={query}
            onQueryChange={setQuery}
            sort={sort}
            onSortChange={setSort}
            onCopy={handleCopy}
            onEdit={(c) => setView({ name: 'edit', id: c.id })}
            onDelete={setPendingDelete}
            onAdd={() => setView({ name: 'add' })}
          />
        )}
      </main>

      <ConfirmDialog
        open={pendingDelete !== null}
        title="Delete this password?"
        message={
          pendingDelete
            ? `“${pendingDelete.siteName}” (${pendingDelete.username}) will be permanently removed from your vault. This cannot be undone.`
            : ''
        }
        confirmLabel="Delete"
        onConfirm={() => void confirmDelete()}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
}
