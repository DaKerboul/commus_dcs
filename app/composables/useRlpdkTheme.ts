export function useRlpdkTheme() {
  const route = useRoute()
  const isRlpdk = useState('rlpdk-theme', () => false)

  // Check query param or localStorage
  onMounted(() => {
    if (route.query.theme === 'rlpdk') {
      isRlpdk.value = true
      localStorage.setItem('commus_theme_rlpdk', '1')
    } else if (localStorage.getItem('commus_theme_rlpdk') === '1') {
      isRlpdk.value = true
    }
  })

  function disableRlpdk() {
    isRlpdk.value = false
    localStorage.removeItem('commus_theme_rlpdk')
  }

  function enableRlpdk() {
    isRlpdk.value = true
    localStorage.setItem('commus_theme_rlpdk', '1')
  }

  // Generate a fake decree number for fun
  const decreeNumber = computed(() => {
    const now = new Date()
    return `DK-${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${Math.floor(Math.random() * 9999).toString().padStart(4, '0')}`
  })

  const rlpdkTexts = {
    siteName: 'Registre Officiel des Communautés Aériennes — RLPDK',
    siteNameShort: 'ROCA-DK',
    subtitle: 'Approuvé par le Ministère de l\'Aviation Virtuelle du Kerboulistan',
    hero: 'Par décret du Grand Chancelier, toute communauté DCS francophone doit être enregistrée auprès du Bureau Central des Escadrons.',
    approval: 'Ce registre est certifié conforme par la République Libre et Populaire du Kerboulistan.',
    footer: '© République Libre et Populaire du Kerboulistan — Tous droits réservés par décret gouvernemental',
    disclaimer: 'Toute reproduction non autorisée sera poursuivie devant le Tribunal Suprême de l\'Aéronautique Virtuelle.',
    badge: 'Homologué RLPDK',
    greeting: 'Bienvenue, Citoyen.',
    searchPlaceholder: 'Rechercher dans les registres officiels...',
    exportLabel: 'Télécharger le Registre Officiel',
    voteLabel: 'Décerner une Mention d\'Honneur',
    statsTitle: 'Rapport Statistique du Bureau Central',
  }

  return {
    isRlpdk,
    decreeNumber,
    rlpdkTexts,
    enableRlpdk,
    disableRlpdk,
  }
}
