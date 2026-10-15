import type { Domain, MediaPolicyItem } from '../lib/schemas';

export type Resume = {
  profile: {
    nameJa: string;
    nameEn: string;
    affiliation: string;
    focus: string[];
    coreTags: string[];
    summary: string; // トップの meta description と OGP の概要(String.length で 120 以内)
    links: {
      github: string;
      zenn: string;
      note: string;
      speakerDeck: string;
      x: string;
      email: string;
      resumePdf: '/resume.pdf';
    };
  };
  about: string[]; // 段落。1〜4個
  skills: { category: string; items: string[] }[];
  experience: {
    kind: 'education' | 'internship' | 'presentation' | 'work';
    title: string;
    org: string;
    start: string; // 'YYYY-MM'
    end?: string; // 'YYYY-MM' か 'present'
    note?: string;
  }[];
  domains: Domain[];
  mediaPolicy: MediaPolicyItem[];
};

export const resume = {
  profile: {
    nameJa: '高田 莉玖',
    nameEn: 'Riku Takata',
    affiliation: 'Toyama Prefecture University | Product Engineer',
    focus: [
      'Next.js',
      'React',
      'TypeScript',
      'Node.js',
      'Python',
      'Satellite Data',
      'XR',
    ],
    // TODO(content): 仮のタグ。コア領域のタグ(3〜4個)に書き換える
    coreTags: ['仮のタグ1', '仮のタグ2', '仮のタグ3'],
    // TODO(content): 仮の概要。トップの meta description と OGP に使う文章に書き換える(120文字以内)
    summary: '仮の概要です。',
    links: {
      github: 'https://github.com/Riku-Takata',
      zenn: 'https://zenn.dev/riku_takata',
      // TODO(content): 仮の URL。note のプロフィールの URL に書き換える
      note: 'https://note.com/',
      // TODO(content): 仮の URL。Speaker Deck のプロフィールの URL に書き換える
      speakerDeck: 'https://speakerdeck.com/',
      x: 'https://x.com/tk1_chestnut',
      email: 'RikuChestnut66@gmail.com',
      resumePdf: '/resume.pdf',
    },
  },
  // TODO(content): 仮の段落。About の本文(1〜4段落)に書き換える
  about: ['仮の段落です。'],
  // TODO(content): 仮のスキル。カテゴリと項目に書き換える
  skills: [{ category: '仮のカテゴリ', items: ['仮の項目'] }],
  // TODO(content): 仮の経歴。start / end は 'YYYY-MM'(end は 'present' も可)
  experience: [
    { kind: 'education', title: '仮の経歴', org: '仮の所属', start: '2026-04' },
  ],
  // TODO(content): 仮の専門領域。2〜4個に書き換える
  domains: [
    { title: '仮の領域1', description: '仮の説明です。', keywords: [] },
    { title: '仮の領域2', description: '仮の説明です。', keywords: [] },
  ],
  mediaPolicy: [
    {
      media: 'github',
      role: 'Code & Architecture',
      description: '実装、環境構築、構成図などの技術仕様(一次情報)',
    },
    {
      media: 'zenn',
      role: 'Tech Deep Dive',
      description: '技術選定の理由、ボトルネックの解き方、技術検証のログ',
    },
    {
      media: 'note',
      role: 'Context & Log',
      description:
        'カンファレンスの参加記、登壇・出展の振り返り、研究・開発の背景',
    },
    {
      media: 'slide',
      role: 'Slides',
      description: '展示会・学会・LT の発表スライド',
    },
  ],
} satisfies Resume;
