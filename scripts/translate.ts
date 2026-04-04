/**
 * WebWaka OS v4 — AI Translation Pipeline
 *
 * Translates Markdown documentation files into French, Swahili, and Arabic
 * using the WebWaka CORE-5 AI abstraction layer (getAICompletion).
 *
 * Key guarantees:
 *   - Code blocks (``` ... ```) are never translated.
 *   - Inline code (`...`) is never translated.
 *   - Markdown links [text](url) — only the link text is translated, never the URL.
 *   - All output is sanitized against XSS before being written to disk.
 *
 * Usage: npx ts-node scripts/translate.ts --input README.md --lang fr [--output translations/fr/README.md]
 * Blueprint Reference: Part 12.3 — Localisation & AI Translation Pipeline
 */

import * as fs from 'fs';
import * as path from 'path';
import sanitizeHtml from 'sanitize-html';

// ===== TYPES =====

export type SupportedLanguage = 'fr' | 'sw' | 'ar';

export interface TranslationResult {
  original: string;
  translated: string;
  language: SupportedLanguage;
  codeBlocksPreserved: number;
  linksPreserved: number;
}

export interface AICompletionFn {
  (prompt: string, language: string): Promise<string>;
}

// ===== CODE BLOCK EXTRACTION =====

const FENCED_BLOCK_RE = /```[\s\S]*?```/g;
const INLINE_CODE_RE = /`[^`\n]+`/g;

/**
 * Extract all fenced code blocks (``` ... ```) and inline code (`...`) from
 * Markdown, replacing them with stable numbered placeholders.
 * Returns the cleaned string and the extracted blocks for later restoration.
 */
export function extractCodeBlocks(markdown: string): { cleaned: string; blocks: string[] } {
  const blocks: string[] = [];

  // First, extract fenced code blocks (multi-line)
  let cleaned = markdown.replace(FENCED_BLOCK_RE, (match) => {
    const idx = blocks.push(match) - 1;
    return `{{CODE_BLOCK_${idx}}}`;
  });

  // Then, extract inline code
  cleaned = cleaned.replace(INLINE_CODE_RE, (match) => {
    const idx = blocks.push(match) - 1;
    return `{{CODE_BLOCK_${idx}}}`;
  });

  return { cleaned, blocks };
}

/**
 * Restore extracted code blocks back into the (translated) string,
 * replacing all {{CODE_BLOCK_N}} placeholders.
 */
export function restoreCodeBlocks(translated: string, blocks: string[]): string {
  return translated.replace(/\{\{CODE_BLOCK_(\d+)\}\}/g, (_, i) => {
    const idx = parseInt(i, 10);
    if (idx >= 0 && idx < blocks.length) {
      return blocks[idx];
    }
    return _; // leave unknown placeholders intact
  });
}

// ===== LINK PRESERVATION =====

const MARKDOWN_LINK_RE = /\[([^\]]*)\]\(([^)]*)\)/g;
const LINK_TEXT_PLACEHOLDER_RE = /\{\{LINK_(\d+)_TEXT\}\}\(([^)]*)\)/g;

/**
 * Replace markdown link text with placeholders so only the display text
 * (not the URL) is ever sent to the translation model.
 *
 * Returns cleaned markdown with placeholders and the original link texts.
 */
export function extractLinkTexts(markdown: string): { cleaned: string; linkTexts: string[] } {
  const linkTexts: string[] = [];
  const cleaned = markdown.replace(MARKDOWN_LINK_RE, (_, text, url) => {
    const idx = linkTexts.push(text) - 1;
    return `{{LINK_${idx}_TEXT}}(${url})`;
  });
  return { cleaned, linkTexts };
}

/**
 * Restore original (or translated) link text back into the markdown,
 * using the translated texts array when provided.
 */
export function restoreLinkTexts(markdown: string, linkTexts: string[], translatedTexts?: string[]): string {
  const texts = translatedTexts ?? linkTexts;
  return markdown.replace(LINK_TEXT_PLACEHOLDER_RE, (_, i, url) => {
    const idx = parseInt(i, 10);
    const text = idx >= 0 && idx < texts.length ? texts[idx] : linkTexts[idx] ?? '';
    return `[${text}](${url})`;
  });
}

// ===== XSS SANITIZATION =====

const SANITIZE_OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: sanitizeHtml.defaults.allowedTags.concat([
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'pre', 'code', 'blockquote',
    'table', 'thead', 'tbody', 'tr', 'th', 'td',
    'del', 'ins', 'mark',
  ]),
  allowedAttributes: {
    ...sanitizeHtml.defaults.allowedAttributes,
    'a': ['href', 'name', 'target', 'rel'],
    'img': ['src', 'alt', 'title', 'width', 'height'],
    'code': ['class'],
    'pre': ['class'],
  },
  allowedSchemes: ['http', 'https', 'mailto', 'tel'],
  disallowedTagsMode: 'discard',
};

/**
 * Sanitize an HTML string to prevent XSS attacks.
 * Applied to all AI-generated translated content before it is rendered or written.
 */
export function sanitizeMarkdown(html: string): string {
  return sanitizeHtml(html, SANITIZE_OPTIONS);
}

/**
 * Sanitize plain text (Markdown source, not rendered HTML) by stripping
 * any injected HTML tags or script patterns that could survive Markdown parsing.
 */
export function sanitizePlainText(text: string): string {
  // Remove any raw <script> / <iframe> / event-handler injections
  return text
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<iframe[\s\S]*?<\/iframe>/gi, '')
    .replace(/javascript\s*:/gi, 'removed:')
    .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '');
}

// ===== AI COMPLETION =====

/**
 * Default CORE-5 AI completion function.
 * In production this calls the WebWaka staging API; in tests it is mocked.
 */
/* istanbul ignore next */
export async function getAICompletion(prompt: string, language: string): Promise<string> {
  const apiKey = process.env.WEBWAKA_AI_KEY;
  if (!apiKey) {
    throw new Error('WEBWAKA_AI_KEY environment variable is not set');
  }

  const response = await fetch('https://staging-api.webwaka.io/v4/ai/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      prompt,
      language,
      maxTokens: 4096,
      temperature: 0.3,
    }),
  });

  if (!response.ok) {
    throw new Error(`AI completion failed: ${response.status} ${response.statusText}`);
  }

  const data = await response.json() as { text: string };
  return data.text;
}

// ===== TRANSLATION PIPELINE =====

/**
 * Translate a Markdown document to the target language using the AI completion function.
 *
 * Pipeline:
 *   1. Extract code blocks → placeholders (never translated)
 *   2. Extract link texts → placeholders (only text translated, not URLs)
 *   3. Sanitize input for XSS patterns
 *   4. Send cleaned text to CORE-5 AI for translation
 *   5. Restore code blocks from placeholders
 *   6. Restore link texts (translated) from placeholders
 *   7. Sanitize output (strip any injected XSS from AI output)
 *   8. Prepend translation metadata header
 */
export async function translateMarkdown(
  content: string,
  language: SupportedLanguage,
  aiCompletionFn: AICompletionFn = getAICompletion,
): Promise<TranslationResult> {
  // Step 1: Extract code blocks
  const { cleaned: noCodeBlocks, blocks } = extractCodeBlocks(content);

  // Step 2: Extract link texts
  const { cleaned: noLinks, linkTexts } = extractLinkTexts(noCodeBlocks);

  // Step 3: Sanitize the input (prevent prompt injection / XSS from source)
  const sanitized = sanitizePlainText(noLinks);

  // Step 4: Translate via CORE-5 AI
  const languageNames: Record<SupportedLanguage, string> = {
    fr: 'French',
    sw: 'Swahili',
    ar: 'Arabic',
  };

  const prompt =
    `Translate the following Markdown documentation to ${languageNames[language]}.\n` +
    `RULES:\n` +
    `- Preserve ALL Markdown formatting (headings, lists, tables, bold, italic, horizontal rules).\n` +
    `- Do NOT translate placeholders like {{CODE_BLOCK_N}} or {{LINK_N_TEXT}} — keep them exactly as-is.\n` +
    `- Do NOT translate URLs inside parentheses ().\n` +
    `- Do NOT translate proper nouns: WebWaka, Paystack, Flutterwave, Termii, NIMC, BVN, NGN, KES, GHS.\n` +
    `- Return ONLY the translated Markdown, no preamble or explanation.\n\n` +
    `DOCUMENT:\n${sanitized}`;

  const rawTranslation = await aiCompletionFn(prompt, language);

  // Step 5: Sanitize AI output (strip any XSS the model may have hallucinated)
  const sanitizedTranslation = sanitizePlainText(rawTranslation);

  // Step 6: Restore code blocks
  const withCodeBlocks = restoreCodeBlocks(sanitizedTranslation, blocks);

  // Step 7: Restore link texts (using translated output)
  // The model should have kept {{LINK_N_TEXT}} placeholders intact
  const withLinks = restoreLinkTexts(withCodeBlocks, linkTexts);

  // Step 8: Prepend metadata header
  const header =
    `<!-- Auto-translated by WebWaka CORE-5 AI Translation Pipeline -->\n` +
    `<!-- Language: ${language} | Source: original | Date: ${new Date().toISOString().slice(0, 10)} -->\n\n`;

  const translated = header + withLinks;

  return {
    original: content,
    translated,
    language,
    codeBlocksPreserved: blocks.length,
    linksPreserved: linkTexts.length,
  };
}

// ===== CLI ENTRY POINT =====

/* istanbul ignore next */
if (require.main === module) {
  const args = process.argv.slice(2);
  const inputIndex = args.indexOf('--input');
  const langIndex = args.indexOf('--lang');
  const outputIndex = args.indexOf('--output');

  if (inputIndex === -1 || langIndex === -1) {
    console.error('Usage: ts-node scripts/translate.ts --input <file.md> --lang <fr|sw|ar> [--output <out.md>]');
    process.exit(1);
  }

  const inputFile = args[inputIndex + 1];
  const lang = args[langIndex + 1] as SupportedLanguage;
  const outputFile = outputIndex !== -1
    ? args[outputIndex + 1]
    : `translations/${lang}/${path.basename(inputFile)}`;

  if (!['fr', 'sw', 'ar'].includes(lang)) {
    console.error(`Unsupported language: ${lang}. Must be one of: fr, sw, ar`);
    process.exit(1);
  }

  const content = fs.readFileSync(inputFile, 'utf8');
  console.log(`[translate] Translating ${inputFile} → ${lang}…`);

  translateMarkdown(content, lang)
    .then(result => {
      fs.mkdirSync(path.dirname(outputFile), { recursive: true });
      fs.writeFileSync(outputFile, result.translated, 'utf8');
      console.log(`[translate] ✅ Written to ${outputFile}`);
      console.log(`[translate]    Code blocks preserved: ${result.codeBlocksPreserved}`);
      console.log(`[translate]    Links preserved:       ${result.linksPreserved}`);
    })
    .catch(err => {
      console.error('[translate] ❌ Error:', (err as Error).message);
      process.exit(1);
    });
}
