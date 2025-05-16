# Déploiement automatique du site commus.kerboul.me avec Docker et GitHub Actions

## 1. Prérequis
- Un serveur avec Docker et Docker Compose installés
- Un reverse proxy (ex: Nginx, Traefik) configuré pour pointer `https://commus.kerboul.me` vers le port 80 du conteneur frontend
- Un accès SSH ou root au serveur

## 2. Déploiement initial

1. Clone le dépôt sur ton serveur :
   ```bash
   git clone https://github.com/<ton_user>/<ton_repo>.git
   cd <ton_repo>
   ```
2. Définis la variable d'environnement pour le secret du webhook :
   ```bash
   export COMMUS_SECRET="ton_secret_fort"
   ```
3. Lance les services :
   ```bash
   docker compose up -d --build
   ```
4. Vérifie que le site est accessible sur https://commus.kerboul.me

## 3. Configuration du webhook GitHub

1. Va dans les paramètres de ton repo GitHub > Webhooks > Add webhook
2. URL : `https://commus.kerboul.me/ton_secret` (où `ton_secret` correspond à la valeur de COMMUS_SECRET)
3. Content type : `application/json`
4. Pas besoin de secret (le secret est dans l'URL)
5. Events : `Just the push event` (ou tout ce que tu veux)
6. Active le webhook

## 4. Fonctionnement

Le système fonctionne de la façon suivante :
1. Le frontend est un serveur Nginx statique qui sert les fichiers HTML/CSS/JS précompilés
2. Le webhook écoute les notifications de GitHub
3. Quand un nouveau commit est poussé, le webhook :
   - Pull le repo git
   - Reconstruit le conteneur frontend (qui refait le build des docs)
   - Redémarre le conteneur frontend avec le nouveau contenu

Ce flux de travail garantit que le site est toujours à jour sans nécessiter d'intervention manuelle.

## 5. GitHub Actions (optionnel)

Si tu veux déclencher le webhook via GitHub Actions (au lieu du webhook natif) :

Ajoute ce job dans `.github/workflows/deploy.yml` :

```yaml
name: Deploy VitePress
on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Appel du webhook de déploiement
        run: |
          curl -X POST https://commus.kerboul.me/${{ secrets.COMMUS_SECRET }}
```

> Ajoute la valeur du secret dans les secrets GitHub sous le nom COMMUS_SECRET.

## 6. Mise à jour manuelle

Pour forcer une mise à jour :
```bash
# Remplacer ton_secret par la valeur définie dans COMMUS_SECRET
curl -X GET https://commus.kerboul.me/ton_secret
```

---

**Note importante** : Le webhook a besoin d'accès au socket Docker pour reconstruire le conteneur frontend. Cette approche simplifiée évite d'avoir à gérer manuellement le processus de build et de déploiement.
