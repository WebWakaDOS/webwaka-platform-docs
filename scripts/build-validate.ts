/**
 * WebWaka OS v4 Docs — Build Validation Script
 *
 * Runs a full validation suite to ensure the documentation site is build-ready:
 *   1. Validates the OpenAPI spec structure
 *   2. Validates the manifest.json structure
 *   3. Checks that all required documentation files exist
 *   4. Validates the GitHub Actions CI workflow syntax
 *   5. Checks ADR, tutorial, and translation file completeness
 *   6. Reports a pass/fail summary
 *
 * Usage: npx ts-node scripts/build-validate.ts
 * Exit codes:
 *   0 — all checks passed
 *   1 — one or more checks failed
 *
 * Blueprint Reference: QA-DOC Regression Guards
 */

import * as fs from 'fs';
import * as path from 'path';
import { validateOpenAPISpec, loadSpecFromFile } from './generate-openapi';

// ===== TYPES =====

export interface ValidationResult {
  name: string;
  passed: boolean;
  message?: string;
}

export interface BuildReport {
  results: ValidationResult[];
  passed: number;
  failed: number;
  total: number;
  success: boolean;
}

// ===== CHECKERS =====

/**
 * Check that a file or directory exists.
 */
export function checkFileExists(filePath: string, label?: string): ValidationResult {
  const name = label ?? `File exists: ${filePath}`;
  const exists = fs.existsSync(filePath);
  return {
    name,
    passed: exists,
    message: exists ? undefined : `Missing: ${filePath}`,
  };
}

/**
 * Validate that the OpenAPI spec at the given path is structurally valid.
 */
export function validateOpenAPI(specPath: string): ValidationResult {
  const name = `OpenAPI spec valid: ${specPath}`;
  try {
    const spec = loadSpecFromFile(specPath);
    const pathCount = Object.keys(spec.paths).length;
    const schemaCount = Object.keys(spec.components?.schemas ?? {}).length;
    return {
      name,
      passed: true,
      message: `${pathCount} paths, ${schemaCount} schemas`,
    };
  } catch (err) {
    return {
      name,
      passed: false,
      message: (err as Error).message,
    };
  }
}

/**
 * Validate that a JSON file is parseable and matches a minimal schema.
 */
export function validateJSON(filePath: string, requiredKeys: string[] = []): ValidationResult {
  const name = `JSON valid: ${filePath}`;
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const parsed = JSON.parse(content) as Record<string, unknown>;
    const missingKeys = requiredKeys.filter(k => !(k in parsed));
    if (missingKeys.length > 0) {
      return { name, passed: false, message: `Missing required keys: ${missingKeys.join(', ')}` };
    }
    return { name, passed: true };
  } catch (err) {
    return { name, passed: false, message: (err as Error).message };
  }
}

/**
 * Check that a directory contains at least N files matching a glob pattern.
 */
export function checkDirectoryContains(dir: string, extension: string, minCount: number): ValidationResult {
  const name = `${dir} has ≥${minCount} ${extension} files`;
  try {
    if (!fs.existsSync(dir)) {
      return { name, passed: false, message: `Directory not found: ${dir}` };
    }
    const files = fs.readdirSync(dir).filter(f => f.endsWith(extension));
    const passed = files.length >= minCount;
    return {
      name,
      passed,
      message: passed ? `Found ${files.length} files` : `Only ${files.length} found, need ${minCount}`,
    };
  } catch (err) {
    return { name, passed: false, message: (err as Error).message };
  }
}

/**
 * Check that a Markdown file contains a specific string.
 */
export function checkMarkdownContains(filePath: string, searchString: string): ValidationResult {
  const name = `${path.basename(filePath)} contains "${searchString}"`;
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const found = content.includes(searchString);
    return { name, passed: found, message: found ? undefined : `String not found in ${filePath}` };
  } catch (err) {
    return { name, passed: false, message: (err as Error).message };
  }
}

/**
 * Validate the GitHub Actions workflow YAML file exists and is non-empty.
 */
export function validateWorkflow(workflowPath: string): ValidationResult {
  const name = `GitHub Actions workflow: ${workflowPath}`;
  try {
    if (!fs.existsSync(workflowPath)) {
      return { name, passed: false, message: 'Workflow file not found' };
    }
    const content = fs.readFileSync(workflowPath, 'utf8');
    if (content.trim().length < 50) {
      return { name, passed: false, message: 'Workflow file appears empty' };
    }
    const hasOn = content.includes('on:') || content.includes('"on":');
    const hasJobs = content.includes('jobs:');
    if (!hasOn || !hasJobs) {
      return { name, passed: false, message: 'Workflow missing "on" or "jobs" section' };
    }
    return { name, passed: true };
  } catch (err) {
    return { name, passed: false, message: (err as Error).message };
  }
}

