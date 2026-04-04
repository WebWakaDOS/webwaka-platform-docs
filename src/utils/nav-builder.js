const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.join(__dirname, '..', '..');

const SECTION_LABELS = {
  '': 'Root Documents',
  'content/adrs': 'Architecture Decision Records',
  'content/tutorials': 'Interactive Tutorials',
  'content': 'Reference Docs',
  'docs/enhancements': 'Enhancement Plans',
  'docs/manus-research': 'Research & Analysis',
  'qa-reports': 'QA Reports',
  'translations/fr': 'Français',
  'translations/sw': 'Kiswahili',
  'translations/ar': 'العربية',
};

function getAllMarkdownFiles(dir, base = '') {
  const results = [];
  let items;
  try {
    items = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return results;
  }
  for (const item of items) {
    if (item.name.startsWith('.') || item.name === 'node_modules' || item.name === 'versions') continue;
    const relPath = base ? `${base}/${item.name}` : item.name;
    if (item.isDirectory()) {
      results.push(...getAllMarkdownFiles(path.join(dir, item.name), relPath));
    } else if (item.name.endsWith('.md')) {
      results.push(relPath);
    }
  }
  return results.sort();
}

function getLabel(filePath) {
  return filePath.split('/').pop().replace('.md', '').replace(/-/g, ' ').replace(/_/g, ' ');
}

function buildNavSections(files) {
  const sections = new Map();
  sections.set('', []);

  for (const f of files) {
    const parts = f.split('/');
    if (parts.length === 1) {
      sections.get('').push(f);
    } else {
      const dir = parts.slice(0, -1).join('/');
      if (!sections.has(dir)) sections.set(dir, []);
      sections.get(dir).push(f);
    }
  }
  return sections;
}

function buildNav(files, currentFile, lang = '') {
  const sections = buildNavSections(files);

  let nav = `<nav id="sidebar">
    <div class="logo">
      <a href="/" class="logo-link">
        <div class="logo-icon">W</div>
        <div>
          <div class="logo-title">WebWaka OS v4</div>
          <div class="logo-sub">Platform Documentation</div>
        </div>
      </a>
    </div>
    <div class="nav-search-wrap">
      <input type="text" id="nav-search" placeholder="Filter docs..." autocomplete="off" />
    </div>
    <ul id="nav-list">`;

  nav += `<li class="nav-special-links">
    <a href="/api-explorer" class="nav-special${currentFile === '__api-explorer' ? ' active' : ''}">
      <span class="nav-icon">⚡</span> API Explorer
    </a>
    <a href="/status" class="nav-special${currentFile === '__status' ? ' active' : ''}">
      <span class="nav-icon">📡</span> Platform Status
    </a>
    <a href="/changelog" class="nav-special${currentFile === '__changelog' ? ' active' : ''}">
      <span class="nav-icon">📋</span> Changelog
    </a>
    <a href="/postman" class="nav-special${currentFile === '__postman' ? ' active' : ''}">
      <span class="nav-icon">📮</span> Postman Collection
    </a>
  </li>`;

  const sectionOrder = [
    '', 'content', 'content/adrs', 'content/tutorials',
    'docs/enhancements', 'docs/manus-research', 'qa-reports',
    'translations/fr', 'translations/sw', 'translations/ar',
  ];

  const allDirs = [...sections.keys()];
  const orderedDirs = [
    ...sectionOrder.filter(d => sections.has(d)),
    ...allDirs.filter(d => !sectionOrder.includes(d)),
  ];

  for (const dir of orderedDirs) {
    const sectionFiles = sections.get(dir);
    if (!sectionFiles || sectionFiles.length === 0) continue;

    const label = SECTION_LABELS[dir] || dir.split('/').pop().replace(/-/g, ' ');
    nav += `<li class="nav-section">${label}</li>`;

    for (const f of sectionFiles) {
      const active = f === currentFile ? ' active' : '';
      const label = getLabel(f);
      const href = `/doc/${encodeURIComponent(f)}`;
      nav += `<li><a href="${href}" class="nav-link${active}" title="${label}" data-label="${label.toLowerCase()}">${label}</a></li>`;
    }
  }

  nav += `</ul></nav>`;
  return nav;
}

function buildBreadcrumb(filePath) {
  const parts = filePath.split('/');
  return parts.map((p, i) => {
    const isLast = i === parts.length - 1;
    if (isLast) return `<span class="bc-current">${p.replace('.md', '')}</span>`;
    const pathSoFar = parts.slice(0, i + 1).join('/');
    return `<a class="bc-link" href="/browse/${encodeURIComponent(pathSoFar)}">${p}</a>`;
  }).join(`<span class="bc-sep">›</span>`);
}

module.exports = { getAllMarkdownFiles, buildNav, buildBreadcrumb, ROOT_DIR };
