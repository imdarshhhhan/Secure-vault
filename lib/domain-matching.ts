/**
 * Decides which saved logins belong to the page you are on.
 *
 * Rule: the HOSTNAME must be identical (a single leading "www." is ignored).
 *   github.com       ↔ www.github.com        match
 *   github.com       ↔ github.com/login      match   (paths are ignored)
 *   github.com       ↔ gist.github.com       NO match (other subdomains are other sites)
 *   example.com      ↔ example-login.com     NO match
 *   example.com      ↔ example.com.evil.io   NO match
 *
 * We use the URL parser built into the browser, which also converts look-alike unicode
 * domains to their "punycode" form (xn--...), so they can never equal the real domain.
 * To save a login for a subdomain, just save that subdomain's URL (e.g. https://gist.github.com).
 */

export function normalizeUrl(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;
  const withScheme = /^[a-z][a-z0-9+.-]*:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  try {
    const url = new URL(withScheme);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return null;
    const host = url.hostname;
    const looksLikeHost = host.includes('.') || host === 'localhost' || host.includes(':');
    if (!host || !looksLikeHost) return null;
    url.username = '';
    url.password = '';
    url.hash = '';
    const hasExtras = url.pathname !== '/' || url.search !== '';
    return hasExtras ? url.href : url.origin;
  } catch {
    return null;
  }
}

/** The comparison key used for matching: lowercase hostname without a leading "www.". */
export function getMatchKey(input: string): string | null {
  const normalized = normalizeUrl(input);
  if (!normalized) return null;
  const host = new URL(normalized).hostname.toLowerCase().replace(/\.$/, '');
  return host.startsWith('www.') ? host.slice(4) : host;
}

export function getDisplayDomain(input: string): string {
  return getMatchKey(input) ?? input;
}

export function domainsMatch(a: string, b: string): boolean {
  const keyA = getMatchKey(a);
  const keyB = getMatchKey(b);
  return keyA !== null && keyA === keyB;
}

export function findMatchingCredentials<T extends { siteUrl: string }>(credentials: T[], currentUrl: string): T[] {
  const key = getMatchKey(currentUrl);
  if (!key) return [];
  return credentials.filter((c) => getMatchKey(c.siteUrl) === key);
}

/** Same website + same username (case-insensitive) = the same account. */
export function isSameAccount(
  a: { siteUrl: string; username: string },
  b: { siteUrl: string; username: string },
): boolean {
  return domainsMatch(a.siteUrl, b.siteUrl) && a.username.trim().toLowerCase() === b.username.trim().toLowerCase();
}

/** True for plain-http pages (other than localhost), where a password could be seen in transit. */
export function isInsecurePage(url: string): boolean {
  const normalized = normalizeUrl(url);
  if (!normalized) return false;
  const parsed = new URL(normalized);
  return parsed.protocol === 'http:' && parsed.hostname !== 'localhost' && parsed.hostname !== '127.0.0.1';
}
