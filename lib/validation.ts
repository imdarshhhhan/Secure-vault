import { normalizeUrl } from './domain-matching';
import type { CredentialInput, FieldErrors } from './types';

export const MIN_MASTER_PASSWORD_LENGTH = 12;

export interface ValidationResult {
  valid: boolean;
  errors: FieldErrors;
  /** Trimmed values with the URL normalised. Only meaningful when valid. */
  value: CredentialInput;
}

export function todayISO(): string {
  const d = new Date();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${month}-${day}`;
}

export function validateCredentialInput(input: CredentialInput): ValidationResult {
  const errors: FieldErrors = {};
  const siteName = input.siteName.trim();
  const username = input.username.trim();
  const rawUrl = input.siteUrl.trim();
  const firstLoginDate = input.firstLoginDate.trim();

  if (!siteName) errors.siteName = 'Enter a site name, for example GitHub.';
  else if (siteName.length > 100) errors.siteName = 'Keep the site name under 100 characters.';

  let siteUrl = rawUrl;
  if (!rawUrl) errors.siteUrl = 'Enter the website address, for example https://github.com.';
  else {
    const normalized = normalizeUrl(rawUrl);
    if (!normalized) errors.siteUrl = 'That is not a valid web address. Use something like https://github.com.';
    else siteUrl = normalized;
  }

  if (!username) errors.username = 'Enter the username or email for this account.';
  else if (username.length > 256) errors.username = 'Keep the username under 256 characters.';

  if (!input.password) errors.password = 'Enter a password, or generate one.';
  else if (input.password.length > 1024) errors.password = 'That password is too long (1024 characters max).';

  if (firstLoginDate) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(firstLoginDate) || Number.isNaN(Date.parse(firstLoginDate))) {
      errors.firstLoginDate = 'Use a valid date.';
    } else if (firstLoginDate > todayISO()) {
      errors.firstLoginDate = 'The first login date cannot be in the future.';
    }
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
    value: { siteName, siteUrl, username, password: input.password, firstLoginDate },
  };
}

export function validateMasterPassword(password: string, confirm: string): string | null {
  if (password.length < MIN_MASTER_PASSWORD_LENGTH) {
    return `Use at least ${MIN_MASTER_PASSWORD_LENGTH} characters. A short sentence of random words works well.`;
  }
  if (password !== confirm) return 'The two passwords do not match.';
  return null;
}
