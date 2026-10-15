import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const root = fileURLToPath(new URL('../../', import.meta.url));

describe('vercel.json', () => {
  const config: unknown = JSON.parse(
    readFileSync(path.join(root, 'vercel.json'), 'utf-8'),
  );

  it('framework、buildCommand、outputDirectory、trailingSlash の 4 つだけを持つ', () => {
    expect(config).toStrictEqual({
      framework: 'astro',
      buildCommand: 'npm run build',
      outputDirectory: 'dist',
      trailingSlash: true,
    });
  });
});
