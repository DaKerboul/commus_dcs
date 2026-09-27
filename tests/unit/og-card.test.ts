import { describe, it, expect } from 'vitest'
import { cardChips, escapeXml, wrapText } from '../../server/utils/og-card'

describe('og card text layout', () => {
  it('keeps short text on one line', () => {
    expect(wrapText('FOX3', 64, 780, 2, true)).toEqual(['FOX3'])
  })

  it('wraps a long name onto two lines without losing words', () => {
    const lines = wrapText('Communauté COUTEAU ALPHA', 64, 780, 2, true)
    expect(lines).toEqual(['Communauté', 'COUTEAU ALPHA'])
  })

  it('ends with an ellipsis when text does not fit', () => {
    const lines = wrapText('mot '.repeat(80), 26, 780, 2)
    expect(lines).toHaveLength(2)
    expect(lines[1]!.endsWith('…')).toBe(true)
  })

  it('cuts a single word longer than the line', () => {
    const [line] = wrapText('x'.repeat(200), 26, 780, 1)
    expect(line!.length).toBeLessThanOrEqual(Math.floor(780 / (26 * 0.6)))
  })

  it('escapes names for the SVG', () => {
    expect(escapeXml('Escadre "CHIMERE" <025> & co')).toBe('Escadre &quot;CHIMERE&quot; &lt;025&gt; &amp; co')
  })
})

describe('og card pills', () => {
  const base = { name: 'x', shortDescription: null, accentHex: null, recruitmentStatus: 'unknown', communityType: 'other', sizeCategory: 'unknown', votes: 0, moduleCount: 0 }

  it('shows nothing it does not know', () => {
    expect(cardChips(base)).toEqual([])
  })

  it('leads with recruitment, then type, size, modules and votes', () => {
    const chips = cardChips({ ...base, recruitmentStatus: 'open', communityType: 'semi_open_squadron', sizeCategory: 'small', moduleCount: 1, votes: 22 })
    expect(chips.map(c => c.text)).toEqual(['Recrute', 'Escadron semi-ouvert', 'Petit groupe', '1 module', '♥ 22'])
    expect(chips[0]!.tone).toBe('success')
  })
})
