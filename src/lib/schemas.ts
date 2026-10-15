import { z } from 'astro/zod';

const yearMonth = z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/);

// Zod 4 の min/max はコードポイントで数えるので、UTF-16 のコード単位(string.length)で数える
const lengthBetween = (min: number, max: number) => (s: string) =>
  s.length >= min && s.length <= max;

const notBlank = (s: string) => s.trim() !== '';

const isHttpsUrl = (s: string) => {
  try {
    return new URL(s).protocol === 'https:';
  } catch {
    return false;
  }
};

const httpsUrl = z
  .string()
  .refine(isHttpsUrl, { message: 'https の URL にする' });

export const projectSchema = z.strictObject({
  title: z
    .string()
    .refine(lengthBetween(1, 60), { message: 'title は 1〜60 文字' }),
  period: z
    .object({
      start: yearMonth,
      end: z.union([yearMonth, z.literal('present')]),
    })
    .refine((p) => p.end === 'present' || p.end >= p.start, {
      message: 'period.end は period.start 以降にする',
    }),
  summary: z
    .string()
    .refine(lengthBetween(1, 100), { message: 'summary は 1〜100 文字' })
    .refine((s) => !/\p{Cc}/u.test(s), {
      message: 'summary に改行や制御文字を含めない',
    }),
  tech: z
    .array(z.string().refine(notBlank))
    .min(1)
    .max(8)
    .refine((a) => new Set(a.map((s) => s.toLowerCase())).size === a.length, {
      message: 'tech に重複がある(大文字と小文字は区別しない)',
    }),
  outcomes: z
    .array(z.string().refine(lengthBetween(0, 60)).refine(notBlank))
    .min(1)
    .max(3),
  links: z
    .object({ demo: httpsUrl.optional(), github: httpsUrl.optional() })
    .default({}),
  featured: z.boolean(),
  order: z.number().int().positive(),
});

// ISO 8601 の日時として読める文字列か
const isIsoDateTime = (s: string) =>
  /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}(:\d{2}(\.\d+)?)?(Z|[+-]\d{2}:?\d{2})?)?$/.test(
    s,
  ) && !Number.isNaN(Date.parse(s));

// 記事1件の形。レスポンス全体の形(zennResponseSchema)とは分けて、記事ごとに検証する
export const zennArticleSchema = z.object({
  title: z.string(),
  slug: z.string(),
  published_at: z.string().refine(isIsoDateTime, {
    message: 'published_at は ISO 8601 の日時にする',
  }),
});

// レスポンス全体の形だけを見る。記事単位の検証は zennArticleSchema で行う
export const zennResponseSchema = z.object({ articles: z.array(z.unknown()) });
