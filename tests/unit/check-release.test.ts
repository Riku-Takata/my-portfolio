import { afterEach, describe, expect, it } from 'vitest';
import {
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { PDFDict, PDFDocument, PDFHexString, PDFName } from 'pdf-lib';
import { runChecks } from '../../scripts/lib/check-release.mjs';
import { computeSourceHash } from '../../scripts/lib/diagrams.mjs';

type Result = { id: string; status: string; details: string[] };
type PdfOpts = {
  author?: string;
  title?: string;
  xmp?: boolean;
  objectStreams?: boolean;
};

const IDS = [
  'resume-pdf',
  'resume-pdf-metadata',
  'todo-content',
  'featured',
  'diagrams',
  'mdx-headings',
];
const CLI = fileURLToPath(
  new URL('../../scripts/check-release.mjs', import.meta.url),
);
const BODY =
  '## 1. 概要\n\n## 2. アーキテクチャ\n\n## 3. 技術選定\n\n## 4. 課題\n';

function infoDictOf(doc: PDFDocument): PDFDict | undefined {
  const ref = doc.context.trailerInfo?.Info;
  const obj = ref ? doc.context.lookup(ref) : undefined;
  return obj instanceof PDFDict ? obj : undefined;
}

async function makePdf(opts: PdfOpts = {}): Promise<Uint8Array> {
  const doc = await PDFDocument.create({ updateMetadata: false });
  doc.addPage();
  if (opts.author !== undefined) doc.setAuthor(opts.author);
  if (opts.title !== undefined) doc.setTitle(opts.title);
  if (opts.xmp) {
    doc.catalog.set(
      PDFName.of('Metadata'),
      doc.context.register(
        doc.context.flateStream('<x:xmpmeta/>', {
          Type: 'Metadata',
          Subtype: 'XML',
        }),
      ),
    );
  }
  return doc.save({ useObjectStreams: opts.objectStreams ?? false });
}

const dirs: string[] = [];
afterEach(() => {
  while (dirs.length > 0) rmSync(dirs.pop()!, { recursive: true, force: true });
});

function put(root: string, file: string, content: string | Uint8Array) {
  const full = path.join(root, file);
  mkdirSync(path.dirname(full), { recursive: true });
  writeFileSync(full, content);
}

async function makeFixture(): Promise<string> {
  const root = mkdtempSync(path.join(os.tmpdir(), 'check-release-'));
  dirs.push(root);
  put(root, 'public/resume.pdf', await makePdf());
  put(root, 'astro.config.mjs', 'export default {};\n');
  put(root, 'src/pages/index.astro', '---\n---\n<h1>hi</h1>\n');
  for (const n of ['a', 'b']) {
    put(
      root,
      `src/content/projects/${n}.mdx`,
      `---\ntitle: ${n}\nfeatured: true\n---\n\n${BODY}`,
    );
  }
  const mmd = 'graph TD\nA-->B\n';
  put(root, 'src/assets/diagrams/x.mmd', mmd);
  put(
    root,
    'src/assets/diagrams/x.svg',
    `<!-- source-sha256: ${computeSourceHash(mmd)} -->\n<svg></svg>\n`,
  );
  return root;
}

function statusOf(results: Result[], id: string): string {
  return results.find((r) => r.id === id)!.status;
}
function detailsOf(results: Result[], id: string): string {
  return results.find((r) => r.id === id)!.details.join('\n');
}
function snapshot(root: string): Record<string, string> {
  const out: Record<string, string> = {};
  const walk = (dir: string) => {
    for (const e of readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, e.name);
      if (e.isDirectory()) walk(full);
      else {
        const st = statSync(full);
        out[path.relative(root, full)] =
          `${st.size}:${st.mtimeMs}:${readFileSync(full).toString('base64')}`;
      }
    }
  };
  walk(root);
  return out;
}

