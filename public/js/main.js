/* WebWaka OS v4 Documentation — Frontend JS */

// ===== DARK/LIGHT THEME TOGGLE =====
(function initTheme() {
  const saved = localStorage.getItem('ww-theme') || 'dark';
  document.documentElement.setAttribute('data-theme', saved);
  updateThemeBtn(saved);
})();

function updateThemeBtn(theme) {
  const btn = document.getElementById('theme-btn');
  if (btn) btn.textContent = theme === 'dark' ? '☀️' : '🌙';
}

function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme') || 'dark';
  const next = current === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem('ww-theme', next);
  updateThemeBtn(next);
}

// ===== MOBILE MENU =====
function toggleMenu() {
  const sidebar = document.getElementById('sidebar');
  if (sidebar) sidebar.classList.toggle('open');
}

document.addEventListener('click', function (e) {
  const sidebar = document.getElementById('sidebar');
  const menuBtn = document.getElementById('menu-btn');
  if (sidebar && menuBtn && !sidebar.contains(e.target) && !menuBtn.contains(e.target)) {
    sidebar.classList.remove('open');
  }
});

// ===== VERSION SELECTOR =====
function onVersionChange(select) {
  const version = select.value;
  const currentPath = window.location.pathname;
  if (version === 'v4.x') {
    if (currentPath.startsWith('/versions/')) {
      window.location.href = '/';
    }
  } else {
    window.location.href = '/versions/' + version;
  }
}

// ===== LANGUAGE SELECTOR =====
function onLangChange(select) {
  const lang = select.value;
  if (lang === 'en') {
    window.location.href = '/';
    return;
  }
  const currentDoc = document.body.dataset.currentDoc;
  if (currentDoc) {
    const docName = currentDoc.split('/').pop();
    window.location.href = '/doc/' + encodeURIComponent('translations/' + lang + '/' + docName);
  } else {
    window.location.href = '/doc/' + encodeURIComponent('translations/' + lang + '/README.md');
  }
}

// ===== SEARCH =====
let searchTimeout = null;
const searchResults = document.getElementById('search-results');

function onSearchInput(input) {
  const query = input.value.trim();
  clearTimeout(searchTimeout);

  if (query.length < 2) {
    hideSearchResults();
    return;
  }

  searchTimeout = setTimeout(() => performSearch(query), 200);
}

async function performSearch(query) {
  try {
    const res = await fetch('/api/search?q=' + encodeURIComponent(query));
    const data = await res.json();
    renderSearchResults(data.results, query);
  } catch {
    hideSearchResults();
  }
}

function renderSearchResults(results, query) {
  if (!searchResults) return;

  if (!results || results.length === 0) {
    searchResults.innerHTML = `<div class="search-empty">No results for "<strong>${escapeHtml(query)}</strong>"</div>`;
    searchResults.classList.add('active');
    return;
  }

  searchResults.innerHTML = results.map(r => `
    <a href="/doc/${encodeURIComponent(r.path)}" class="search-result-item" onclick="hideSearchResults()">
      <div class="sr-title">${r.title}</div>
      <div class="sr-path">${r.path}</div>
      <div class="sr-excerpt">${r.excerpt}</div>
    </a>
  `).join('');
  searchResults.classList.add('active');
}

function hideSearchResults() {
  if (searchResults) searchResults.classList.remove('active');
}

document.addEventListener('keydown', function (e) {
  if (e.key === 'Escape') hideSearchResults();
  if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
    e.preventDefault();
    const input = document.getElementById('main-search');
    if (input) input.focus();
  }
});

document.addEventListener('click', function (e) {
  if (searchResults && !searchResults.contains(e.target)) {
    const input = document.getElementById('main-search');
    if (!input || !input.contains(e.target)) hideSearchResults();
  }
});

// ===== SIDEBAR FILTER =====
function onNavSearch(input) {
  const query = input.value.toLowerCase().trim();
  const links = document.querySelectorAll('.nav-link');
  links.forEach(link => {
    const label = link.dataset.label || '';
    if (!query || label.includes(query)) {
      link.classList.remove('hidden');
    } else {
      link.classList.add('hidden');
    }
  });
}

// ===== FEEDBACK WIDGET =====
let feedbackVote = null;

function submitFeedback(vote) {
  feedbackVote = vote;
  document.querySelectorAll('.feedback-btn').forEach(b => b.classList.remove('selected-up', 'selected-down'));
  const btn = document.getElementById('fb-' + vote);
  if (btn) btn.classList.add('selected-' + vote);

  const commentSection = document.getElementById('feedback-comment');
  if (commentSection) commentSection.classList.add('active');
}

