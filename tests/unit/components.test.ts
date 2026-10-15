import { getViteConfig } from 'astro/config';
import { createServer, type ViteDevServer } from 'vite';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

type Render = (
  path: string,
  props?: Record<string, unknown>,
) => Promise<string>;

let server: ViteDevServer;
let render: Render;

beforeAll(async () => {
  const config = await getViteConfig({
    server: { middlewareMode: true, hmr: false },
    appType: 'custom',
    logLevel: 'silent',
  })({ command: 'serve', mode: 'test' });
  server = await createServer({ ...config, configFile: false });
  const { experimental_AstroContainer } =
    await server.ssrLoadModule('astro/container');
  const container = await experimental_AstroContainer.create();
  render = async (path, props = {}) => {
    const mod = await server.ssrLoadModule(`/src/components/${path}.astro`);
    return container.renderToString(mod.default, {
      props,
      slots: { default: '<p>child</p>' },
    });
  };
}, 60_000);

afterAll(async () => {
  await server?.close();
});

function startTags(html: string, name: string): string[] {
  return [...html.matchAll(new RegExp(`<${name}(?=[\\s>/])[^>]*>`, 'g'))].map(
    (m) => m[0],
  );
}

function attr(tag: string, name: string): string | undefined {
  const m = tag.match(new RegExp(`\\s${name}(?:="([^"]*)")?(?=[\\s>/])`));
  return m ? (m[1] ?? '') : undefined;
}

function classes(tag: string): string[] {
  return (attr(tag, 'class') ?? '').split(/\s+/).filter(Boolean);
}

const CONTAINER_CLASSES = ['mx-auto', 'max-w-2xl', 'px-4', 'sm:px-6'];

describe('Container', () => {
  it('div に幅のクラスがあり、slot がその中に出る', async () => {
    const html = (await render('common/Container')).trim();
    expect(html.startsWith('<div')).toBe(true);
    expect(classes(startTags(html, 'div')[0])).toEqual(
      expect.arrayContaining(CONTAINER_CLASSES),
    );
    expect(html).toMatch(/<div[^>]*>[\s\S]*<p>child<\/p>[\s\S]*<\/div>$/);
  });
});

describe('Section', () => {
  it('section > Container > h2 の順で、slot は h2 より後', async () => {
    const html = (
      await render('common/Section', {
        id: 'about',
        label: 'About',
      })
    ).trim();
    const section = startTags(html, 'section');
    expect(html.startsWith('<section')).toBe(true);
    expect(section).toHaveLength(1);
    expect(attr(section[0], 'id')).toBe('about');
    const inner = startTags(html, 'div');
    expect(classes(inner[0])).toEqual(
      expect.arrayContaining(CONTAINER_CLASSES),
    );
    const h2 = startTags(html, 'h2');
    expect(h2).toHaveLength(1);
    expect(classes(h2[0])).toEqual(
      expect.arrayContaining(['text-lg', 'font-semibold']),
    );
    expect(html).toMatch(/<h2[^>]*>\s*About\s*<\/h2>/);
    expect(html.indexOf('<p>child</p>')).toBeGreaterThan(html.indexOf('</h2>'));
    expect(html.indexOf('<p>child</p>')).toBeLessThan(html.indexOf('</div>'));
  });
});

describe('Badge', () => {
  it('class に必要なクラスがあり、zinc 以外の色と rounded-full がない', async () => {
    const html = await render('ui/Badge');
    const tag = startTags(html, 'span')[0];
    const cls = classes(tag);
    expect(html).toContain('<p>child</p>');
    expect(cls).toEqual(
      expect.arrayContaining([
        'font-mono',
        'text-xs',
        'border-zinc-200',
        'dark:border-zinc-800',
      ]),
    );
    expect(cls.some((c) => /^border(-\d+)?$/.test(c))).toBe(true);
    const colorNames = cls
      .map((c) =>
        c.match(
          /(?:^|:)(?:bg|text|border|ring|outline|fill|stroke)-([a-z]+)-\d/,
        ),
      )
      .filter((m): m is RegExpMatchArray => m !== null)
      .map((m) => m[1]);
    expect(colorNames.filter((n) => n !== 'zinc')).toEqual([]);
    expect(cls).not.toContain('rounded-full');
  });
});

describe('LinkButton', () => {
  const REQUIRED = [
    'text-indigo-600',
    'dark:text-indigo-400',
    'focus-visible:outline-indigo-500',
    'transition-colors',
    'duration-150',
  ];

  it.each(['https://github.com/Riku-Takata', 'http://example.com/'])(
    '外部リンク: %s',
    async (href) => {
      const html = await render('ui/LinkButton', { href });
      const tags = startTags(html, 'a');
      expect(tags).toHaveLength(1);
      expect(attr(tags[0], 'href')).toBe(href);
      expect(attr(tags[0], 'target')).toBe('_blank');
      expect(attr(tags[0], 'rel')).toBe('noopener noreferrer');
      expect(classes(tags[0])).toEqual(expect.arrayContaining(REQUIRED));
      expect(html).toMatch(/<a[^>]*>[\s\S]*<p>child<\/p>[\s\S]*<\/a>/);
    },
  );

  it.each([
    '/resume.pdf',
    '/projects/foo/',
    '#about',
    'mailto:RikuChestnut66@gmail.com',
  ])('内部リンク: %s', async (href) => {
    const html = await render('ui/LinkButton', { href });
    const tags = startTags(html, 'a');
    expect(tags).toHaveLength(1);
    expect(attr(tags[0], 'href')).toBe(href);
    expect(attr(tags[0], 'target')).toBeUndefined();
    expect(attr(tags[0], 'rel')).toBeUndefined();
    expect(classes(tags[0])).toEqual(expect.arrayContaining(REQUIRED));
  });
});

describe('アイコン', () => {
  it.each(['Github', 'X', 'Mail', 'FileText', 'ArrowRight', 'ExternalLink'])(
    '%s',
    async (name) => {
      const path = `icons/${name}`;
      const plain = await render(path);
      const tags = startTags(plain, 'svg');
      expect(tags).toHaveLength(1);
      expect(attr(tags[0], 'aria-hidden')).toBe('true');
      expect(attr(tags[0], 'viewBox')).toBe('0 0 24 24');
      expect(classes(tags[0])).toContain('size-4');

      const sized = await render(path, { class: 'size-6' });
      const cls = classes(startTags(sized, 'svg')[0]);
      expect(cls).toContain('size-6');
      expect(cls).not.toContain('size-4');
    },
  );
});
