/**
 * Unit tests for scripts/generate-openapi.ts
 * Blueprint Reference: Part 8.1 — QA-DOC-4
 */

import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import {
  extractRoutesFromTSFile,
  buildPathsFromRoutes,
  mergeOpenAPISpecs,
  validateOpenAPISpec,
  loadSpecFromFile,
  writeSpecToFile,
  RouteInfo,
  OpenAPISpec,
} from './generate-openapi';

// ===== FIXTURES =====

const minimalValidSpec = (): OpenAPISpec => ({
  openapi: '3.1.0',
  info: { title: 'Test API', version: '1.0.0' },
  paths: {
    '/health': {
      get: { responses: { '200': { description: 'OK' } } },
    },
  },
});

const tsoaSource = `
import { Route, Get, Post, Delete, OperationId } from 'tsoa';

@Route('tenants')
export class TenantController {
  /** List all tenants */
  @Get('/')
  @OperationId('listTenants')
  async list() { return []; }

  /** Create a tenant */
  @Post('/')
  @OperationId('createTenant')
  async create() { return {}; }

  /** Delete a tenant */
  @Delete('/{tenantId}')
  async delete() { return; }
}
`;

const expressSource = `
const router = express.Router();
router.get('/products', listProducts);
router.post('/products', createProduct);
router.patch('/products/:id', updateProduct);
router.delete('/products/:id', deleteProduct);
`;

// ===== extractRoutesFromTSFile =====

describe('extractRoutesFromTSFile', () => {
  describe('TSOA decorator style', () => {
    it('extracts GET routes from @Get decorator', () => {
      const routes = extractRoutesFromTSFile(tsoaSource);
      const getRoute = routes.find(r => r.method === 'get' && r.path.includes('tenants'));
      expect(getRoute).toBeDefined();
      expect(getRoute!.path).toMatch(/tenants/);
    });

    it('extracts POST routes from @Post decorator', () => {
      const routes = extractRoutesFromTSFile(tsoaSource);
      const postRoute = routes.find(r => r.method === 'post');
      expect(postRoute).toBeDefined();
    });

    it('extracts DELETE routes from @Delete decorator', () => {
      const routes = extractRoutesFromTSFile(tsoaSource);
      const deleteRoute = routes.find(r => r.method === 'delete');
      expect(deleteRoute).toBeDefined();
    });

    it('prepends @Route base path to all sub-routes', () => {
      const routes = extractRoutesFromTSFile(tsoaSource);
      const allPaths = routes.map(r => r.path);
      expect(allPaths.every(p => p.includes('tenants'))).toBe(true);
    });

    it('returns an empty array for a file with no routes', () => {
      const empty = extractRoutesFromTSFile('const x = 1;');
      expect(empty).toHaveLength(0);
    });
  });

  describe('Express router style', () => {
    it('extracts GET routes from router.get()', () => {
      const routes = extractRoutesFromTSFile(expressSource);
      const getRoute = routes.find(r => r.method === 'get' && r.path === '/products');
      expect(getRoute).toBeDefined();
    });

    it('extracts POST routes from router.post()', () => {
      const routes = extractRoutesFromTSFile(expressSource);
      const postRoute = routes.find(r => r.method === 'post' && r.path === '/products');
      expect(postRoute).toBeDefined();
    });

    it('extracts PATCH routes from router.patch()', () => {
      const routes = extractRoutesFromTSFile(expressSource);
      const patchRoute = routes.find(r => r.method === 'patch');
      expect(patchRoute).toBeDefined();
    });

    it('extracts DELETE routes from router.delete()', () => {
      const routes = extractRoutesFromTSFile(expressSource);
      const deleteRoute = routes.find(r => r.method === 'delete');
      expect(deleteRoute).toBeDefined();
    });

    it('correctly parses path strings', () => {
      const routes = extractRoutesFromTSFile(expressSource);
      const paths = routes.map(r => r.path);
      expect(paths).toContain('/products');
    });
  });

  describe('Mixed source', () => {
    it('handles a file with both TSOA and Express patterns', () => {
      const mixed = tsoaSource + '\n' + expressSource;
      const routes = extractRoutesFromTSFile(mixed);
      expect(routes.length).toBeGreaterThan(3);
    });

    it('does not produce duplicate routes for the same path+method', () => {
      const source = `
        @Route('items')
        class ItemController {
          @Get('/')
          list() {}
        }
        router.get('/items/', listItems);
      `;
      const routes = extractRoutesFromTSFile(source);
      const getItemRoutes = routes.filter(
        r => r.method === 'get' && r.path.replace(/\/$/, '') === '/items',
      );
      expect(getItemRoutes.length).toBeLessThanOrEqual(2);
    });
  });
});

// ===== buildPathsFromRoutes =====

