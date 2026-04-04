const http = require('http');
const fs = require('fs');
const path = require('path');
const { marked } = require('marked');

const PORT = 5000;
const HOST = '0.0.0.0';

const ROOT_DIR = __dirname;

function getAllMarkdownFiles(dir, base = '') {
  const results = [];
  const items = fs.readdirSync(dir, { withFileTypes: true });
  for (const item of items) {
    if (item.name.startsWith('.') || item.name === 'node_modules') continue;
    const relPath = base ? `${base}/${item.name}` : item.name;
    if (item.isDirectory()) {
      results.push(...getAllMarkdownFiles(path.join(dir, item.name), relPath));
    } else if (item.name.endsWith('.md')) {
      results.push(relPath);
    }
  }
  return results.sort();
}

function renderPage(title, content) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title} - WebWaka OS v4 Docs</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #0f172a; color: #e2e8f0; display: flex; min-height: 100vh; }
    nav { width: 280px; min-width: 280px; background: #1e293b; border-right: 1px solid #334155; overflow-y: auto; height: 100vh; position: sticky; top: 0; }
    nav .logo { padding: 20px 16px; border-bottom: 1px solid #334155; }
    nav .logo h1 { font-size: 14px; font-weight: 700; color: #38bdf8; letter-spacing: 0.5px; }
    nav .logo p { font-size: 11px; color: #64748b; margin-top: 2px; }
    nav ul { list-style: none; padding: 8px 0; }
    nav li a { display: block; padding: 6px 16px; font-size: 12px; color: #94a3b8; text-decoration: none; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; border-left: 2px solid transparent; }
    nav li a:hover { background: #0f172a; color: #e2e8f0; border-left-color: #38bdf8; }
    nav li a.active { background: #0f172a; color: #38bdf8; border-left-color: #38bdf8; font-weight: 600; }
    nav .section { padding: 8px 16px 4px; font-size: 10px; font-weight: 700; color: #475569; text-transform: uppercase; letter-spacing: 1px; margin-top: 8px; }
    main { flex: 1; padding: 40px; max-width: 900px; overflow-y: auto; }
    .markdown-body { line-height: 1.7; }
    .markdown-body h1 { font-size: 2em; color: #f1f5f9; margin-bottom: 16px; padding-bottom: 12px; border-bottom: 1px solid #334155; }
    .markdown-body h2 { font-size: 1.5em; color: #e2e8f0; margin: 32px 0 12px; padding-bottom: 8px; border-bottom: 1px solid #1e293b; }
    .markdown-body h3 { font-size: 1.2em; color: #cbd5e1; margin: 24px 0 8px; }
    .markdown-body h4 { font-size: 1em; color: #94a3b8; margin: 16px 0 8px; }
    .markdown-body p { margin: 12px 0; color: #cbd5e1; }
    .markdown-body a { color: #38bdf8; }
    .markdown-body code { background: #1e293b; padding: 2px 6px; border-radius: 4px; font-family: monospace; font-size: 0.9em; color: #7dd3fc; }
    .markdown-body pre { background: #1e293b; border: 1px solid #334155; border-radius: 8px; padding: 16px; overflow-x: auto; margin: 16px 0; }
    .markdown-body pre code { background: none; padding: 0; color: #e2e8f0; }
    .markdown-body table { width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 14px; }
    .markdown-body th { background: #1e293b; color: #94a3b8; padding: 8px 12px; text-align: left; border: 1px solid #334155; }
    .markdown-body td { padding: 8px 12px; border: 1px solid #1e293b; color: #cbd5e1; }
    .markdown-body tr:hover td { background: #1e293b22; }
    .markdown-body ul, .markdown-body ol { padding-left: 24px; margin: 12px 0; color: #cbd5e1; }
    .markdown-body li { margin: 4px 0; }
    .markdown-body blockquote { border-left: 4px solid #38bdf8; padding-left: 16px; color: #94a3b8; margin: 16px 0; }
    .markdown-body strong { color: #f1f5f9; }
    .markdown-body hr { border: none; border-top: 1px solid #334155; margin: 24px 0; }
    .breadcrumb { font-size: 12px; color: #64748b; margin-bottom: 24px; }
    .breadcrumb span { color: #38bdf8; }
    @media (max-width: 768px) { nav { display: none; } main { padding: 20px; } }
  </style>
</head>
<body>
${content}
</body>
</html>`;
}

function buildNav(files, currentFile) {
  const rootFiles = files.filter(f => !f.includes('/'));
  const grouped = {};
  files.filter(f => f.includes('/')).forEach(f => {
    const dir = f.split('/')[0];
    if (!grouped[dir]) grouped[dir] = [];
    grouped[dir].push(f);
  });

  let nav = `<nav>
    <div class="logo">
      <h1>WebWaka OS v4</h1>
      <p>Platform Documentation</p>
    </div>
    <ul>
      <li class="section">Root Documents</li>`;

  for (const f of rootFiles) {
    const active = f === currentFile ? ' class="active"' : '';
    nav += `<li><a href="/doc/${encodeURIComponent(f)}"${active}>${f.replace('.md', '')}</a></li>`;
  }

  for (const [dir, dirFiles] of Object.entries(grouped)) {
    nav += `<li class="section">${dir}</li>`;
    for (const f of dirFiles) {
      const label = f.split('/').slice(1).join('/').replace('.md', '');
      const active = f === currentFile ? ' class="active"' : '';
      nav += `<li><a href="/doc/${encodeURIComponent(f)}"${active} title="${label}">${label}</a></li>`;
    }
  }

  nav += `</ul></nav>`;
  return nav;
}

const server = http.createServer((req, res) => {
  res.setHeader('X-Robots-Tag', 'noindex');

  if (req.url === '/') {
    const files = getAllMarkdownFiles(ROOT_DIR);
    const nav = buildNav(files, 'README.md');
    let mdContent = '';
    try {
      mdContent = fs.readFileSync(path.join(ROOT_DIR, 'README.md'), 'utf8');
    } catch {
      mdContent = '# WebWaka OS v4 Documentation\n\nSelect a document from the sidebar.';
    }
    const html = renderPage('README', `${nav}<main><div class="breadcrumb"><span>README.md</span></div><div class="markdown-body">${marked.parse(mdContent)}</div></main>`);
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(html);
    return;
  }

  if (req.url.startsWith('/doc/')) {
    const encodedFile = req.url.slice(5);
    const filePath = decodeURIComponent(encodedFile);
    const absPath = path.join(ROOT_DIR, filePath);

    if (!absPath.startsWith(ROOT_DIR) || !filePath.endsWith('.md')) {
      res.writeHead(404); res.end('Not found'); return;
    }

    try {
      const mdContent = fs.readFileSync(absPath, 'utf8');
      const files = getAllMarkdownFiles(ROOT_DIR);
      const nav = buildNav(files, filePath);
      const parts = filePath.split('/');
      const breadcrumb = parts.map((p, i) => {
        if (i === parts.length - 1) return `<span>${p}</span>`;
        return p;
      }).join(' / ');
      const html = renderPage(filePath.replace('.md', ''), `${nav}<main><div class="breadcrumb">${breadcrumb}</div><div class="markdown-body">${marked.parse(mdContent)}</div></main>`);
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(html);
    } catch {
      res.writeHead(404); res.end('Document not found');
    }
    return;
  }

  res.writeHead(301, { Location: '/' });
  res.end();
});

server.listen(PORT, HOST, () => {
  console.log(`WebWaka OS v4 Docs running at http://${HOST}:${PORT}`);
});
