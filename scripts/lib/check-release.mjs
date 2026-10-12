import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import {
  PDFDict,
  PDFDocument,
  PDFHexString,
  PDFName,
  PDFString,
} from 'pdf-lib';
import { parse } from 'yaml';
import { isSvgFresh } from './diagrams.mjs';

/**
 * @typedef {'OK' | 'FAIL' | 'WARN'} Status
 * @typedef {{ id: string, status: Status, details: string[] }} CheckResult
 */

const RESUME = 'public/resume.pdf';
const REQUIRED_H2_WORDS = ['概要', 'アーキテクチャ', '技術選定', '課題'];

/**
 * ルートからの相対パスを `/` 区切りで返す。
 * @param {string} root
 * @param {string} p
 * @returns {string}
 */
function rel(root, p) {
  return path.relative(root, p).split(path.sep).join('/');
}

/**
 * dir の下の通常ファイルを再帰で集める。シンボリックリンクはたどらない。
 * @param {string} dir
 * @returns {string[]}
 */
function walkFiles(dir) {
  if (!existsSync(dir)) return [];
  /** @type {string[]} */
  const out = [];
  const entries = readdirSync(dir, { withFileTypes: true }).sort((a, b) =>
    a.name < b.name ? -1 : a.name > b.name ? 1 : 0,
  );
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...walkFiles(full));
    else if (e.isFile()) out.push(full);
  }
  return out;
}

/**
 * @param {string} p
 * @returns {boolean}
 */
function isFile(p) {
  try {
    return statSync(p).isFile();
  } catch {
    return false;
  }
}

/**
 * @param {string} root
 * @returns {{ result: CheckResult, bytes: Buffer | null }}
 */
function checkResumePdf(root) {
  const file = path.join(root, RESUME);
  /** @param {string} d */
  const fail = (d) => ({
    result: {
      id: 'resume-pdf',
      status: /** @type {Status} */ ('FAIL'),
      details: [d],
    },
    bytes: null,
  });
  if (!isFile(file)) return fail(`${RESUME} がない`);
  const bytes = readFileSync(file);
  if (bytes.length === 0) return fail(`${RESUME} が0バイト`);
  if (bytes.subarray(0, 5).toString('latin1') !== '%PDF-') {
    return fail(`${RESUME} が %PDF- で始まらない`);
  }
  return { result: { id: 'resume-pdf', status: 'OK', details: [] }, bytes };
}

/**
 * @param {unknown} obj
 * @returns {string}
 */
function textOf(obj) {
  if (obj === undefined || obj === null) return '';
  if (obj instanceof PDFString || obj instanceof PDFHexString) {
    try {
      return obj.decodeText();
    } catch {
      return obj.toString();
    }
  }
  return String(obj);
}

/**
 * @param {Buffer | null} bytes
 * @returns {Promise<CheckResult>}
 */
async function checkResumePdfMetadata(bytes) {
  const id = 'resume-pdf-metadata';
  if (bytes === null) {
    return { id, status: 'FAIL', details: [`${RESUME} を確かめられない`] };
  }
  let doc;
  try {
    doc = await PDFDocument.load(bytes, { updateMetadata: false });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return {
      id,
      status: 'FAIL',
      details: [`${RESUME} を pdf-lib で読めない: ${message}`],
    };
  }
  // カタログがない PDF は /Metadata もないとみなす(AC-12)。
  const rootRef = doc.context.trailerInfo?.Root;
  const catalog = rootRef ? doc.context.lookup(rootRef) : undefined;
  const details = [];
  const ref = doc.context.trailerInfo?.Info;
  const obj = ref ? doc.context.lookup(ref) : undefined;
  if (obj instanceof PDFDict) {
    for (const key of ['Author', 'Creator', 'Producer']) {
      if (textOf(obj.get(PDFName.of(key))) !== '')
        details.push(`${key} が残っている`);
    }
    const title = textOf(obj.get(PDFName.of('Title')));
    if (/[\\/]|\.(docx?|pages|key|odt)/i.test(title)) {
      details.push('Title に元のファイルのパスか拡張子が入っている');
    }
  }
  if (catalog instanceof PDFDict && catalog.has(PDFName.of('Metadata'))) {
    details.push('Metadata(XMP)がカタログに残っている');
  }
  return { id, status: details.length > 0 ? 'FAIL' : 'OK', details };
}

/**
 * @param {string} root
 * @returns {CheckResult}
 */
function checkTodoContent(root) {
  const files = walkFiles(path.join(root, 'src'));
  const config = path.join(root, 'astro.config.mjs');
  if (isFile(config)) files.push(config);
  const entries = files
    .map((f) => ({ f, r: rel(root, f) }))
    .sort((a, b) => (a.r < b.r ? -1 : 1));
  const details = [];
  for (const { f, r } of entries) {
    const lines = readFileSync(f, 'utf8').split(/\r?\n/);
    lines.forEach((line, i) => {
      if (line.includes('TODO(content)')) details.push(`${r}:${i + 1}`);
    });
  }
  return {
    id: 'todo-content',
    status: details.length > 0 ? 'FAIL' : 'OK',
    details,
  };
}

