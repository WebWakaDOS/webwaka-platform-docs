/**
 * Unit tests for scripts/check-links.ts
 * Blueprint Reference: Part 8.2 — QA-DOC Regression Guards
 */

import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import {
  extractLinksFromFile,
  collectMarkdownFiles,
  resolveInternalLink,
  checkInternalLink,
  runLinkCheck,
  LinkCheckResult,
} from './check-links';

// ===== HELPERS =====

let tmpDir: string;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'webwaka-links-test-'));
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

function write(rel: string, content: string): string {
  const full = path.join(tmpDir, rel);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(full, content, 'utf8');
  return full;
}

// ===== extractLinksFromFile =====

describe('extractLinksFromFile', () => {
  it('extracts markdown links', () => {
    const p = write('doc.md', 'See [the docs](https://docs.webwaka.io) for more.');
    const links = extractLinksFromFile(p);
    expect(links).toContain('https://docs.webwaka.io');
  });

  it('extracts multiple unique links', () => {
    const p = write('doc.md', '[A](https://a.com) and [B](https://b.com) and [A again](https://a.com)');
    const links = extractLinksFromFile(p);
    // Set deduplication — https://a.com should appear only once
    expect(links.filter(l => l === 'https://a.com')).toHaveLength(1);
    expect(links).toContain('https://b.com');
  });

  it('extracts image links', () => {
    const p = write('doc.md', '![Logo](https://example.com/logo.png)');
    const links = extractLinksFromFile(p);
    expect(links).toContain('https://example.com/logo.png');
  });

  it('extracts href from HTML anchor tags', () => {
    const p = write('doc.md', '<a href="https://webwaka.io">Click</a>');
    const links = extractLinksFromFile(p);
    expect(links).toContain('https://webwaka.io');
  });

  it('extracts internal relative links', () => {
    const p = write('doc.md', 'See [intro](./getting-started.md) for details.');
    const links = extractLinksFromFile(p);
    expect(links).toContain('./getting-started.md');
  });

  it('ignores anchor fragments (#section)', () => {
    const p = write('doc.md', '[Section](#overview)');
    const links = extractLinksFromFile(p);
    expect(links).not.toContain('#overview');
    expect(links.filter(l => l.startsWith('#'))).toHaveLength(0);
  });

  it('returns empty array for a file with no links', () => {
    const p = write('doc.md', '# Plain heading\n\nJust plain text, no links.');
    const links = extractLinksFromFile(p);
    expect(links).toHaveLength(0);
  });

  it('handles an empty file', () => {
    const p = write('empty.md', '');
    const links = extractLinksFromFile(p);
    expect(links).toHaveLength(0);
  });
});

// ===== collectMarkdownFiles =====

describe('collectMarkdownFiles', () => {
  it('finds .md files in a flat directory', () => {
    write('a.md', '# A');
    write('b.md', '# B');
    write('c.txt', 'not markdown');
    const files = collectMarkdownFiles(tmpDir);
    expect(files.filter(f => f.endsWith('.md'))).toHaveLength(2);
    expect(files).not.toContain(path.join(tmpDir, 'c.txt'));
  });

  it('recursively finds .md files in subdirectories', () => {
    write('root.md', '# Root');
    write('sub/child.md', '# Child');
    write('sub/nested/deep.md', '# Deep');
    const files = collectMarkdownFiles(tmpDir);
    expect(files).toHaveLength(3);
  });

  it('finds .mdx files as well', () => {
    write('page.mdx', '# MDX Page');
    const files = collectMarkdownFiles(tmpDir);
    expect(files.some(f => f.endsWith('.mdx'))).toBe(true);
  });

  it('returns empty array for a non-existent directory', () => {
    const files = collectMarkdownFiles('/nonexistent/path/that/does/not/exist');
    expect(files).toHaveLength(0);
  });

  it('returns empty array for an empty directory', () => {
    fs.mkdirSync(path.join(tmpDir, 'empty'), { recursive: true });
    const files = collectMarkdownFiles(path.join(tmpDir, 'empty'));
    expect(files).toHaveLength(0);
  });
});

// ===== resolveInternalLink =====

describe('resolveInternalLink', () => {
  it('resolves a relative link from the source file directory', () => {
    const sourceFile = path.join(tmpDir, 'docs', 'intro.md');
    const result = resolveInternalLink('./getting-started.md', sourceFile, tmpDir);
    expect(result).toBe(path.join(tmpDir, 'docs', 'getting-started.md'));
  });

  it('resolves an absolute link from the root directory', () => {
    const sourceFile = path.join(tmpDir, 'docs', 'intro.md');
    const result = resolveInternalLink('/content/webhooks.md', sourceFile, tmpDir);
    expect(result).toBe(path.join(tmpDir, 'content', 'webhooks.md'));
  });

  it('resolves a parent directory traversal (../)', () => {
    const sourceFile = path.join(tmpDir, 'docs', 'sub', 'page.md');
    const result = resolveInternalLink('../intro.md', sourceFile, tmpDir);
    expect(result).toBe(path.join(tmpDir, 'docs', 'intro.md'));
  });

  it('treats a path not starting with / as relative', () => {
    const sourceFile = path.join(tmpDir, 'index.md');
    const result = resolveInternalLink('README.md', sourceFile, tmpDir);
    expect(result).toBe(path.join(tmpDir, 'README.md'));
  });
});

