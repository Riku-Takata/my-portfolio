import { describe, expect, it } from 'vitest';
import {
  articleSchema,
  domainSchema,
  externalLinkSchema,
  mediaPolicyItemSchema,
  periodSchema,
  profileSchema,
  projectEntrySchema,
  projectSchema,
  timelineItemSchema,
  zennArticleSchema,
  zennResponseSchema,
} from '../../src/lib/schemas';
import { resume } from '../../src/content/resume';

describe('schemas (AC-1)', () => {
  it('既存および新規スキーマがすべて export されている', () => {
    expect(projectSchema).toBeDefined();
    expect(zennArticleSchema).toBeDefined();
    expect(zennResponseSchema).toBeDefined();
    expect(externalLinkSchema).toBeDefined();
    expect(periodSchema).toBeDefined();
    expect(projectEntrySchema).toBeDefined();
    expect(articleSchema).toBeDefined();
    expect(timelineItemSchema).toBeDefined();
    expect(domainSchema).toBeDefined();
    expect(mediaPolicyItemSchema).toBeDefined();
    expect(profileSchema).toBeDefined();
  });
});

describe('AC-2: 文字数は String.length (UTF-16)', () => {
  const baseProject = () => ({
    id: 'satellite-insar',
    context: {
      label: '共同実証実験',
      period: { start: '2024-04', end: 'present' as const },
    },
    title: '😀'.repeat(30), // UTF-16 length: 60
    summary: '衛星データの解析基盤',
    highlight: '処理を自動化した',
    techStack: ['Python', 'GDAL', 'AWS'],
    links: [],
    featured: true,
    order: 1,
  });

  it('title が length 60 の絵文字なら通る', () => {
    const res = projectEntrySchema.safeParse(baseProject());
    expect(res.success).toBe(true);
  });

  it('title が length 61 (絵文字30個 + a) なら落ちる', () => {
    const data = baseProject();
    data.title = '😀'.repeat(30) + 'a';
    const res = projectEntrySchema.safeParse(data);
    expect(res.success).toBe(false);
  });
});

describe('AC-3: externalLinkSchema', () => {
  it('label なし、label ありで通る', () => {
    expect(
      externalLinkSchema.safeParse({
        media: 'github',
        url: 'https://github.com/a/b',
      }).success,
    ).toBe(true);
    expect(
      externalLinkSchema.safeParse({
        media: 'github',
        url: 'https://github.com/a/b',
        label: '任意の表示名',
      }).success,
    ).toBe(true);
  });

  it.each(['github', 'zenn', 'note', 'slide', 'demo'] as const)(
    'media %s は通る',
    (media) => {
      expect(
        externalLinkSchema.safeParse({
          media,
          url: 'https://example.com',
        }).success,
      ).toBe(true);
    },
  );

  it('media qiita は落ちる', () => {
    expect(
      externalLinkSchema.safeParse({
        media: 'qiita',
        url: 'https://example.com',
      }).success,
    ).toBe(false);
  });

  it.each(['http://example.com', 'not a url', 'ftp://example.com'])(
    'url %s は落ちる',
    (url) => {
      expect(
        externalLinkSchema.safeParse({
          media: 'github',
          url,
        }).success,
      ).toBe(false);
    },
  );
});

describe('AC-4: periodSchema', () => {
  it.each([
    { start: '2024-04' },
    { start: '2024-04', end: '2024-04' },
    { start: '2024-04', end: '2025-03' },
    { start: '2024-04', end: 'present' },
  ])('通る例: %j', (val) => {
    expect(periodSchema.safeParse(val).success).toBe(true);
  });

  it.each([
    { start: '2024-04', end: '2024-03' },
    { start: '2024-13' },
    { start: '2024-4' },
    { start: '2024-04', end: 'now' },
  ])('落ちる例: %j', (val) => {
    expect(periodSchema.safeParse(val).success).toBe(false);
  });
});

