// 半角スペース、en dash(U+2013)、半角スペースの3文字
const EN_DASH_SEPARATOR = ' – ';
const YEAR_MONTH = /^(\d{4})-(0[1-9]|1[0-2])$/;
const JST_OFFSET_MS = 9 * 60 * 60 * 1000;

function parseYearMonth(value: string): { year: string; month: string } {
  const match = YEAR_MONTH.exec(value);
  if (!match) {
    throw new Error(`YYYY-MM の形ではありません: ${JSON.stringify(value)}`);
  }
  return { year: match[1], month: match[2] };
}

const pad2 = (n: number): string => String(n).padStart(2, '0');

// 'YYYY-MM' を '2024.04' にする。'present' は 'Present'
export function formatYearMonth(value: string): string {
  if (value === 'present') {
    return 'Present';
  }
  const { year, month } = parseYearMonth(value);
  return `${year}.${month}`;
}

// 期間を年だけの表示にする。同じ年なら 1 つ、end が 'present' なら 'Present'
export function formatPeriod(period: { start: string; end: string }): string {
  const start = parseYearMonth(period.start);
  if (period.end === 'present') {
    return `${start.year}${EN_DASH_SEPARATOR}Present`;
  }
  const end = parseYearMonth(period.end);
  if (period.start > period.end) {
    throw new Error(
      `start が end より後です: start=${JSON.stringify(period.start)}, end=${JSON.stringify(period.end)}`,
    );
  }
  if (start.year === end.year) {
    return start.year;
  }
  return `${start.year}${EN_DASH_SEPARATOR}${end.year}`;
}

// ISO 8601 の日時を JST の '2025.01.01' にする。実行環境の TZ には依存しない
export function formatDate(value: string): string {
  const ms = Date.parse(value);
  if (Number.isNaN(ms)) {
    throw new Error(`日時として読めません: ${JSON.stringify(value)}`);
  }
  const jst = new Date(ms + JST_OFFSET_MS);
  return `${jst.getUTCFullYear()}.${pad2(jst.getUTCMonth() + 1)}.${pad2(jst.getUTCDate())}`;
}

// start の新しい順に並べた新しい配列を返す(安定ソート。元の配列は変えない)
export function sortExperience<T extends { start: string }>(
  items: readonly T[],
): T[] {
  return [...items].sort((a, b) =>
    a.start < b.start ? 1 : a.start > b.start ? -1 : 0,
  );
}
