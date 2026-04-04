const fs = require('fs');
const path = require('path');

const FEEDBACK_FILE = path.join(__dirname, '..', 'feedback', 'feedback.json');

function loadFeedback() {
  try {
    return JSON.parse(fs.readFileSync(FEEDBACK_FILE, 'utf8'));
  } catch {
    return {};
  }
}

function saveFeedback(data) {
  fs.mkdirSync(path.dirname(FEEDBACK_FILE), { recursive: true });
  fs.writeFileSync(FEEDBACK_FILE, JSON.stringify(data, null, 2));
}

function recordFeedback(docPath, vote, comment = '') {
  const data = loadFeedback();
  if (!data[docPath]) {
    data[docPath] = { up: 0, down: 0, comments: [] };
  }
  if (vote === 'up') data[docPath].up++;
  if (vote === 'down') data[docPath].down++;
  if (comment.trim()) {
    data[docPath].comments.push({
      text: comment.trim().slice(0, 500),
      vote,
      ts: new Date().toISOString(),
    });
  }
  saveFeedback(data);
  return data[docPath];
}

function getFeedback(docPath) {
  const data = loadFeedback();
  return data[docPath] || { up: 0, down: 0, comments: [] };
}

function getAllFeedback() {
  return loadFeedback();
}

module.exports = { recordFeedback, getFeedback, getAllFeedback };
