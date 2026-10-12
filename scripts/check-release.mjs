import process from 'node:process';
import { runChecks } from './lib/check-release.mjs';

const results = await runChecks(process.cwd());
for (const { id, status, details } of results) {
  process.stdout.write(`${status} ${id}\n`);
  for (const d of details) process.stdout.write(`  ${d}\n`);
}
process.exitCode = results.some((r) => r.status === 'FAIL') ? 1 : 0;
