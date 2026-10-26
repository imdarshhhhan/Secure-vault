import { describe, expect, it } from 'vitest';
import { decryptJson, deriveKeyBytes, encryptJson, fromBase64, generateSalt, toBase64 } from '../lib/crypto';
import { DecryptionError } from '../lib/errors';

const ITER = 1000; // fast for tests; production uses 600,000

describe('crypto', () => {
  it('round-trips data with the right key', async () => {
    const salt = generateSalt();
    const key = await deriveKeyBytes('correct horse battery staple', salt, ITER);
    const blob = await encryptJson({ hello: 'world' }, key, { salt: toBase64(salt), iterations: ITER });
    expect(await decryptJson(blob, key)).toEqual({ hello: 'world' });
  });

  it('rejects a wrong master password', async () => {
    const salt = generateSalt();
    const good = await deriveKeyBytes('right password', salt, ITER);
    const bad = await deriveKeyBytes('wrong password', salt, ITER);
    const blob = await encryptJson({ secret: 1 }, good, { salt: toBase64(salt), iterations: ITER });
    await expect(decryptJson(blob, bad)).rejects.toBeInstanceOf(DecryptionError);
  });

  it('detects tampering with the ciphertext', async () => {
    const salt = generateSalt();
    const key = await deriveKeyBytes('pw', salt, ITER);
    const blob = await encryptJson({ secret: 1 }, key, { salt: toBase64(salt), iterations: ITER });
    const bytes = fromBase64(blob.ciphertext);
    bytes[0] ^= 1;
    await expect(decryptJson({ ...blob, ciphertext: toBase64(bytes) }, key)).rejects.toBeInstanceOf(DecryptionError);
  });

  it('uses a fresh IV for every encryption and never leaks plaintext', async () => {
    const salt = generateSalt();
    const key = await deriveKeyBytes('pw', salt, ITER);
    const params = { salt: toBase64(salt), iterations: ITER };
    const a = await encryptJson({ password: 'hunter2-plaintext' }, key, params);
    const b = await encryptJson({ password: 'hunter2-plaintext' }, key, params);
    expect(a.iv).not.toEqual(b.iv);
    expect(a.ciphertext).not.toEqual(b.ciphertext);
    expect(JSON.stringify(a)).not.toContain('hunter2');
  });

  it('derives different keys for different salts', async () => {
    const k1 = await deriveKeyBytes('pw', generateSalt(), ITER);
    const k2 = await deriveKeyBytes('pw', generateSalt(), ITER);
    expect(toBase64(k1)).not.toEqual(toBase64(k2));
  });
});
