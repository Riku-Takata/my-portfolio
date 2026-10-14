// alt の前後の空白を取り除く。空(空白だけを含む)なら Error を throw する
export function assertAlt(alt: string): string {
  const trimmed = alt.trim();
  if (trimmed === '') {
    throw new Error(`Figure の alt が空です: "${alt}"`);
  }
  return trimmed;
}
