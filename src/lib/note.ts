import { XMLParser, XMLValidator } from 'fast-xml-parser';
import { resume } from '../content/resume';
import { articleSchema, type Article } from './schemas';

const TIMEOUT_MS = 10000;
// profile.links.note のプロフィールの URL に /rss を足したもの
const NOTE_RSS_URL = `${resume.profile.links.note.replace(/\/+$/, '')}/rss`;

// ビルド時に note の最新記事を RSS から取る。失敗したら warn を1回出して [] を返す。NOTE_OFFLINE=1 なら取得せず []
export async function fetchLatestNotes(
  rssUrl: string = NOTE_RSS_URL,
  count: number = 5,
): Promise<Article[]> {
  if (!Number.isInteger(count) || count < 1) {
    throw new Error(`count は 1 以上の整数にする: ${JSON.stringify(count)}`);
  }

  // NOTE_OFFLINE=1 のときは取得しない
  if (process.env.NOTE_OFFLINE === '1') {
    return [];
  }

  try {
    const res = await fetch(rssUrl, {
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!res.ok) {
      console.warn(`note の RSS が HTTP ${res.status} を返しました`);
      return [];
    }
    const xml = await res.text();
    if (XMLValidator.validate(xml) !== true) {
      console.warn('note の RSS が正しい XML ではありません');
      return [];
    }
    const parsed = new XMLParser({ parseTagValue: false }).parse(xml);
    const raw: unknown = parsed?.rss?.channel?.item;
    const items: unknown[] =
      raw === undefined || raw === null ? [] : Array.isArray(raw) ? raw : [raw];
    if (items.length === 0) {
      console.warn('note の RSS に記事がありません');
      return [];
    }

    const found: { ms: number; article: Article }[] = [];
    for (const it of items) {
      if (typeof it !== 'object' || it === null) continue;
      const { title, link, pubDate } = it as Record<string, unknown>;
      if (
        typeof title !== 'string' ||
        typeof link !== 'string' ||
        typeof pubDate !== 'string'
      ) {
        continue;
      }
      const ms = Date.parse(pubDate);
      if (Number.isNaN(ms)) continue;
      const r = articleSchema.safeParse({
        media: 'note',
        title,
        url: link,
        publishedAt: new Date(ms).toISOString(),
      });
      if (r.success) found.push({ ms, article: r.data });
    }
    return found
      .sort((a, b) => b.ms - a.ms)
      .slice(0, count)
      .map((f) => f.article);
  } catch (e) {
    console.warn('note の記事を取得できませんでした', e);
    return [];
  }
}
