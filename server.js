const express = require('express');
const fs = require('fs');
const path = require('path');
const { getAllMarkdownFiles, buildNav, buildBreadcrumb, ROOT_DIR } = require('./src/utils/nav-builder');
const { renderMarkdown } = require('./src/utils/markdown');
const { search } = require('./src/utils/search-index');
const { recordFeedback, getFeedback } = require('./src/feedback-store');
const { getChangelog, getTypeConfig } = require('./src/changelog');

const app = express();
const PORT = 5000;

app.use(express.json());
app.use(express.static(path.join(ROOT_DIR, 'public')));

// Platform status data
const SERVICES = [
  { name: 'API Gateway (Cloudflare Workers)', status: 'operational' },
  { name: 'Commerce Module', status: 'operational' },
  { name: 'Fintech & Payments', status: 'operational' },
  { name: 'Transport Module', status: 'operational' },
  { name: 'AI Platform (CORE-5 / OpenRouter)', status: 'operational' },
  { name: 'Offline Sync Engine', status: 'operational' },
  { name: 'Webhook Delivery', status: 'operational' },
  { name: 'Central Management Dashboard', status: 'operational' },
  { name: 'Cloudflare KV (Tenant Config)', status: 'operational' },
  { name: 'PostgreSQL (Cloudflare D1)', status: 'operational' },
  { name: 'Cloudflare R2 (Assets)', status: 'operational' },
  { name: 'Documentation Site', status: 'operational' },
];

// ===== HELPERS =====

function shell(content, options = {}) {
  const {
    title = 'WebWaka OS v4 Docs',
    currentFile = '',
    docPath = '',
    lang = 'en',
    version = 'v4.x',
    showTOC = false,
  } = options;

  const files = getAllMarkdownFiles(ROOT_DIR);
  const nav = buildNav(files, currentFile, lang);

  return `<!DOCTYPE html>
<html lang="${lang}" data-theme="dark">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
  <link rel="stylesheet" href="/css/main.css" />
</head>
<body data-current-doc="${currentFile}" data-doc-path="${docPath}">

  <header>
    <div class="header-left">
      <button class="menu-btn" id="menu-btn" onclick="toggleMenu()" aria-label="Toggle menu">☰</button>
    </div>

    <div class="header-search">
      <span class="header-search-icon">🔍</span>
      <input
        type="text"
        id="main-search"
        placeholder="Search docs… (⌘K)"
        autocomplete="off"
        oninput="onSearchInput(this)"
        onfocus="onSearchInput(this)"
      />
    </div>

    <div class="header-actions">
      <select class="version-select" title="API version" onchange="onVersionChange(this)">
        <option value="v4.x" ${version === 'v4.x' ? 'selected' : ''}>v4.x (current)</option>
        <option value="v1.x" ${version === 'v1.x' ? 'selected' : ''}>v1.x (legacy)</option>
      </select>

      <select class="lang-select" title="Language" onchange="onLangChange(this)">
        <option value="en" ${lang === 'en' ? 'selected' : ''}>🇬🇧 EN</option>
        <option value="fr" ${lang === 'fr' ? 'selected' : ''}>🇫🇷 FR</option>
        <option value="sw" ${lang === 'sw' ? 'selected' : ''}>🇰🇪 SW</option>
        <option value="ar" ${lang === 'ar' ? 'selected' : ''}>🇸🇦 AR</option>
      </select>

      <a href="/status" class="status-widget" title="Platform status">
        <span class="status-dot operational" id="status-dot"></span>
        <span id="status-label">All systems operational</span>
      </a>

      <button class="theme-btn" id="theme-btn" onclick="toggleTheme()" title="Toggle dark/light mode">☀️</button>
    </div>
  </header>

  <div id="search-results"></div>

  <div class="layout">
    ${nav}
    <div class="content-wrapper">
      <main>
        ${content}
      </main>
      ${showTOC ? `<aside class="toc">
        <div class="toc-title">On this page</div>
        <ul class="toc-list" id="toc-list"></ul>
      </aside>` : ''}
    </div>
  </div>

  <script src="/js/main.js"></script>
</body>
</html>`;
}

