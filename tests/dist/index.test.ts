import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const indexPath = fileURLToPath(
  new URL('../../dist/index.html', import.meta.url),
);

describe('dist/index.html', () => {
  it('ある', () => {
    expect(existsSync(indexPath)).toBe(true);
  });

  it('<html> の lang が ja', () => {
    const html = readFileSync(indexPath, 'utf-8');
    const match = html.match(/<html\b[^>]*\blang=["']?([^"'\s>]+)/i);
    expect(match?.[1]).toBe('ja');
  });
});