// ===== FULL BUILD VALIDATION =====

/**
 * Run all build validation checks and return a comprehensive report.
 */
export function runBuildValidation(rootDir: string = process.cwd()): BuildReport {
  const results: ValidationResult[] = [];

  // 1. Core files exist
  results.push(checkFileExists(path.join(rootDir, 'server.js'), 'server.js exists'));
  results.push(checkFileExists(path.join(rootDir, 'package.json'), 'package.json exists'));
  results.push(checkFileExists(path.join(rootDir, 'openapi.json'), 'openapi.json exists'));
  results.push(checkFileExists(path.join(rootDir, 'public/manifest.json'), 'PWA manifest exists'));
  results.push(checkFileExists(path.join(rootDir, 'public/sw.js'), 'Service worker exists'));
  results.push(checkFileExists(path.join(rootDir, 'public/css/main.css'), 'main.css exists'));
  results.push(checkFileExists(path.join(rootDir, 'public/js/main.js'), 'main.js exists'));

  // 2. OpenAPI spec validation
  results.push(validateOpenAPI(path.join(rootDir, 'openapi.json')));

  // 3. Manifest validation
  results.push(validateJSON(path.join(rootDir, 'public/manifest.json'), [
    'name', 'short_name', 'start_url', 'display', 'icons',
  ]));

  // 4. GitHub Actions workflow
  results.push(validateWorkflow(path.join(rootDir, '.github/workflows/generate-openapi.yml')));

  // 5. Documentation content files
  const contentFiles = [
    'content/error-codes.md',
    'content/webhooks.md',
    'content/security-compliance.md',
    'content/sdk-docs.md',
    'content/developer-portal.md',
    'content/contribution-guidelines.md',
  ];
  for (const f of contentFiles) {
    results.push(checkFileExists(path.join(rootDir, f)));
  }

  // 6. ADRs (at least 3)
  results.push(checkDirectoryContains(path.join(rootDir, 'content/adrs'), '.md', 3));

  // 7. Tutorials (at least 3)
  results.push(checkDirectoryContains(path.join(rootDir, 'content/tutorials'), '.md', 3));

  // 8. Translations (all 3 languages)
  for (const lang of ['fr', 'sw', 'ar']) {
    results.push(checkFileExists(
      path.join(rootDir, `translations/${lang}/README.md`),
      `translations/${lang}/README.md exists`,
    ));
  }

  // 9. Versioned docs
  results.push(checkFileExists(path.join(rootDir, 'versions/v1.x/README.md'), 'v1.x legacy docs exist'));

  // 10. ADR structure check — first ADR must have Status, Context, Decision, Consequences
  const adr1 = path.join(rootDir, 'content/adrs/ADR-001-multi-tenant-architecture.md');
  if (fs.existsSync(adr1)) {
    results.push(checkMarkdownContains(adr1, 'Status:'));
    results.push(checkMarkdownContains(adr1, 'Context'));
    results.push(checkMarkdownContains(adr1, 'Decision'));
    results.push(checkMarkdownContains(adr1, 'Consequences'));
  }

  // 11. Scripts directory
  results.push(checkDirectoryContains(path.join(rootDir, 'scripts'), '.ts', 4));

  // ===== Compile report =====
  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;

  return {
    results,
    passed,
    failed,
    total: results.length,
    success: failed === 0,
  };
}

// ===== CLI ENTRY POINT =====

/* istanbul ignore next */
if (require.main === module) {
  const rootDir = process.cwd();
  console.log(`\n🔍 WebWaka OS v4 Docs — Build Validation\n${'═'.repeat(50)}`);

  const report = runBuildValidation(rootDir);

  for (const result of report.results) {
    const icon = result.passed ? '✅' : '❌';
    const msg = result.message ? ` (${result.message})` : '';
    console.log(`${icon} ${result.name}${msg}`);
  }

  console.log(`\n${'─'.repeat(50)}`);
  console.log(`Total: ${report.total}  ✅ Passed: ${report.passed}  ❌ Failed: ${report.failed}`);

  if (report.success) {
    console.log('\n✅ All validation checks passed — build is ready\n');
    process.exit(0);
  } else {
    console.error('\n❌ Build validation FAILED — fix the issues above before deploying\n');
    process.exit(1);
  }
}
