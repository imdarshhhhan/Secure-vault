import { useMemo } from 'react';
import { findMatchingCredentials, getDisplayDomain, getMatchKey, isInsecurePage } from '../lib/domain-matching';
import { filterCredentials, sortCredentials } from '../lib/search';
import type { Credential } from '../lib/types';
import { ListIcon, PlusIcon } from './icons';
import PasswordCard from './PasswordCard';
import SearchBar from './SearchBar';

interface Props {
  credentials: Credential[];
  currentUrl: string | null | undefined;
  query: string;
  onQueryChange: (q: string) => void;
  onCopy: (c: Credential) => Promise<void>;
  onEdit: (c: Credential) => void;
  onDelete: (c: Credential) => void;
  onAdd: () => void;
  onViewAll: () => void;
}

export default function PopupHome(props: Props) {
  const { credentials, currentUrl, query, onQueryChange, onCopy, onEdit, onDelete, onAdd, onViewAll } = props;
  const searching = query.trim().length > 0;
  const siteKey = currentUrl ? getMatchKey(currentUrl) : null;

  const shown = useMemo(() => {
    if (searching) return sortCredentials(filterCredentials(credentials, query), 'alphabetical');
    return currentUrl ? sortCredentials(findMatchingCredentials(credentials, currentUrl), 'alphabetical') : [];
  }, [credentials, currentUrl, query, searching]);

  let siteLine: React.ReactNode;
  if (currentUrl === undefined) siteLine = <span className="text-ink-500">Checking this tab…</span>;
  else if (!siteKey) {
    siteLine = <span className="text-ink-500">Open a website to see its saved logins.</span>;
  } else {
    siteLine = (
      <>
        <span className="text-ink-500">Current site: </span>
        <span className="font-semibold">{getDisplayDomain(currentUrl as string)}</span>
      </>
    );
  }

  return (
    <div className="space-y-3 p-3">
      <div className="space-y-1 rounded-lg bg-vault-50 px-3 py-2 text-sm">
        <p className="truncate">{siteLine}</p>
        {currentUrl && isInsecurePage(currentUrl) && (
          <p className="text-xs text-brass-700">This page does not use HTTPS. Be careful before pasting a password.</p>
        )}
      </div>

      <SearchBar value={query} onChange={onQueryChange} />

      <div className="max-h-[320px] overflow-y-auto">
        {shown.length > 0 ? (
          <>
            <p className="mb-2 text-xs font-medium text-ink-500">
              {searching ? 'Search results' : `Saved logins for this site (${shown.length})`}
            </p>
            <ul className="space-y-2">
              {shown.map((c) => (
                <PasswordCard key={c.id} credential={c} onCopy={onCopy} onEdit={onEdit} onDelete={onDelete} />
              ))}
            </ul>
          </>
        ) : (
          <div className="rounded-lg border border-dashed border-ink-200 px-4 py-6 text-center text-sm text-ink-700">
            {searching
              ? 'No saved passwords match your search.'
              : credentials.length === 0
                ? 'Your vault is empty. Add your first password to get started.'
                : siteKey
                  ? 'No saved passwords found for this website.'
                  : 'Search to find a saved password.'}
          </div>
        )}
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={onAdd}
          className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-vault-600 px-3 py-2 text-sm font-semibold text-white hover:bg-vault-700"
        >
          <PlusIcon /> Add password
        </button>
        <button
          type="button"
          onClick={onViewAll}
          className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-ink-200 px-3 py-2 text-sm font-medium hover:bg-ink-50"
        >
          <ListIcon /> View all passwords
        </button>
      </div>
    </div>
  );
}
