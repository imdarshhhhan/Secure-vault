import { useMemo } from 'react';
import { filterCredentials, sortCredentials } from '../lib/search';
import type { Credential, SortMode } from '../lib/types';
import { PlusIcon } from './icons';
import PasswordCard from './PasswordCard';
import SearchBar from './SearchBar';

interface Props {
  credentials: Credential[];
  query: string;
  onQueryChange: (q: string) => void;
  sort: SortMode;
  onSortChange: (s: SortMode) => void;
  onCopy: (c: Credential) => Promise<void>;
  onEdit: (c: Credential) => void;
  onDelete: (c: Credential) => void;
  onAdd: () => void;
}

export default function Dashboard(props: Props) {
  const { credentials, query, onQueryChange, sort, onSortChange, onCopy, onEdit, onDelete, onAdd } = props;
  const shown = useMemo(() => sortCredentials(filterCredentials(credentials, query), sort), [credentials, query, sort]);

  return (
    <div className="space-y-4 p-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="min-w-[200px] flex-1">
          <SearchBar value={query} onChange={onQueryChange} placeholder="Search by site, domain or username" />
        </div>
        <label className="sr-only" htmlFor="sort">
          Sort passwords
        </label>
        <select
          id="sort"
          value={sort}
          onChange={(e) => onSortChange(e.target.value as SortMode)}
          className="rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm"
        >
          <option value="alphabetical">A to Z</option>
          <option value="recent">Recently added</option>
        </select>
        <button
          type="button"
          onClick={onAdd}
          className="inline-flex items-center gap-1.5 rounded-lg bg-vault-600 px-3 py-2 text-sm font-semibold text-white hover:bg-vault-700"
        >
          <PlusIcon /> Add password
        </button>
      </div>

      {shown.length > 0 ? (
        <ul className="space-y-2" aria-label="Saved passwords">
          {shown.map((c) => (
            <PasswordCard key={c.id} credential={c} onCopy={onCopy} onEdit={onEdit} onDelete={onDelete} />
          ))}
        </ul>
      ) : (
        <div className="rounded-xl border border-dashed border-ink-200 px-6 py-12 text-center">
          <p className="text-sm font-semibold">
            {credentials.length === 0 ? 'No passwords saved yet' : 'Nothing matches your search'}
          </p>
          <p className="mt-1 text-sm text-ink-700">
            {credentials.length === 0
              ? 'Add your first login. It is encrypted before it is saved on this device.'
              : 'Try a different site name, domain or username.'}
          </p>
          {credentials.length === 0 && (
            <button
              type="button"
              onClick={onAdd}
              className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-vault-600 px-4 py-2 text-sm font-semibold text-white hover:bg-vault-700"
            >
              <PlusIcon /> Add your first password
            </button>
          )}
        </div>
      )}
    </div>
  );
}
