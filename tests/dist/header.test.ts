import { describe, expect, it } from 'vitest';
import { SITE_NAME } from '../../src/lib/site';
import {
  allFiles,
  attrs,
  decode,
  htmlFiles,
  readDist,
  startTags,
} from './html';

const text = (fragment: string) =>
  decode(fragment.replace(/<[^>]*>/g, '')).trim();

const files = htmlFiles();

describe('Header', () => {
  it('dist に必要な HTML ファイルがある', () => {
    expect(files).toContain('index.html');
    expect(files).toContain('404.html');
    expect(
      files.some((f) => f.startsWith('projects/') && f.endsWith('index.html')),
    ).toBe(true);
  });

  describe.each(files)('%s', (file) => {
    const html = readDist(file);

    it('AC-1: id="site-header" を持つ <header> 要素がちょうど1つあり、文字列は1回だけ出る', () => {
      const headers = startTags(html, 'header').filter(
        (t) => attrs(t).get('id') === 'site-header',
      );
      expect(
        headers,
        `${file}: header#site-header should have length 1`,
      ).toHaveLength(1);
      const occurrences = html.split('id="site-header"').length - 1;
      expect(
        occurrences,
        `${file}: id="site-header" count should be 1`,
      ).toBe(1);
    });

    it('AC-2: href="/" の <a> がちょうど1つあり、文字が Riku Takata で target を持たない', () => {
      const headerTag = startTags(html, 'header').find(
        (t) => attrs(t).get('id') === 'site-header',
      );
      expect(headerTag).toBeDefined();
      const start = html.indexOf(headerTag!);
      const end = html.indexOf('</header>', start);
      const headerContent = html.slice(start, end);

      const anchors = [
        ...headerContent.matchAll(/<a\b[^>]*>[\s\S]*?<\/a>/g),
      ].map((m) => m[0]);
      const rootAnchors = anchors.filter(
        (a) => attrs(startTags(a, 'a')[0]).get('href') === '/',
      );
      expect(
        rootAnchors,
        `${file}: root anchor in header should be 1`,
      ).toHaveLength(1);
      const rootAnchor = rootAnchors[0];
      const tag = startTags(rootAnchor, 'a')[0];
      expect(attrs(tag).has('target')).toBe(false);
      expect(text(rootAnchor)).toBe(SITE_NAME);
      expect(text(rootAnchor)).toBe('Riku Takata');
    });

    it('AC-3: <nav> 要素がちょうど1つあり、リンクの href が正しい', () => {
      const headerTag = startTags(html, 'header').find(
        (t) => attrs(t).get('id') === 'site-header',
      );
      expect(headerTag).toBeDefined();
      const start = html.indexOf(headerTag!);
      const end = html.indexOf('</header>', start);
      const headerContent = html.slice(start, end);

      const navTags = startTags(headerContent, 'nav');
      expect(
        navTags,
        `${file}: nav tag count in header should be 1`,
      ).toHaveLength(1);

      const navStart = headerContent.indexOf(navTags[0]);
      const navEnd = headerContent.indexOf('</nav>', navStart);
      const navContent = headerContent.slice(navStart, navEnd);

      const navAnchors = [
        ...navContent.matchAll(/<a\b[^>]*>[\s\S]*?<\/a>/g),
      ].map((m) => m[0]);
      const hrefs = navAnchors.map((a) =>
        attrs(startTags(a, 'a')[0]).get('href'),
      );
      expect(hrefs, `${file}: nav anchor hrefs`).toEqual([
        '/#about',
        '/#projects',
        '/#experience',
        '/#articles',
      ]);
    });

    it('AC-4: nav の <a> の文字が順に About, Projects, Experience, Articles', () => {
      const headerTag = startTags(html, 'header').find(
        (t) => attrs(t).get('id') === 'site-header',
      );
      expect(headerTag).toBeDefined();
      const start = html.indexOf(headerTag!);
      const end = html.indexOf('</header>', start);
      const headerContent = html.slice(start, end);

      const navTags = startTags(headerContent, 'nav');
      const navStart = headerContent.indexOf(navTags[0]);
      const navEnd = headerContent.indexOf('</nav>', navStart);
      const navContent = headerContent.slice(navStart, navEnd);

      const navAnchors = [
        ...navContent.matchAll(/<a\b[^>]*>[\s\S]*?<\/a>/g),
      ].map((m) => m[0]);
      const labels = navAnchors.map(text);
      expect(labels, `${file}: nav anchor labels`).toEqual([
        'About',
        'Projects',
        'Experience',
        'Articles',
      ]);
    });

    it('AC-5 & AC-6: class に sticky と border-b があり、shadow や backdrop-blur を含まない', () => {
      const headerTag = startTags(html, 'header').find(
        (t) => attrs(t).get('id') === 'site-header',
      );
      expect(headerTag).toBeDefined();
      const cls = (attrs(headerTag!).get('class') ?? '')
        .split(/\s+/)
        .filter(Boolean);
      expect(cls, `${file}: class must contain sticky`).toContain('sticky');
      expect(cls, `${file}: class must contain border-b`).toContain('border-b');

      const prohibited = cls.filter((c) =>
        /^shadow|^backdrop-blur|:shadow|:backdrop-blur/.test(c),
      );
      expect(
        prohibited,
        `${file}: should not contain prohibited classes: ${prohibited.join(', ')}`,
      ).toEqual([]);
    });

    it('AC-7: header 開始タグから </header> の範囲に <script という文字列がない', () => {
      const headerTag = startTags(html, 'header').find(
        (t) => attrs(t).get('id') === 'site-header',
      );
      expect(headerTag).toBeDefined();
      const start = html.indexOf(headerTag!);
      const end = html.indexOf('</header>', start);
      const headerContent = html.slice(start, end);

      expect(
        headerContent,
        `${file}: header must not contain <script`,
      ).not.toContain('<script');
    });
  });

  it('AC-9: CSS ファイルに html { scroll-padding-top } の宣言があり、0/0px 以外である', () => {
    const cssFiles = allFiles().filter((f) => f.endsWith('.css'));
    expect(cssFiles.length).toBeGreaterThan(0);

    const matches: { file: string; value: string }[] = [];
    for (const file of cssFiles) {
      const css = readDist(file);
      const re = /(^|[},])\s*html\s*\{[^}]*scroll-padding-top\s*:\s*([^;}]+)/g;
      let m: RegExpExecArray | null;
      while ((m = re.exec(css)) !== null) {
        matches.push({ file, value: m[2].trim() });
      }
    }

    expect(
      matches.length,
      'should find at least one html { scroll-padding-top } declaration',
    ).toBeGreaterThan(0);
    for (const match of matches) {
      expect(
        ['0', '0px'].includes(match.value),
        `${match.file}: scroll-padding-top should not be 0 or 0px, got ${match.value}`,
      ).toBe(false);
    }
  });
});
