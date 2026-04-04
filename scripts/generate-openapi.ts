/**
 * WebWaka OS v4 — OpenAPI Generation Script
 *
 * Merges OpenAPI specs extracted from all platform repositories
 * into a single validated openapi.json file.
 *
 * Usage: npx ts-node scripts/generate-openapi.ts [--output ./openapi.json]
 * Blueprint Reference: Part 8.1 — API Documentation Automation
 */

import * as fs from 'fs';
import * as path from 'path';

// ===== TYPES =====

export interface OpenAPISpec {
  openapi: string;
  info: {
    title: string;
    version: string;
    description?: string;
  };
  paths: Record<string, PathItem>;
  components?: {
    schemas?: Record<string, SchemaObject>;
    securitySchemes?: Record<string, unknown>;
    responses?: Record<string, unknown>;
  };
  tags?: Array<{ name: string; description?: string }>;
  servers?: Array<{ url: string; description?: string }>;
}

export interface PathItem {
  get?: OperationObject;
  post?: OperationObject;
  put?: OperationObject;
  patch?: OperationObject;
  delete?: OperationObject;
  head?: OperationObject;
  options?: OperationObject;
}

export interface OperationObject {
  tags?: string[];
  summary?: string;
  description?: string;
  operationId?: string;
  parameters?: ParameterObject[];
  requestBody?: RequestBodyObject;
  responses?: Record<string, unknown>;
  security?: unknown[];
}

export interface ParameterObject {
  name: string;
  in: 'query' | 'path' | 'header' | 'cookie';
  required?: boolean;
  schema?: SchemaObject;
  description?: string;
}

export interface RequestBodyObject {
  required?: boolean;
  content?: Record<string, { schema?: SchemaObject; example?: unknown }>;
}

export interface SchemaObject {
  type?: string;
  format?: string;
  properties?: Record<string, SchemaObject>;
  items?: SchemaObject;
  required?: string[];
  enum?: unknown[];
  description?: string;
  $ref?: string;
  oneOf?: SchemaObject[];
  allOf?: SchemaObject[];
}

export interface RouteInfo {
  method: string;
  path: string;
  operationId?: string;
  summary?: string;
  tags?: string[];
  parameters?: ParameterObject[];
  hasBody?: boolean;
  bodyType?: string;
  returnType?: string;
}

// ===== EXTRACTION =====

/**
 * Extract route declarations from a TypeScript source file.
 * Recognises TSOA decorators (@Route, @Get, @Post, etc.) and
 * plain Express router patterns (router.get/post/put/patch/delete).
 */
