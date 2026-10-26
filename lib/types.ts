/** One saved login. This whole object only ever exists in memory or inside the encrypted vault blob. */
export interface Credential {
  id: string;
  siteName: string;
  siteUrl: string;
  username: string;
  password: string;
  /** Only set when the user typed it in. We never guess a website's real first-login date. */
  firstLoginDate: string | null;
  createdAt: string;
  updatedAt: string;
}

/** What the forms produce. firstLoginDate is '' when the user left it empty. */
export interface CredentialInput {
  siteName: string;
  siteUrl: string;
  username: string;
  password: string;
  firstLoginDate: string;
}

export type FieldErrors = Partial<Record<keyof CredentialInput, string>>;

/** The plaintext that gets encrypted. */
export interface VaultData {
  version: 1;
  credentials: Credential[];
}

/** What is written to chrome.storage.local. Contains NO plaintext secrets. */
export interface EncryptedVault {
  version: 1;
  kdf: 'PBKDF2-SHA256';
  iterations: number;
  /** base64, unique per vault */
  salt: string;
  /** base64, 12 bytes, fresh for every save */
  iv: string;
  /** base64, AES-256-GCM ciphertext + auth tag */
  ciphertext: string;
}

/** Non-secret preferences (stored unencrypted). */
export interface Settings {
  autoLockMinutes: number;
  /** 0 = never clear */
  clipboardClearSeconds: number;
}

export const DEFAULT_SETTINGS: Settings = {
  autoLockMinutes: 5,
  clipboardClearSeconds: 30,
};

export type SortMode = 'alphabetical' | 'recent';
