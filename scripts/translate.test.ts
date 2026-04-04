/**
 * Unit tests for scripts/translate.ts
 * Blueprint Reference: Part 12.3 — QA-DOC-3, QA-DOC-4
 */

import {
  extractCodeBlocks,
  restoreCodeBlocks,
  extractLinkTexts,
  restoreLinkTexts,
  sanitizeMarkdown,
  sanitizePlainText,
  translateMarkdown,
  SupportedLanguage,
  AICompletionFn,
} from './translate';

// ===== extractCodeBlocks =====

describe('extractCodeBlocks', () => {
  it('extracts a single fenced code block', () => {
    const md = 'Before\n```js\nconst x = 1;\n```\nAfter';
    const { cleaned, blocks } = extractCodeBlocks(md);
    expect(blocks).toHaveLength(1);
    expect(blocks[0]).toBe('```js\nconst x = 1;\n```');
    expect(cleaned).toContain('{{CODE_BLOCK_0}}');
    expect(cleaned).not.toContain('const x = 1;');
  });

  it('extracts multiple fenced code blocks', () => {
    const md = '```bash\nnpm install\n```\nSome text\n```python\nprint("hi")\n```';
    const { cleaned, blocks } = extractCodeBlocks(md);
    expect(blocks).toHaveLength(2);
    expect(cleaned).toContain('{{CODE_BLOCK_0}}');
    expect(cleaned).toContain('{{CODE_BLOCK_1}}');
    expect(cleaned).not.toContain('npm install');
    expect(cleaned).not.toContain('print("hi")');
  });

  it('extracts inline code', () => {
    const md = 'Use `npm install` to install dependencies.';
    const { cleaned, blocks } = extractCodeBlocks(md);
    expect(blocks).toHaveLength(1);
    expect(blocks[0]).toBe('`npm install`');
    expect(cleaned).not.toContain('npm install');
    expect(cleaned).toContain('{{CODE_BLOCK_0}}');
  });

  it('handles markdown with no code blocks', () => {
    const md = '# Hello World\n\nThis is plain text.';
    const { cleaned, blocks } = extractCodeBlocks(md);
    expect(blocks).toHaveLength(0);
    expect(cleaned).toBe(md);
  });

  it('handles empty string', () => {
    const { cleaned, blocks } = extractCodeBlocks('');
    expect(cleaned).toBe('');
    expect(blocks).toHaveLength(0);
  });

  it('correctly numbers multiple blocks sequentially', () => {
    // Fenced blocks are extracted first, then inline code — so the fenced
    // block gets index 0 and the inline snippets get indices 1 and 2.
    const md = '`a`\n```\nb\n```\n`c`';
    const { cleaned, blocks } = extractCodeBlocks(md);
    expect(cleaned).toContain('{{CODE_BLOCK_0}}');
    expect(cleaned).toContain('{{CODE_BLOCK_1}}');
    expect(cleaned).toContain('{{CODE_BLOCK_2}}');
    // Fenced block extracted first
    expect(blocks[0]).toBe('```\nb\n```');
    // Inline codes follow
    expect(blocks[1]).toBe('`a`');
    expect(blocks[2]).toBe('`c`');
  });

  it('preserves code block language tags', () => {
    const md = '```typescript\nconst x: string = "hello";\n```';
    const { blocks } = extractCodeBlocks(md);
    expect(blocks[0]).toContain('typescript');
    expect(blocks[0]).toContain('const x: string');
  });
});

// ===== restoreCodeBlocks =====

describe('restoreCodeBlocks', () => {
  it('restores a single code block placeholder', () => {
    const blocks = ['```js\nconst x = 1;\n```'];
    const translated = 'Avant\n{{CODE_BLOCK_0}}\nAprès';
    const result = restoreCodeBlocks(translated, blocks);
    expect(result).toBe('Avant\n```js\nconst x = 1;\n```\nAprès');
  });

  it('restores multiple code block placeholders', () => {
    const blocks = ['`npm install`', '```bash\nnpm run build\n```'];
    const translated = 'Exécutez {{CODE_BLOCK_0}} puis {{CODE_BLOCK_1}}.';
    const result = restoreCodeBlocks(translated, blocks);
    expect(result).toContain('`npm install`');
    expect(result).toContain('```bash\nnpm run build\n```');
  });

  it('handles strings with no placeholders', () => {
    const result = restoreCodeBlocks('No placeholders here.', []);
    expect(result).toBe('No placeholders here.');
  });

  it('leaves unknown placeholders intact', () => {
    const blocks: string[] = [];
    const translated = 'Hello {{CODE_BLOCK_99}} World';
    const result = restoreCodeBlocks(translated, blocks);
    expect(result).toContain('{{CODE_BLOCK_99}}');
  });

  it('roundtrips: extract then restore produces the original', () => {
    const original = '# Title\n\n```json\n{"key": "value"}\n```\n\nInline `code` here.';
    const { cleaned, blocks } = extractCodeBlocks(original);
    const restored = restoreCodeBlocks(cleaned, blocks);
    expect(restored).toBe(original);
  });

  it('restores code blocks that have been moved by translation', () => {
    const blocks = ['```js\nconst x = 1;\n```'];
    // Simulates AI reordering text but keeping placeholder intact
    const translated = '{{CODE_BLOCK_0}}\n\nLe texte suit.';
    const result = restoreCodeBlocks(translated, blocks);
    expect(result).toContain('```js\nconst x = 1;\n```');
  });
});

