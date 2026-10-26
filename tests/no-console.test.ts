import { readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const full = path.join(dir, name);
    return statSync(full).isDirectory() ? sourceFiles(full) : /\.(ts|tsx)$/.test(name) ? [full] : [];
  });
}

describe('logging safety', () => {
  it('has no console.* calls anywhere in the app source (so secrets cannot be logged)', () => {
    const offenders = ['lib', 'hooks', 'components', 'pages', 'extension']
      .flatMap((dir) => sourceFiles(path.join(process.cwd(), dir)))
      .filter((file) => /\bconsole\.\w+/.test(readFileSync(file, 'utf8')));
    expect(offenders).toEqual([]);
  });
});
