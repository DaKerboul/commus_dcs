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
          { text: '06th Multirole Helicopter Regiment', link: '/commus/06mhr' },
          { text: '102th Phenix', link: '/commus/102thPhenix.md' },
          { text: '131st Death Viper', link: '/commus/131stDeathViper.md' },
          { text: '1er ROC', link: '/commus/1roc' },
          { text: '2nd French Fighter Squadron', link: '/commus/2ffs' },
          { text: '3rd Wing', link: '/commus/3rdwing' },
          { text: '51th Massilia', link: '/commus/51thMassilia.md' },
          { text: '64 vFAS', link: '/commus/64vFAS.md' },
          { text: '71st WASP', link: '/commus/71stWASP.md' },
          { text: 'AAE Esport Gaming', link: '/commus/AAEEsportGaming.md' },
          { text: 'AAE Esport/Gaming', link: '/commus/aaeeg'},
          { text: 'Ashayar', link: '/commus/Ashayar.md' },
          { text: 'ATAC', link: '/commus/ATAC.md' },
          { text: 'Boarder Airline', link: '/commus/BoarderAirline.md' },
          { text: 'BOLT', link: '/commus/bolt' },
          { text: 'Bullseye Francophone', link: '/commus/bfr' },
          { text: 'Canard Volant', link: '/commus/CanardVolant.md' },
          { text: 'Cellules Rapaces', link: '/commus/cellulesrapaces' },
          { text: 'CheckSix', link: '/commus/c6' },
          { text: 'Cirrus', link: '/commus/cirrus' },
          { text: 'Couteau Alpha', link: '/commus/couteau' },
          { text: 'DCS Screenshots World', link: '/commus/screens'},
          { text: 'Digital Joint Squadron', link: '/commus/DigitalJointSquadron.md' },
          { text: 'Dilixo Country', link: '/commus/DilixoCountry.md' },
          { text: 'Duck's Squadron (VFA-12)', link: '/commus/DucksSquadron(VFA-12).md' },
          { text: 'EA-11', link: '/commus/ea11' },
          { text: 'EC 2/18 Frelon', link: '/commus/EC2-18Frelon.md' },
          { text: 'ECT RFV', link: '/commus/ectrfv' },
          { text: 'ERAF', link: '/commus/eraf' },
          { text: 'ESCA', link: '/commus/esca' },
          { text: 'Escadron Guerre Froide Francophone', link: '/commus/egff' },
          { text: 'Escouade Torch', link: '/commus/EscouadeTorch.md' },
          { text: 'Flying Buddies', link: '/commus/FlyingBuddies.md' },
          { text: 'FOX 3', link: '/commus/FOX3.md' },
          { text: 'FR3D Studio', link: '/commus/fr3d' },
          { text: 'Gameplan', link: '/commus/gameplan' },
          { text: 'Groupement de Chasse 22', link: '/commus/gc22' },
          { text: 'Iridium', link: '/commus/Iridium.md' },
          { text: 'IRREductibles', link: '/commus/IRREductibles.md' },
          { text: 'Joint Task Force Francophone', link:'/commus/jtff'},
          { text: 'Kerboulistan', link: '/commus/kerboul' },
          { text: 'Killer Aggressor Squadron', link: '/commus/kas' },
          { text: 'Leading Edge', link: '/commus/lde' },
          { text: 'Liaison 16', link: '/commus/l16' },
          { text: 'No Escape Zone', link: '/commus/noez' },
          { text: 'Raybirds', link: '/commus/Raybirds.md' },
          { text: 'RelaX', link: '/commus/relax' },
          { text: 'Sky Haven', link: '/commus/skyhaven' },
          { text: 'Split-Air', link: '/commus/splitair' },
          { text: 'Swiss Alpine Fighters', link: '/commus/saf' },
          { text: 'TheSkyline35', link: '/commus/TheSkyline35.md' },
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