// ===== extractLinkTexts =====

describe('extractLinkTexts', () => {
  it('extracts a single link text', () => {
    const md = 'See [the docs](https://docs.webwaka.io) for more.';
    const { cleaned, linkTexts } = extractLinkTexts(md);
    expect(linkTexts).toHaveLength(1);
    expect(linkTexts[0]).toBe('the docs');
    expect(cleaned).toContain('{{LINK_0_TEXT}}');
    expect(cleaned).toContain('(https://docs.webwaka.io)');
    expect(cleaned).not.toContain('[the docs]');
  });

  it('extracts multiple link texts', () => {
    const md = '[Home](/) and [GitHub](https://github.com/webwaka-os)';
    const { cleaned, linkTexts } = extractLinkTexts(md);
    expect(linkTexts).toHaveLength(2);
    expect(linkTexts[0]).toBe('Home');
    expect(linkTexts[1]).toBe('GitHub');
    expect(cleaned).toContain('{{LINK_0_TEXT}}(/)');
    expect(cleaned).toContain('{{LINK_1_TEXT}}(https://github.com/webwaka-os)');
  });

  it('preserves the URLs in the cleaned output', () => {
    const md = '[API Reference](https://api.webwaka.io/v4)';
    const { cleaned } = extractLinkTexts(md);
    expect(cleaned).toContain('https://api.webwaka.io/v4');
  });

  it('returns empty arrays for markdown with no links', () => {
    const md = '# Just a heading\n\nNo links here.';
    const { cleaned, linkTexts } = extractLinkTexts(md);
    expect(linkTexts).toHaveLength(0);
    expect(cleaned).toBe(md);
  });

  it('handles links with empty text', () => {
    const md = '[](https://example.com)';
    const { cleaned, linkTexts } = extractLinkTexts(md);
    expect(linkTexts).toHaveLength(1);
    expect(linkTexts[0]).toBe('');
    expect(cleaned).toContain('{{LINK_0_TEXT}}');
  });
});

// ===== restoreLinkTexts =====

describe('restoreLinkTexts', () => {
  it('restores original link text when no translated texts provided', () => {
    const md = '{{LINK_0_TEXT}}(https://docs.webwaka.io)';
    const result = restoreLinkTexts(md, ['the docs']);
    expect(result).toBe('[the docs](https://docs.webwaka.io)');
  });

  it('restores translated link text when translatedTexts provided', () => {
    const md = '{{LINK_0_TEXT}}(https://docs.webwaka.io)';
    const result = restoreLinkTexts(md, ['the docs'], ['les docs']);
    expect(result).toBe('[les docs](https://docs.webwaka.io)');
  });

  it('preserves URLs exactly — never translates them', () => {
    const md = '{{LINK_0_TEXT}}(https://api.webwaka.io/v4/tenants?page=1&limit=20)';
    const result = restoreLinkTexts(md, ['view tenants'], ['voir les locataires']);
    expect(result).toContain('https://api.webwaka.io/v4/tenants?page=1&limit=20');
    expect(result).not.toContain('{{LINK_0_TEXT}}');
  });

  it('restores multiple links', () => {
    const md = '{{LINK_0_TEXT}}(/) and {{LINK_1_TEXT}}(https://github.com)';
    const result = restoreLinkTexts(md, ['Home', 'GitHub'], ['Accueil', 'GitHub']);
    expect(result).toBe('[Accueil](/) and [GitHub](https://github.com)');
  });

  it('roundtrips: extract then restore with original texts produces original', () => {
    const original = 'Click [here](https://webwaka.io) to visit [the portal](https://portal.webwaka.io).';
    const { cleaned, linkTexts } = extractLinkTexts(original);
    const restored = restoreLinkTexts(cleaned, linkTexts);
    expect(restored).toBe(original);
  });
});

