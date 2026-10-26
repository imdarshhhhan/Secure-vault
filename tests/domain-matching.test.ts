import { describe, expect, it } from 'vitest';
import { domainsMatch, findMatchingCredentials, isSameAccount, normalizeUrl } from '../lib/domain-matching';

describe('domain matching', () => {
  it('matches a login page to the saved site', () => {
    expect(domainsMatch('https://github.com/login', 'https://github.com')).toBe(true);
  });
  it('ignores a leading www and letter case', () => {
    expect(domainsMatch('https://www.GitHub.com', 'https://github.com')).toBe(true);
  });
  it('does not treat look-alike domains as equal', () => {
    expect(domainsMatch('https://example-login.com', 'https://example.com')).toBe(false);
    expect(domainsMatch('https://example.com.evil.io', 'https://example.com')).toBe(false);
    expect(domainsMatch('https://notexample.com', 'https://example.com')).toBe(false);
  });
  it('does not match other subdomains', () => {
    expect(domainsMatch('https://gist.github.com', 'https://github.com')).toBe(false);
    expect(domainsMatch('https://github.com', 'https://gist.github.com')).toBe(false);
    expect(domainsMatch('https://a.github.com', 'https://a.github.com/x')).toBe(true);
  });
  it('does not match unicode look-alikes', () => {
    expect(domainsMatch('https://gіthub.com', 'https://github.com')).toBe(false); // Cyrillic "і"
  });
  it('rejects non-web addresses', () => {
    expect(normalizeUrl('javascript:alert(1)')).toBeNull();
    expect(normalizeUrl('chrome://extensions')).toBeNull();
    expect(normalizeUrl('ftp://example.com')).toBeNull();
    expect(normalizeUrl('not a url')).toBeNull();
    expect(normalizeUrl('')).toBeNull();
  });
  it('adds https:// when the scheme is missing', () => {
    expect(normalizeUrl('github.com')).toBe('https://github.com');
  });
  it('returns only the matching credentials, supporting several accounts per site', () => {
    const creds = [
      { siteUrl: 'https://github.com', username: 'a' },
      { siteUrl: 'https://github.com', username: 'b' },
      { siteUrl: 'https://gitlab.com', username: 'a' },
    ];
    expect(findMatchingCredentials(creds, 'https://github.com/settings')).toHaveLength(2);
    expect(findMatchingCredentials(creds, 'https://chrome://x')).toHaveLength(0);
  });
  it('treats same site + same username (any case) as a duplicate account', () => {
    expect(
      isSameAccount({ siteUrl: 'https://github.com', username: 'Me@x.com' }, { siteUrl: 'https://www.github.com/', username: 'me@x.com ' }),
    ).toBe(true);
    expect(isSameAccount({ siteUrl: 'https://github.com', username: 'a' }, { siteUrl: 'https://github.com', username: 'b' })).toBe(false);
  });
});
