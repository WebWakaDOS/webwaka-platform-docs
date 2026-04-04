/**
 * WebWaka OS v4 Docs — Link Checker
 *
 * Crawls all Markdown files in the docs tree and verifies that:
 *   - Internal links resolve to existing files.
 *   - External links return HTTP 2xx responses (with optional flag to skip).
 *
 * Usage:
 *   npx ts-node scripts/check-links.ts [--no-external] [--dir ./content]
 *
 * Exit codes:
 *   0  — all links OK
 *   1  — one or more broken links found
 *
 * Blueprint Reference: Part 8.2 — Documentation Quality Gates
 */

import * as fs from 'fs';
import * as path from 'path';

// ===== TYPES =====

export interface LinkCheckResult {
  file: string;
  link: string;
  type: 'internal' | 'external';
  status: 'ok' | 'broken' | 'skipped';
  reason?: string;
}

export interface LinkCheckReport {
  scanned: number;
  checked: number;
  broken: LinkCheckResult[];
  ok: LinkCheckResult[];
  skipped: LinkCheckResult[];
}

// ===== MARKDOWN SCANNING =====

const MARKDOWN_LINK_RE = /\[([^\]]*)\]\(([^)#\s]+)/g;
const IMAGE_LINK_RE = /!\[([^\]]*)\]\(([^)#\s]+)/g;
const HTML_HREF_RE = /href=["']([^"'#]+)["']/g;

/**
 * Extract all links (markdown, image, and raw href) from a Markdown file.
 */
export function extractLinksFromFile(filePath: string): string[] {
  const content = fs.readFileSync(filePath, 'utf8');
  const links = new Set<string>();

  let match: RegExpExecArray | null;

  const patterns = [MARKDOWN_LINK_RE, IMAGE_LINK_RE, HTML_HREF_RE];
  for (const pattern of patterns) {
    pattern.lastIndex = 0;
    while ((match = pattern.exec(content)) !== null) {
      const url = match[2] || match[1];
      if (url && url.trim() && !url.startsWith('#')) {
        links.add(url.trim());
      }
    }
  }

  return Array.from(links);
}

/**
 * Recursively collect all Markdown files in a directory.
 */
export function collectMarkdownFiles(dir: string): string[] {
  const files: string[] = [];

  if (!fs.existsSync(dir)) return files;

  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...collectMarkdownFiles(fullPath));
    } else if (entry.isFile() && (entry.name.endsWith('.md') || entry.name.endsWith('.mdx'))) {
      files.push(fullPath);
    }
  }

  return files;
}

// ===== LINK RESOLUTION =====

/**
 * Resolve an internal link relative to the markdown file that contains it.
 * Returns the absolute file path the link points to.
 */
export function resolveInternalLink(link: string, sourceFile: string, rootDir: string): string {
  if (link.startsWith('/')) {
    // Absolute path from doc root
    return path.join(rootDir, link);
  }
  // Relative path from source file's directory
  return path.resolve(path.dirname(sourceFile), link);
}

/**
 * Check if an internal link resolves to an existing file or directory.
 */
export function checkInternalLink(link: string, sourceFile: string, rootDir: string): LinkCheckResult {
  const resolved = resolveInternalLink(link, sourceFile, rootDir);
  const candidates = [
    resolved,
    resolved + '.md',
    resolved + '/README.md',
    resolved + '/index.md',
  ];

  const exists = candidates.some(c => fs.existsSync(c));

  return {
    file: sourceFile,
    link,
    type: 'internal',
    status: exists ? 'ok' : 'broken',
    reason: exists ? undefined : `Resolved to ${resolved} — not found`,
  };
}

// ===== EXTERNAL LINK CHECKING =====

/**
 * Check if an external URL returns a 2xx response.
 * Implements a simple HEAD-first, GET-fallback approach with a timeout.
 */
