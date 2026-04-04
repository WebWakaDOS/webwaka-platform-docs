const fs = require('fs');
const path = require('path');
const { getAllMarkdownFiles, ROOT_DIR } = require('./nav-builder');

let searchIndex = null;
let lastBuilt = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

function buildSearchIndex(forceRebuild = false) {
  const now = Date.now();
  if (searchIndex && !forceRebuild && (now - lastBuilt) < CACHE_TTL) {
    return searchIndex;
  }

  const files = getAllMarkdownFiles(ROOT_DIR);
  const docs = [];

  for (const filePath of files) {
    const absPath = path.join(ROOT_DIR, filePath);
    try {
      const content = fs.readFileSync(absPath, 'utf8');
      const lines = content.split('\n');
      const title = lines.find(l => l.startsWith('#'))?.replace(/^#+\s*/, '') || filePath;
      const text = content
        .replace(/```[\s\S]*?```/g, '')
        .replace(/`[^`]*`/g, '')
        .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
        .replace(/[#*_|>-]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

      docs.push({
        id: filePath,
        title,
        path: filePath,
        text: text.slice(0, 2000),
        preview: text.slice(0, 200),
      });
    } catch {
      // skip unreadable files
    }
  }

  searchIndex = docs;
  lastBuilt = now;
  return docs;
}

function search(query, limit = 20) {
  if (!query || query.trim().length < 2) return [];

  const docs = buildSearchIndex();
  const terms = query.toLowerCase().split(/\s+/).filter(t => t.length > 1);

  const scored = docs.map(doc => {
    const titleLower = doc.title.toLowerCase();
    const textLower = doc.text.toLowerCase();
    let score = 0;

    for (const term of terms) {
      if (titleLower.includes(term)) score += 10;
      if (doc.path.toLowerCase().includes(term)) score += 5;
      const textMatches = (textLower.match(new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length;
      score += textMatches;
    }

    return { ...doc, score };
  })
  .filter(d => d.score > 0)
  .sort((a, b) => b.score - a.score)
  .slice(0, limit);

  return scored.map(d => {
    const queryLower = query.toLowerCase();
    const textIdx = d.text.toLowerCase().indexOf(queryLower);
    let excerpt = d.preview;
    if (textIdx > -1) {
      const start = Math.max(0, textIdx - 60);
      const end = Math.min(d.text.length, textIdx + 120);
      excerpt = (start > 0 ? '...' : '') + d.text.slice(start, end) + (end < d.text.length ? '...' : '');
    }

    const highlight = (str) => str.replace(
      new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'),
      m => `<mark>${m}</mark>`
    );

    return {
      path: d.path,
      title: highlight(d.title),
      excerpt: highlight(excerpt),
      score: d.score,
    };
  });
}

module.exports = { buildSearchIndex, search };
