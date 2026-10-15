import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import {
  allFiles,
  attrs,
  decode,
  htmlFiles,
  isAnalyticsScript,
  readDist,
  scripts,
  startTags,
} from './html';

const TAG_REST = `(?=[\\s>/])(?:"[^"]*"|'[^']*'|[^>"'])*>`;

interface El {
  start: number;
  end: number;
  tag: string;
  html: string;
}

function outerOf(html: string, start: number, name: string): El {
  const open = new RegExp(`^<${name}${TAG_REST}`, 'i').exec(html.slice(start));
  if (!open) throw new Error(`no <${name}> at ${start}`);
  const tag = open[0];
  if (tag.endsWith('/>')) {
    return { start, end: start + tag.length, tag, html: tag };
  }
  const re = new RegExp(`<(/?)${name}(?=[\\s>/])[^>]*>`, 'gi');
  re.lastIndex = start;
  let depth = 0;
  for (let m = re.exec(html); m; m = re.exec(html)) {
    depth += m[1] === '/' ? -1 : 1;
    if (depth === 0) {
      const end = m.index + m[0].length;
      return { start, end, tag, html: html.slice(start, end) };
    }
  }
  throw new Error(`unclosed <${name}> at ${start}`);
}

function extractBlockBody(css: string, openBraceIndex: number): string {
  let depth = 0;
  let start = -1;
  for (let i = openBraceIndex; i < css.length; i++) {
    if (css[i] === '{') {
      if (depth === 0) start = i + 1;
      depth++;
    } else if (css[i] === '}') {
      depth--;
      if (depth === 0) {
        return css.slice(start, i);
      }
    }
  }
  return '';
}

function getTopSection(html: string): El {
  const re = new RegExp(`<section${TAG_REST}`, 'gi');
  for (const m of html.matchAll(re)) {
    if (attrs(m[0]).get('id') === 'top') {
      return outerOf(html, m.index, 'section');
    }
  }
  throw new Error('No #top section found');
}

function getDistCss(): string {
  const cssFiles = allFiles().filter(
    (f) => f.startsWith('_astro/') && f.endsWith('.css'),
  );
  const externalCss = cssFiles.map((f) => readDist(f)).join('\n');
  const indexHtml = readDist('index.html');
  const embeddedCss = [
    ...indexHtml.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/gi),
  ]
    .map((m) => m[1])
    .join('\n');
  return `${externalCss}\n${embeddedCss}`;
}

