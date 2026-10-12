import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const root = fileURLToPath(new URL('../../', import.meta.url));
const read = (f: string) => readFileSync(path.join(root, f), 'utf-8');

// 静的 import(import type と副作用だけの import を含む)と動的 import() の指定子
function importSpecifiers(source: string): string[] {
  const patterns = [
    /\bimport\s+(?:type\s+)?[^'"`;]*?\bfrom\s*['"`]([^'"`]+)['"`]/g,
    /\bimport\s*['"`]([^'"`]+)['"`]/g,
    /\bimport\s*\(\s*['"`]([^'"`]+)['"`]/g,
    /\bexport\s+(?:type\s+)?[^'"`;]*?\bfrom\s*['"`]([^'"`]+)['"`]/g,
  ];
  return patterns.flatMap((re) => [...source.matchAll(re)].map((m) => m[1]));
}

// src/ からの相対パスに直した指定子が src/content/ を指すか
function pointsToContent(file: string, spec: string): boolean {
  if (!spec.startsWith('.')) return /(^|\/)content\//.test(spec);
  const resolved = path.posix.normalize(
    path.posix.join(path.posix.dirname(file), spec),
  );
  return resolved === 'src/content' || resolved.startsWith('src/content/');
}

describe('importSpecifiers', () => {
  it.each([
    ["import { resume } from '../../content/resume';", '../../content/resume'],
    [
      "import type { Resume } from '../../content/resume';",
      '../../content/resume',
    ],
    ["const m = await import('../../content/resume');", '../../content/resume'],
    ["import '../../content/resume';", '../../content/resume'],
  ])('%s', (source, spec) => {
    expect(importSpecifiers(source)).toContain(spec);
  });
});

describe('sections と content の依存', () => {
  const sectionsDir = path.join(root, 'src/components/sections');
  const sectionFiles = (
    readdirSync(sectionsDir, { recursive: true }) as string[]
  )
    .map(
      (f) => 'src/components/sections/' + String(f).split(path.sep).join('/'),
    )
    .filter((f) => /\.(astro|ts|tsx|js|mjs|mdx)$/.test(f));

  it('Hero と About がある', () => {
    expect(sectionFiles).toEqual(
      expect.arrayContaining([
        'src/components/sections/Hero.astro',
        'src/components/sections/About.astro',
      ]),
    );
  });

  it('AC-16: sections/ のファイルは src/content/ を import しない', () => {
    const found = sectionFiles.flatMap((f) =>
      importSpecifiers(read(f))
        .filter((s) => pointsToContent(f, s))
        .map((s) => `${f}: ${s}`),
    );
    expect(found).toEqual([]);
  });

  it('AC-17: pages/index.astro は src/content/resume.ts を import する', () => {
    const file = 'src/pages/index.astro';
    const specs = importSpecifiers(read(file)).map((s) =>
      path.posix.normalize(path.posix.join(path.posix.dirname(file), s)),
    );
    expect(
      specs.some(
        (s) => s === 'src/content/resume' || s === 'src/content/resume.ts',
      ),
    ).toBe(true);
  });
});
