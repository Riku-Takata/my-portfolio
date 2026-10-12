import process from 'node:process';
import { CHECK_IDS, runChecksWithDetails } from './lib/check-release.mjs';

let results;
try {
  results = await runChecksWithDetails(process.cwd());
} catch (e) {
  const message = e instanceof Error ? e.message : String(e);
  results = CHECK_IDS.map((id) => ({
    id,
    status: 'FAIL',
    details: [`確かめられない: ${message}`],
  }));
}
for (const { id, status, details } of results) {
  process.stdout.write(`${status} ${id}\n`);
  for (const d of details) process.stdout.write(`  ${d}\n`);
}
process.exitCode = results.some((r) => r.status === 'FAIL') ? 1 : 0;
