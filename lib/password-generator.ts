export interface GeneratorOptions {
  length: number;
  lowercase: boolean;
  uppercase: boolean;
  digits: boolean;
  symbols: boolean;
}

export const DEFAULT_GENERATOR_OPTIONS: GeneratorOptions = {
  length: 20,
  lowercase: true,
  uppercase: true,
  digits: true,
  symbols: true,
};

const SETS = {
  lowercase: 'abcdefghijkmnopqrstuvwxyz', // no "l"
  uppercase: 'ABCDEFGHJKLMNPQRSTUVWXYZ', // no "I" or "O"
  digits: '23456789', // no "0" or "1"
  symbols: '!@#$%^&*()-_=+[]{};:,.?',
} as const;

/** Uniform random integer in [0, max) using the browser's secure RNG (no modulo bias). */
function randomIndex(max: number): number {
  const limit = Math.floor(0x100000000 / max) * max;
  const buffer = new Uint32Array(1);
  do {
    crypto.getRandomValues(buffer);
  } while (buffer[0] >= limit);
  return buffer[0] % max;
}

export function generatePassword(options: Partial<GeneratorOptions> = {}): string {
  const opts = { ...DEFAULT_GENERATOR_OPTIONS, ...options };
  const length = Math.min(64, Math.max(8, Math.floor(opts.length)));
  const pools = (['lowercase', 'uppercase', 'digits', 'symbols'] as const)
    .filter((name) => opts[name])
    .map((name) => SETS[name]);
  if (pools.length === 0) throw new Error('Choose at least one kind of character.');

  // Guarantee one character from every selected pool, then fill the rest from all of them.
  const all = pools.join('');
  const chars = pools.map((pool) => pool[randomIndex(pool.length)]);
  while (chars.length < length) chars.push(all[randomIndex(all.length)]);

  // Fisher–Yates shuffle so the guaranteed characters aren't always first.
  for (let i = chars.length - 1; i > 0; i--) {
    const j = randomIndex(i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }
  return chars.join('');
}
