/**
 * Unit tests for scripts/build-validate.ts
 * Blueprint Reference: QA-DOC Regression Guards
 */

import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import {
  checkFileExists,
  validateOpenAPI,
  validateJSON,
  checkDirectoryContains,
  checkMarkdownContains,
  validateWorkflow,
  runBuildValidation,
} from './build-validate';

// ===== HELPERS =====

let tmpDir: string;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'webwaka-build-test-'));
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

// ===== checkFileExists =====

describe('checkFileExists', () => {
  it('passes when file exists', () => {
    const p = write('test.md', '# test');
    const result = checkFileExists(p);
    expect(result.passed).toBe(true);
  });

  it('fails when file does not exist', () => {
    const result = checkFileExists(path.join(tmpDir, 'missing.md'));
    expect(result.passed).toBe(false);
    expect(result.message).toContain('Missing');
  });

  it('uses the provided label as the result name', () => {
    const p = write('a.md', '# a');
    const result = checkFileExists(p, 'Custom label');
    expect(result.name).toBe('Custom label');
  });

  it('uses file path as label when no label provided', () => {
    const p = write('b.md', '# b');
    const result = checkFileExists(p);
    expect(result.name).toContain('b.md');
  });
});

// ===== validateOpenAPI =====

describe('validateOpenAPI', () => {
  it('passes for a valid OpenAPI spec file', () => {
    const spec = {
      openapi: '3.1.0',
      info: { title: 'Test', version: '1.0.0' },
      paths: { '/health': { get: { responses: { '200': { description: 'OK' } } } } },
    };
    const p = write('openapi.json', JSON.stringify(spec));
    const result = validateOpenAPI(p);
    expect(result.passed).toBe(true);
  });

  it('fails for an invalid OpenAPI spec', () => {
    const p = write('bad.json', JSON.stringify({ invalid: true }));
    const result = validateOpenAPI(p);
    expect(result.passed).toBe(false);
  });

  it('fails when the file does not exist', () => {
    const result = validateOpenAPI('/nonexistent/openapi.json');
    expect(result.passed).toBe(false);
  });

  it('includes path and schema count in the message when valid', () => {
    const spec = {
      openapi: '3.1.0',
      info: { title: 'T', version: '1' },
      paths: {
        '/a': { get: { responses: { '200': { description: 'OK' } } } },
        '/b': { post: { responses: { '201': { description: 'Created' } } } },
      },
      components: { schemas: { User: { type: 'object' } } },
    };
    const p = write('openapi.json', JSON.stringify(spec));
    const result = validateOpenAPI(p);
    expect(result.message).toContain('2 paths');
    expect(result.message).toContain('1 schemas');
  });
});

// ===== validateJSON =====

describe('validateJSON', () => {
  it('passes for valid JSON with all required keys', () => {
    const p = write('data.json', JSON.stringify({ name: 'Test', version: '1.0' }));
    const result = validateJSON(p, ['name', 'version']);
    expect(result.passed).toBe(true);
  });

  it('fails when a required key is missing', () => {
    const p = write('data.json', JSON.stringify({ name: 'Test' }));
    const result = validateJSON(p, ['name', 'version']);
    expect(result.passed).toBe(false);
    expect(result.message).toContain('version');
  });

  it('passes with no required keys specified', () => {
    const p = write('data.json', JSON.stringify({ anything: true }));
    const result = validateJSON(p, []);
    expect(result.passed).toBe(true);
  });

  it('fails for malformed JSON', () => {
    const p = write('bad.json', '{ this is not json }');
    const result = validateJSON(p, []);
    expect(result.passed).toBe(false);
  });

  it('fails when file does not exist', () => {
    const result = validateJSON(path.join(tmpDir, 'nonexistent.json'), []);
    expect(result.passed).toBe(false);
  });
});

// ===== checkDirectoryContains =====