// ===== sanitizePlainText =====

describe('sanitizePlainText', () => {
  it('removes <script> tags and their content', () => {
    const input = 'Hello <script>alert("xss")</script> World';
    const result = sanitizePlainText(input);
    expect(result).not.toContain('<script>');
    expect(result).not.toContain('alert("xss")');
    expect(result).toContain('Hello');
    expect(result).toContain('World');
  });

  it('removes <iframe> tags', () => {
    const input = 'Text <iframe src="evil.com"></iframe> more';
    const result = sanitizePlainText(input);
    expect(result).not.toContain('<iframe');
    expect(result).not.toContain('evil.com');
  });

  it('replaces javascript: URI schemes', () => {
    const input = 'Click [here](javascript:alert(1))';
    const result = sanitizePlainText(input);
    expect(result).not.toContain('javascript:');
    expect(result).toContain('removed:');
  });

  it('removes inline event handlers', () => {
    const input = '<img src="x" onerror="alert(1)">';
    const result = sanitizePlainText(input);
    expect(result).not.toContain('onerror=');
  });

  it('preserves normal markdown content', () => {
    const input = '# Title\n\nThis is **bold** and _italic_ text.';
    const result = sanitizePlainText(input);
    expect(result).toContain('# Title');
    expect(result).toContain('**bold**');
    expect(result).toContain('_italic_');
  });
});

// ===== sanitizeMarkdown (HTML sanitizer) =====

describe('sanitizeMarkdown', () => {
  it('strips <script> tags from rendered HTML', () => {
    const html = '<h1>Hello</h1><script>alert("xss")</script>';
    const result = sanitizeMarkdown(html);
    expect(result).toContain('<h1>Hello</h1>');
    expect(result).not.toContain('<script>');
    expect(result).not.toContain('alert');
  });

  it('allows standard heading tags', () => {
    const html = '<h1>H1</h1><h2>H2</h2><h3>H3</h3>';
    const result = sanitizeMarkdown(html);
    expect(result).toContain('<h1>');
    expect(result).toContain('<h2>');
    expect(result).toContain('<h3>');
  });

  it('allows code and pre tags', () => {
    const html = '<pre><code class="language-js">const x = 1;</code></pre>';
    const result = sanitizeMarkdown(html);
    expect(result).toContain('<code');
    expect(result).toContain('const x = 1;');
  });

  it('allows anchor tags with safe href', () => {
    const html = '<a href="https://webwaka.io">WebWaka</a>';
    const result = sanitizeMarkdown(html);
    expect(result).toContain('href="https://webwaka.io"');
  });

  it('strips javascript: href from anchor tags', () => {
    const html = '<a href="javascript:alert(1)">click</a>';
    const result = sanitizeMarkdown(html);
    expect(result).not.toContain('javascript:');
  });

  it('allows table elements', () => {
    const html = '<table><thead><tr><th>Name</th></tr></thead><tbody><tr><td>Value</td></tr></tbody></table>';
    const result = sanitizeMarkdown(html);
    expect(result).toContain('<table>');
    expect(result).toContain('<th>Name</th>');
    expect(result).toContain('<td>Value</td>');
  });

  it('strips event handlers from allowed tags', () => {
    const html = '<p onclick="alert(1)">Hello</p>';
    const result = sanitizeMarkdown(html);
    expect(result).not.toContain('onclick');
    expect(result).toContain('<p>Hello</p>');
  });
});

// ===== translateMarkdown (integration) =====