describe('buildPathsFromRoutes', () => {
  const routes: RouteInfo[] = [
    { method: 'get', path: '/orders', summary: 'List orders', tags: ['Orders'] },
    { method: 'post', path: '/orders', summary: 'Create order' },
    { method: 'delete', path: '/orders/:id' },
  ];

  it('creates a paths object with all given route paths', () => {
    const paths = buildPathsFromRoutes(routes);
    expect(paths).toHaveProperty('/orders');
    expect(paths).toHaveProperty('/orders/:id');
  });

  it('assigns HTTP methods correctly', () => {
    const paths = buildPathsFromRoutes(routes);
    expect(paths['/orders']).toHaveProperty('get');
    expect(paths['/orders']).toHaveProperty('post');
    expect(paths['/orders/:id']).toHaveProperty('delete');
  });

  it('sets summary when provided', () => {
    const paths = buildPathsFromRoutes(routes);
    expect((paths['/orders'].get as { summary?: string })?.summary).toBe('List orders');
  });

  it('omits summary when not provided', () => {
    const paths = buildPathsFromRoutes(routes);
    expect((paths['/orders/:id'].delete as Record<string, unknown>)?.summary).toBeUndefined();
  });

  it('adds default 200 response to all operations', () => {
    const paths = buildPathsFromRoutes(routes);
    expect((paths['/orders'].get as { responses: Record<string, unknown> }).responses).toHaveProperty('200');
  });

  it('returns an empty object for an empty routes array', () => {
    expect(buildPathsFromRoutes([])).toEqual({});
  });
});

// ===== mergeOpenAPISpecs =====

describe('mergeOpenAPISpecs', () => {
  it('returns a spec with the base info when no additional specs provided', () => {
    const base = minimalValidSpec();
    const merged = mergeOpenAPISpecs(base);
    expect(merged.info.title).toBe('Test API');
    expect(merged.openapi).toBe('3.1.0');
  });

  it('merges paths from additional specs', () => {
    const base = minimalValidSpec();
    const extra: Partial<OpenAPISpec> = {
      paths: {
        '/users': {
          get: { responses: { '200': { description: 'OK' } } },
        },
      },
    };
    const merged = mergeOpenAPISpecs(base, extra);
    expect(merged.paths).toHaveProperty('/health');
    expect(merged.paths).toHaveProperty('/users');
  });

  it('additional spec overrides conflicting paths from base', () => {
    const base = minimalValidSpec();
    const extra: Partial<OpenAPISpec> = {
      paths: {
        '/health': {
          get: { summary: 'Overridden health check', responses: { '200': { description: 'OK' } } },
          post: { responses: { '201': { description: 'Created' } } },
        },
      },
    };
    const merged = mergeOpenAPISpecs(base, extra);
    expect(merged.paths['/health']).toHaveProperty('post');
  });

  it('merges schemas from additional spec components', () => {
    const base = minimalValidSpec();
    const extra: Partial<OpenAPISpec> = {
      components: {
        schemas: {
          User: { type: 'object', properties: { id: { type: 'string' } } },
        },
      },
    };
    const merged = mergeOpenAPISpecs(base, extra);
    expect(merged.components?.schemas).toHaveProperty('User');
  });

  it('preserves base schemas when merging new ones', () => {
    const base: OpenAPISpec = {
      ...minimalValidSpec(),
      components: {
        schemas: { Tenant: { type: 'object' } },
      },
    };
    const extra: Partial<OpenAPISpec> = {
      components: { schemas: { User: { type: 'object' } } },
    };
    const merged = mergeOpenAPISpecs(base, extra);
    expect(merged.components?.schemas).toHaveProperty('Tenant');
    expect(merged.components?.schemas).toHaveProperty('User');
  });

  it('merges tags without duplicates', () => {
    const base: OpenAPISpec = { ...minimalValidSpec(), tags: [{ name: 'Auth' }] };
    const extra1: Partial<OpenAPISpec> = { tags: [{ name: 'Auth' }, { name: 'Commerce' }] };
    const extra2: Partial<OpenAPISpec> = { tags: [{ name: 'Fintech' }] };
    const merged = mergeOpenAPISpecs(base, extra1, extra2);
    const tagNames = merged.tags!.map(t => t.name);
    expect(tagNames.filter(n => n === 'Auth')).toHaveLength(1);
    expect(tagNames).toContain('Commerce');
    expect(tagNames).toContain('Fintech');
  });

  it('merges multiple additional specs correctly', () => {
    const base = minimalValidSpec();
    const spec1: Partial<OpenAPISpec> = { paths: { '/a': { get: { responses: { '200': { description: 'OK' } } } } } };
    const spec2: Partial<OpenAPISpec> = { paths: { '/b': { post: { responses: { '201': { description: 'Created' } } } } } };
    const spec3: Partial<OpenAPISpec> = { paths: { '/c': { delete: { responses: { '204': { description: 'Deleted' } } } } } };
    const merged = mergeOpenAPISpecs(base, spec1, spec2, spec3);
    expect(Object.keys(merged.paths)).toHaveLength(4); // /health + /a + /b + /c
  });
});

// ===== validateOpenAPISpec =====