describe('checkDirectoryContains', () => {
  it('passes when directory has enough matching files', () => {
    write('docs/a.md', '# A');
    write('docs/b.md', '# B');
    write('docs/c.md', '# C');
    const result = checkDirectoryContains(path.join(tmpDir, 'docs'), '.md', 3);
    expect(result.passed).toBe(true);
  });

  it('fails when directory has fewer files than required', () => {
    write('docs/a.md', '# A');
    const result = checkDirectoryContains(path.join(tmpDir, 'docs'), '.md', 3);
    expect(result.passed).toBe(false);
    expect(result.message).toContain('Only 1');
  });

  it('fails when directory does not exist', () => {
    const result = checkDirectoryContains(path.join(tmpDir, 'nonexistent'), '.md', 1);
    expect(result.passed).toBe(false);
    expect(result.message).toContain('not found');
  });

  it('ignores files that do not match the extension', () => {
    write('docs/a.md', '# A');
    write('docs/b.ts', 'const x = 1;');
    const result = checkDirectoryContains(path.join(tmpDir, 'docs'), '.md', 2);
    expect(result.passed).toBe(false); // only 1 .md file
  });

  it('passes exactly at the minimum count', () => {
    write('docs/a.md', '# A');
    const result = checkDirectoryContains(path.join(tmpDir, 'docs'), '.md', 1);
    expect(result.passed).toBe(true);
  });
});

// ===== checkMarkdownContains =====

describe('checkMarkdownContains', () => {
  it('passes when string is found in the file', () => {
    const p = write('doc.md', '# Title\n\n## Status: Accepted\n\nContent here.');
    const result = checkMarkdownContains(p, 'Status:');
    expect(result.passed).toBe(true);
  });

  it('fails when string is not found', () => {
    const p = write('doc.md', '# Title\n\nNo status here.');
    const result = checkMarkdownContains(p, 'Status:');
    expect(result.passed).toBe(false);
  });

  it('fails when file does not exist', () => {
    const result = checkMarkdownContains(path.join(tmpDir, 'missing.md'), 'anything');
    expect(result.passed).toBe(false);
  });

  it('uses the basename in the result name', () => {
    const p = write('my-adr.md', '# ADR');
    const result = checkMarkdownContains(p, '# ADR');
    expect(result.name).toContain('my-adr.md');
  });
});

// ===== validateWorkflow =====

describe('validateWorkflow', () => {
  it('passes for a valid GitHub Actions workflow file', () => {
    const workflow = `
name: Validate OpenAPI
on:
  push:
    branches: [main]
jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npx swagger-cli validate openapi.json
`.trim();
    const p = write('.github/workflows/ci.yml', workflow);
    const result = validateWorkflow(p);
    expect(result.passed).toBe(true);
  });

  it('fails when workflow file does not exist', () => {
    const result = validateWorkflow(path.join(tmpDir, 'nonexistent.yml'));
    expect(result.passed).toBe(false);
    expect(result.message).toContain('not found');
  });

  it('fails when workflow file is too short (empty/stub)', () => {
    const p = write('ci.yml', 'on: push');
    const result = validateWorkflow(p);
    expect(result.passed).toBe(false);
    expect(result.message).toContain('empty');
  });

  it('fails when workflow has no "jobs" section', () => {
    const p = write('ci.yml', `
name: Test
on:
  push:
    branches: [main]
# missing jobs section
`.repeat(5));
    const result = validateWorkflow(p);
    expect(result.passed).toBe(false);
  });
});

// ===== runBuildValidation (integration) =====

