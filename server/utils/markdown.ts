import MarkdownIt from 'markdown-it'
import sanitizeHtml from 'sanitize-html'

/**
 * Renders community-authored markdown to HTML.
 *
 * Content here is written by community managers, i.e. untrusted input rendered
 * on a public page — this is the project's main XSS surface. Two independent
 * layers guard it:
 *   1. markdown-it runs with `html: false`, so raw HTML in the source is
 *      escaped rather than passed through.
 *   2. sanitize-html then filters the *output* against a closed allowlist, so
 *      anything the parser might still emit (or any future parser change)
 *      cannot introduce script, style, iframe, event handlers or js: URLs.
 *
 * Raw markdown is what gets stored; rendering happens on read. That keeps the
 * author's text intact and lets this sanitizer be tightened later without a
 * data migration.
 */

const md = new MarkdownIt({
  html: false,      // never trust inline HTML from users
  linkify: true,    // bare URLs become links (still sanitized below)
  breaks: true,     // single newlines render as <br>, matching how people type
  typographer: false,
})

// Headings start at h3: the page already owns h1/h2, so user content must not
// hijack the document outline.
md.renderer.rules.heading_open = (tokens, idx) => {
  const level = Math.min(6, Number(tokens[idx]!.tag.slice(1)) + 2)
  return `<h${level}>`
}
md.renderer.rules.heading_close = (tokens, idx) => {
  const level = Math.min(6, Number(tokens[idx]!.tag.slice(1)) + 2)
  return `</h${level}>`
}

const SANITIZE_OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: [
    'p', 'br', 'hr',
    'h3', 'h4', 'h5', 'h6',
    'strong', 'em', 's', 'code', 'pre', 'blockquote',
    'ul', 'ol', 'li',
    'a',
  ],
  allowedAttributes: {
    a: ['href', 'rel', 'target'],
  },
  // Anything not http(s)/mailto is dropped, which excludes javascript: and data:.
  allowedSchemes: ['http', 'https', 'mailto'],
  allowedSchemesAppliedToAttributes: ['href'],
  disallowedTagsMode: 'discard',
  transformTags: {
    // User links are untrusted: no referrer leak, no window.opener access,
    // and no SEO endorsement.
    a: (tagName, attribs) => ({
      tagName,
      attribs: {
        ...attribs,
        rel: 'nofollow ugc noopener noreferrer',
        target: '_blank',
      },
    }),
  },
}

/** Sanitized HTML for a markdown string. Returns '' for empty input. */
export function renderMarkdown(source: unknown): string {
  if (typeof source !== 'string') return ''
  const trimmed = source.trim()
  if (!trimmed) return ''

  return sanitizeHtml(md.render(trimmed), SANITIZE_OPTIONS)
}

/**
 * Plain-text preview of markdown, for meta descriptions and card excerpts.
 *
 * Entities are decoded so the text reads naturally, then angle brackets are
 * dropped outright: the result can never re-form markup, whatever it is
 * interpolated into.
 */
export function markdownToPlainText(source: unknown, maxLength = 300): string {
  if (typeof source !== 'string') return ''

  const text = sanitizeHtml(md.render(source), { allowedTags: [], allowedAttributes: {} })
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#(?:39|x27);/g, "'")
    .replace(/&amp;/g, '&') // last, so decoded text cannot rebuild an entity
    .replace(/[<>]/g, '')   // inert regardless of where the caller puts it
    .replace(/\s+/g, ' ')
    .trim()

  return text.length > maxLength ? `${text.slice(0, maxLength - 1)}…` : text
}
