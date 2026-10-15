import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { projects } from '../../src/content/projects';
import { resume } from '../../src/content/resume';
import { timeline } from '../../src/content/timeline';
import {
  loadFeaturedProjects,
  loadProfile,
  loadProjects,
  loadTimeline,
  sortTimeline,
} from '../../src/lib/content';
import { domainSchema, mediaPolicyItemSchema } from '../../src/lib/schemas';

const root = fileURLToPath(new URL('../../', import.meta.url));

describe('AC-15: projects.ts', () => {
  it('projects が export されていて要件通りの要素を持つ', () => {
    expect(projects).toHaveLength(2);
    const p1 = projects.find((p) => p.id === 'satellite-insar');
    const p2 = projects.find((p) => p.id === 'rag-knowledge-base');

    expect(p1).toBeDefined();
    expect(p1!.title).toBe('衛星 InSAR による地表変動の解析基盤');
    expect(p1!.context.period).toEqual({ start: '2024-04', end: 'present' });
    expect(p1!.featured).toBe(true);
    expect(p1!.order).toBe(1);

    expect(p2).toBeDefined();
    expect(p2!.title).toBe('RAG による社内ナレッジ検索基盤');
    expect(p2!.context.period).toEqual({ start: '2024-10', end: 'present' });
    expect(p2!.featured).toBe(true);
    expect(p2!.order).toBe(2);
  });

  it('ファイルに TODO(content) が含まれる', () => {
    const code = readFileSync(
      path.join(root, 'src/content/projects.ts'),
      'utf8',
    );
    expect(code).toContain('TODO(content)');
  });
});

describe('AC-16: timeline.ts', () => {
  it('timeline が export されていて要素は 1 件', () => {
    expect(timeline).toHaveLength(1);
  });

  it('ファイルに TODO(content) が含まれる', () => {
    const code = readFileSync(
      path.join(root, 'src/content/timeline.ts'),
      'utf8',
    );
    expect(code).toContain('TODO(content)');
  });
});

describe('AC-17, AC-18, AC-19, AC-20: resume.ts の新フィールドと TODO', () => {
  it('AC-17: coreTags とリンクの要件', () => {
    expect(resume.profile.coreTags).toHaveLength(3);
    for (const tag of resume.profile.coreTags) {
      expect(typeof tag).toBe('string');
    }
    expect(resume.profile.links.zenn).toBe('https://zenn.dev/riku_takata');
    expect(resume.profile.links.note.startsWith('https://')).toBe(true);
    expect(resume.profile.links.speakerDeck.startsWith('https://')).toBe(true);
  });

  it('AC-17: coreTags, note, speakerDeck, domains の行または直前の行に TODO(content) がある', () => {
    const code = readFileSync(path.join(root, 'src/content/resume.ts'), 'utf8');
    const lines = code.split('\n');
    const resumeStart = lines.findIndex((l) =>
      l.startsWith('export const resume ='),
    );
    expect(resumeStart).toBeGreaterThan(-1);

    const targets = ['coreTags:', 'note:', 'speakerDeck:', 'domains:'];
    for (const target of targets) {
      const offset = lines
        .slice(resumeStart)
        .findIndex((l) => l.includes(target));
      expect(offset).toBeGreaterThan(-1);
      const idx = resumeStart + offset;
      const targetLine = lines[idx];
      const prevLine = idx > 0 ? lines[idx - 1] : '';
      const hasTodo =
        targetLine.includes('TODO(content)') ||
        prevLine.includes('TODO(content)');
      expect(
        hasTodo,
        `Expected TODO(content) on or before line with "${target}"`,
      ).toBe(true);
    }
  });

  it('AC-18: resume.domains が 2 件で各件が domainSchema で通る', () => {
    expect(resume.domains).toHaveLength(2);
    for (const d of resume.domains) {
      expect(domainSchema.safeParse(d).success).toBe(true);
    }
  });

  it('AC-19: resume.mediaPolicy が 4 件で各件が mediaPolicyItemSchema で通る', () => {
    expect(resume.mediaPolicy).toHaveLength(4);
    for (const item of resume.mediaPolicy) {
      expect(mediaPolicyItemSchema.safeParse(item).success).toBe(true);
      expect(item.description.length).toBeGreaterThanOrEqual(1);
      expect(item.description.length).toBeLessThanOrEqual(40);
    }

    const expected = [
      { media: 'github', role: 'Code & Architecture' },
      { media: 'zenn', role: 'Tech Deep Dive' },
      { media: 'note', role: 'Context & Log' },
      { media: 'slide', role: 'Slides' },
    ];
    for (let i = 0; i < expected.length; i++) {
      expect(resume.mediaPolicy[i].media).toBe(expected[i].media);
      expect(resume.mediaPolicy[i].role).toBe(expected[i].role);
    }
  });
});

describe('AC-21〜AC-25: content.ts の読み出し関数とソート', () => {
  it('AC-21: loadProjects が 2 件を返し id は satellite-insar と rag-knowledge-base', () => {
    const loaded = loadProjects();
    expect(loaded).toHaveLength(2);
    const ids = loaded.map((p) => p.id).sort();
    expect(ids).toEqual(['rag-knowledge-base', 'satellite-insar']);
  });

  it('AC-22: loadFeaturedProjects が order 順で projectEntrySchema の平らな形で返す', () => {
    const featured = loadFeaturedProjects();
    expect(featured).toHaveLength(2);
    expect(featured.map((p) => p.id)).toEqual([
      'satellite-insar',
      'rag-knowledge-base',
    ]);
    // data で包まれていないことの確認
    expect((featured[0] as { data?: unknown }).data).toBeUndefined();
    expect(featured[0].title).toBe('衛星 InSAR による地表変動の解析基盤');
    expect(featured[1].title).toBe('RAG による社内ナレッジ検索基盤');
  });

  it('AC-23: sortTimeline が period.start の新しい順に並べ、同じものは順序維持、引数は書き換えない', () => {
    const items = [
      { id: '1', period: { start: '2023-04' } },
      { id: '2', period: { start: '2025-10' } },
      { id: '3', period: { start: '2024-01' } },
      { id: '4', period: { start: '2024-01' } }, // 同じ start
    ];
    const original = [...items];
    const sorted = sortTimeline(items);

    expect(items).toEqual(original);
    expect(sorted.map((i) => i.id)).toEqual(['2', '3', '4', '1']);
    expect(sorted.map((i) => i.period.start)).toEqual([
      '2025-10',
      '2024-01',
      '2024-01',
      '2023-04',
    ]);
  });

  it('AC-24: loadTimeline が 1 件を返す', () => {
    const loaded = loadTimeline();
    expect(loaded).toHaveLength(1);
    expect(loaded[0].kind).toBe('education');
  });

  it('AC-25: loadProfile が resume.profile と等しい値を返す', () => {
    const prof = loadProfile();
    expect(prof.nameJa).toBe(resume.profile.nameJa);
    expect(prof.nameEn).toBe(resume.profile.nameEn);
    expect(prof.affiliation).toBe(resume.profile.affiliation);
    expect(prof.coreTags).toEqual(resume.profile.coreTags);
    expect(prof.summary).toBe(resume.profile.summary);
    expect(prof.links).toEqual(resume.profile.links);
  });
});
