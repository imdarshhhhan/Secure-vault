import type { FieldErrors } from './types';

export class VaultLockedError extends Error {
  constructor() {
    super('The vault is locked.');
    this.name = 'VaultLockedError';
  }
}

export class VaultNotFoundError extends Error {
  constructor() {
    super('No vault has been created yet.');
    this.name = 'VaultNotFoundError';
  }
}

/** Thrown when AES-GCM authentication fails: wrong master password or tampered data. */
export class DecryptionError extends Error {
  constructor() {
    super('Could not decrypt the vault. The master password is wrong or the data is damaged.');
    this.name = 'DecryptionError';
  }
}

export class DuplicateCredentialError extends Error {
  constructor() {
    super('You already saved this username for this website. Edit the existing entry instead.');
    this.name = 'DuplicateCredentialError';
  }
}

export class ValidationError extends Error {
  errors: FieldErrors;
  constructor(errors: FieldErrors) {
    super('Some fields need attention.');
    this.name = 'ValidationError';
    this.errors = errors;
  }
}
