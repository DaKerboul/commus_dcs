import { describe, expect, it } from 'vitest'
import { normalizeFoundedDate } from '../../server/utils/validation'

describe('normalizeFoundedDate', () => {
  it('conserve la précision saisie', () => {
    expect(normalizeFoundedDate('2003')).toBe('2003')
    expect(normalizeFoundedDate('2013-11')).toBe('2013-11')
    expect(normalizeFoundedDate('2004-03-25')).toBe('2004-03-25')
  })

  it('accepte les valeurs déjà en base', () => {
    // Ces trois-là viennent du seed ; la route ne doit pas les invalider
    // lors d'un ré-enregistrement.
    for (const value of ['2003-01-01', '2020-07-01', '2021-01-01']) {
      expect(normalizeFoundedDate(value)).toBe(value)
    }
  })

  it('rejette les dates impossibles', () => {
    expect(normalizeFoundedDate('2023-02-31')).toBeNull()
    expect(normalizeFoundedDate('2023-13-01')).toBeNull()
    expect(normalizeFoundedDate('2023-00-10')).toBeNull()
  })

  it('rejette les fautes de frappe hors bornes', () => {
    expect(normalizeFoundedDate('1003')).toBeNull()
    expect(normalizeFoundedDate('20203')).toBeNull()
    expect(normalizeFoundedDate(String(new Date().getFullYear() + 1))).toBeNull()
  })

  it('accepte l’année en cours', () => {
    const year = String(new Date().getFullYear())
    expect(normalizeFoundedDate(year)).toBe(year)
  })

  it('rejette le texte libre plutôt que de le stocker', () => {
    // La colonne alimente `new Date()` sur /timeline : « depuis 2003 »
    // produirait un « Invalid Date » sur une page publique.
    expect(normalizeFoundedDate('depuis 2003')).toBeNull()
    expect(normalizeFoundedDate('03/2004')).toBeNull()
    expect(normalizeFoundedDate('2004-3-5')).toBeNull()
  })

  it('traite le vide et le non-texte comme absents', () => {
    expect(normalizeFoundedDate('')).toBeNull()
    expect(normalizeFoundedDate('   ')).toBeNull()
    expect(normalizeFoundedDate(null)).toBeNull()
    expect(normalizeFoundedDate(2003)).toBeNull()
  })
})