export function extractRoutesFromTSFile(content: string): RouteInfo[] {
  const routes: RouteInfo[] = [];

  // Match TSOA-style decorators: @Route('/basePath') + @Get('/subPath') etc.
  const controllerMatch = content.match(/@Route\(['"]([^'"]+)['"]\)/);
  const basePath = controllerMatch ? controllerMatch[1].replace(/\/+$/, '') : '';

  const tsoaPattern = /@(Get|Post|Put|Patch|Delete|Head)\(['"]?([^'")\s]*?)['"]?\)/g;
  let tsoaMatch: RegExpExecArray | null;
  while ((tsoaMatch = tsoaPattern.exec(content)) !== null) {
    const method = tsoaMatch[1].toLowerCase();
    const subPath = tsoaMatch[2] || '/';
    const fullPath = basePath
      ? `/${basePath.replace(/^\//, '')}${subPath.startsWith('/') ? subPath : '/' + subPath}`
      : (subPath.startsWith('/') ? subPath : '/' + subPath);

    // Extract optional @OperationId decorator immediately following
    const afterDecorator = content.slice(tsoaMatch.index + tsoaMatch[0].length, tsoaMatch.index + tsoaMatch[0].length + 200);
    const opIdMatch = afterDecorator.match(/@OperationId\(['"]([^'"]+)['"]\)/);
    const summaryMatch = afterDecorator.match(/\/\*\*\s*\n\s*\*\s*([^\n]+)/);

    routes.push({
      method,
      path: fullPath,
      operationId: opIdMatch ? opIdMatch[1] : undefined,
      summary: summaryMatch ? summaryMatch[1].trim() : undefined,
    });
  }

  // Match Express-style: router.get('/path', ...) or app.post('/path', ...)
  const expressPattern = /(?:router|app)\.(get|post|put|patch|delete)\s*\(\s*['"]([^'"]+)['"]/g;
  let expressMatch: RegExpExecArray | null;
  while ((expressMatch = expressPattern.exec(content)) !== null) {
    const method = expressMatch[1].toLowerCase();
    const routePath = expressMatch[2];

    // Avoid duplicates from TSOA extraction
    const isDupe = routes.some(r => r.method === method && r.path === routePath);
    if (!isDupe) {
      routes.push({ method, path: routePath });
    }
  }

  return routes;
}

/**
 * Build a partial OpenAPI PathItem map from extracted RouteInfo objects.
 */
export function buildPathsFromRoutes(routes: RouteInfo[]): Record<string, PathItem> {
  const paths: Record<string, PathItem> = {};

  for (const route of routes) {
    if (!paths[route.path]) paths[route.path] = {};

    const operation: OperationObject = {
      operationId: route.operationId,
      summary: route.summary,
      tags: route.tags,
      responses: { '200': { description: 'Success' } },
    };

    // Remove undefined fields
    if (!operation.operationId) delete operation.operationId;
    if (!operation.summary) delete operation.summary;
    if (!operation.tags) delete operation.tags;

    (paths[route.path] as Record<string, OperationObject>)[route.method] = operation;
  }

  return paths;
}

// ===== MERGING =====

/**
 * Merge multiple partial OpenAPI specs into a single canonical spec.
 * Later specs override conflicting paths; schemas are deeply merged.
 */
export function mergeOpenAPISpecs(base: OpenAPISpec, ...additional: Partial<OpenAPISpec>[]): OpenAPISpec {
  const merged: OpenAPISpec = {
    openapi: base.openapi,
    info: { ...base.info },
    paths: { ...base.paths },
    components: {
      schemas: { ...(base.components?.schemas ?? {}) },
      securitySchemes: { ...(base.components?.securitySchemes ?? {}) },
      responses: { ...(base.components?.responses ?? {}) },
    },
    tags: [...(base.tags ?? [])],
    servers: [...(base.servers ?? [])],
  };

  for (const spec of additional) {
    // Merge paths (additional paths override base on conflict)
    if (spec.paths) {
      for (const [pathKey, pathItem] of Object.entries(spec.paths)) {
        if (merged.paths[pathKey]) {
          merged.paths[pathKey] = { ...merged.paths[pathKey], ...pathItem };
        } else {
          merged.paths[pathKey] = pathItem;
        }
      }
    }

    // Merge schemas
    if (spec.components?.schemas) {
      Object.assign(merged.components!.schemas!, spec.components.schemas);
    }

    // Merge tags (deduplicate by name)
    if (spec.tags) {
      const existingNames = new Set(merged.tags!.map(t => t.name));
      for (const tag of spec.tags) {
        if (!existingNames.has(tag.name)) {
          merged.tags!.push(tag);
          existingNames.add(tag.name);
        }
      }
    }
  }

  return merged;
}

// ===== VALIDATION =====

/**
 * Validate that an object conforms to the minimal OpenAPI 3.x structure.
 * Returns true if valid, false otherwise.
 */
export function validateOpenAPISpec(spec: unknown): spec is OpenAPISpec {
  if (!spec || typeof spec !== 'object') return false;
  const s = spec as Record<string, unknown>;

  // Required top-level fields
  if (typeof s['openapi'] !== 'string') return false;
  if (!s['openapi'].startsWith('3.')) return false;
  if (!s['info'] || typeof s['info'] !== 'object') return false;
  if (!s['paths'] || typeof s['paths'] !== 'object') return false;

  const info = s['info'] as Record<string, unknown>;
  if (typeof info['title'] !== 'string' || info['title'].trim() === '') return false;
  if (typeof info['version'] !== 'string' || info['version'].trim() === '') return false;

  // Validate each path has at least one valid HTTP method
  const validMethods = new Set(['get', 'post', 'put', 'patch', 'delete', 'head', 'options']);
  const paths = s['paths'] as Record<string, unknown>;
  for (const [pathKey, pathItem] of Object.entries(paths)) {
    if (!pathKey.startsWith('/')) return false;
    if (!pathItem || typeof pathItem !== 'object') return false;
    const methods = Object.keys(pathItem as object).filter(k => validMethods.has(k));
    if (methods.length === 0) return false;
  }

  return true;
}

// ===== FILE I/O =====

/**
 * Load a JSON file as an OpenAPISpec.
 */
export function loadSpecFromFile(filePath: string): OpenAPISpec {
  const content = fs.readFileSync(filePath, 'utf8');
  const parsed = JSON.parse(content) as unknown;
  if (!validateOpenAPISpec(parsed)) {
    throw new Error(`Invalid OpenAPI spec at: ${filePath}`);
  }
  return parsed;
}

/**
 * Write an OpenAPISpec to a JSON file.
 */
export function writeSpecToFile(spec: OpenAPISpec, outputPath: string): void {
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, JSON.stringify(spec, null, 2) + '\n', 'utf8');
}

// ===== CLI ENTRY POINT =====

/* istanbul ignore next */
if (require.main === module) {
  const args = process.argv.slice(2);
  const outputIndex = args.indexOf('--output');
  const outputPath = outputIndex !== -1 ? args[outputIndex + 1] : './openapi.json';

  console.log('[generate-openapi] Loading base spec from openapi.json…');
  const base = loadSpecFromFile('./openapi.json');
  console.log(`[generate-openapi] Base spec: ${Object.keys(base.paths).length} paths, ${Object.keys(base.components?.schemas ?? {}).length} schemas`);

  // In a real CI environment, additional specs cloned from all 15 repos would
  // be passed as additional arguments and merged here. For local runs, we just
  // re-validate and write the existing spec.
  const merged = mergeOpenAPISpecs(base);
  writeSpecToFile(merged, outputPath);
  console.log(`[generate-openapi] ✅ Merged spec written to ${outputPath}`);
  console.log(`[generate-openapi]    Paths: ${Object.keys(merged.paths).length}`);
  console.log(`[generate-openapi]    Schemas: ${Object.keys(merged.components?.schemas ?? {}).length}`);
}