async function sendFeedback() {
  const docPath = document.body.dataset.docPath;
  const comment = document.getElementById('fb-comment-text')?.value || '';

  if (!feedbackVote) return;

  try {
    const res = await fetch('/api/feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path: docPath, vote: feedbackVote, comment }),
    });
    const data = await res.json();

    const thanks = document.getElementById('feedback-thanks');
    const comment_section = document.getElementById('feedback-comment');
    if (thanks) {
      thanks.style.display = 'block';
      thanks.textContent = `Thanks! This page has ${data.up} 👍 and ${data.down} 👎`;
    }
    if (comment_section) comment_section.classList.remove('active');
  } catch {
    alert('Could not submit feedback. Please try again.');
  }
}

// ===== TABLE OF CONTENTS =====
function buildTOC() {
  const toc = document.getElementById('toc-list');
  if (!toc) return;

  const headings = document.querySelectorAll('.markdown-body h2, .markdown-body h3');
  if (headings.length < 3) {
    const tocEl = document.querySelector('.toc');
    if (tocEl) tocEl.style.display = 'none';
    return;
  }

  headings.forEach((h, i) => {
    if (!h.id) h.id = 'heading-' + i;
    const li = document.createElement('li');
    li.className = 'toc-item';
    const a = document.createElement('a');
    a.href = '#' + h.id;
    a.className = 'toc-link' + (h.tagName === 'H3' ? ' toc-h3' : '');
    a.textContent = h.textContent;
    li.appendChild(a);
    toc.appendChild(li);
  });

  // Highlight active heading on scroll
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        document.querySelectorAll('.toc-link').forEach(l => l.classList.remove('active'));
        const link = toc.querySelector(`a[href="#${entry.target.id}"]`);
        if (link) link.classList.add('active');
      }
    });
  }, { rootMargin: '-60px 0px -80% 0px' });

  headings.forEach(h => observer.observe(h));
}

// ===== STATUS WIDGET =====
async function updateStatusWidget() {
  const dot = document.getElementById('status-dot');
  const label = document.getElementById('status-label');
  if (!dot || !label) return;

  try {
    const res = await fetch('/api/status');
    const data = await res.json();
    dot.className = 'status-dot ' + data.overall;
    label.textContent = data.label;
  } catch {
    // keep default
  }
}

// ===== COPY CODE BLOCKS =====
function addCopyButtons() {
  document.querySelectorAll('.markdown-body pre').forEach(pre => {
    const btn = document.createElement('button');
    btn.textContent = 'Copy';
    btn.style.cssText = `
      position: absolute; top: 8px; right: 8px;
      background: var(--bg-tertiary); color: var(--text-muted);
      border: 1px solid var(--border); border-radius: 4px;
      padding: 3px 8px; font-size: 11px; cursor: pointer;
      transition: all 0.2s;
    `;
    btn.onclick = () => {
      const code = pre.querySelector('code');
      if (code) {
        navigator.clipboard.writeText(code.textContent).then(() => {
          btn.textContent = 'Copied!';
          btn.style.color = 'var(--green)';
          setTimeout(() => {
            btn.textContent = 'Copy';
            btn.style.color = 'var(--text-muted)';
          }, 2000);
        });
      }
    };
    pre.style.position = 'relative';
    pre.appendChild(btn);
  });
}

// ===== LOAD FEEDBACK COUNTS =====
async function loadFeedbackCounts() {
  const countEl = document.getElementById('feedback-count');
  const docPath = document.body.dataset.docPath;
  if (!countEl || !docPath) return;

  try {
    const res = await fetch('/api/feedback?path=' + encodeURIComponent(docPath));
    const data = await res.json();
    if (data.up + data.down > 0) {
      countEl.textContent = `${data.up} 👍  ${data.down} 👎`;
    }
  } catch {}
}

// ===== INIT =====
document.addEventListener('DOMContentLoaded', function () {
  buildTOC();
  addCopyButtons();
  updateStatusWidget();
  loadFeedbackCounts();

  // Restore search input value from URL param
  const urlParams = new URLSearchParams(window.location.search);
  const q = urlParams.get('q');
  const searchInput = document.getElementById('main-search');
  if (q && searchInput) {
    searchInput.value = q;
    performSearch(q);
  }
});

function escapeHtml(str) {
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}