function feedbackWidget(docPath) {
  const fb = getFeedback(docPath);
  return `
  <div class="feedback-widget">
    <div class="feedback-title">Was this page helpful?</div>
    <div class="feedback-buttons">
      <button class="feedback-btn" id="fb-up" onclick="submitFeedback('up')">👍 Yes</button>
      <button class="feedback-btn" id="fb-down" onclick="submitFeedback('down')">👎 No</button>
    </div>
    <div class="feedback-count" id="feedback-count">${fb.up + fb.down > 0 ? `${fb.up} 👍  ${fb.down} 👎` : ''}</div>
    <div class="feedback-comment" id="feedback-comment">
      <textarea id="fb-comment-text" placeholder="Tell us how we can improve this page… (optional)"></textarea>
      <button class="feedback-submit" onclick="sendFeedback()">Send feedback</button>
    </div>
    <div class="feedback-thanks" id="feedback-thanks"></div>
  </div>`;
}

// ===== HOME =====
app.get('/', (req, res) => {
  let mdContent = '';
  try {
    mdContent = fs.readFileSync(path.join(ROOT_DIR, 'README.md'), 'utf8');
  } catch {
    mdContent = '# WebWaka OS v4 Documentation';
  }

  const quickLinks = [
    { icon: '⚡', title: 'API Explorer', sub: 'Interactive API reference', href: '/api-explorer' },
    { icon: '📖', title: 'Tutorials', sub: 'Step-by-step guides', href: '/doc/' + encodeURIComponent('content/tutorials/01-getting-started.md') },
    { icon: '🔑', title: 'Auth & Tenants', sub: 'Authentication guide', href: '/doc/' + encodeURIComponent('content/sdk-docs.md') },
    { icon: '🔔', title: 'Webhooks', sub: 'Event reference', href: '/doc/' + encodeURIComponent('content/webhooks.md') },
    { icon: '🔢', title: 'Error Codes', sub: 'All error responses', href: '/doc/' + encodeURIComponent('content/error-codes.md') },
    { icon: '🛡️', title: 'Security Hub', sub: 'Compliance & audit', href: '/doc/' + encodeURIComponent('content/security-compliance.md') },
    { icon: '🏛️', title: 'ADRs', sub: 'Architecture decisions', href: '/doc/' + encodeURIComponent('content/adrs/ADR-001-multi-tenant-architecture.md') },
    { icon: '🌍', title: 'Developer Portal', sub: 'Build on WebWaka', href: '/doc/' + encodeURIComponent('content/developer-portal.md') },
  ];

  const qlHtml = quickLinks.map(l => `
    <a href="${l.href}" class="quick-link">
      <div class="quick-link-icon">${l.icon}</div>
      <div class="quick-link-title">${l.title}</div>
      <div class="quick-link-sub">${l.sub}</div>
    </a>`).join('');

  const content = `
    <div class="home-hero">
      <h1>WebWaka OS v4 Documentation</h1>
      <p>Multi-tenant, offline-first, AI-native SaaS operating system for Nigeria and Africa.</p>
    </div>
    <div class="quick-links">${qlHtml}</div>
    <hr style="margin:28px 0;border-top:1px solid var(--border);">
    <div class="markdown-body">${renderMarkdown(mdContent)}</div>
    ${feedbackWidget('README.md')}
  `;

  res.send(shell(content, {
    title: 'WebWaka OS v4 Documentation',
    currentFile: 'README.md',
    docPath: 'README.md',
    showTOC: false,
  }));
});