describe('AC-5, AC-6, AC-7: projectEntrySchema', () => {
  const base = () => ({
    id: 'satellite-insar',
    context: {
      label: '共同実証実験',
      period: { start: '2024-04', end: 'present' as const },
    },
    title: '解析基盤',
    summary: '衛星データの解析基盤',
    highlight: '処理を自動化した',
    techStack: ['Python', 'GDAL', 'AWS'],
    links: [],
    featured: true,
    order: 1,
  });

  it('AC-5: 基本の値で通る', () => {
    expect(projectEntrySchema.safeParse(base()).success).toBe(true);
  });

  describe('AC-6: 1か所変えると落ちる', () => {
    it.each(['Satellite', 'a--b', '-a', 'a_b', ''])(
      'id が %s だと落ちる',
      (id) => {
        const val = { ...base(), id };
        expect(projectEntrySchema.safeParse(val).success).toBe(false);
      },
    );

    it.each(['', 'a'.repeat(13)])(
      'context.label が %d 文字だと落ちる',
      (label) => {
        const val = {
          ...base(),
          context: { ...base().context, label },
        };
        expect(projectEntrySchema.safeParse(val).success).toBe(false);
      },
    );

    it('context.period が end < start だと落ちる', () => {
      const val = {
        ...base(),
        context: {
          label: '文脈',
          period: { start: '2024-04', end: '2024-03' },
        },
      };
      expect(projectEntrySchema.safeParse(val).success).toBe(false);
    });

    it.each(['', 'a'.repeat(61)])('title が %d 文字だと落ちる', (title) => {
      const val = { ...base(), title };
      expect(projectEntrySchema.safeParse(val).success).toBe(false);
    });

    it.each(['', 'a'.repeat(61), '改行\nあり'])(
      'summary が %s だと落ちる',
      (summary) => {
        const val = { ...base(), summary };
        expect(projectEntrySchema.safeParse(val).success).toBe(false);
      },
    );

    it.each(['', 'a'.repeat(101), '改行\nあり'])(
      'highlight が %s だと落ちる',
      (highlight) => {
        const val = { ...base(), highlight };
        expect(projectEntrySchema.safeParse(val).success).toBe(false);
      },
    );

    it('techStack が 2 個だと落ちる', () => {
      const val = { ...base(), techStack: ['Python', 'AWS'] };
      expect(projectEntrySchema.safeParse(val).success).toBe(false);
    });

    it('techStack が 7 個だと落ちる', () => {
      const val = {
        ...base(),
        techStack: ['1', '2', '3', '4', '5', '6', '7'],
      };
      expect(projectEntrySchema.safeParse(val).success).toBe(false);
    });

    it('techStack に大文字小文字の重複があると落ちる', () => {
      const val = { ...base(), techStack: ['Python', 'python', 'AWS'] };
      expect(projectEntrySchema.safeParse(val).success).toBe(false);
    });

    it('links が 6 個だと落ちる', () => {
      const val = {
        ...base(),
        links: [
          { media: 'github', url: 'https://example.com/1' },
          { media: 'zenn', url: 'https://example.com/2' },
          { media: 'note', url: 'https://example.com/3' },
          { media: 'slide', url: 'https://example.com/4' },
          { media: 'demo', url: 'https://example.com/5' },
          { media: 'github', url: 'https://example.com/6' },
        ],
      };
      expect(projectEntrySchema.safeParse(val).success).toBe(false);
    });

    it('links の media が重複すると落ちる', () => {
      const val = {
        ...base(),
        links: [
          { media: 'github', url: 'https://example.com/1' },
          { media: 'github', url: 'https://example.com/2' },
        ],
      };
      expect(projectEntrySchema.safeParse(val).success).toBe(false);
    });

    it('links に http の URL があると落ちる', () => {
      const val = {
        ...base(),
        links: [{ media: 'github', url: 'http://example.com' }],
      };
      expect(projectEntrySchema.safeParse(val).success).toBe(false);
    });

    it.each(['true', 1, null, undefined])(
      'featured が真偽値でない(%s)と落ちる',
      (featured) => {
        const val = { ...base(), featured };
        expect(projectEntrySchema.safeParse(val).success).toBe(false);
      },
    );

    it.each([0, -1, 1.5])('order が %s だと落ちる', (order) => {
      const val = { ...base(), order };
      expect(projectEntrySchema.safeParse(val).success).toBe(false);
    });
  });

  describe('AC-7: 境界値は通る', () => {
    it.each(['a', 'a'.repeat(12)])(
      'context.label が %d 文字なら通る',
      (label) => {
        const val = {
          ...base(),
          context: { ...base().context, label },
        };
        expect(projectEntrySchema.safeParse(val).success).toBe(true);
      },
    );

    it('title が 60 文字なら通る', () => {
      const val = { ...base(), title: 'a'.repeat(60) };
      expect(projectEntrySchema.safeParse(val).success).toBe(true);
    });

    it('summary が 60 文字なら通る', () => {
      const val = { ...base(), summary: 'a'.repeat(60) };
      expect(projectEntrySchema.safeParse(val).success).toBe(true);
    });

    it('highlight が 100 文字なら通る', () => {
      const val = { ...base(), highlight: 'a'.repeat(100) };
      expect(projectEntrySchema.safeParse(val).success).toBe(true);
    });

    it.each([
      ['Python', 'GDAL', 'AWS'],
      ['1', '2', '3', '4', '5', '6'],
    ])('techStack が %d 個なら通る', (...techStack) => {
      const val = { ...base(), techStack };
      expect(projectEntrySchema.safeParse(val).success).toBe(true);
    });

    it('links が media の重ならない 5 個なら通る', () => {
      const val = {
        ...base(),
        links: [
          { media: 'github', url: 'https://example.com/1' },
          { media: 'zenn', url: 'https://example.com/2' },
          { media: 'note', url: 'https://example.com/3' },
          { media: 'slide', url: 'https://example.com/4' },
          { media: 'demo', url: 'https://example.com/5' },
        ],
      };
      expect(projectEntrySchema.safeParse(val).success).toBe(true);
    });
  });
});

