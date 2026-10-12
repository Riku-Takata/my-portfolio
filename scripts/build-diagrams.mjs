// src/assets/diagrams/*.mmd を mermaid-cli で .svg に書き出す(手元で流す。build からは呼ばない)。
import {
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import process from 'node:process';
import { spawnSync } from 'node:child_process';
import { fileURLToPath, URL } from 'node:url';
import { computeSourceHash } from './lib/diagrams.mjs';

const root = fileURLToPath(new URL('..', import.meta.url));
const dir = join(root, 'src', 'assets', 'diagrams');
const configPath = join(root, 'mermaid.config.json');
const mmdc = join(
  root,
  'node_modules',
  '.bin',
  process.platform === 'win32' ? 'mmdc.cmd' : 'mmdc',
);

const names = readdirSync(dir, { withFileTypes: true })
  .filter((entry) => entry.isFile() && entry.name.endsWith('.mmd'))
  .map((entry) => entry.name)
  .sort();

if (names.length === 0) {
  process.stderr.write(`${dir} に .mmd がありません\n`);
  process.exitCode = 1;
} else {
  const tmp = mkdtempSync(join(tmpdir(), 'diagrams-'));
  let failed = 0;
  try {
    for (const name of names) {
      const base = name.slice(0, -'.mmd'.length);
      const mmdPath = join(dir, name);
      const tmpSvg = join(tmp, `${base}.svg`);
      const result = spawnSync(
        mmdc,
        ['-i', mmdPath, '-o', tmpSvg, '-c', configPath],
        {
          stdio: 'inherit',
        },
      );
      if (result.error || result.status !== 0) {
        process.stderr.write(`書き出しに失敗: ${name}\n`);
        failed += 1;
        continue;
      }
      const hash = computeSourceHash(readFileSync(mmdPath));
      const body = readFileSync(tmpSvg, 'utf8')
        .trimStart()
        .replace(/^<\?xml[^>]*\?>\s*/, '');
      writeFileSync(
        join(dir, `${base}.svg`),
        `<!-- source-sha256: ${hash} -->\n${body}`,
      );
      process.stdout.write(`書き出し: ${base}.svg\n`);
    }
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
  if (failed > 0) process.exitCode = 1;
}