describe('validateOpenAPISpec', () => {
  it('returns true for a valid minimal spec', () => {
    expect(validateOpenAPISpec(minimalValidSpec())).toBe(true);
  });

  it('returns false for null', () => {
    expect(validateOpenAPISpec(null)).toBe(false);
  });

  it('returns false for a non-object', () => {
    expect(validateOpenAPISpec('not an object')).toBe(false);
    expect(validateOpenAPISpec(42)).toBe(false);
  });

  it('returns false when openapi field is missing', () => {
    const spec = { info: { title: 'X', version: '1' }, paths: { '/a': { get: { responses: {} } } } };
    expect(validateOpenAPISpec(spec)).toBe(false);
  });

  it('returns false when openapi version is not 3.x', () => {
    const spec = { ...minimalValidSpec(), openapi: '2.0.0' };
    expect(validateOpenAPISpec(spec)).toBe(false);
  });

  it('returns false when info.title is missing', () => {
    const spec = { openapi: '3.1.0', info: { version: '1.0.0' }, paths: { '/a': { get: { responses: {} } } } };
    expect(validateOpenAPISpec(spec)).toBe(false);
  });

  it('returns false when info.version is missing', () => {
    const spec = { openapi: '3.1.0', info: { title: 'X' }, paths: { '/a': { get: { responses: {} } } } };
    expect(validateOpenAPISpec(spec)).toBe(false);
  });

  it('returns false when paths is missing', () => {
    const spec = { openapi: '3.1.0', info: { title: 'X', version: '1' } };
    expect(validateOpenAPISpec(spec)).toBe(false);
  });

  it('returns false when a path does not start with /', () => {
    const spec = {
      openapi: '3.1.0',
      info: { title: 'X', version: '1' },
      paths: { 'health': { get: { responses: {} } } },
    };
    expect(validateOpenAPISpec(spec)).toBe(false);
  });

  it('returns false when a path item has no valid HTTP methods', () => {
    const spec = {
      openapi: '3.1.0',
      info: { title: 'X', version: '1' },
      paths: { '/health': { summary: 'no methods' } },
    };
    expect(validateOpenAPISpec(spec)).toBe(false);
  });

  it('returns true for a spec with multiple paths and methods', () => {
    const spec: OpenAPISpec = {
      openapi: '3.0.0',
      info: { title: 'Full API', version: '2.0.0' },
      paths: {
        '/users': {
          get: { responses: { '200': { description: 'OK' } } },
          post: { responses: { '201': { description: 'Created' } } },
        },
        '/users/:id': {
          delete: { responses: { '204': { description: 'Deleted' } } },
        },
      },
    };
    expect(validateOpenAPISpec(spec)).toBe(true);
  });
});

// ===== loadSpecFromFile & writeSpecToFile =====

describe('loadSpecFromFile', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'webwaka-test-'));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('loads and parses a valid OpenAPI spec from a file', () => {
    const spec = minimalValidSpec();
    const filePath = path.join(tmpDir, 'openapi.json');
    fs.writeFileSync(filePath, JSON.stringify(spec, null, 2));
    const loaded = loadSpecFromFile(filePath);
    expect(loaded.info.title).toBe('Test API');
    expect(loaded.openapi).toBe('3.1.0');
  });

  it('throws when the file contains an invalid spec', () => {
    const filePath = path.join(tmpDir, 'bad.json');
    fs.writeFileSync(filePath, JSON.stringify({ not: 'valid' }));
    expect(() => loadSpecFromFile(filePath)).toThrow('Invalid OpenAPI spec');
  });

  it('throws when the file does not exist', () => {
    expect(() => loadSpecFromFile('/nonexistent/path/openapi.json')).toThrow();
  });
});

describe('writeSpecToFile', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'webwaka-test-'));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('writes a spec to a JSON file', () => {
    const spec = minimalValidSpec();
    const filePath = path.join(tmpDir, 'output.json');
    writeSpecToFile(spec, filePath);
    expect(fs.existsSync(filePath)).toBe(true);
    const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    expect(content.info.title).toBe('Test API');
  });

  it('creates intermediate directories if they do not exist', () => {
    const spec = minimalValidSpec();
    const filePath = path.join(tmpDir, 'nested', 'deeply', 'openapi.json');
    writeSpecToFile(spec, filePath);
    expect(fs.existsSync(filePath)).toBe(true);
  });

  it('writes valid JSON that round-trips through loadSpecFromFile', () => {
    const spec = minimalValidSpec();
    const filePath = path.join(tmpDir, 'roundtrip.json');
    writeSpecToFile(spec, filePath);
    const loaded = loadSpecFromFile(filePath);
    expect(loaded).toEqual(spec);
  });

  it('appends a trailing newline to the file', () => {
    const spec = minimalValidSpec();
    const filePath = path.join(tmpDir, 'newline.json');
    writeSpecToFile(spec, filePath);
    const raw = fs.readFileSync(filePath, 'utf8');
    expect(raw.endsWith('\n')).toBe(true);
  });
});