describe('translateMarkdown', () => {
  const mockAI: AICompletionFn = async (prompt: string, _lang: string): Promise<string> => {
    // Extract the DOCUMENT section from the prompt
    const docMatch = prompt.match(/DOCUMENT:\n([\s\S]+)$/);
    const doc = docMatch ? docMatch[1] : prompt;
    // Identity mock: return the doc unchanged (simulates perfect placeholder preservation)
    return doc;
  };

  const mockAIFrench: AICompletionFn = async (prompt: string, _lang: string): Promise<string> => {
    const docMatch = prompt.match(/DOCUMENT:\n([\s\S]+)$/);
    const doc = docMatch ? docMatch[1] : prompt;
    // Simulate French translation of plain text but preserve placeholders
    return doc
      .replace(/Hello/g, 'Bonjour')
      .replace(/World/g, 'Monde')
      .replace(/Click here/g, 'Cliquez ici');
  };

  it('includes a translation metadata header in the output', async () => {
    const result = await translateMarkdown('# Hello', 'fr', mockAI);
    expect(result.translated).toContain('Auto-translated by WebWaka CORE-5');
    expect(result.translated).toContain('Language: fr');
  });

  it('preserves fenced code blocks exactly', async () => {
    const content = '## Usage\n\n```bash\nnpm install @webwaka/sdk\n```\n\nAfter installation…';
    const result = await translateMarkdown(content, 'fr', mockAI);
    expect(result.translated).toContain('```bash\nnpm install @webwaka/sdk\n```');
    expect(result.codeBlocksPreserved).toBe(1);
  });

  it('preserves inline code exactly', async () => {
    const content = 'Run `npm start` to begin.';
    const result = await translateMarkdown(content, 'sw', mockAI);
    expect(result.translated).toContain('`npm start`');
  });

  it('preserves link URLs (only text may be translated)', async () => {
    const content = 'See [the docs](https://docs.webwaka.io/api) for details.';
    const result = await translateMarkdown(content, 'ar', mockAI);
    expect(result.translated).toContain('https://docs.webwaka.io/api');
    expect(result.linksPreserved).toBe(1);
  });

  it('counts code blocks preserved correctly', async () => {
    const content = '```js\nx\n```\n\n```py\ny\n```\n\nInline `z`';
    const result = await translateMarkdown(content, 'fr', mockAI);
    expect(result.codeBlocksPreserved).toBe(3);
  });

  it('counts links preserved correctly', async () => {
    const content = '[A](/a) and [B](/b) and [C](/c)';
    const result = await translateMarkdown(content, 'fr', mockAI);
    expect(result.linksPreserved).toBe(3);
  });

  it('strips XSS from AI output', async () => {
    const maliciousAI: AICompletionFn = async () =>
      'Bonjour <script>alert("xss")</script> Monde';
    const content = '# Hello World';
    const result = await translateMarkdown(content, 'fr', maliciousAI);
    expect(result.translated).not.toContain('<script>');
    expect(result.translated).not.toContain('alert("xss")');
  });

  it('strips XSS from javascript: URIs in AI output', async () => {
    const maliciousAI: AICompletionFn = async () =>
      'Cliquez [ici](javascript:alert(1))';
    const content = 'Click [here](https://webwaka.io)';
    const result = await translateMarkdown(content, 'fr', maliciousAI);
    expect(result.translated).not.toContain('javascript:');
  });

  it('returns original content in the result', async () => {
    const content = '# Original Title\n\nSome content.';
    const result = await translateMarkdown(content, 'fr', mockAI);
    expect(result.original).toBe(content);
  });

  it('returns the correct language in the result', async () => {
    const result = await translateMarkdown('Hello', 'sw', mockAI);
    expect(result.language).toBe('sw');
  });

  it('handles markdown with no special content (no code, no links)', async () => {
    const content = '# Simple Title\n\nJust plain text with some **bold** and _italic_.';
    const result = await translateMarkdown(content, 'fr', mockAI);
    expect(result.codeBlocksPreserved).toBe(0);
    expect(result.linksPreserved).toBe(0);
    expect(result.translated.length).toBeGreaterThan(0);
  });

  it('handles complex real-world markdown correctly', async () => {
    const content = `
# Getting Started

Install the SDK:

\`\`\`bash
npm install @webwaka/sdk
\`\`\`

Then authenticate:

\`\`\`typescript
const client = new WebWakaClient({ apiKey: process.env.KEY });
\`\`\`

See the [full SDK docs](https://docs.webwaka.io/sdk) for more information.
Use \`client.auth.login()\` to get a token.
`.trim();

    const result = await translateMarkdown(content, 'fr', mockAIFrench);
    // Code blocks preserved
    expect(result.translated).toContain('```bash');
    expect(result.translated).toContain('npm install @webwaka/sdk');
    expect(result.translated).toContain('```typescript');
    expect(result.translated).toContain('new WebWakaClient');
    // Link URL preserved
    expect(result.translated).toContain('https://docs.webwaka.io/sdk');
    // Inline code preserved
    expect(result.translated).toContain('`client.auth.login()`');
    // Stats
    expect(result.codeBlocksPreserved).toBe(3); // 2 fenced + 1 inline
    expect(result.linksPreserved).toBe(1);
  });
});