describe('Hero DeskIllustration (T-034)', () => {
  it('AC-2: #top の中の <a> 要素の外にある <svg> はちょうど1つで aria-hidden="true"', () => {
    const html = readDist('index.html');
    const top = getTopSection(html);
    const topWithoutLinks = top.html.replace(/<a\b[\s\S]*?<\/a\s*>/gi, '');
    const svgs = startTags(topWithoutLinks, 'svg');
    expect(svgs).toHaveLength(1);
    expect(attrs(svgs[0]).get('aria-hidden')).toBe('true');
  });

  it('AC-3: イラストの <svg> と index.html 全体に foreignObject がない', () => {
    const html = readDist('index.html');
    const top = getTopSection(html);
    const topWithoutLinks = top.html.replace(/<a\b[\s\S]*?<\/a\s*>/gi, '');
    const svgMatch = /<svg(?=[\s>/])[^>]*>/i.exec(topWithoutLinks);
    expect(svgMatch).not.toBeNull();
    const svgStart = top.html.indexOf(svgMatch![0]);
    const svgEl = outerOf(top.html, svgStart, 'svg');
    expect(svgEl.html).not.toMatch(/<foreignObject/i);
    expect(html).not.toMatch(/<foreignObject/i);
  });

  it('AC-4: イラストの <svg> に <text> があり、テキストをつなげると const greet を含む', () => {
    const html = readDist('index.html');
    const top = getTopSection(html);
    const topWithoutLinks = top.html.replace(/<a\b[\s\S]*?<\/a\s*>/gi, '');
    const svgMatch = /<svg(?=[\s>/])[^>]*>/i.exec(topWithoutLinks);
    expect(svgMatch).not.toBeNull();
    const svgStart = top.html.indexOf(svgMatch![0]);
    const svgEl = outerOf(top.html, svgStart, 'svg');

    const textMatches = [
      ...svgEl.html.matchAll(/<text\b[^>]*>([\s\S]*?)<\/text>/gi),
    ];
    expect(textMatches.length).toBeGreaterThanOrEqual(1);

    const combined = textMatches
      .map((m) => decode(m[1].replace(/<[^>]+>/g, '')))
      .join('');
    expect(combined).toContain('const greet');
  });

  it('AC-5: dist の CSS に @keyframes が1つ以上ある', () => {
    const css = getDistCss();
    expect(css).toMatch(/@keyframes/);
  });

  it('AC-6: dist の CSS の @keyframes 本体に stroke-dashoffset か stroke-dasharray がある', () => {
    const css = getDistCss();
    const keyframesMatches = [...css.matchAll(/@keyframes\b[^{]*\{/g)];
    expect(keyframesMatches.length).toBeGreaterThanOrEqual(1);

    const bodies = keyframesMatches.map((m) =>
      extractBlockBody(css, m.index + m[0].length - 1),
    );
    const hasStrokeDash = bodies.some((b) =>
      /stroke-dash(offset|array)/.test(b),
    );
    expect(hasStrokeDash).toBe(true);
  });

  it('AC-7: dist の CSS で animation か animation-timing-function の宣言の値に steps( がある', () => {
    const css = getDistCss();
    expect(css).toMatch(
      /(?<![A-Za-z0-9_-])(?:animation|animation-timing-function)\s*:[^;}]*steps\(/,
    );
  });

  it('AC-8: dist の CSS に prefers-reduced-motion: reduce の @media がありアニメーションを停止している', () => {
    const css = getDistCss();
    const mediaMatches = [...css.matchAll(/@media\b[^{]*\{/g)];
    const reducedMotionMedia = mediaMatches.filter((m) => {
      const condition = m[0];
      return (
        condition.includes('prefers-reduced-motion') &&
        condition.includes('reduce')
      );
    });
    expect(reducedMotionMedia.length).toBeGreaterThanOrEqual(1);

    const hasStop = reducedMotionMedia.some((m) => {
      const body = extractBlockBody(css, m.index + m[0].length - 1);
      return /(?<![A-Za-z0-9_-])(?:animation|animation-name)\s*:\s*none|(?<![A-Za-z0-9_-])animation-play-state\s*:\s*paused/.test(
        body,
      );
    });
    expect(hasStop).toBe(true);
  });

  it('AC-9: dist のすべての HTML でスクリプトは Vercel Analytics のみ、_astro/*.js も insights を含む', () => {
    for (const file of htmlFiles()) {
      const html = readDist(file);
      const nonJsonLd = scripts(html).filter(
        (s) => s.attrs.get('type') !== 'application/ld+json',
      );
      expect(nonJsonLd).toHaveLength(1);
      expect(isAnalyticsScript(nonJsonLd[0])).toBe(true);
    }

    const jsFiles = allFiles().filter(
      (f) => f.startsWith('_astro/') && f.endsWith('.js'),
    );
    for (const js of jsFiles) {
      expect(readDist(js)).toContain('/_vercel/insights');
    }
  });

  it('AC-10: DeskIllustration 以外の src/ の .astro と .css に @keyframes や animation 宣言、animate- トークンがない', () => {
    const root = fileURLToPath(new URL('../../', import.meta.url));
    const srcDir = path.join(root, 'src');
    const allSrcFiles = (readdirSync(srcDir, { recursive: true }) as string[])
      .map((f) => 'src/' + String(f).split(path.sep).join('/'))
      .filter(
        (f) =>
          /\.(astro|css)$/.test(f) &&
          f !== 'src/components/sections/DeskIllustration.astro',
      );

    const violations: string[] = [];
    for (const rel of allSrcFiles) {
      const content = readFileSync(path.join(root, rel), 'utf-8');
      if (/@keyframes/.test(content)) {
        violations.push(`${rel}: @keyframes`);
      }
      if (/(?<![A-Za-z0-9_-])animation(?:-[a-z-]+)?\s*:/.test(content)) {
        violations.push(`${rel}: animation property`);
      }
      if (/(?<![A-Za-z0-9_-])animate-/.test(content)) {
        violations.push(`${rel}: animate-`);
      }
    }
    expect(violations).toEqual([]);
  });

  it('AC-11: DeskIllustration.astro に禁止色名、gradient、色の直書き、animate- がない', () => {
    const root = fileURLToPath(new URL('../../', import.meta.url));
    const file = path.join(
      root,
      'src/components/sections/DeskIllustration.astro',
    );
    const content = readFileSync(file, 'utf-8');

    const forbiddenColors =
      /(?<![A-Za-z0-9_-])(red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|violet|purple|fuchsia|pink|rose|slate|gray|neutral|stone|white|black)(?![A-Za-z0-9_-])/;
    const gradient = /gradient/i;
    const hexColor =
      /#(?:[0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{3,4})(?![0-9a-fA-F])/;
    const colorFunc = /\b(?:rgba?|hsla?|oklch|oklab|lab|lch|color)\(/;
    const animateToken = /(?<![A-Za-z0-9_-])animate-/;

    expect(content).not.toMatch(forbiddenColors);
    expect(content).not.toMatch(gradient);
    expect(content).not.toMatch(hexColor);
    expect(content).not.toMatch(colorFunc);
    expect(content).not.toMatch(animateToken);
  });
});