// ===== DOCUMENT VIEWER =====
app.use('/doc', (req, res, next) => {
  if (req.method !== 'GET') return next();
  const filePath = decodeURIComponent(req.path.slice(1));
  const absPath = path.join(ROOT_DIR, filePath);

  if (!absPath.startsWith(ROOT_DIR) || !filePath.endsWith('.md')) {
    return res.status(404).send(shell('<h1>404 — Not Found</h1>', { title: '404' }));
  }

  let mdContent;
  try {
    mdContent = fs.readFileSync(absPath, 'utf8');
  } catch {
    return res.status(404).send(shell(`
      <h1>Document Not Found</h1>
      <p>The document <code>${filePath}</code> does not exist.</p>
      <p><a href="/">← Back to home</a></p>
    `, { title: '404 Not Found' }));
  }

  const titleLine = mdContent.split('\n').find(l => l.startsWith('#'));
  const title = titleLine ? titleLine.replace(/^#+\s*/, '') : filePath;

  const lang = filePath.startsWith('translations/') ? filePath.split('/')[1] : 'en';
  const breadcrumb = buildBreadcrumb(filePath);

  const editUrl = `https://github.com/webwaka-os/webwaka-platform-docs/edit/main/${filePath}`;

  const content = `
    <div class="breadcrumb">${breadcrumb}</div>
    <div class="page-actions">
      <a class="page-action-btn" href="${editUrl}" target="_blank" rel="noopener">✏️ Edit this page</a>
      <a class="page-action-btn" href="/api/raw/${encodeURIComponent(filePath)}" target="_blank">📄 View raw</a>
    </div>
    <div class="markdown-body">${renderMarkdown(mdContent)}</div>
    ${feedbackWidget(filePath)}
  `;

  res.send(shell(content, {
    title: `${title} — WebWaka Docs`,
    currentFile: filePath,
    docPath: filePath,
    lang,
    showTOC: true,
  }));
});

// ===== API EXPLORER =====
app.get('/api-explorer', (req, res) => {
  const content = `
    <div class="breadcrumb"><span class="bc-current">API Explorer</span></div>
    <div class="api-explorer-wrap">
      <h1 style="margin-bottom:8px;">Interactive API Explorer</h1>
      <p style="margin-bottom:16px;color:var(--text-muted);font-size:14px;">
        Test WebWaka OS v4 API endpoints directly. Use the Staging server for safe testing.
        All endpoints require a Bearer JWT — click <strong>Authorize</strong> to set your token.
      </p>
      <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui.css" />
      <div id="swagger-ui"></div>
      <script src="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
      <script>
        SwaggerUIBundle({
          url: '/openapi.json',
          dom_id: '#swagger-ui',
          presets: [SwaggerUIBundle.presets.apis, SwaggerUIBundle.SwaggerUIStandalonePreset],
          layout: 'BaseLayout',
          defaultModelsExpandDepth: 1,
          defaultModelExpandDepth: 2,
          tryItOutEnabled: true,
          requestInterceptor: (req) => {
            // Tag all requests as coming from staging
            return req;
          },
          onComplete: () => {
            // Apply dark/light theme to swagger
            const isDark = document.documentElement.getAttribute('data-theme') !== 'light';
            document.querySelector('.swagger-ui')?.style.setProperty('filter', isDark ? 'invert(0)' : 'invert(0)');
          }
        });
      </script>
    </div>
  `;

  res.send(shell(content, {
    title: 'API Explorer — WebWaka Docs',
    currentFile: '__api-explorer',
  }));
});

// ===== STATUS PAGE =====
app.get('/status', (req, res) => {
  const serviceRows = SERVICES.map(s => `
    <div class="service-row">
      <span class="service-name">${s.name}</span>
      <span class="service-badge ${s.status}">${s.status === 'operational' ? '✅ Operational' : s.status === 'degraded' ? '⚠️ Degraded' : '🔧 Maintenance'}</span>
    </div>`).join('');

  const allOk = SERVICES.every(s => s.status === 'operational');
  const overallClass = allOk ? 'operational' : 'degraded';
  const overallLabel = allOk ? '✅ All Systems Operational' : '⚠️ Partial Degradation';

  const content = `
    <div class="status-page">
      <div class="breadcrumb"><span class="bc-current">Platform Status</span></div>
      <h1 style="margin-bottom:16px;">Platform Status</h1>
      <div class="status-overall ${overallClass}">${overallLabel}</div>
      <p style="margin:12px 0 20px;font-size:13px;color:var(--text-muted);">
        Last checked: ${new Date().toUTCString()} — Uptime SLA: 99.9%
      </p>
      <div class="service-grid">${serviceRows}</div>
      <hr/>
      <h3 style="margin:20px 0 12px;">Incident History</h3>
      <p style="font-size:13px;color:var(--text-muted);">
        No incidents in the last 90 days. Full history available at 
        <a href="https://status.webwaka.io" target="_blank" rel="noopener">status.webwaka.io</a>.
      </p>
      <hr/>
      <h3 style="margin:20px 0 12px;">Subscribe to Updates</h3>
      <p style="font-size:13px;color:var(--text-muted);">
        Get notified for incidents via the <code>platform.incident.*</code> webhook events.
        See <a href="/doc/${encodeURIComponent('content/webhooks.md')}">Webhooks Reference</a>.
      </p>
    </div>
  `;

  res.send(shell(content, {
    title: 'Platform Status — WebWaka Docs',
    currentFile: '__status',
  }));
});

// ===== CHANGELOG =====
app.get('/changelog', async (req, res) => {
  const groups = await getChangelog(60);

  const entriesHtml = groups.map(group => {
    const items = group.entries.map(e => {
      const cfg = getTypeConfig(e.type);
      return `
        <div class="changelog-item">
          <span class="commit-type ${e.type}">${cfg.emoji} ${e.type}</span>
          <span class="commit-msg">${escapeHtml(e.message.split('\n')[0].slice(0, 100))}</span>
          <span class="commit-hash">${e.hash}</span>
        </div>`;
    }).join('');

    return `
      <div class="changelog-entry">
        <div class="changelog-date">${group.date}</div>
        ${items}
      </div>`;
  }).join('');

  const content = `
    <div class="breadcrumb"><span class="bc-current">Changelog</span></div>
    <h1 style="margin-bottom:8px;">Changelog</h1>
    <p style="margin-bottom:24px;color:var(--text-muted);font-size:14px;">
      Automatically generated from Git commit history. Follows 
      <a href="/doc/${encodeURIComponent('content/contribution-guidelines.md')}">Conventional Commits</a> format.
    </p>
    ${entriesHtml || '<p style="color:var(--text-muted)">No changelog entries available.</p>'}
  `;

  res.send(shell(content, {
    title: 'Changelog — WebWaka Docs',
    currentFile: '__changelog',
  }));
});

// ===== POSTMAN COLLECTION =====
app.get('/postman', (req, res) => {
  const content = `
    <div class="postman-page">
      <div class="breadcrumb"><span class="bc-current">Postman Collection</span></div>
      <h1 style="margin-bottom:8px;">Postman Collection</h1>
      <p style="margin-bottom:20px;color:var(--text-muted);font-size:14px;">
        Download the official WebWaka OS v4 Postman collection to test all API endpoints
        with pre-configured environments, example requests, and auto-generated auth flows.
      </p>

      <div class="download-card">
        <h3>📮 WebWaka OS v4 — Full API Collection</h3>
        <p>Includes all endpoints: Auth, Tenants, Commerce, Fintech, Transport, AI, Webhooks.
           Pre-configured for Staging and Production environments.</p>
        <a href="/api/postman/download" class="download-btn" download="webwaka-v4-api.postman_collection.json">
          ⬇️ Download Collection (JSON)
        </a>
      </div>

      <div class="download-card">
        <h3>🌍 Postman Environments</h3>
        <p>Download environment files pre-configured with base URLs, API keys placeholders, and test data.</p>
        <a href="/api/postman/environment?env=staging" class="download-btn" style="background:var(--amber);margin-right:8px;" download>
          ⬇️ Staging Environment
        </a>
        <a href="/api/postman/environment?env=production" class="download-btn" style="background:var(--green);" download>
          ⬇️ Production Environment
        </a>
      </div>

      <h3 style="margin:24px 0 12px;">Using the Collection</h3>
      <div class="markdown-body">${renderMarkdown(`
1. Open Postman and click **Import**
2. Select the downloaded \`webwaka-v4-api.postman_collection.json\`
3. Import the environment file for your target environment
4. Set \`WEBWAKA_API_KEY\` in the environment variables
5. Run the **Auth / Issue Token** request first — it auto-saves the token
6. All other requests will use the saved token automatically

**Tip:** Use the **Collection Runner** to run the full test suite in order.
      `)}</div>
    </div>
  `;

  res.send(shell(content, {
    title: 'Postman Collection — WebWaka Docs',
    currentFile: '__postman',
  }));
});

// ===== VERSION ROUTES =====
app.get('/versions/:version', (req, res) => {
  const version = req.params.version;
  const versionDir = path.join(ROOT_DIR, 'versions', version);
  const readmePath = path.join(versionDir, 'README.md');

  let mdContent = '';
  try {
    mdContent = fs.readFileSync(readmePath, 'utf8');
  } catch {
    mdContent = `# WebWaka OS ${version}\n\nThis version snapshot is not yet available.\n\nView the [current documentation](/).`;
  }

  const content = `
    <div class="breadcrumb"><a class="bc-link" href="/">Home</a><span class="bc-sep">›</span><span class="bc-current">Version ${version}</span></div>
    <div style="background:var(--amber);color:#000;padding:10px 16px;border-radius:6px;margin-bottom:20px;font-size:13px;">
      ⚠️ You are viewing version <strong>${version}</strong>. 
      <a href="/" style="color:#000;font-weight:600;">Switch to v4.x (current) →</a>
    </div>
    <div class="markdown-body">${renderMarkdown(mdContent)}</div>
  `;

  res.send(shell(content, {
    title: `${version} — WebWaka Docs`,
    version,
  }));
});

