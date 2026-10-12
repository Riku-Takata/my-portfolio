import { existsSync, readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const distDir = fileURLToPath(new URL('../../dist/', import.meta.url));

export function allFiles(): string[] {
  return (readdirSync(distDir, { recursive: true }) as string[]).map((f) =>
    String(f).split(path.sep).join('/'),
  );
}

export function htmlFiles(): string[] {
  return allFiles().filter((f) => f.endsWith('.html'));
}

export function readDist(rel: string): string {
  return readFileSync(path.join(distDir, rel), 'utf-8');
}

export function startTags(html: string, name: string): string[] {
  return [...html.matchAll(new RegExp(`<${name}(?=[\\s>/])[^>]*>`, 'g'))].map(
    (m) => m[0],
  );
}

export function decode(s: string): string {
  return s
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&#x27;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');
}

export function attrs(tag: string): Map<string, string> {
  const out = new Map<string, string>();
  const body = tag.replace(/^<[^\s>/]+/, '').replace(/\/?>$/, '');
  for (const m of body.matchAll(
    /([^\s=/"'>]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'>]+)))?/g,
  )) {
    out.set(m[1].toLowerCase(), decode(m[2] ?? m[3] ?? m[4] ?? ''));
  }
  return out;
}

// <meta key="value" ...> の content の配列
export function metas(html: string, key: string, value: string): string[] {
  return startTags(html, 'meta')
    .map(attrs)
    .filter((a) => a.get(key) === value)
    .map((a) => a.get('content') ?? '');
}

// name が prefix で始まる <meta> の name の配列
export function metaNamesStartingWith(html: string, prefix: string): string[] {
  return startTags(html, 'meta')
    .map(attrs)
    .map((a) => a.get('name') ?? '')
    .filter((n) => n.startsWith(prefix));
}

export function titleTexts(html: string): string[] {
  return [...html.matchAll(/<title\b[^>]*>([\s\S]*?)<\/title>/g)].map((m) =>
    decode(m[1]),
  );
}

export function canonicals(html: string): string[] {
  return startTags(html, 'link')
    .map(attrs)
    .filter((a) => a.get('rel') === 'canonical')
    .map((a) => a.get('href') ?? '');
}

export interface Script {
  attrs: Map<string, string>;
  body: string;
}

export function scripts(html: string): Script[] {
  return [...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/g)].map(
    (m) => ({ attrs: attrs(`<script ${m[1]}>`), body: m[2] }),
  );
}

const INSIGHTS = '/_vercel/insights';

// design.md の「検証の方針 > JS」の定義 (a)(b)(c)
export function isAnalyticsScript(s: Script): boolean {
  const src = s.attrs.get('src');
  if (src === undefined) return s.body.includes(INSIGHTS);
  if (src.startsWith(`${INSIGHTS}/`)) return true;
  if (src.startsWith('/_astro/') && src.endsWith('.js')) {
    const file = path.join(distDir, src);
    return existsSync(file) && readFileSync(file, 'utf-8').includes(INSIGHTS);
  }
  return false;
}
