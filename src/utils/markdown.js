const { marked } = require('marked');

marked.setOptions({
  gfm: true,
  breaks: false,
});

function renderMarkdown(md) {
  return marked.parse(md);
}

module.exports = { renderMarkdown };
