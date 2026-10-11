import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const START = '(?<![A-Za-z0-9_-])'; // トークンの始まり
const END = '(?![A-Za-z0-9_-])'; // トークンの終わり
// 報告用にクラスの残りの部分を拾う(text-red-500/50、duration-[150ms] など)
const TAIL = '(?:[A-Za-z0-9_.%/-]|\\[[^\\]\\s]*\\])';
const COLOR_PREFIX =
  '(?:bg|text|border|border-[trblxyse]|ring|outline|fill|stroke)';
const PALETTE =
  '(?:red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|violet|purple|fuchsia|pink|rose|slate|gray|neutral|stone)';
const ARBITRARY_COLOR =
  '\\[(?:#|rgba?\\(|hsla?\\(|oklch\\(|oklab\\(|lab\\(|lch\\(|color\\(|color:)[^\\]\\s]*\\]';

const CLASS_RULES: RegExp[] = [
  START + 'animate-' + TAIL + '+',
  START + 'transition-(?!colors' + END + ')' + TAIL + '+',
  START + 'duration-(?!150' + END + ')' + TAIL + '+',
  START + 'bg-(?:gradient|linear)-' + TAIL + '+',
  START + 'bg-(?:radial|conic)(?![A-Za-z0-9_])' + TAIL + '*',
  START + '(?:from|via|to)-' + TAIL + '+',
  START + 'rounded-full' + END,
  START + COLOR_PREFIX + '-' + PALETTE + '-\\d' + TAIL + '*',
  START + COLOR_PREFIX + '-' + ARBITRARY_COLOR,
].map((p) => new RegExp(p, 'g'));

function blankCssDeclarations(css: string): string {
  return css.replace(
    /(^|[{;])(\s*)([A-Za-z0-9-]+)(?=\s*:)/gm,
    (_m, a: string, b: string, name: string) => a + b + ' '.repeat(name.length),
  );
}

function findClassViolations(source: string, isCss = false): string[] {
  const text = isCss ? blankCssDeclarations(source) : source;
  return CLASS_RULES.flatMap((re) => [...text.matchAll(re)].map((m) => m[0]));
}

function findClientDirectives(source: string): string[] {
  return [...source.matchAll(/client:[a-z][A-Za-z0-9_-]*/g)].map((m) => m[0]);
}

const root = fileURLToPath(new URL('../../', import.meta.url));
const srcDir = path.join(root, 'src');
const files = readdirSync(srcDir, { recursive: true }).map(
  (f) => 'src/' + String(f).split(path.sep).join('/'),
);

const classTargets = files.filter(
  (f) =>
    /\.(astro|ts|css)$/.test(f) &&
    !(f.endsWith('.ts') && f.startsWith('src/content/')),
);
const clientTargets = files.filter((f) => /\.(astro|mdx)$/.test(f));
const jsxFiles = files.filter((f) => /\.(tsx|jsx)$/.test(f));

describe('findClassViolations', () => {
  it.each([
    'animate-spin',
    'transition-all',
    'duration-300',
    'bg-gradient-to-r',
    'from-zinc-50',
    'text-red-500',
    'rounded-full',
    'to-transparent',
    'border-t-red-500',
    'text-[#ff0000]',
    'dark:bg-radial',
    'hover:animate-bounce',
    '<div class="md:rounded-full">',
    '<div class="text-red-500/50 p-2">',
  ])('違反: %s', (input) => {
    expect(findClassViolations(input)).not.toEqual([]);
  });

  it.each([
    'transition-colors',
    'duration-150',
    'transition-colors duration-150',
    'text-zinc-500',
    'text-indigo-600',
    'end-to-end',
    'back-to-top',
    'data-animate-x',
    'my-rounded-full',
    "import { X } from '../lib/site';",
    'shadow-red-500',
    'text-[14px]',
    'transition',
  ])('違反でない: %s', (input) => {
    expect(findClassViolations(input)).toEqual([]);
  });

  it('CSS のプロパティ宣言は判定から外す', () => {
    expect(
      findClassViolations(
        'a { transition-property: color; transition-duration: 300ms; }',
        true,
      ),
    ).toEqual([]);
  });

  it('CSS の @apply は判定する', () => {
    expect(findClassViolations('@apply transition-all;', true)).toEqual([
      'transition-all',
    ]);
  });
});

describe('findClientDirectives', () => {
  it('client:load を検出する', () => {
    expect(findClientDirectives('<Foo client:load />')).toEqual([
      'client:load',
    ]);
  });

  it('client:only を検出する', () => {
    expect(findClientDirectives('<Foo client:only="preact" />')).not.toEqual(
      [],
    );
  });

  it('ディレクティブがなければ空', () => {
    expect(findClientDirectives('<Foo />')).toEqual([]);
  });
});

describe('src/ のソース', () => {
  it('色と動きの規律に反するクラスがない', () => {
    const violations = classTargets.flatMap((rel) =>
      findClassViolations(
        readFileSync(path.join(root, rel), 'utf8'),
        rel.endsWith('.css'),
      ).map((m) => `${rel}: ${m}`),
    );
    expect(violations).toEqual([]);
  });

  it('.tsx / .jsx がない', () => {
    expect(jsxFiles).toEqual([]);
  });

  it('client: ディレクティブがない', () => {
    const found = clientTargets.flatMap((rel) =>
      findClientDirectives(readFileSync(path.join(root, rel), 'utf8')).map(
        (d) => `${rel}: ${d}`,
      ),
    );
    expect(found).toEqual([]);
  });
});