// ===== checkInternalLink =====

describe('checkInternalLink', () => {
  it('returns ok when the file exists exactly', () => {
    write('content/webhooks.md', '# Webhooks');
    const sourceFile = path.join(tmpDir, 'README.md');
    const result = checkInternalLink('./content/webhooks.md', sourceFile, tmpDir);
    expect(result.status).toBe('ok');
    expect(result.type).toBe('internal');
  });

  it('returns ok when .md extension is appended and file exists', () => {
    write('content/webhooks.md', '# Webhooks');
    const sourceFile = path.join(tmpDir, 'README.md');
    const result = checkInternalLink('./content/webhooks', sourceFile, tmpDir);
    expect(result.status).toBe('ok');
  });

  it('returns ok when README.md in directory exists', () => {
    write('sdk/README.md', '# SDK');
    const sourceFile = path.join(tmpDir, 'README.md');
    const result = checkInternalLink('./sdk', sourceFile, tmpDir);
    expect(result.status).toBe('ok');
  });

  it('returns broken when link does not resolve to any file', () => {
    const sourceFile = path.join(tmpDir, 'README.md');
    const result = checkInternalLink('./nonexistent-page', sourceFile, tmpDir);
    expect(result.status).toBe('broken');
    expect(result.reason).toBeDefined();
  });

  it('includes the source file in the result', () => {
    const sourceFile = path.join(tmpDir, 'README.md');
    const result = checkInternalLink('./missing.md', sourceFile, tmpDir);
    expect(result.file).toBe(sourceFile);
  });

  it('includes the link in the result', () => {
    const sourceFile = path.join(tmpDir, 'README.md');
    const result = checkInternalLink('./missing.md', sourceFile, tmpDir);
    expect(result.link).toBe('./missing.md');
  });
});

// ===== runLinkCheck (integration) =====

describe('runLinkCheck', () => {
  it('scans markdown files and returns a report with counts', async () => {
    write('a.md', '[A](https://example.com)\n\n[B](./b.md)');
    write('b.md', '# B page');
    const report = await runLinkCheck([tmpDir], tmpDir, { checkExternal: false });
    expect(report.scanned).toBe(2);
    expect(report.checked).toBeGreaterThan(0);
  });

  it('marks external links as skipped when checkExternal is false', async () => {
    write('doc.md', 'See [external](https://webwaka.io)');
    const report = await runLinkCheck([tmpDir], tmpDir, { checkExternal: false });
    expect(report.skipped.length).toBe(1);
    expect(report.skipped[0].status).toBe('skipped');
    expect(report.skipped[0].reason).toContain('--no-external');
  });

  it('marks broken internal links correctly', async () => {
    write('doc.md', 'See [missing page](./missing-page.md)');
    const report = await runLinkCheck([tmpDir], tmpDir, { checkExternal: false });
    expect(report.broken.length).toBe(1);
    expect(report.broken[0].type).toBe('internal');
  });

  it('marks valid internal links as ok', async () => {
    write('index.md', 'See [about](./about.md)');
    write('about.md', '# About');
    const report = await runLinkCheck([tmpDir], tmpDir, { checkExternal: false });
    const okInternal = report.ok.filter(r => r.type === 'internal');
    expect(okInternal.length).toBe(1);
  });

  it('handles an empty directory gracefully', async () => {
    const emptyDir = path.join(tmpDir, 'empty');
    fs.mkdirSync(emptyDir);
    const report = await runLinkCheck([emptyDir], emptyDir, { checkExternal: false });
    expect(report.scanned).toBe(0);
    expect(report.checked).toBe(0);
    expect(report.broken).toHaveLength(0);
  });

  it('handles multiple directories', async () => {
    const dir1 = path.join(tmpDir, 'd1');
    const dir2 = path.join(tmpDir, 'd2');
    fs.mkdirSync(dir1);
    fs.mkdirSync(dir2);
    fs.writeFileSync(path.join(dir1, 'a.md'), 'Hello');
    fs.writeFileSync(path.join(dir2, 'b.md'), 'World');
    const report = await runLinkCheck([dir1, dir2], tmpDir, { checkExternal: false });
    expect(report.scanned).toBe(2);
  });

  it('total = ok + broken + skipped', async () => {
    write('doc.md', '[external](https://a.com)\n[missing](./no.md)\n[ok](./doc.md)');
    const report = await runLinkCheck([tmpDir], tmpDir, { checkExternal: false });
    const total = report.ok.length + report.broken.length + report.skipped.length;
    expect(total).toBe(report.checked);
  });
});
