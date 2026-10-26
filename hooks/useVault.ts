import { useCallback, useEffect, useState } from 'react';
import { cancelAutoLock, scheduleAutoLock } from '../lib/browser';
import { VaultLockedError } from '../lib/errors';
import { getSettings, onSessionKeyChange, saveSettings } from '../lib/storage';
import { DEFAULT_SETTINGS } from '../lib/types';
import type { Credential, CredentialInput, Settings } from '../lib/types';
import {
  addCredential,
  createVault,
  deleteCredential,
  isUnlocked,
  loadCredentials,
  lockVault,
  unlockVault,
  updateCredential,
  vaultExists,
} from '../lib/vault';

export type VaultStatus = 'loading' | 'setup' | 'locked' | 'unlocked';

/** Single place where the UI talks to the vault. Decrypted data only lives in this hook's state. */
export function useVault() {
  const [status, setStatus] = useState<VaultStatus>('loading');
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);

  const refresh = useCallback(async () => {
    setSettings(await getSettings());
    if (!(await vaultExists())) {
      setCredentials([]);
      setStatus('setup');
      return;
    }
    if (!(await isUnlocked())) {
      setCredentials([]);
      setStatus('locked');
      return;
    }
    try {
      setCredentials(await loadCredentials());
      setStatus('unlocked');
    } catch (error) {
      if (!(error instanceof VaultLockedError)) throw error;
      setCredentials([]);
      setStatus('locked');
    }
  }, []);

  useEffect(() => {
    refresh().catch(() => setStatus('locked'));
  }, [refresh]);

  useEffect(() => onSessionKeyChange(() => void refresh().catch(() => setStatus('locked'))), [refresh]);

  const lock = useCallback(async () => {
    await lockVault();
    await cancelAutoLock();
    setCredentials([]); // drop decrypted data from memory
    setStatus('locked');
  }, []);

  useEffect(() => {
    if (status !== 'unlocked') return;
    const minutes = Math.max(1, settings.autoLockMinutes);
    let timer: ReturnType<typeof setTimeout>;
    let lastNotified = 0;
    const onActivity = () => {
      clearTimeout(timer);
      timer = setTimeout(() => void lock(), minutes * 60_000);
      const now = Date.now();
      if (now - lastNotified > 10_000) {
        lastNotified = now;
        void scheduleAutoLock(minutes);
      }
    };
    onActivity();
    window.addEventListener('pointerdown', onActivity);
    window.addEventListener('keydown', onActivity);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('pointerdown', onActivity);
      window.removeEventListener('keydown', onActivity);
    };
  }, [status, settings.autoLockMinutes, lock]);

  const setup = useCallback(
    async (masterPassword: string) => {
      await createVault(masterPassword);
      await refresh();
    },
    [refresh],
  );

  const unlock = useCallback(
    async (masterPassword: string) => {
      await unlockVault(masterPassword); // throws DecryptionError when wrong
      await refresh();
    },
    [refresh],
  );

  const add = useCallback(async (input: CredentialInput) => {
    await addCredential(input);
    setCredentials(await loadCredentials());
  }, []);

  const update = useCallback(async (id: string, input: CredentialInput) => {
    await updateCredential(id, input);
    setCredentials(await loadCredentials());
  }, []);

  const remove = useCallback(async (id: string) => {
    await deleteCredential(id);
    setCredentials(await loadCredentials());
  }, []);

  const changeSettings = useCallback(
    async (patch: Partial<Settings>) => {
      const next = { ...settings, ...patch };
      setSettings(next);
      await saveSettings(next);
    },
    [settings],
  );

  return { status, credentials, settings, setup, unlock, lock, add, update, remove, changeSettings };
}
