import { describe, expect, it } from 'vitest'
import { escapeMarkdown, formatNotification } from '../../server/utils/notify'

const SITE = 'https://commus.kerboul.me'

describe('escapeMarkdown', () => {
  it('échappe les caractères de mise en forme Telegram', () => {
    // Un escadron nommé Wolf_Pack casserait le message, voire le ferait
    // rejeter par Telegram — donc la notification serait perdue.
    expect(escapeMarkdown('Wolf_Pack')).toBe('Wolf\\_Pack')
    expect(escapeMarkdown('*Elite*')).toBe('\\*Elite\\*')
    expect(escapeMarkdown('[FR] Escadron')).toBe('\\[FR\\] Escadron')
    expect(escapeMarkdown('`code`')).toBe('\\`code\\`')
  })

  it('laisse le texte ordinaire intact, accents compris', () => {
    expect(escapeMarkdown('Escadre CHIMÈRE 025')).toBe('Escadre CHIMÈRE 025')
    expect(escapeMarkdown('102TH PHOENIX')).toBe('102TH PHOENIX')
  })

  it('gère les entrées non textuelles sans lever', () => {
    expect(escapeMarkdown(null)).toBe('')
    expect(escapeMarkdown(undefined)).toBe('')
    expect(escapeMarkdown(42)).toBe('')
  })
})

describe('formatNotification', () => {
  it('produit le format complet attendu', () => {
    const message = formatNotification({
      title: 'Nouvelle soumission',
      subject: '102TH PHOENIX',
      detail: 'par Kerboul',
      path: '/admin/submissions',
    }, SITE)

    expect(message).toBe(
      '🔔 *Commus* — Nouvelle soumission\n'
      + '*102TH PHOENIX* · par Kerboul\n'
      + '→ https://commus.kerboul.me/admin/submissions',
    )
  })

  it('omet les lignes vides plutôt que de laisser des séparateurs orphelins', () => {
    const message = formatNotification({ title: 'Test' }, SITE)
    expect(message).toBe('🔔 *Commus* — Test')
    expect(message).not.toContain('·')
    expect(message).not.toContain('→')
  })

  it('n’ajoute pas de point médian quand un seul champ est fourni', () => {
    expect(formatNotification({ title: 'T', subject: 'Escadron' }, SITE))
      .toBe('🔔 *Commus* — T\n*Escadron*')
    expect(formatNotification({ title: 'T', detail: 'par X' }, SITE))
      .toBe('🔔 *Commus* — T\npar X')
  })

  it('accepte un emoji personnalisé', () => {
    expect(formatNotification({ title: 'T', emoji: '📥' }, SITE)).toContain('📥 *Commus*')
  })

  it('ne double pas la barre oblique du lien', () => {
    const message = formatNotification({ title: 'T', path: '/admin' }, 'https://commus.kerboul.me/')
    expect(message).toContain('→ https://commus.kerboul.me/admin')
    expect(message).not.toContain('.me//admin')
  })

  it('échappe le sujet et le détail, pas la structure', () => {
    const message = formatNotification({
      title: 'Réclamation',
      subject: 'Wolf_Pack',
      detail: 'par Thé_touste',
    }, SITE)

    // Les astérisques de structure restent, ceux du contenu sont neutralisés.
    expect(message).toContain('*Wolf\\_Pack*')
    expect(message).toContain('par Thé\\_touste')
  })
})
