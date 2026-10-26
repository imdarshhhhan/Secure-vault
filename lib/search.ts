import { getDisplayDomain } from './domain-matching';
import type { Credential, SortMode } from './types';

/** Case-insensitive search across site name, domain and username. */
export function filterCredentials(credentials: Credential[], query: string): Credential[] {
  const q = query.trim().toLowerCase();
  if (!q) return credentials;
  return credentials.filter(
    (c) =>
      c.siteName.toLowerCase().includes(q) ||
      getDisplayDomain(c.siteUrl).toLowerCase().includes(q) ||
      c.username.toLowerCase().includes(q),
  );
}

export function sortCredentials(credentials: Credential[], mode: SortMode): Credential[] {
  const copy = [...credentials];
  if (mode === 'recent') {
    return copy.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }
  return copy.sort(
    (a, b) =>
      a.siteName.localeCompare(b.siteName, undefined, { sensitivity: 'base' }) ||
      a.username.localeCompare(b.username, undefined, { sensitivity: 'base' }),
  );
}
