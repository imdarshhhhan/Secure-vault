import { DecryptionError } from './errors';
import type { EncryptedVault } from './types';

/**
 * All cryptography lives in this one file, using only the browser's built-in Web Crypto API.
 *
 *  - Key derivation: PBKDF2-HMAC-SHA256 from the master password + a random 16-byte salt.
 *  - Encryption:     AES-256-GCM (authenticated), fresh random 12-byte IV for every encryption.
 *
 * Nothing here ever logs or stores the master password or the derived key.
 */

// OWASP's 2023 recommendation for PBKDF2-HMAC-SHA256.
export const PBKDF2_ITERATIONS = 600_000;
const SALT_BYTES = 16;
const IV_BYTES = 12;

const encoder = new TextEncoder();
const decoder = new TextDecoder();
// "Additional authenticated data": binds the ciphertext to this app + format version.
const AAD = encoder.encode('securevault:vault:v1');

export function randomBytes(length: number): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(length));
}

export function generateSalt(): Uint8Array {
  return randomBytes(SALT_BYTES);
}

export function toBase64(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

export function fromBase64(value: string): Uint8Array {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

/** Turns the master password into 32 bytes of key material. Deliberately slow. */
export async function deriveKeyBytes(
  masterPassword: string,
  salt: Uint8Array,
  iterations: number,
): Promise<Uint8Array> {
  const material = await crypto.subtle.importKey('raw', encoder.encode(masterPassword), 'PBKDF2', false, [
    'deriveBits',
  ]);
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', hash: 'SHA-256', salt: salt as BufferSource, iterations },
    material,
    256,
  );
  return new Uint8Array(bits);
}

function importAesKey(keyBytes: Uint8Array, usage: 'encrypt' | 'decrypt'): Promise<CryptoKey> {
  // extractable = false: the CryptoKey object itself can never be exported again.
  return crypto.subtle.importKey('raw', keyBytes as BufferSource, 'AES-GCM', false, [usage]);
}

export async function encryptJson(
  data: unknown,
  keyBytes: Uint8Array,
  params: { salt: string; iterations: number },
): Promise<EncryptedVault> {
  const iv = randomBytes(IV_BYTES); // never reuse an IV with the same key
  const key = await importAesKey(keyBytes, 'encrypt');
  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: iv as BufferSource, additionalData: AAD },
    key,
    encoder.encode(JSON.stringify(data)),
  );
  return {
    version: 1,
    kdf: 'PBKDF2-SHA256',
    iterations: params.iterations,
    salt: params.salt,
    iv: toBase64(iv),
    ciphertext: toBase64(new Uint8Array(ciphertext)),
  };
}

export async function decryptJson<T>(vault: EncryptedVault, keyBytes: Uint8Array): Promise<T> {
  try {
    const key = await importAesKey(keyBytes, 'decrypt');
    const plaintext = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: fromBase64(vault.iv) as BufferSource, additionalData: AAD },
      key,
      fromBase64(vault.ciphertext) as BufferSource,
    );
    return JSON.parse(decoder.decode(plaintext)) as T;
  } catch {
    // Deliberately vague: don't reveal whether the key or the data was at fault.
    throw new DecryptionError();
  }
}
