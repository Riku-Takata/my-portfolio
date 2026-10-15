import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const root = fileURLToPath(new URL('../../', import.meta.url));
const read = (rel: string) => readFileSync(path.join(root, rel), 'utf8');
const norm = (s: string) => s.replace(/\s+/g, ' ').replace(/'/g, '"').trim();

const css = read('src/styles/global.css');
const pkg = JSON.parse(read('package.json')) as {
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
};
const lock = JSON.parse(read('package-lock.json')) as {
  packages: Record<
    string,
    {
      dependencies?: Record<string, string>;
      devDependencies?: Record<string, string>;
    }
  >;
};
const deps = Object.keys({ ...pkg.dependencies, ...pkg.devDependencies });

const ICONS = ['Github', 'X', 'Mail', 'FileText', 'ArrowRight', 'ExternalLink'];
const iconSrc = (n: string) => read(`src/components/icons/${n}.astro`);

describe('global.css', () => {
  it('tailwindcss と typography を読み込む', () => {
    expect(css).toMatch(/@import\s+['"]tailwindcss['"];/);
    expect(css).toMatch(/@plugin\s+['"]@tailwindcss\/typography['"];/);
  });

  const theme = css.match(/@theme\s*\{([^}]*)\}/)?.[1] ?? '';
  const declared = (name: string) => {
    const re = new RegExp(`${name}\\s*:\\s*([^;]*);`, 'g');
    return [...theme.matchAll(re)].map((m) => norm(m[1]));
  };

  it('--font-sans', () => {
    expect(declared('--font-sans')).toEqual([
      '"Geist Variable", "Hiragino Sans", "Hiragino Kaku Gothic ProN", "Noto Sans JP", "Yu Gothic UI", Meiryo, sans-serif',
    ]);
  });

  it('--font-mono', () => {
    expect(declared('--font-mono')).toEqual([
      '"JetBrains Mono Variable", ui-monospace, monospace',
    ]);
  });

  it('dark のバリアントを上書きしない', () => {
    expect(css).not.toMatch(/@custom-variant\s+dark/);
    expect(css).not.toMatch(/@variant\s+dark/);
  });

  it('フォントを @import で1つずつ読み込む', () => {
    for (const name of ['geist', 'jetbrains-mono']) {
      const re = new RegExp(
        `^@import\\s+['"]@fontsource-variable/${name}(/[^'"]*)?['"]`,
        'gm',
      );
      expect(css.match(re)).toHaveLength(1);
    }
  });
});

describe('src/ のファイル', () => {
  const files = (
    readdirSync(path.join(root, 'src'), { recursive: true }) as string[]
  )
    .map((f) => 'src/' + String(f).split(path.sep).join('/'))
    .filter((f) => /\.(astro|css|ts)$/.test(f));

  it('global.css 以外で @fontsource-variable を読み込まない', () => {
    const found = files
      .filter((f) => f !== 'src/styles/global.css')
      .filter((f) => read(f).includes('@fontsource-variable'));
    expect(found).toEqual([]);
  });

  it('このタスクで作る・変えるファイルに禁止トークンがない', () => {
    const targets = files.filter(
      (f) =>
        f === 'src/styles/global.css' ||
        f === 'src/layouts/BaseLayout.astro' ||
        f === 'src/pages/index.astro' ||
        f.startsWith('src/components/'),
    );
    const tokens = [
      'transform',
      'rotate-',
      'scale-',
      'translate-',
      'backdrop-blur',
      'animate-',
      'rounded-full',
      'bg-gradient',
      'bg-linear',
      'bg-radial',
      'bg-conic',
      'scroll-smooth',
    ];
    const blank = (s: string) =>
      s.replace(
        /(^|[{;])(\s*)([A-Za-z0-9-]+)(?=\s*:)/gm,
        (_m, a: string, b: string, n: string) => a + b + ' '.repeat(n.length),
      );
    const found = targets.flatMap((f) => {
      const text = f.endsWith('.css') ? blank(read(f)) : read(f);
      return tokens
        .filter((t) =>
          new RegExp('(?<![A-Za-z0-9_])-?' + t.replace(/-/g, '\\-')).test(text),
        )
        .map((t) => `${f}: ${t}`);
    });
    expect(found).toEqual([]);
  });
});

describe('package.json', () => {
  it('必要な依存がある', () => {
    const need = [
      '@fontsource-variable/geist',
      '@fontsource-variable/jetbrains-mono',
      '@tailwindcss/typography',
    ];
    expect(need.filter((n) => !deps.includes(n))).toEqual([]);
    const rootPkg = lock.packages[''];
    const lockDeps = Object.keys({
      ...rootPkg.dependencies,
      ...rootPkg.devDependencies,
    });
    expect(need.filter((n) => !lockDeps.includes(n))).toEqual([]);
  });

  it('フォントのパッケージは2つだけで、和文のものがない', () => {
    expect(deps.filter((d) => d.startsWith('@fontsource')).sort()).toEqual([
      '@fontsource-variable/geist',
      '@fontsource-variable/jetbrains-mono',
    ]);
    expect(deps.filter((d) => /noto|jp|japanese/i.test(d))).toEqual([]);
  });

  it('禁止された依存がない', () => {
    const banned = [
      'react',
      'react-dom',
      '@astrojs/react',
      'react-icons',
      'simple-icons',
    ];
    expect(
      deps.filter((d) => banned.includes(d) || /lucide|@iconify/.test(d)),
    ).toEqual([]);
  });
});

describe('アイコンのソース', () => {
  it.each(ICONS)('%s に色の直書きがない', (name) => {
    const src = iconSrc(name);
    const values = [...src.matchAll(/\b(?:fill|stroke)="([^"]*)"/g)].map(
      (m) => m[1],
    );
    expect(values.filter((v) => v !== 'currentColor' && v !== 'none')).toEqual(
      [],
    );
    const found = [
      /style=/,
      /#[0-9a-fA-F]{3,8}\b/,
      /rgba?\(/,
      /hsla?\(/,
      /oklch\(/,
      /\b(black|white|red|blue|green|gray|grey)\b/,
    ].filter((re) => re.test(src));
    expect(found).toEqual([]);
  });

  it.each(['Github', 'X'])('%s の出典コメント', (name) => {
    const src = iconSrc(name);
    expect(src).toContain('Simple Icons');
    expect(src).toContain('CC0');
  });

  it.each(['Mail', 'FileText', 'ArrowRight', 'ExternalLink'])(
    '%s の出典コメントと stroke-width',
    (name) => {
      const src = iconSrc(name);
      expect(src).toContain('Lucide');
      expect(src).toContain('ISC');
      expect(src).toContain('stroke-width="2"');
    },
  );
});

describe('部品のソース', () => {
  it('Section は Container を import して幅を直書きしない', () => {
    const src = read('src/components/common/Section.astro');
    expect(src).toMatch(/from\s+['"]\.\/Container\.astro['"]/);
    expect(src).not.toContain('max-w-2xl');
  });

  it('LinkButton の props は href だけ', () => {
    const src = read('src/components/ui/LinkButton.astro');
    const body = src.match(/interface Props\s*\{([^}]*)\}/)?.[1] ?? '';
    const names = [...body.matchAll(/(\w+)\??\s*:/g)].map((m) => m[1]);
    expect(names).toEqual(['href']);
    expect(src).not.toContain('external');
  });
});
