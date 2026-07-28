import { describe, expect, it } from 'vitest'
import { markdownToPlainText, renderMarkdown } from '../../server/utils/markdown'

describe('renderMarkdown — formatting', () => {
  it('renders basic emphasis and lists', () => {
    const html = renderMarkdown('**gras** et *italique*\n\n- un\n- deux')
    expect(html).toContain('<strong>gras</strong>')
    expect(html).toContain('<em>italique</em>')
    expect(html).toContain('<li>un</li>')
  })

  it('demotes headings so user content cannot hijack the outline', () => {
    const html = renderMarkdown('# Titre\n\n## Sous-titre')
    expect(html).toContain('<h3>Titre</h3>')
    expect(html).toContain('<h4>Sous-titre</h4>')
    expect(html).not.toContain('<h1>')
    expect(html).not.toContain('<h2>')
  })

  it('keeps blockquotes and code', () => {
    const html = renderMarkdown('> citation\n\n`du code`')
    expect(html).toContain('<blockquote>')
    expect(html).toContain('<code>du code</code>')
  })

  it('returns an empty string for blank input', () => {
    expect(renderMarkdown('')).toBe('')
    expect(renderMarkdown('   ')).toBe('')
    expect(renderMarkdown(null)).toBe('')
    expect(renderMarkdown(undefined)).toBe('')
    expect(renderMarkdown(42)).toBe('')
  })
})

describe('renderMarkdown — XSS hardening', () => {
  // Only these tags may ever appear as real markup in the output. Anything a
  // payload tries to inject must end up escaped (&lt;…) instead, which is inert.
  const ALLOWED_TAGS = /^(p|br|hr|h[3-6]|strong|em|s|code|pre|blockquote|ul|ol|li|a)$/

  /** Every real tag in `html` is on the allowlist. */
  function tagsAreAllowed(html: string) {
    const tags = [...html.matchAll(/<\/?([a-zA-Z][\w-]*)/g)].map(m => m[1]!.toLowerCase())
    return tags.every(t => ALLOWED_TAGS.test(t))
  }

  /** No attribute inside a real tag is an event handler. */
  function hasNoEventHandler(html: string) {
    const insideTags = [...html.matchAll(/<[^>]+>/g)].map(m => m[0])
    return insideTags.every(tag => !/\son[a-z]+\s*=/i.test(tag))
  }

  /**
   * No href inside a *real* tag points at a dangerous scheme.
   * Escaped payloads (&lt;a href="javascript:…") are inert text, so scanning the
   * whole string would flag them as vulnerabilities when they are not.
   */
  function hrefsAreSafe(html: string) {
    const hrefs = [...html.matchAll(/<[^>]+>/g)]
      .flatMap(tag => [...tag[0].matchAll(/href\s*=\s*"([^"]*)"/gi)])
      .map(m => m[1]!.trim().toLowerCase())
    return hrefs.every(h => !h.startsWith('javascript:') && !h.startsWith('data:') && !h.startsWith('vbscript:'))
  }

  const PAYLOADS = [
    '<script>alert(1)</script>',
    '<img src=x onerror="alert(1)">',
    '<iframe src="https://evil.test"></iframe>',
    '<style>body{display:none}</style>',
    '<p onclick="alert(1)">texte</p>',
    '<svg/onload=alert(1)>',
    '[clic](javascript:alert(1))',
    '[x](JaVaScRiPt:alert(1))',
    '[x](data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg==)',
    '[x](vbscript:msgbox(1))',
    '<a href="javascript:alert(1)">clic</a>',
    '<body onload=alert(1)>',
    '<object data="evil.swf"></object>',
  ]

  it.each(PAYLOADS)('neutralises payload: %s', (payload) => {
    const html = renderMarkdown(payload)
    expect(tagsAreAllowed(html), `unexpected tag in: ${html}`).toBe(true)
    expect(hasNoEventHandler(html), `event handler in: ${html}`).toBe(true)
    expect(hrefsAreSafe(html), `dangerous href in: ${html}`).toBe(true)
  })

  it('escapes raw HTML rather than emitting it', () => {
    const html = renderMarkdown('<img src=x onerror="alert(1)">')
    // The payload survives as visible text, which is harmless…
    expect(html).toContain('&lt;img')
    // …but never as an actual element.
    expect(html).not.toMatch(/<img/i)
  })

  it('leaves a javascript: markdown link as inert text, with no anchor', () => {
    const html = renderMarkdown('[clic](javascript:alert(1))')
    expect(html).not.toContain('<a')
    expect(html).not.toContain('href')
  })

  it('does not render images, even from valid markdown', () => {
    const html = renderMarkdown('![alt](https://example.test/a.png)')
    expect(html).not.toMatch(/<img/i)
  })

  it('hardens outbound links', () => {
    const html = renderMarkdown('[site](https://example.test)')
    expect(html).toContain('href="https://example.test"')
    expect(html).toContain('rel="nofollow ugc noopener noreferrer"')
    expect(html).toContain('target="_blank"')
  })

  it('hardens autolinked bare URLs too', () => {
    const html = renderMarkdown('Rejoignez https://discord.gg/abcdef')
    expect(html).toContain('rel="nofollow ugc noopener noreferrer"')
  })
})

describe('markdownToPlainText', () => {
  it('strips all markup', () => {
    expect(markdownToPlainText('**Bonjour** *le* monde')).toBe('Bonjour le monde')
  })

  it('collapses whitespace across blocks', () => {
    expect(markdownToPlainText('Une ligne\n\nUne autre')).toBe('Une ligne Une autre')
  })

  it('truncates with an ellipsis', () => {
    const out = markdownToPlainText('a'.repeat(500), 50)
    expect(out).toHaveLength(50)
    expect(out.endsWith('…')).toBe(true)
  })

  it('cannot re-form markup, whatever it is interpolated into', () => {
    const text = markdownToPlainText('<script>alert(1)</script>')
    expect(text).not.toContain('<')
    expect(text).not.toContain('>')
  })

  it('decodes entities so the text reads naturally', () => {
    expect(markdownToPlainText('Nous & vous')).toBe('Nous & vous')
    expect(markdownToPlainText('« citation »')).toBe('« citation »')
  })
})
