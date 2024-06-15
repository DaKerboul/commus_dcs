import { defineConfig } from 'vitepress'

export default defineConfig({
  title: "Commus DCS FR",
  description: "La liste des Communautés DCS World Francophones",
  themeConfig: {
    nav: [
      { text: 'Accueil', link: '/' },
      { text: 'Communautés', link: '/new' }
    ],

    sidebar: [
      {
        text: 'Présentation',
        items: [
          { text: 'Nouveau Format ?', link: '/new' }
        ]
      },
      {
        text: 'Serveurs Officiels',
        items: [
          { text: 'Liens Officiels', link: '/official' }
        ]
      },
      {
        text: 'Communautés',
        items: [
          { text: '1er ROC', link: '/commus/1roc' },
          { text: '2nd French Fighter Squadron', link: '/commus/2ffs' },
          { text: '3rd Wing', link: '/commus/3rdwing' },
          { text: '06th Multirole Helicopter Regiment', link: '/commus/06mhr' },
          { text: 'BOLT', link: '/commus/bolt' },
          { text: 'Bullseye Francophone', link: '/commus/bfr' },
          { text: 'CheckSix', link: '/commus/c6' },
          { text: 'Cellules Rapaces', link: '/commus/cellulesrapaces' },
          { text: 'Cirrus', link: '/commus/cirrus' },
          { text: 'Couteau Alpha', link: '/commus/couteau' },
          { text: 'EA-11', link: '/commus/ea11' },
          { text: 'ECT RFV', link: '/commus/ectrfv' },
          { text: 'ERAF', link: '/commus/eraf' },
          { text: 'ESCA', link: '/commus/esca' },
          { text: 'FR3D Studio', link: '/commus/fr3d' },
          { text: 'Gameplan', link: '/commus/gameplan' },
          { text: 'Groupement de Chasse 22', link: '/commus/gc22' },
          { text: 'Joint Task Force Francophone', link: '/commus/jtff'},
          { text: 'Kerboul', link: '/commus/kerboul' },
          { text: 'Liaison 16', link: '/commus/l16' },
          { text: 'Leading Edge', link: '/commus/lde' },
          { text: 'No Escape Zone', link: '/commus/noez' },
          { text: 'RelaX', link: '/commus/relax' },
          { text: 'Sky Haven', link: '/commus/skyhaven' },
          { text: 'Split-Air', link: '/commus/splitair' },
          { text: 'DCS Screenshots World', link: '/commus/screens'},
          { text: 'Swiss Alpine Fighters', link: '/commus/saf' },
          { text: 'Virtual Aerobatics Prestige', link: '/commus/vap' },
          { text: 'Virtual Belgian Air Force', link: '/commus/vbaf' },
          { text: 'Virtual European Air Force', link: '/commus/veaf' },
          { text: 'Virtual Expeditionary Air Wing' , link: '/commus/veaw' },
          { text: 'Wolfa', link: '/commus/wolfa' },
        ]
      },
      {
        text: 'Contact',
        items: [
          { text: 'Contact', link: '/contact' }
        ]
      }
    ],

    socialLinks: [
      { icon: 'github', link: 'https://github.com/DaKerboul/commus_dcs' }
    ],

    search: {
      provider: 'local',
    },

    logo: '/logo.png',

    footer: {
      message: 'Released under the <a href="https://fr.wikipedia.org/wiki/Licence_MIT">MIT License</a>.',
      copyright: 'Copyright © 2024 <a href="https://kerboul.me/site_gov/">Gouvernement du Kerboulistan</a>'
    },

    appearance: 'dark',

    editLink: {
      pattern: 'https://github.com/DaKerboul/commus_dcs/edit/main/docs/:path',
      text: 'Modifier cette page sur GitHub'
    },
  }
})
