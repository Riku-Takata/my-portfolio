import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  computeSourceHash,
  extractSourceHash,
  isSvgFresh,
} from '../../scripts/lib/diagrams.mjs';

// npm test はリポジトリのルートで流れるので、cwd から求める
const relDir = 'src/assets/diagrams';
const absDir = () => resolve(process.cwd(), relDir);

function listDirect(ext: string): string[] {
  const dir = absDir();
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith(ext))
    .map((entry) => entry.name)
    .sort();
}

const stem = (name: string) => name.slice(0, name.lastIndexOf('.'));

describe('diagram hash functions', () => {
  const mmd = 'flowchart LR\n  A["前処理"] --> B["変位マップ"]\n';
  const svg = `<!-- source-sha256: ${computeSourceHash(mmd)} -->\n<svg></svg>\n`;

  it('computeSourceHash は SHA-256 の小文字16進を返す', () => {
    expect(computeSourceHash('')).toBe(
      'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    );
    expect(computeSourceHash(Buffer.from(mmd, 'utf8'))).toBe(
      computeSourceHash(mmd),
    );
  });

  it('computeSourceHash は改行コードを正規化しない', () => {
    expect(computeSourceHash('a\r\n')).not.toBe(computeSourceHash('a\n'));
  });

  it('extractSourceHash は1行目が正しい形のときだけ値を返す', () => {
    const hash = 'a'.repeat(64);
    expect(extractSourceHash(`<!-- source-sha256: ${hash} -->\n<svg/>`)).toBe(
      hash,
    );
    expect(extractSourceHash('<svg/>')).toBeNull();
    expect(
      extractSourceHash(`<svg/>\n<!-- source-sha256: ${hash} -->`),
    ).toBeNull();
    expect(
      extractSourceHash(`<!-- source-sha256: ${'a'.repeat(63)} -->\n`),
    ).toBeNull();
    expect(
      extractSourceHash(`<!-- source-sha256: ${'A'.repeat(64)} -->\n`),
    ).toBeNull();
  });

  it('isSvgFresh は一致するときだけ true を返す', () => {
    expect(isSvgFresh(mmd, svg)).toBe(true);
    expect(isSvgFresh(mmd + ' ', svg)).toBe(false);
    expect(isSvgFresh(mmd, '<svg></svg>')).toBe(false);
  });
});

describe('src/assets/diagrams', () => {
  it('.mmd が1つ以上ある', () => {
    const mmds = listDirect('.mmd');
    expect(
      mmds.length,
      `${relDir}/ の直下に .mmd が0件です(${absDir()})`,
    ).toBeGreaterThan(0);
  });

  it('すべての .mmd に同じ名前の .svg がある', () => {
    const svgs = listDirect('.svg');
    const missing = listDirect('.mmd')
      .filter((name) => !svgs.includes(`${stem(name)}.svg`))
      .map((name) => `${relDir}/${name}`);
    expect(missing).toEqual([]);
  });

  it('すべての .svg に同じ名前の .mmd がある', () => {
    const mmds = listDirect('.mmd');
    const orphans = listDirect('.svg')
      .filter((name) => !mmds.includes(`${stem(name)}.mmd`))
      .map((name) => `${relDir}/${name}`);
    expect(orphans).toEqual([]);
  });

  it('すべての .svg が今の .mmd に対して新しい', () => {
    const mmds = listDirect('.mmd');
    const stale = listDirect('.svg')
      .filter((name) => mmds.includes(`${stem(name)}.mmd`))
      .flatMap((name) => {
        const mmd = readFileSync(resolve(absDir(), `${stem(name)}.mmd`));
        const svg = readFileSync(resolve(absDir(), name), 'utf8');
        return isSvgFresh(mmd, svg)
          ? []
          : [
              {
                file: `${relDir}/${name}`,
                expected: computeSourceHash(mmd),
                actual: extractSourceHash(svg),
              },
            ];
      });
    expect(stale).toEqual([]);
  });
});
