const { simpleGit } = require('simple-git');
const path = require('path');

const ROOT_DIR = path.join(__dirname, '..');

async function getChangelog(limit = 50) {
  try {
    const git = simpleGit(ROOT_DIR);
    const log = await git.log({ maxCount: limit });

    const entries = log.all.map(commit => ({
      hash: commit.hash.slice(0, 8),
      date: commit.date.slice(0, 10),
      message: commit.message,
      author: commit.author_name,
      type: detectType(commit.message),
    }));

    const grouped = groupByDate(entries);
    return grouped;
  } catch (e) {
    return [{ date: 'Recent', entries: [{ message: 'Documentation updated', type: 'docs', author: 'WebWaka Team', hash: '---' }] }];
  }
}

function detectType(message) {
  if (message.match(/^feat/i)) return 'feat';
  if (message.match(/^fix/i)) return 'fix';
  if (message.match(/^docs/i)) return 'docs';
  if (message.match(/^refactor/i)) return 'refactor';
  if (message.match(/^test/i)) return 'test';
  if (message.match(/^chore/i)) return 'chore';
  if (message.match(/^perf/i)) return 'perf';
  return 'other';
}

function groupByDate(entries) {
  const groups = new Map();
  for (const e of entries) {
    if (!groups.has(e.date)) groups.set(e.date, []);
    groups.get(e.date).push(e);
  }
  return [...groups.entries()].map(([date, entries]) => ({ date, entries }));
}

const TYPE_CONFIG = {
  feat: { label: 'New Feature', color: '#22c55e', emoji: '✨' },
  fix: { label: 'Bug Fix', color: '#ef4444', emoji: '🐛' },
  docs: { label: 'Documentation', color: '#38bdf8', emoji: '📝' },
  refactor: { label: 'Refactor', color: '#a78bfa', emoji: '♻️' },
  test: { label: 'Tests', color: '#f59e0b', emoji: '🧪' },
  chore: { label: 'Maintenance', color: '#64748b', emoji: '🔧' },
  perf: { label: 'Performance', color: '#fb923c', emoji: '⚡' },
  other: { label: 'Update', color: '#94a3b8', emoji: '📦' },
};

function getTypeConfig(type) {
  return TYPE_CONFIG[type] || TYPE_CONFIG.other;
}

module.exports = { getChangelog, getTypeConfig };
