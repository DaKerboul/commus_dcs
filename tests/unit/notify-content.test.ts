import { describe, expect, it } from 'vitest'
import {
  ageLabel,
  claimWarnings,
  excerpt,
  queueLine,
  revisionChangeLines,
  revisionWarnings,
  shortUrl,
  submissionLines,
  submissionWarnings,
} from '../../server/utils/notify-content'
import { formatNotification } from '../../server/utils/notify'

const NOW = new Date('2026-10-28T12:00:00Z').getTime()
const ago = (ms: number) => new Date(NOW - ms)
const HOUR = 3_600_000
const DAY = 24 * HOUR

describe('ageLabel', () => {
  it('donne une durée lisible', () => {
    expect(ageLabel(ago(10 * 60_000), NOW)).toBe('il y a moins d’une heure')
    expect(ageLabel(ago(3 * HOUR), NOW)).toBe('il y a 3 h')
    expect(ageLabel(ago(12 * DAY), NOW)).toBe('il y a 12 j')
    expect(ageLabel(ago(120 * DAY), NOW)).toBe('il y a 4 mois')
  })
})

describe('excerpt', () => {
  it('aplatit les retours à la ligne et coupe sur un mot', () => {
    expect(excerpt('Je suis\n\nle fondateur')).toBe('Je suis le fondateur')
    const cut = excerpt('mot '.repeat(100), 30)
    expect(cut.endsWith('…')).toBe(true)
    expect(cut.length).toBeLessThanOrEqual(31)
    expect(cut).not.toMatch(/mo…$/)
  })

  it('tolère une valeur absente', () => {
    expect(excerpt(null)).toBe('')
  })
})

describe('shortUrl', () => {
  it('garde l’hôte et le chemin', () => {
    expect(shortUrl('https://www.discord.gg/abc/?x=1')).toBe('discord.gg/abc')
    expect(shortUrl('')).toBe('(vide)')
    expect(shortUrl(null)).toBe('(vide)')
    expect(shortUrl('pas une url')).toBe('pas une url')
  })
})

describe('queueLine', () => {
  it('résume les files non vides seulement', () => {
    expect(queueLine({ submissions: 2, claims: 1, revisions: 0 })).toBe('En attente : 2 soumissions · 1 réclamation')
    expect(queueLine({ submissions: 0, claims: 0, revisions: 0 })).toBeNull()
  })
})

describe('claimWarnings', () => {
  const base = { accountCreatedAt: ago(400 * DAY), ownerCount: 0, competingClaims: 0, reopened: false }

  it('ne dit rien pour une demande sans signal particulier', () => {
    expect(claimWarnings(base, NOW)).toEqual([])
  })

  it('signale un compte récent, une fiche déjà gérée, une concurrence et une réouverture', () => {
    const warnings = claimWarnings({ accountCreatedAt: ago(2 * HOUR), ownerCount: 1, competingClaims: 2, reopened: true }, NOW)
    expect(warnings).toEqual([
      'Compte récent (créé il y a 2 h)',
      'La fiche a déjà 1 responsable',
      '2 autres demandes en cours sur cette fiche',
      'Demande déjà refusée une fois',
    ])
  })
})

describe('revisionChangeLines', () => {
  it('montre l’avant et l’après de chaque champ', () => {
    const lines = revisionChangeLines(
      { name: 'Wolf Pack', discordUrl: 'https://discord.gg/new', logoUrl: 'data:image/png;base64,AAA', images: [{}, {}, {}], otherLinks: [] },
      { name: 'Wolf_Pack', discordUrl: 'https://discord.gg/old', logoUrl: null, images: [{}], otherLinks: [{}, {}] },
    )
    expect(lines).toEqual([
      'Nom : Wolf_Pack → Wolf Pack',
      'Discord : discord.gg/old → discord.gg/new',
      'Logo : nouvelle image',
      'Galerie : 1 → 3 image(s)',
      'Autres liens : 2 → 0 lien(s)',
    ])
  })

  it('ne recopie jamais une image base64 dans le message', () => {
    const [line] = revisionChangeLines({ logoUrl: `data:image/png;base64,${'A'.repeat(5000)}` }, { logoUrl: null })
    expect(line!.length).toBeLessThan(40)
  })
})

describe('revisionWarnings', () => {
  it('met en garde sur le lien Discord, le nom et un auteur récent', () => {
    expect(revisionWarnings({ discordUrl: 'x', name: 'y' }, ago(DAY), NOW)).toHaveLength(3)
    expect(revisionWarnings({ websiteUrl: 'x' }, ago(400 * DAY), NOW)).toEqual([])
    expect(revisionWarnings({ websiteUrl: 'x' }, null, NOW)).toEqual([])
  })
})

describe('soumission', () => {
  const facts = { typeLabel: 'Escadron', sizeLabel: '30+ membres', shortDescription: 'Une escadre\nvirtuelle', hasDiscord: true, imageCount: 2, moduleCount: 1 }

  it('résume classification, description et contenu', () => {
    expect(submissionLines(facts)).toEqual([
      'Escadron · 30+ membres',
      '« Une escadre virtuelle »',
      '1 module · 2 images',
    ])
  })

  it('omet ce qui manque', () => {
    expect(submissionLines({ ...facts, typeLabel: null, sizeLabel: null, shortDescription: null })).toEqual(['1 module · 2 images'])
  })

  it('signale un doublon de nom et l’absence de Discord', () => {
    expect(submissionWarnings({ hasDiscord: false }, 'Wolf Pack')).toEqual([
      'Une fiche porte déjà ce nom : « Wolf Pack »',
      'Aucun lien Discord : identité difficile à vérifier',
    ])
    expect(submissionWarnings({ hasDiscord: true }, null)).toEqual([])
  })
})

describe('formatNotification (contexte)', () => {
  it('assemble lignes, alertes, file et lien dans cet ordre', () => {
    const message = formatNotification({
      emoji: '🙋',
      title: 'Réclamation de fiche',
      subject: 'Wolf_Pack',
      detail: 'par Maverick',
      lines: ['« Je suis le fondateur »'],
      warnings: ['Compte récent (créé il y a 2 h)'],
      path: '/admin/moderation?tab=claims&open=4',
    }, 'https://commus.kerboul.me', 'En attente : 1 réclamation')

    expect(message).toBe(
      '🙋 *Commus* — Réclamation de fiche\n'
      + '*Wolf\\_Pack* · par Maverick\n'
      + '« Je suis le fondateur »\n'
      + '⚠️ Compte récent (créé il y a 2 h)\n'
      + '_En attente : 1 réclamation_\n'
      + '→ https://commus.kerboul.me/admin/moderation?tab=claims&open=4',
    )
  })

  it('échappe le contenu libre des lignes (un message peut contenir * ou _)', () => {
    const message = formatNotification({ title: 'T', lines: ['*urgent* mon_pseudo'] }, 'https://x.fr')
    expect(message).toContain('\\*urgent\\* mon\\_pseudo')
  })
})