/* istanbul ignore next */
export async function checkExternalLink(link: string, sourceFile: string, timeoutMs = 8000): Promise<LinkCheckResult> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(link, {
      method: 'HEAD',
      signal: controller.signal,
      headers: { 'User-Agent': 'WebWaka-Docs-LinkChecker/1.0' },
      redirect: 'follow',
    });

    clearTimeout(timer);

    if (response.status >= 200 && response.status < 300) {
      return { file: sourceFile, link, type: 'external', status: 'ok' };
    }

    // Some servers reject HEAD; try GET
    if (response.status === 405 || response.status === 403) {
      const getResponse = await fetch(link, {
        method: 'GET',
        headers: { 'User-Agent': 'WebWaka-Docs-LinkChecker/1.0' },
        redirect: 'follow',
      });
      return {
        file: sourceFile,
        link,
        type: 'external',
        status: getResponse.ok ? 'ok' : 'broken',
        reason: getResponse.ok ? undefined : `HTTP ${getResponse.status}`,
      };
    }

    return {
      file: sourceFile,
      link,
      type: 'external',
      status: 'broken',
      reason: `HTTP ${response.status}`,
    };
  } catch (err: unknown) {
    clearTimeout(timer);
    const msg = err instanceof Error ? err.message : String(err);
    return {
      file: sourceFile,
      link,
      type: 'external',
      status: 'broken',
      reason: msg.includes('abort') ? 'Timeout' : msg,
    };
  }
}

// ===== FULL REPORT =====

/**
 * Run the full link check across all Markdown files in the given directories.
 */
export async function runLinkCheck(
  dirs: string[],
  rootDir: string,
  options: { checkExternal?: boolean } = {},
): Promise<LinkCheckReport> {
  const { checkExternal = true } = options;

  // Collect all markdown files
  const files: string[] = [];
  for (const dir of dirs) {
    files.push(...collectMarkdownFiles(dir));
  }

  const report: LinkCheckReport = {
    scanned: files.length,
    checked: 0,
    broken: [],
    ok: [],
    skipped: [],
  };

  for (const file of files) {
    const links = extractLinksFromFile(file);

    for (const link of links) {
      report.checked++;
      const isExternal = link.startsWith('http://') || link.startsWith('https://');

      if (isExternal) {
        if (!checkExternal) {
          report.skipped.push({ file, link, type: 'external', status: 'skipped', reason: '--no-external flag' });
        } else {
          const result = await checkExternalLink(link, file);
          if (result.status === 'ok') report.ok.push(result);
          else report.broken.push(result);
        }
      } else {
        const result = checkInternalLink(link, file, rootDir);
        if (result.status === 'ok') report.ok.push(result);
        else report.broken.push(result);
      }
    }
  }

  return report;
}

// ===== CLI ENTRY POINT =====

/* istanbul ignore next */
if (require.main === module) {
  const args = process.argv.slice(2);
  const noExternal = args.includes('--no-external');
  const dirIndex = args.indexOf('--dir');
  const dirs = dirIndex !== -1
    ? [args[dirIndex + 1]]
    : ['.', 'content', 'translations', 'versions'];

  const rootDir = process.cwd();
  console.log(`[check-links] Scanning ${dirs.join(', ')} for Markdown files…`);

  runLinkCheck(dirs, rootDir, { checkExternal: !noExternal })
    .then(report => {
      console.log(`\n[check-links] Scanned ${report.scanned} files, checked ${report.checked} links`);
      console.log(`             ✅ OK: ${report.ok.length}  ❌ Broken: ${report.broken.length}  ⏭  Skipped: ${report.skipped.length}\n`);

      if (report.broken.length > 0) {
        console.error('[check-links] ❌ Broken links found:\n');
        for (const result of report.broken) {
          console.error(`  File:   ${result.file}`);
          console.error(`  Link:   ${result.link}`);
          console.error(`  Reason: ${result.reason ?? 'unknown'}\n`);
        }
        process.exit(1);
      }

      console.log('[check-links] ✅ All links OK');
    })
    .catch(err => {
      console.error('[check-links] ❌ Fatal error:', (err as Error).message);
      process.exit(1);
    });
}
