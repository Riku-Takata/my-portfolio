import {
  closeSync,
  existsSync,
  openSync,
  readdirSync,
  readSync,
} from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { SITE_URL } from '../../src/lib/site';
import { allFiles, distDir, htmlFiles, metas, readDist } from './html';

const projectsDir = fileURLToPath(
  new URL('../../src/content/projects/', import.meta.url),
);
const slugs = readdirSync(projectsDir)
  .filter((f) => f.endsWith('.mdx'))
  .map((f) => f.slice(0, -'.mdx'.length));
const expected = ['index', ...slugs];

function header(file: string): Buffer {
  const fd = openSync(file, 'r');
  try {
    const buf = Buffer.alloc(24);
    readSync(fd, buf, 0, 24, 0);
    return buf;
  } finally {
    closeSync(fd);
  }
}

describe('OGP 画像', () => {
  it('dist/og の PNG は index と各プロジェクトだけ', () => {
    const pngs = readdirSync(path.join(distDir, 'og'))
      .filter((f) => f.endsWith('.png'))
      .sort();
    expect(pngs).toEqual(expected.map((s) => `${s}.png`).sort());
  });

  it.each(expected)('%s.png は 1200x630 の PNG', (slug) => {
    const file = path.join(distDir, 'og', `${slug}.png`);
    expect(existsSync(file), `${file} がない`).toBe(true);
    const buf = header(file);
    expect([...buf.subarray(0, 8)]).toEqual([
      0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
    ]);
    expect(buf.subarray(12, 16).toString('ascii')).toBe('IHDR');
    expect(buf.readUInt32BE(16)).toBe(1200);
    expect(buf.readUInt32BE(20)).toBe(630);
  });

  it('すべての HTML の og:image が指すファイルがある', () => {
    const missing: string[] = [];
    for (const file of htmlFiles()) {
      for (const value of metas(readDist(file), 'property', 'og:image')) {
        if (!value.startsWith(SITE_URL)) {
          missing.push(`${file}: ${value} (SITE_URL で始まらない)`);
          continue;
        }
        const p = value.slice(SITE_URL.length);
        if (!existsSync(path.join(distDir, p))) {
          missing.push(`${file}: ${value} (${p} がない)`);
        }
      }
    }
    expect(missing).toEqual([]);
  });

  it('フォント(.otf / NotoSansJP)が dist に出ていない', () => {
    const fonts = allFiles().filter(
      (f) => f.endsWith('.otf') || f.includes('NotoSansJP'),
    );
    expect(fonts).toEqual([]);
  });
});
