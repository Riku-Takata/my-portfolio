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
    return container.renderToString(mod.default, { props });
  };
}, 60_000);

afterAll(async () => {
  await server?.close();
});

function project(id: string, links: Record<string, string> = {}) {
  return {
    id,
    data: {
      title: `title-${id}`,
      period: { start: '2024-04', end: 'present' },
      summary: `summary-${id}`,
      tech: ['TypeScript', 'Python'],
      outcomes: ['成果1', '成果2'],
      links,
      featured: true,
      order: 1,
    },
  };
}

function anchors(html: string): { tag: string; text: string }[] {
  return [...html.matchAll(/(<a\s[^>]*>)([\s\S]*?)<\/a>/g)].map((m) => ({
    tag: m[1],
    text: m[2].replace(/<[^>]*>/g, '').trim(),
  }));
}

describe('ProjectCard', () => {
  it('article の枠・見出し・期間・概要・技術・成果が並ぶ', async () => {
    const html = await render('ui/ProjectCard', { project: project('p1') });
    expect(html).toMatch(
      /^<article [^>]*border-zinc-200[^>]*dark:border-zinc-800/,
    );
    expect(html).not.toMatch(/shadow/);
    expect(html).not.toMatch(/<time/);
    const order = [
      '<h3',
      '2024 – Present',
      'summary-p1',
      'TypeScript',
      '<ul',
    ].map((s) => html.indexOf(s));
    expect(order.every((i) => i >= 0)).toBe(true);
    expect([...order].sort((a, b) => a - b)).toEqual(order);
    expect(html.match(/<li>/g)).toHaveLength(2);
    expect(html.match(/font-mono/g)).toHaveLength(2);
  });

  it('links がなければ詳細リンクだけ。target はない', async () => {
    const html = await render('ui/ProjectCard', { project: project('p1') });
    const a = anchors(html);
    expect(a).toHaveLength(1);
    expect(a[0].text).toBe('技術解説を読む →');
    expect(a[0].tag).toContain('href="/projects/p1/"');
    expect(a[0].tag).not.toContain('target');
    expect(html).not.toContain('<svg');
  });

  it('demo と github があると Live Demo → GitHub Code → 詳細の順に出る', async () => {
    const html = await render('ui/ProjectCard', {
      project: project('p1', {
        demo: 'https://demo.example.com',
        github: 'https://github.com/x/y',
      }),
    });
    const a = anchors(html);
    expect(a.map((x) => x.text)).toEqual([
      'Live Demo',
      'GitHub Code',
      '技術解説を読む →',
    ]);
    expect(a[0].tag).toContain('href="https://demo.example.com"');
    expect(a[0].tag).toContain('target="_blank"');
    expect(a[0].tag).toContain('rel="noopener noreferrer"');
    expect(html.match(/<svg[^>]*aria-hidden="true"/g)).toHaveLength(2);
    expect(html).not.toMatch(/[[\]]/);
  });
});

describe('ProjectsList', () => {
  it.each([1, 2, 3])('%i 件を渡した順に出す', async (n) => {
    const ids = ['c', 'a', 'b'].slice(0, n);
    const html = await render('sections/ProjectsList', {
      projects: ids.map((id) => project(id)),
    });
    expect(html.match(/<article/g)).toHaveLength(n);
    expect([...html.matchAll(/title-(\w)</g)].map((m) => m[1])).toEqual(ids);
  });

  it('空配列でも h2 だけが出る', async () => {
    const html = await render('sections/ProjectsList', { projects: [] });
    expect(html).toContain('Featured Projects</h2>');
    expect(html).not.toContain('<article');
  });
});
