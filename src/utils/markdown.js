const { marked } = require('marked');
const sanitizeHtml = require('sanitize-html');

marked.setOptions({
  gfm: true,
  breaks: false,
});

const SANITIZE_OPTS = {
  allowedTags: sanitizeHtml.defaults.allowedTags.concat([
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'pre', 'code', 'blockquote', 'del', 'ins', 'mark',
    'table', 'thead', 'tbody', 'tr', 'th', 'td',
    'details', 'summary', 'kbd', 'abbr', 'hr',
  ]),
  allowedAttributes: {
    ...sanitizeHtml.defaults.allowedAttributes,
    'a': ['href', 'name', 'target', 'rel', 'title'],
    'img': ['src', 'alt', 'title', 'width', 'height', 'loading'],
    'code': ['class'],
    'pre': ['class'],
    'th': ['align'],
    'td': ['align'],
    'abbr': ['title'],
  },
  allowedSchemes: ['http', 'https', 'mailto', 'tel'],
  disallowedTagsMode: 'discard',
};

/**
 * Render Markdown to sanitized HTML.
 * Sanitization prevents XSS from AI-generated translated content (QA-DOC-3).
 */
function renderMarkdown(md) {
  const raw = marked.parse(md);
  return sanitizeHtml(raw, SANITIZE_OPTS);
}

module.exports = { renderMarkdown };
