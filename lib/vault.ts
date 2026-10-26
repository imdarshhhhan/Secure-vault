import {
  PBKDF2_ITERATIONS,
  decryptJson,
  deriveKeyBytes,
  encryptJson,
  fromBase64,
  generateSalt,
  toBase64,
} from './crypto';
import { isSameAccount } from './domain-matching';
import {
  DecryptionError,
  DuplicateCredentialError,
  ValidationError,
  VaultLockedError,
  VaultNotFoundError,
} from './errors';
import { clearSessionKey, getEncryptedVault, getSessionKey, saveEncryptedVault, setSessionKey } from './storage';
import type { Credential, CredentialInput, EncryptedVault, VaultData } from './types';
import { validateCredentialInput } from './validation';

/**
 * The vault is ONE encrypted blob (so even site names are hidden on disk).
 * Every change: read + decrypt -> modify -> encrypt with a fresh IV -> write.
 * The unlock key lives only in chrome.storage.session (RAM) while the vault is unlocked.
 */

export async function vaultExists(): Promise<boolean> {
  return (await getEncryptedVault()) !== undefined;
}

export async function isUnlocked(): Promise<boolean> {
  return (await getSessionKey()) !== undefined;
}

/** First-time setup. `iterations` is only overridden by the unit tests. */
export async function createVault(masterPassword: string, iterations: number = PBKDF2_ITERATIONS): Promise<void> {
  if (await vaultExists()) throw new Error('A vault already exists on this device.');
  const salt = generateSalt();
  const keyBytes = await deriveKeyBytes(masterPassword, salt, iterations);
  const empty: VaultData = { version: 1, credentials: [] };
  const encrypted = await encryptJson(empty, keyBytes, { salt: toBase64(salt), iterations });
  await saveEncryptedVault(encrypted);
  await setSessionKey(toBase64(keyBytes));
}

/** Throws DecryptionError when the master password is wrong. */
export async function unlockVault(masterPassword: string): Promise<Credential[]> {
  const stored = await getEncryptedVault();
  if (!stored) throw new VaultNotFoundError();
  const keyBytes = await deriveKeyBytes(masterPassword, fromBase64(stored.salt), stored.iterations);
  const data = await decryptJson<VaultData>(stored, keyBytes);
  await setSessionKey(toBase64(keyBytes));
  return data.credentials;
}

export async function lockVault(): Promise<void> {
  await clearSessionKey();
}

async function openVault(): Promise<{ stored: EncryptedVault; keyBytes: Uint8Array; data: VaultData }> {
  const stored = await getEncryptedVault();
  if (!stored) throw new VaultNotFoundError();
  const sessionKey = await getSessionKey();
  if (!sessionKey) throw new VaultLockedError();
  const keyBytes = fromBase64(sessionKey);
  try {
    return { stored, keyBytes, data: await decryptJson<VaultData>(stored, keyBytes) };
  } catch (error) {
    if (error instanceof DecryptionError) {
      await clearSessionKey(); // stale or invalid key: fall back to locked
      throw new VaultLockedError();
    }
    throw error;
  }
}

async function persist(stored: EncryptedVault, keyBytes: Uint8Array, data: VaultData): Promise<void> {
  const encrypted = await encryptJson(data, keyBytes, { salt: stored.salt, iterations: stored.iterations });
  await saveEncryptedVault(encrypted);
}

export async function loadCredentials(): Promise<Credential[]> {
  return (await openVault()).data.credentials;
}

export async function addCredential(input: CredentialInput): Promise<Credential> {
  const result = validateCredentialInput(input);
  if (!result.valid) throw new ValidationError(result.errors);

  const { stored, keyBytes, data } = await openVault();
  if (data.credentials.some((c) => isSameAccount(c, result.value))) throw new DuplicateCredentialError();

  const now = new Date().toISOString();
  const credential: Credential = {
    id: crypto.randomUUID(),
    siteName: result.value.siteName,
    siteUrl: result.value.siteUrl,
    username: result.value.username,
    password: result.value.password,
    firstLoginDate: result.value.firstLoginDate || null,
    createdAt: now,
    updatedAt: now,
  };
  await persist(stored, keyBytes, { ...data, credentials: [...data.credentials, credential] });
  return credential;
}

export async function updateCredential(id: string, input: CredentialInput): Promise<Credential> {
  const result = validateCredentialInput(input);
  if (!result.valid) throw new ValidationError(result.errors);

  const { stored, keyBytes, data } = await openVault();
  const existing = data.credentials.find((c) => c.id === id);
  if (!existing) throw new Error('That entry no longer exists.');
  if (data.credentials.some((c) => c.id !== id && isSameAccount(c, result.value))) {
    throw new DuplicateCredentialError();
  }

  const updated: Credential = {
    ...existing,
    siteName: result.value.siteName,
    siteUrl: result.value.siteUrl,
    username: result.value.username,
    password: result.value.password,
    firstLoginDate: result.value.firstLoginDate || null,
    updatedAt: new Date().toISOString(),
  };
  await persist(stored, keyBytes, {
    ...data,
    credentials: data.credentials.map((c) => (c.id === id ? updated : c)),
  });
  return updated;
}

export async function deleteCredential(id: string): Promise<void> {
  const { stored, keyBytes, data } = await openVault();
  await persist(stored, keyBytes, { ...data, credentials: data.credentials.filter((c) => c.id !== id) });
}
