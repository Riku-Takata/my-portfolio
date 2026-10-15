export type Resume = {
  profile: {
    nameJa: string;
    nameEn: string;
    affiliation: string;
    focus: string[];
    summary: string; // トップの meta description と OGP の概要(String.length で 120 以内)
    links: {
      github: string;
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
    // TODO(content): 仮の概要。トップの meta description と OGP に使う文章に書き換える(120文字以内)
    summary: '仮の概要です。',
    links: {
      github: 'https://github.com/Riku-Takata',
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
} satisfies Resume;