describe('check-release', () => {
  it('0: makePdf が Producer/Creator/Author を入れない', async () => {
    for (const objectStreams of [false, true]) {
      const bytes = await makePdf({ objectStreams });
      const doc = await PDFDocument.load(bytes, { updateMetadata: false });
      const info = infoDictOf(doc);
      for (const k of ['Producer', 'Creator', 'Author']) {
        expect(info?.has(PDFName.of(k)) ?? false).toBe(false);
      }
    }
  });

  it('1: すべて満たすと6項目すべて OK', async () => {
    const root = await makeFixture();
    const results: Result[] = await runChecks(root);
    expect(results.map((r) => r.id)).toEqual(IDS);
    for (const r of results) expect(r.status).toBe('OK');
  });

  it('2: resume.pdf が0バイトだと pdf と metadata が FAIL', async () => {
    const root = await makeFixture();
    put(root, 'public/resume.pdf', '');
    const results: Result[] = await runChecks(root);
    expect(statusOf(results, 'resume-pdf')).toBe('FAIL');
    expect(statusOf(results, 'resume-pdf-metadata')).toBe('FAIL');
  });

  it('3: resume.pdf がないと FAIL でパスが入る', async () => {
    const root = await makeFixture();
    rmSync(path.join(root, 'public/resume.pdf'));
    const results: Result[] = await runChecks(root);
    expect(statusOf(results, 'resume-pdf')).toBe('FAIL');
    expect(statusOf(results, 'resume-pdf-metadata')).toBe('FAIL');
    expect(detailsOf(results, 'resume-pdf')).toContain('public/resume.pdf');
  });

  it('4: %PDF- で始まらないと FAIL', async () => {
    const root = await makeFixture();
    put(root, 'public/resume.pdf', 'hello');
    const results: Result[] = await runChecks(root);
    expect(statusOf(results, 'resume-pdf')).toBe('FAIL');
    expect(detailsOf(results, 'resume-pdf')).toContain('public/resume.pdf');
    expect(statusOf(results, 'resume-pdf-metadata')).toBe('FAIL');
  });

  it('4b: %PDF- で始まっても pdf-lib で読めないと metadata が FAIL', async () => {
    const root = await makeFixture();
    put(root, 'public/resume.pdf', '%PDF-1.4\ngarbage');
    const results: Result[] = await runChecks(root);
    expect(statusOf(results, 'resume-pdf')).toBe('OK');
    expect(statusOf(results, 'resume-pdf-metadata')).toBe('FAIL');
  });

  it('5: Author が残っていると FAIL', async () => {
    const root = await makeFixture();
    put(root, 'public/resume.pdf', await makePdf({ author: 'Riku' }));
    const results: Result[] = await runChecks(root);
    expect(statusOf(results, 'resume-pdf-metadata')).toBe('FAIL');
    expect(detailsOf(results, 'resume-pdf-metadata')).toContain('Author');
  });

  it('6: オブジェクトストリームの Info の Author も見つける', async () => {
    const root = await makeFixture();
    const bytes = await makePdf({ author: 'Riku', objectStreams: true });
    expect(Buffer.from(bytes).toString('latin1')).not.toContain('/Author');
    put(root, 'public/resume.pdf', bytes);
    const results: Result[] = await runChecks(root);
    expect(statusOf(results, 'resume-pdf-metadata')).toBe('FAIL');
    expect(detailsOf(results, 'resume-pdf-metadata')).toContain('Author');
  });

  it.each([
    ['C:\\Users\\me\\resume.docx', 'FAIL'],
    ['/Users/me/resume.pdf', 'FAIL'],
    ['resume.pages', 'FAIL'],
    ['Riku Takata Resume', 'OK'],
  ])('7: Title %s は %s', async (title, expected) => {
    const root = await makeFixture();
    put(root, 'public/resume.pdf', await makePdf({ title }));
    const results: Result[] = await runChecks(root);
    expect(statusOf(results, 'resume-pdf-metadata')).toBe(expected);
    if (expected === 'FAIL')
      expect(detailsOf(results, 'resume-pdf-metadata')).toContain('Title');
  });

  it('8: カタログに Metadata があると FAIL', async () => {
    const root = await makeFixture();
    put(root, 'public/resume.pdf', await makePdf({ xmp: true }));
    const results: Result[] = await runChecks(root);
    expect(statusOf(results, 'resume-pdf-metadata')).toBe('FAIL');
    expect(detailsOf(results, 'resume-pdf-metadata')).toContain('Metadata');
  });

  it('9: BOM だけの Author は空とみなす', async () => {
    const root = await makeFixture();
    const doc = await PDFDocument.create({ updateMetadata: false });
    doc.addPage();
    doc.setAuthor('x');
    infoDictOf(doc)!.set(PDFName.of('Author'), PDFHexString.of('FEFF'));
    put(root, 'public/resume.pdf', await doc.save());
    const results: Result[] = await runChecks(root);
    expect(statusOf(results, 'resume-pdf-metadata')).toBe('OK');
  });

  it('10: TODO(content) の行を1行ずつ拾い、対象外は見ない', async () => {
    const root = await makeFixture();
    put(
      root,
      'src/lib/x.ts',
      'const a = 1;\n// TODO(content) a TODO(content) b\n',
    );
    put(root, 'astro.config.mjs', '// TODO(content)\nexport default {};\n');
    put(root, 'docs/a.md', 'TODO(content)\n');
    put(root, 'scripts/a.mjs', '// TODO(content)\n');
    put(root, 'README.md', 'TODO(content)\n');
    const results: Result[] = await runChecks(root);
    expect(statusOf(results, 'todo-content')).toBe('FAIL');
    const details = results.find((r) => r.id === 'todo-content')!.details;
    expect(details.filter((d) => d.startsWith('src/lib/x.ts:2'))).toHaveLength(
      1,
    );
    expect(
      details.filter((d) => d.startsWith('astro.config.mjs:1')),
    ).toHaveLength(1);
    expect(details).toHaveLength(2);
    for (const d of details) {
      expect(d).not.toContain('docs/');
      expect(d).not.toContain('scripts/');
      expect(d).not.toContain('README.md');
    }
  });

  it.each([
    ['featured: false', '---\ntitle: b\nfeatured: false\n---\n'],
    ["featured: 'true'", "---\ntitle: b\nfeatured: 'true'\n---\n"],
    ['キーなし', '---\ntitle: b\n---\n'],
    ['frontmatter が空', '---\n---\n'],
  ])('11: b.mdx が %s だと featured は1件で FAIL', async (_name, content) => {
    const root = await makeFixture();
    put(root, 'src/content/projects/b.mdx', `${content}\n${BODY}`);
    put(
      root,
      'src/content/projects/sub/c.mdx',
      `---\nfeatured: true\n---\n${BODY}`,
    );
    const results: Result[] = await runChecks(root);
    expect(statusOf(results, 'featured')).toBe('FAIL');
    expect(detailsOf(results, 'featured')).toContain('1');
  });

  it('12: frontmatter を閉じていない MDX で FAIL', async () => {
    const root = await makeFixture();
    put(root, 'src/content/projects/c.mdx', '---\nfeatured: true\n\n## 概要\n');
    const results: Result[] = await runChecks(root);
    expect(statusOf(results, 'featured')).toBe('FAIL');
    expect(detailsOf(results, 'featured')).toContain(
      'src/content/projects/c.mdx',
    );
  });

  it('13: YAML として読めない frontmatter で FAIL', async () => {
    const root = await makeFixture();
    put(
      root,
      'src/content/projects/c.mdx',
      `---\nfeatured: [true\n---\n${BODY}`,
    );
    const results: Result[] = await runChecks(root);
    expect(statusOf(results, 'featured')).toBe('FAIL');
    expect(detailsOf(results, 'featured')).toContain(
      'src/content/projects/c.mdx',
    );
  });

  it('14: 図の不整合で FAIL', async () => {
    let root = await makeFixture();
    put(root, 'src/assets/diagrams/x.mmd', 'graph TD\nA-->C\n');
    let results: Result[] = await runChecks(root);
    expect(statusOf(results, 'diagrams')).toBe('FAIL');
    expect(detailsOf(results, 'diagrams')).toContain('x.svg');

    root = await makeFixture();
    rmSync(path.join(root, 'src/assets/diagrams/x.svg'));
    results = await runChecks(root);
    expect(statusOf(results, 'diagrams')).toBe('FAIL');

    root = await makeFixture();
    rmSync(path.join(root, 'src/assets/diagrams/x.svg'));
    rmSync(path.join(root, 'src/assets/diagrams/x.mmd'));
    results = await runChecks(root);
    expect(statusOf(results, 'diagrams')).toBe('FAIL');
  });

  it('15: h2 が欠けると WARN で他は OK', async () => {
    const root = await makeFixture();
    put(
      root,
      'src/content/projects/b.mdx',
      '---\nfeatured: true\n---\n## 1. 概要\n## 2. アーキテクチャ\n## 3. 技術選定\n',
    );
    const results: Result[] = await runChecks(root);
    expect(statusOf(results, 'mdx-headings')).toBe('WARN');
    expect(detailsOf(results, 'mdx-headings')).toContain(
      'src/content/projects/b.mdx',
    );
    expect(detailsOf(results, 'mdx-headings')).toContain('課題');
    for (const r of results.filter((r) => r.id !== 'mdx-headings'))
      expect(r.status).toBe('OK');
  });

  it('16: CLI の出力と終了コード', async () => {
    const root = await makeFixture();
    const run = () =>
      spawnSync(process.execPath, [CLI], { cwd: root, encoding: 'utf8' });

    const ok = run();
    expect(ok.status).toBe(0);
    for (const id of IDS) {
      const matches = ok.stdout.match(
        new RegExp(`^(OK|FAIL|WARN) ${id}$`, 'gm'),
      );
      expect(matches).toHaveLength(1);
    }

    put(
      root,
      'src/content/projects/b.mdx',
      '---\nfeatured: true\n---\n## 1. 概要\n',
    );
    const warn = run();
    expect(warn.status).toBe(0);
    expect(warn.stdout).toContain('WARN mdx-headings');

    put(root, 'public/resume.pdf', '');
    expect(run().status).not.toBe(0);
  });

  it('17: runChecks と CLI はファイルを変えない', async () => {
    const root = await makeFixture();
    const before = snapshot(root);
    await runChecks(root);
    spawnSync(process.execPath, [CLI], { cwd: root, encoding: 'utf8' });
    expect(snapshot(root)).toEqual(before);
  });
});