describe('AC-8: articleSchema', () => {
  it('zenn と note で通る', () => {
    expect(
      articleSchema.safeParse({
        media: 'zenn',
        title: '記事',
        url: 'https://zenn.dev/riku_takata/articles/x',
        publishedAt: '2026-01-02T03:04:05.000Z',
      }).success,
    ).toBe(true);

    expect(
      articleSchema.safeParse({
        media: 'note',
        title: '記事',
        url: 'https://zenn.dev/riku_takata/articles/x',
        publishedAt: '2026-01-02T03:04:05.000Z',
      }).success,
    ).toBe(true);
  });

  it('media が github だと落ちる', () => {
    expect(
      articleSchema.safeParse({
        media: 'github',
        title: '記事',
        url: 'https://zenn.dev/riku_takata/articles/x',
        publishedAt: '2026-01-02T03:04:05.000Z',
      }).success,
    ).toBe(false);
  });

  it('url が http だと落ちる', () => {
    expect(
      articleSchema.safeParse({
        media: 'zenn',
        title: '記事',
        url: 'http://zenn.dev/riku_takata/articles/x',
        publishedAt: '2026-01-02T03:04:05.000Z',
      }).success,
    ).toBe(false);
  });

  it('publishedAt が yesterday だと落ちる', () => {
    expect(
      articleSchema.safeParse({
        media: 'zenn',
        title: '記事',
        url: 'https://zenn.dev/riku_takata/articles/x',
        publishedAt: 'yesterday',
      }).success,
    ).toBe(false);
  });
});

describe('AC-9: timelineItemSchema', () => {
  const base = () => ({
    kind: 'education' as const,
    period: { start: '2024-04' },
    title: '入学',
    links: [],
  });

  it('基本と org ありで通る', () => {
    expect(timelineItemSchema.safeParse(base()).success).toBe(true);
    expect(
      timelineItemSchema.safeParse({ ...base(), org: '富山県立大学' }).success,
    ).toBe(true);
  });

  it.each([
    'education',
    'research',
    'exhibition',
    'presentation',
    'conference',
    'internship',
    'work',
  ] as const)('kind %s は通る', (kind) => {
    expect(timelineItemSchema.safeParse({ ...base(), kind }).success).toBe(
      true,
    );
  });

  it('kind hobby は落ちる', () => {
    expect(
      timelineItemSchema.safeParse({ ...base(), kind: 'hobby' }).success,
    ).toBe(false);
  });

  it.each(['', 'a'.repeat(61)])('title が %s だと落ちる', (title) => {
    expect(timelineItemSchema.safeParse({ ...base(), title }).success).toBe(
      false,
    );
  });

  it.each(['', 'a'.repeat(41)])('org が %s だと落ちる', (org) => {
    expect(timelineItemSchema.safeParse({ ...base(), org }).success).toBe(
      false,
    );
  });

  it('links が 4 個だと落ちる', () => {
    const links = [
      { media: 'github' as const, url: 'https://example.com/1' },
      { media: 'zenn' as const, url: 'https://example.com/2' },
      { media: 'note' as const, url: 'https://example.com/3' },
      { media: 'slide' as const, url: 'https://example.com/4' },
    ];
    expect(timelineItemSchema.safeParse({ ...base(), links }).success).toBe(
      false,
    );
  });

  it('period が end < start だと落ちる', () => {
    expect(
      timelineItemSchema.safeParse({
        ...base(),
        period: { start: '2024-04', end: '2024-03' },
      }).success,
    ).toBe(false);
  });
});

