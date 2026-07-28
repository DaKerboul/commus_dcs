import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { renderMarkdown } from '../../server/utils/markdown'

/**
 * Guards the switch from plain-text rendering to markdown.
 *
 * Existing community copy was written as plain text, so characters that are
 * markup in markdown (*, #, _, >) could silently change how 58 live pages read.
 * This runs the real production text through the pipeline and asserts nothing
 * is swallowed. Fixture is a snapshot of prod, refreshed by hand when needed.
 */

const FIXTURE = new URL('../fixtures/prod-text.json', import.meta.url)

interface Row { slug: string; description: string | null; objectives: string | null }

let rows: Row[] = []
try {
  rows = JSON.parse(readFileSync(FIXTURE, 'utf8'))
} catch {
  rows = []
}

/**
 * Words in `html`, with tags and entities resolved.
 *
 * href values count as present: an authored `[texte](url)` moves the URL out of
 * the visible text and into the attribute, which is the point of the link.
 */
function wordsFromHtml(html: string): string[] {
  const hrefs = [...html.matchAll(/href\s*=\s*"([^"]*)"/gi)].map(m => m[1]!)
  const text = html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#(?:39|x27);/g, "'")
    .replace(/&amp;/g, '&')
  return [...toWords(text), ...hrefs]
}

/**
 * Words in authored source, with markdown markers removed.
 *
 * Several communities already wrote markdown-flavoured plain text (`## Titre`,
 * `- item`), which used to display literally. Those markers are now consumed as
 * real formatting — a gain, not a loss — so they must not count as missing
 * content. What must never disappear is the words themselves.
 */
function wordsFromSource(source: string): string[] {
  return toWords(source)
}

function toWords(text: string): string[] {
  return text
    .replace(/[#*_`>[\]()~|]/g, ' ')     // markdown markers
    .replace(/(^|\s)-+(\s|$)/g, ' ')     // list bullets / horizontal rules
    .split(/\s+/)
    .map(w => w.trim())
    .filter(Boolean)
}

describe('markdown rendering of real production copy', () => {
  it('has a fixture to check', () => {
    expect(rows.length).toBeGreaterThan(0)
  })

  const withText = rows.flatMap(r => [
    { slug: r.slug, field: 'description', text: r.description },
    { slug: r.slug, field: 'objectives', text: r.objectives },
  ]).filter((r): r is { slug: string; field: string; text: string } => !!r.text?.trim())

  it.each(withText)('keeps every word of $slug/$field', ({ text }) => {
    const rendered = wordsFromHtml(renderMarkdown(text))
    const original = wordsFromSource(text)

    const missing = original.filter(w => !rendered.includes(w))
    expect(missing, `mots perdus: ${missing.slice(0, 5).join(', ')}`).toHaveLength(0)
  })

  it('never emits an unexpected tag across the whole corpus', () => {
    const allowed = /^(p|br|hr|h[3-6]|strong|em|s|code|pre|blockquote|ul|ol|li|a)$/
    for (const { text } of withText) {
      const html = renderMarkdown(text)
      const tags = [...html.matchAll(/<\/?([a-zA-Z][\w-]*)/g)].map(m => m[1]!.toLowerCase())
      for (const tag of tags) {
        expect(allowed.test(tag), `unexpected <${tag}>`).toBe(true)
      }
    }
  })
})