/**
 * @param {string} root
 * @returns {string[]}
 */
function listProjectMdx(root) {
  const dir = path.join(root, 'src/content/projects');
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true })
    .filter((e) => e.isFile() && e.name.endsWith('.mdx'))
    .map((e) => path.join(dir, e.name))
    .sort();
}

/**
 * @param {string} source
 * @returns {{ ok: true, data: unknown } | { ok: false }}
 */
function readFrontmatter(source) {
  const text = source.startsWith(String.fromCharCode(0xfeff))
    ? source.slice(1)
    : source;
  const lines = text.split(/\r?\n/);
  const fence = /^---[ \t]*$/;
  if (!fence.test(lines[0] ?? '')) return { ok: true, data: null };
  const end = lines.findIndex((l, i) => i > 0 && fence.test(l));
  if (end === -1) return { ok: false };
  try {
    return { ok: true, data: parse(lines.slice(1, end).join('\n')) };
  } catch {
    return { ok: false };
  }
}

/**
 * @param {string} root
 * @returns {CheckResult}
 */
function checkFeatured(root) {
  const details = [];
  let broken = false;
  let count = 0;
  for (const file of listProjectMdx(root)) {
    const fm = readFrontmatter(readFileSync(file, 'utf8'));
    if (!fm.ok) {
      broken = true;
      details.push(`${rel(root, file)} の frontmatter が読めない`);
      continue;
    }
    const d = /** @type {any} */ (fm.data);
    if (
      d !== null &&
      typeof d === 'object' &&
      !Array.isArray(d) &&
      d.featured === true
    )
      count++;
  }
  if (count < 2) details.push(`featured が ${count} 件(2件以上が必要)`);
  return {
    id: 'featured',
    status: broken || count < 2 ? 'FAIL' : 'OK',
    details,
  };
}

/**
 * @param {string} root
 * @returns {CheckResult}
 */
function checkDiagrams(root) {
  const dir = path.join(root, 'src/assets/diagrams');
  const names = existsSync(dir)
    ? readdirSync(dir, { withFileTypes: true })
        .filter((e) => e.isFile())
        .map((e) => e.name)
    : [];
  const strip = (/** @type {string} */ ext) =>
    new Set(
      names.filter((n) => n.endsWith(ext)).map((n) => n.slice(0, -ext.length)),
    );
  const mmds = strip('.mmd');
  const svgs = strip('.svg');
  const details = [];
  if (mmds.size === 0) details.push('src/assets/diagrams/ に .mmd がない');
  for (const n of [...mmds].sort()) {
    if (!svgs.has(n)) {
      details.push(`${n}.mmd に対応する ${n}.svg がない`);
    } else if (
      !isSvgFresh(
        readFileSync(path.join(dir, `${n}.mmd`)),
        readFileSync(path.join(dir, `${n}.svg`), 'utf8'),
      )
    ) {
      details.push(`${n}.svg が ${n}.mmd から書き出し直されていない`);
    }
  }
  for (const n of [...svgs].sort()) {
    if (!mmds.has(n)) details.push(`${n}.svg に対応する ${n}.mmd がない`);
  }
  return {
    id: 'diagrams',
    status: details.length > 0 ? 'FAIL' : 'OK',
    details,
  };
}

/**
 * @param {string} root
 * @returns {CheckResult}
 */
function checkMdxHeadings(root) {
  const details = [];
  for (const file of listProjectMdx(root)) {
    const h2 = readFileSync(file, 'utf8')
      .split(/\r?\n/)
      .filter((l) => l.startsWith('## '));
    const missing = REQUIRED_H2_WORDS.filter(
      (w) => !h2.some((l) => l.includes(w)),
    );
    if (missing.length > 0) {
      details.push(
        `${rel(root, file)}: ${missing.join(', ')} を含む h2 がない`,
      );
    }
  }
  return {
    id: 'mdx-headings',
    status: details.length > 0 ? 'WARN' : 'OK',
    details,
  };
}

/**
 * 公開前チェックをすべて流す。ファイルは読むだけで、書き換えない。
 * @param {string} root
 * @returns {Promise<CheckResult[]>}
 */
export async function runChecks(root) {
  const { result: pdf, bytes } = checkResumePdf(root);
  return [
    pdf,
    await checkResumePdfMetadata(bytes),
    checkTodoContent(root),
    checkFeatured(root),
    checkDiagrams(root),
    checkMdxHeadings(root),
  ];
}