describe('runBuildValidation', () => {
  function scaffoldMinimalProject(dir: string): void {
    const spec = {
      openapi: '3.1.0',
      info: { title: 'WebWaka API', version: '4.0.0' },
      paths: {
        '/health': { get: { responses: { '200': { description: 'OK' } } } },
      },
    };
    const manifest = {
      name: 'WebWaka Docs',
      short_name: 'Docs',
      start_url: '/',
      display: 'standalone',
      icons: [{ src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' }],
    };
    const workflow = `
name: CI
on:
  push:
    branches: [main]
jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: node --version
`.trim();

    // Core files
    write(path.join(dir, 'server.js').replace(tmpDir + '/', ''), 'const app = {};');
    write(path.join(dir, 'package.json').replace(tmpDir + '/', ''), JSON.stringify({ name: 'test' }));
    write(path.join(dir, 'openapi.json').replace(tmpDir + '/', ''), JSON.stringify(spec));
    write(path.join(dir, 'public/manifest.json').replace(tmpDir + '/', ''), JSON.stringify(manifest));
    write(path.join(dir, 'public/sw.js').replace(tmpDir + '/', ''), 'self.addEventListener("install", () => {});');
    write(path.join(dir, 'public/css/main.css').replace(tmpDir + '/', ''), 'body { margin: 0; }');
    write(path.join(dir, 'public/js/main.js').replace(tmpDir + '/', ''), 'console.log("ready");');

    // Workflow
    write(path.join(dir, '.github/workflows/generate-openapi.yml').replace(tmpDir + '/', ''), workflow);

    // Content files
    for (const f of ['error-codes', 'webhooks', 'security-compliance', 'sdk-docs', 'developer-portal', 'contribution-guidelines']) {
      write(path.join(dir, `content/${f}.md`).replace(tmpDir + '/', ''), `# ${f}`);
    }

    // ADRs
    write(path.join(dir, 'content/adrs/ADR-001-multi-tenant-architecture.md').replace(tmpDir + '/', ''),
      '# ADR-001\n\nStatus: Accepted\n\n## Context\n\nDecision made.\n\n## Decision\n\nUse X.\n\n## Consequences\n\nGood outcome.');
    write(path.join(dir, 'content/adrs/ADR-002.md').replace(tmpDir + '/', ''), '# ADR-002');
    write(path.join(dir, 'content/adrs/ADR-003.md').replace(tmpDir + '/', ''), '# ADR-003');

    // Tutorials
    write(path.join(dir, 'content/tutorials/01.md').replace(tmpDir + '/', ''), '# Tutorial 1');
    write(path.join(dir, 'content/tutorials/02.md').replace(tmpDir + '/', ''), '# Tutorial 2');
    write(path.join(dir, 'content/tutorials/03.md').replace(tmpDir + '/', ''), '# Tutorial 3');

    // Translations
    for (const lang of ['fr', 'sw', 'ar']) {
      write(path.join(dir, `translations/${lang}/README.md`).replace(tmpDir + '/', ''), `# ${lang.toUpperCase()} Docs`);
    }

    // Versions
    write(path.join(dir, 'versions/v1.x/README.md').replace(tmpDir + '/', ''), '# v1.x Legacy Docs');

    // Scripts
    for (const s of ['generate-openapi.ts', 'translate.ts', 'check-links.ts', 'build-validate.ts']) {
      write(path.join(dir, `scripts/${s}`).replace(tmpDir + '/', ''), '// script');
    }
  }

  it('passes all checks for a fully scaffolded project', () => {
    scaffoldMinimalProject(tmpDir);
    const report = runBuildValidation(tmpDir);
    const failedNames = report.results.filter(r => !r.passed).map(r => r.name);
    expect(failedNames).toHaveLength(0);
    expect(report.success).toBe(true);
    expect(report.passed).toBeGreaterThan(0);
  });

  it('reports failure when required files are missing', () => {
    // Empty directory — most checks should fail
    const report = runBuildValidation(tmpDir);
    expect(report.success).toBe(false);
    expect(report.failed).toBeGreaterThan(0);
  });

  it('returns the correct total count', () => {
    const report = runBuildValidation(tmpDir);
    expect(report.total).toBe(report.passed + report.failed);
  });

  it('reports exactly which checks failed', () => {
    scaffoldMinimalProject(tmpDir);
    // Remove one required file
    fs.unlinkSync(path.join(tmpDir, 'public/sw.js'));
    const report = runBuildValidation(tmpDir);
    expect(report.success).toBe(false);
    const swCheck = report.results.find(r => r.name.includes('sw.js') || r.name.includes('Service worker'));
    expect(swCheck?.passed).toBe(false);
  });
});
