# Communautés DCS World Francophones

Ce projet est un site web répertoriant les communautés francophones de DCS World (Digital Combat Simulator), permettant aux pilotes virtuels de découvrir et rejoindre des escadrons, escadrilles et groupes de vol.

## 🌐 À propos du projet

Ce site est construit avec [VitePress](https://vitepress.dev/), déployé via Docker, et maintenu par la communauté. Il permet aux joueurs de DCS World de trouver facilement des communautés francophones avec lesquelles voler, partager des connaissances et participer à des événements.

Chaque communauté dispose d'une page dédiée présentant :
- Sa description et son identité
- Les appareils sur lesquels elle se spécialise
- Les liens vers ses plateformes de communication (Discord, site web, etc.)
- D'autres informations utiles (recrutement, événements, etc.)

## 🚀 Comment ajouter ou modifier une communauté

### Prérequis

- Un compte [GitHub](https://github.com/)
- Connaissances de base en Markdown (ou simplement suivre le modèle existant)
- Des informations précises sur la communauté à ajouter

### Option 1 : Pour les débutants GitHub (méthode recommandée)

1. **Naviguez** vers le dossier `docs/commus/` dans le repository GitHub
2. **Créez un nouveau fichier** en cliquant sur "Add file" > "Create new file"
3. **Nommez votre fichier** selon le nom court de votre communauté (ex: `nomcourt.md`)
4. **Copiez le contenu** du fichier `_template.md` et adaptez-le avec les informations de votre communauté
5. **Proposez vos modifications** en créant une "Pull Request"

### Option 2 : Pour ceux familiers avec Git

1. **Forkez** ce repository
2. **Clonez** votre fork localement
   ```bash
   git clone https://github.com/votre-username/commus_dcs.git
   cd commus_dcs
   ```
3. **Créez une branche** pour vos modifications
   ```bash
   git checkout -b ajout-communaute-xyz
   ```
4. **Copiez le fichier template** et modifiez-le pour votre communauté
   ```bash
   cp docs/commus/_template.md docs/commus/votre-communaute.md
   ```
5. **Ajoutez votre image de communauté** dans `docs/public/commus_img/` (format recommandé : PNG/JPEG, taille optimisée pour le web)
6. **Testez localement** vos modifications (facultatif)
   ```bash
   npm install
   npm run docs:dev
   ```
7. **Commitez** vos modifications
   ```bash
   git add .
   git commit -m "Ajout de la communauté XYZ"
   git push origin ajout-communaute-xyz
   ```
8. **Créez une Pull Request** depuis votre fork vers le repository principal

## 📝 Structure du fichier Markdown pour une communauté

```markdown
---
layout: doc
title: Nom de votre Communauté
---

# [NOM DE L'ESCADRON]

![Logo de votre communauté](/commus_img/votre-logo.png)

## Description

Décrivez ici votre communauté, son histoire, ses valeurs et sa philosophie de vol.

## Informations

- **Discord**: [Lien vers votre Discord](https://discord.gg/votre-invitation)
- **Site web**: [Nom de votre site](https://votre-site.com)
- **Type de vols**: Serious, Fun, Training, etc.
- **Appareils**: F/A-18C, F-16C, AH-64D, etc.
- **Mods obligatoires**: SRS, Tacview, etc.

## Recrutement

Précisez vos conditions de recrutement, vos attentes et la procédure pour rejoindre votre communauté.

## Screenshots

![Screenshot 1](/commus_img/votre-communaute/screenshot1.png)
```

## 🛠️ Installation locale pour le développement

Pour travailler localement sur ce projet :

```bash
# Cloner le repository
git clone https://github.com/username/commus_dcs.git
cd commus_dcs

# Installer les dépendances
npm install

# Lancer le serveur de développement
npm run docs:dev

# Construire le site pour production
npm run docs:build

# Prévisualiser la build de production
npm run docs:preview
```

## 🐳 Déploiement avec Docker

Le projet est configuré pour être déployé facilement avec Docker :

```bash
# Construire et démarrer les conteneurs
docker compose up -d

# Arrêter les conteneurs
docker compose down

# Reconstruire et redémarrer (après des modifications)
docker compose up -d --build
```

## 📞 Contact

Si vous avez des questions ou des suggestions d'amélioration, n'hésitez pas à ouvrir une issue sur GitHub ou à contacter les mainteneurs du projet.

---

*Ce projet est maintenu par la communauté des pilotes virtuels francophones de DCS World. Merci à tous les contributeurs !*