describe('AC-10: domainSchema', () => {
  it('基本と keywords 4 個で通る', () => {
    expect(
      domainSchema.safeParse({
        title: '衛星リモートセンシング',
        description: '説明',
        keywords: [],
      }).success,
    ).toBe(true);

    expect(
      domainSchema.safeParse({
        title: '衛星リモートセンシング',
        description: '説明',
        keywords: ['k1', 'k2', 'k3', 'k4'],
      }).success,
    ).toBe(true);
  });

  it.each(['', 'a'.repeat(31)])('title が %s だと落ちる', (title) => {
    expect(
      domainSchema.safeParse({
        title,
        description: '説明',
        keywords: [],
      }).success,
    ).toBe(false);
  });

  it.each(['', 'a'.repeat(61)])(
    'description が %s だと落ちる',
    (description) => {
      expect(
        domainSchema.safeParse({
          title: '衛星リモートセンシング',
          description,
          keywords: [],
        }).success,
      ).toBe(false);
    },
  );

  it('keywords が 5 個だと落ちる', () => {
    expect(
      domainSchema.safeParse({
        title: '衛星リモートセンシング',
        description: '説明',
        keywords: ['1', '2', '3', '4', '5'],
      }).success,
    ).toBe(false);
  });
});

describe('AC-11: mediaPolicyItemSchema', () => {
  it('基本で通る', () => {
    expect(
      mediaPolicyItemSchema.safeParse({
        media: 'github',
        role: 'Code & Architecture',
        description: '実装と構成図',
      }).success,
    ).toBe(true);
  });

  it('media が demo だと落ちる', () => {
    expect(
      mediaPolicyItemSchema.safeParse({
        media: 'demo',
        role: 'Code & Architecture',
        description: '実装と構成図',
      }).success,
    ).toBe(false);
  });

  it.each(['', 'a'.repeat(41)])(
    'description が %s だと落ちる',
    (description) => {
      expect(
        mediaPolicyItemSchema.safeParse({
          media: 'github',
          role: 'Code & Architecture',
          description,
        }).success,
      ).toBe(false);
    },
  );

  it('description が 40 文字なら通る', () => {
    expect(
      mediaPolicyItemSchema.safeParse({
        media: 'github',
        role: 'Code & Architecture',
        description: 'a'.repeat(40),
      }).success,
    ).toBe(true);
  });
});

describe('AC-12: profileSchema', () => {
  it('今の resume.profile は通る', () => {
    expect(profileSchema.safeParse(resume.profile).success).toBe(true);
  });

  it.each([2, 5])('coreTags が %d 個だと落ちる', (count) => {
    const val = {
      ...resume.profile,
      coreTags: Array.from({ length: count }, (_, i) => `tag${i}`),
    };
    expect(profileSchema.safeParse(val).success).toBe(false);
  });

  it.each([3, 4])('coreTags が %d 個なら通る', (count) => {
    const val = {
      ...resume.profile,
      coreTags: Array.from({ length: count }, (_, i) => `tag${i}`),
    };
    expect(profileSchema.safeParse(val).success).toBe(true);
  });

  it('summary が 121 文字だと落ちる', () => {
    const val = {
      ...resume.profile,
      summary: 'a'.repeat(121),
    };
    expect(profileSchema.safeParse(val).success).toBe(false);
  });

  it.each(['github', 'zenn', 'note', 'speakerDeck', 'x'] as const)(
    'links.%s が http だと落ちる',
    (key) => {
      const val = {
        ...resume.profile,
        links: {
          ...resume.profile.links,
          [key]: 'http://example.com',
        },
      };
      expect(profileSchema.safeParse(val).success).toBe(false);
    },
  );

  it('links.resumePdf が /resume.pdf 以外だと落ちる', () => {
    const val = {
      ...resume.profile,
      links: {
        ...resume.profile.links,
        resumePdf: '/other.pdf',
      },
    };
    expect(profileSchema.safeParse(val).success).toBe(false);
  });

  it('links.zenn がないと落ちる', () => {
    const restLinks = { ...resume.profile.links };
    delete (restLinks as Record<string, unknown>).zenn;
    const val = {
      ...resume.profile,
      links: restLinks,
    };
    expect(profileSchema.safeParse(val).success).toBe(false);
  });
});