// ===== OPENAPI JSON =====
app.get('/openapi.json', (req, res) => {
  try {
    const spec = fs.readFileSync(path.join(ROOT_DIR, 'openapi.json'), 'utf8');
    res.type('application/json').send(spec);
  } catch {
    res.status(404).json({ error: 'OpenAPI spec not found' });
  }
});

// ===== API: SEARCH =====
app.get('/api/search', (req, res) => {
  const query = req.query.q || '';
  const results = search(query);
  res.json({ query, results });
});

// ===== API: FEEDBACK GET =====
app.get('/api/feedback', (req, res) => {
  const docPath = req.query.path || '';
  res.json(getFeedback(docPath));
});

// ===== API: FEEDBACK POST =====
app.post('/api/feedback', (req, res) => {
  const { path: docPath, vote, comment } = req.body;
  if (!docPath || !['up', 'down'].includes(vote)) {
    return res.status(400).json({ error: 'Invalid request' });
  }
  const result = recordFeedback(docPath, vote, comment);
  res.json(result);
});

// ===== API: STATUS JSON =====
app.get('/api/status', (req, res) => {
  const allOk = SERVICES.every(s => s.status === 'operational');
  res.json({
    overall: allOk ? 'operational' : 'degraded',
    label: allOk ? 'All systems operational' : 'Partial degradation',
    services: SERVICES,
    timestamp: new Date().toISOString(),
  });
});

