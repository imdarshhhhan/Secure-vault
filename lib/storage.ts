import { DEFAULT_SETTINGS } from './types';
import type { EncryptedVault, Settings } from './types';

/**
 * Thin storage layer. Three places data can live:
 *
 *  - Inside the extension:  chrome.storage.local   (encrypted vault + settings, survives restarts)
 *                           chrome.storage.session (the unlock key; RAM only, cleared when Chrome closes)
 *  - `next dev` in a normal tab: localStorage / sessionStorage (so you can try the UI without loading the extension)
 *  - Unit tests (plain Node):    an in-memory Map
 *
 * The master password is never stored anywhere. The derived key only ever goes to the "session" area.
 */

type Area = 'local' | 'session';

const VAULT_KEY = 'vault';
const SETTINGS_KEY = 'settings';
const SESSION_KEY = 'sessionKey';
const WEB_PREFIX = 'securevault:';

const memory: Record<Area, Map<string, string>> = { local: new Map(), session: new Map() };

function chromeArea(area: Area): chrome.storage.StorageArea | null {
  if (typeof chrome === 'undefined' || !chrome.storage) return null;
  return (area === 'local' ? chrome.storage.local : chrome.storage.session) ?? null;
}

function webArea(area: Area): Storage | null {
  try {
    if (typeof window === 'undefined') return null;
    return area === 'local' ? window.localStorage : window.sessionStorage;
  } catch {
    return null;
  }
}

async function getItem<T>(area: Area, key: string): Promise<T | undefined> {
  const ext = chromeArea(area);
  if (ext) {
    const result = await ext.get(key);
    return result[key] as T | undefined;
  }
  const web = webArea(area);
  const raw = web ? web.getItem(WEB_PREFIX + key) : (memory[area].get(key) ?? null);
  return raw ? (JSON.parse(raw) as T) : undefined;
}

async function setItem(area: Area, key: string, value: unknown): Promise<void> {
  const ext = chromeArea(area);
  if (ext) return ext.set({ [key]: value });
  const web = webArea(area);
  const raw = JSON.stringify(value);
  if (web) web.setItem(WEB_PREFIX + key, raw);
  else memory[area].set(key, raw);
}

async function removeItem(area: Area, key: string): Promise<void> {
  const ext = chromeArea(area);
  if (ext) return ext.remove(key);
  const web = webArea(area);
  if (web) web.removeItem(WEB_PREFIX + key);
  else memory[area].delete(key);
}

export const getEncryptedVault = () => getItem<EncryptedVault>('local', VAULT_KEY);
export const saveEncryptedVault = (vault: EncryptedVault) => setItem('local', VAULT_KEY, vault);

export async function getSettings(): Promise<Settings> {
  const stored = await getItem<Partial<Settings>>('local', SETTINGS_KEY);
  return { ...DEFAULT_SETTINGS, ...stored };
}
export const saveSettings = (settings: Settings) => setItem('local', SETTINGS_KEY, settings);

export const getSessionKey = () => getItem<string>('session', SESSION_KEY);
export const setSessionKey = (keyBase64: string) => setItem('session', SESSION_KEY, keyBase64);
export const clearSessionKey = () => removeItem('session', SESSION_KEY);

/** Calls back whenever the vault is locked or unlocked from anywhere (popup, tab, background alarm). */
export function onSessionKeyChange(callback: () => void): () => void {
  if (typeof chrome === 'undefined' || !chrome.storage?.onChanged) return () => {};
  const listener = (changes: Record<string, chrome.storage.StorageChange>, area: string) => {
    if (area === 'session' && SESSION_KEY in changes) callback();
  };
  chrome.storage.onChanged.addListener(listener);
  return () => chrome.storage.onChanged.removeListener(listener);
}

export function resetMemoryStorageForTests(): void {
  memory.local.clear();
  memory.session.clear();
}
