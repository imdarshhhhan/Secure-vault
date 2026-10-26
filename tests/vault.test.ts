import { beforeEach, describe, expect, it } from 'vitest';
import { DecryptionError, DuplicateCredentialError, ValidationError, VaultLockedError } from '../lib/errors';
import { getEncryptedVault, getSessionKey, resetMemoryStorageForTests } from '../lib/storage';
import type { CredentialInput } from '../lib/types';
import {
  addCredential,
  createVault,
  deleteCredential,
  isUnlocked,
  loadCredentials,
  lockVault,
  unlockVault,
  updateCredential,
} from '../lib/vault';

const ITER = 1000;
const MASTER = 'a long master passphrase';
const github: CredentialInput = {
  siteName: 'GitHub',
  siteUrl: 'https://github.com',
  username: 'me@example.com',
  password: 'S3cret-Pa$$word-123',
  firstLoginDate: '',
};

beforeEach(() => resetMemoryStorageForTests());

describe('vault', () => {
  it('never stores plaintext credentials or the master password', async () => {
    await createVault(MASTER, ITER);
    await addCredential(github);
    const stored = JSON.stringify(await getEncryptedVault());
    for (const secret of [github.password, github.username, 'GitHub', 'github.com', MASTER]) {
      expect(stored).not.toContain(secret);
    }
  });

  it('keeps the unlock key out of persistent storage and drops it on lock', async () => {
    await createVault(MASTER, ITER);
    expect(await isUnlocked()).toBe(true);
    expect(JSON.stringify(await getEncryptedVault())).not.toContain(String(await getSessionKey()));
    await lockVault();
    expect(await isUnlocked()).toBe(false);
    await expect(loadCredentials()).rejects.toBeInstanceOf(VaultLockedError);
  });

  it('unlocks with the right master password and rejects the wrong one', async () => {
    await createVault(MASTER, ITER);
    await addCredential(github);
    await lockVault();
    await expect(unlockVault('wrong password!!')).rejects.toBeInstanceOf(DecryptionError);
    expect(await isUnlocked()).toBe(false);
    const creds = await unlockVault(MASTER);
    expect(creds).toHaveLength(1);
    expect(creds[0].password).toBe(github.password);
  });

  it('adds, edits and deletes entries, tracking dates', async () => {
    await createVault(MASTER, ITER);
    const added = await addCredential({ ...github, firstLoginDate: '2020-05-01' });
    expect(added.createdAt).toBe(added.updatedAt);
    expect(added.firstLoginDate).toBe('2020-05-01');

    await new Promise((r) => setTimeout(r, 5));
    const updated = await updateCredential(added.id, { ...github, password: 'new-password-456' });
    expect(updated.createdAt).toBe(added.createdAt);
    expect(updated.updatedAt > added.updatedAt).toBe(true);
    expect((await loadCredentials())[0].password).toBe('new-password-456');

    await deleteCredential(added.id);
    expect(await loadCredentials()).toHaveLength(0);
  });

  it('allows several accounts per site but blocks exact duplicates', async () => {
    await createVault(MASTER, ITER);
    await addCredential(github);
    await addCredential({ ...github, username: 'work@example.com' });
    await expect(addCredential({ ...github, siteUrl: 'https://www.github.com/login', username: 'ME@example.com' })).rejects.toBeInstanceOf(
      DuplicateCredentialError,
    );
    expect(await loadCredentials()).toHaveLength(2);
  });

  it('validates input', async () => {
    await createVault(MASTER, ITER);
    await expect(addCredential({ ...github, siteUrl: 'not a url' })).rejects.toBeInstanceOf(ValidationError);
    await expect(addCredential({ ...github, password: '' })).rejects.toBeInstanceOf(ValidationError);
    await expect(addCredential({ ...github, firstLoginDate: '2999-01-01' })).rejects.toBeInstanceOf(ValidationError);
  });
});
