import { describe, expect, it } from 'vitest';
import { generatePassword } from '../lib/password-generator';

describe('password generator', () => {
  it('honours length and includes every character class', () => {
    for (let i = 0; i < 50; i++) {
      const pw = generatePassword({ length: 20 });
      expect(pw).toHaveLength(20);
      expect(pw).toMatch(/[a-z]/);
      expect(pw).toMatch(/[A-Z]/);
      expect(pw).toMatch(/[0-9]/);
      expect(pw).toMatch(/[^a-zA-Z0-9]/);
    }
  });
  it('produces different passwords each time', () => {
    expect(generatePassword()).not.toEqual(generatePassword());
  });
  it('clamps the length to a safe range', () => {
    expect(generatePassword({ length: 2 })).toHaveLength(8);
    expect(generatePassword({ length: 500 })).toHaveLength(64);
  });
});