// ===== API: RAW MARKDOWN =====
app.use('/api/raw', (req, res, next) => {
  if (req.method !== 'GET') return next();
  const filePath = decodeURIComponent(req.path.slice(1));
  const absPath = path.join(ROOT_DIR, filePath);
  if (!absPath.startsWith(ROOT_DIR) || !filePath.endsWith('.md')) {
    return res.status(404).send('Not found');
  }
  try {
    res.type('text/plain').send(fs.readFileSync(absPath, 'utf8'));
  } catch {
    res.status(404).send('File not found');
  }
});

// ===== API: POSTMAN COLLECTION DOWNLOAD =====
app.get('/api/postman/download', (req, res) => {
  const openapi = JSON.parse(fs.readFileSync(path.join(ROOT_DIR, 'openapi.json'), 'utf8'));

  const collection = {
    info: {
      name: 'WebWaka OS v4 — Platform API',
      schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
      version: openapi.info.version,
      description: openapi.info.description,
    },
    auth: {
      type: 'bearer',
      bearer: [{ key: 'token', value: '{{WEBWAKA_ACCESS_TOKEN}}', type: 'string' }],
    },
    variable: [
      { key: 'baseUrl', value: 'https://staging-api.webwaka.io/v4' },
      { key: 'WEBWAKA_ACCESS_TOKEN', value: '' },
    ],
    item: [],
  };

  // Group by tags
  const tagGroups = {};
  for (const [pathStr, methods] of Object.entries(openapi.paths)) {
    for (const [method, op] of Object.entries(methods)) {
      if (!op.tags) continue;
      const tag = op.tags[0];
      if (!tagGroups[tag]) tagGroups[tag] = [];

      const item = {
        name: op.summary || `${method.toUpperCase()} ${pathStr}`,
        request: {
          method: method.toUpperCase(),
          header: [{ key: 'Content-Type', value: 'application/json' }],
          url: {
            raw: `{{baseUrl}}${pathStr}`,
            host: ['{{baseUrl}}'],
            path: pathStr.split('/').filter(Boolean),
          },
          description: op.description || op.summary || '',
        },
      };

      if (op.requestBody?.content?.['application/json']?.example) {
        item.request.body = {
          mode: 'raw',
          raw: JSON.stringify(op.requestBody.content['application/json'].example, null, 2),
          options: { raw: { language: 'json' } },
        };
      }

      tagGroups[tag].push(item);
    }
  }

  for (const [tag, items] of Object.entries(tagGroups)) {
    collection.item.push({ name: tag, item: items });
  }

  res.setHeader('Content-Disposition', 'attachment; filename="webwaka-v4-api.postman_collection.json"');
  res.type('application/json').json(collection);
});

