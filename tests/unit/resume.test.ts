import { describe, expect, it } from 'vitest';
import { resume, type Resume } from '../../src/content/resume';

const YEAR_MONTH = /^\d{4}-(0[1-9]|1[0-2])$/;

// satisfies の推論結果ではなく Resume 型で読む(end は仮データにない)
const experience: Resume['experience'] = resume.experience;

describe('resume', () => {
  it('summary は 1 以上 120 以下の長さで空でない', () => {
    const { summary } = resume.profile;
    expect(summary).not.toBe('');
    expect(summary.length).toBeGreaterThanOrEqual(1);
    expect(summary.length).toBeLessThanOrEqual(120);
  });

  it('about は 1〜4 段落で、空の段落がない', () => {
    expect(resume.about.length).toBeGreaterThanOrEqual(1);
    expect(resume.about.length).toBeLessThanOrEqual(4);
    for (const paragraph of resume.about) {
      expect(paragraph).not.toBe('');
    }
  });

  it('skills は 1 件以上', () => {
    expect(resume.skills.length).toBeGreaterThanOrEqual(1);
  });

  it('experience は 1 件以上', () => {
    expect(experience.length).toBeGreaterThanOrEqual(1);
  });

  it('start はすべて YYYY-MM 形式', () => {
    for (const item of experience) {
      expect(item.start).toMatch(YEAR_MONTH);
    }
  });

  it('end は present か YYYY-MM で、start 以降', () => {
    for (const item of experience) {
      if (item.end === undefined || item.end === 'present') continue;
      expect(item.end).toMatch(YEAR_MONTH);
      expect(item.end >= item.start).toBe(true);
    }
  });

  it('公開済みの値が確定した値のまま', () => {
    expect(resume.profile.nameJa).toBe('高田 莉玖');
    expect(resume.profile.nameEn).toBe('Riku Takata');
    expect(resume.profile.affiliation).toBe(
      'Toyama Prefecture University | Product Engineer',
    );
    expect(resume.profile.focus).toEqual([
      'Next.js',
      'React',
      'TypeScript',
      'Node.js',
      'Python',
      'Satellite Data',
      'XR',
    ]);
    expect(resume.profile.links).toEqual({
      github: 'https://github.com/Riku-Takata',
      x: 'https://x.com/tk1_chestnut',
      email: 'RikuChestnut66@gmail.com',
      resumePdf: '/resume.pdf',
    });
  });
});
