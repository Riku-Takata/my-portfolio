import { ZENN_USERNAME } from './site';
import { zennArticleSchema, zennResponseSchema } from './schemas';

export type ZennArticle = { title: string; url: string; publishedAt: string };

const ZENN_ORIGIN = 'https://zenn.dev';
const TIMEOUT_MS = 10000;

// ビルド時に Zenn の最新記事を取る。取得に失敗したら warn を1回出して [] を返す。ZENN_OFFLINE=1 なら取得せず []
export async function fetchLatestArticles(
  username: string = ZENN_USERNAME,
  count: number = 5,
): Promise<ZennArticle[]> {
  if (!Number.isInteger(count) || count < 1) {
    throw new Error(`count は 1 以上の整数にする: ${JSON.stringify(count)}`);
  }
  if (username === '') {
    throw new Error('username は空にできない');
  }

  // ZENN_OFFLINE=1 のときは取得しない(空のときの表示をネットワークによらず確かめるため)
  if (process.env.ZENN_OFFLINE === '1') {
    return [];
  }

  const encoded = encodeURIComponent(username);
  const endpoint = `${ZENN_ORIGIN}/api/articles?username=${encoded}&order=latest&count=${count}`;

  try {
    const res = await fetch(endpoint, {
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!res.ok) {
      console.warn(`Zenn API が HTTP ${res.status} を返しました`);
      return [];
    }
    const json: unknown = await res.json();
    const parsed = zennResponseSchema.safeParse(json);
    if (!parsed.success) {
      console.warn(
        'Zenn API のレスポンスの形が想定と違います',
        parsed.error.issues,
      );
      return [];
    }
    return parsed.data.articles
      .flatMap((a) => {
        const r = zennArticleSchema.safeParse(a);
        return r.success
          ? [
              {
                title: r.data.title,
                url: `${ZENN_ORIGIN}/${encoded}/articles/${r.data.slug}`,
                publishedAt: r.data.published_at,
              },
            ]
          : [];
      })
      .slice(0, count);
  } catch (e) {
    console.warn('Zenn の記事を取得できませんでした', e);
    return [];
  }
}