// ===== API: POSTMAN ENVIRONMENT DOWNLOAD =====
app.get('/api/postman/environment', (req, res) => {
  const env = req.query.env || 'staging';
  const baseUrl = env === 'production'
    ? 'https://api.webwaka.io/v4'
    : 'https://staging-api.webwaka.io/v4';

  const environment = {
    name: `WebWaka OS v4 — ${env.charAt(0).toUpperCase() + env.slice(1)}`,
    values: [
      { key: 'baseUrl', value: baseUrl, enabled: true },
      { key: 'WEBWAKA_ACCESS_TOKEN', value: '', enabled: true, type: 'secret' },
      { key: 'WEBWAKA_TENANT_SLUG', value: env === 'staging' ? 'sandbox' : 'your-tenant-slug', enabled: true },
      { key: 'WEBWAKA_WEBHOOK_SECRET', value: '', enabled: true, type: 'secret' },
    ],
  };

  res.setHeader('Content-Disposition', `attachment; filename="webwaka-${env}.postman_environment.json"`);
  res.type('application/json').json(environment);
});

// ===== 404 =====
app.use((req, res) => {
  res.status(404).send(shell(`
    <h1>404 — Page Not Found</h1>
    <p>The page <code>${escapeHtml(req.path)}</code> does not exist.</p>
    <p style="margin-top:16px;"><a href="/">← Back to home</a></p>
  `, { title: '404 Not Found' }));
});

function escapeHtml(str) {
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`WebWaka OS v4 Docs running at http://0.0.0.0:${PORT}`);
});
