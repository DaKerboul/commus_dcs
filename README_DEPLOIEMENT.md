# Déploiement automatique du site commus.kerboul.me avec Docker et GitHub Actions

## 1. Prérequis
- Un serveur avec Docker et Docker Compose installés
- Un reverse proxy (ex: Nginx, Traefik) configuré pour pointer `https://commus.kerboul.me` vers le port 4173 du conteneur frontend
- Un accès SSH ou root au serveur

## 2. Déploiement initial

1. Clone le dépôt sur ton serveur :
   ```bash
   git clone https://github.com/<ton_user>/<ton_repo>.git
   cd <ton_repo>/docker
   ```
2. Configure le secret du webhook dans `docker-compose.yml` (remplace `change_me` par une valeur forte et la même dans GitHub).
3. Lance les services :
   ```bash
   docker compose up -d --build
   ```
4. Vérifie que le site est accessible sur https://commus.kerboul.me

## 3. Configuration du webhook GitHub

1. Va dans les paramètres de ton repo GitHub > Webhooks > Add webhook
2. URL : `https://commus.kerboul.me/webhook` (ou l'URL publique de ton serveur + `/webhook`)
3. Content type : `application/json`
4. Secret : la même valeur que dans `docker-compose.yml` (GITHUB_SECRET)
5. Events : `Just the push event` (ou tout ce que tu veux)
6. Active le webhook

## 4. GitHub Actions (optionnel)

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
          curl -X POST \
            -H "X-Hub-Signature-256: sha256=$(echo -n '${{ github.event.head_commit.id }}' | openssl dgst -sha256 -hmac '${{ secrets.GITHUB_SECRET }}' | sed 's/^.* //')" \
            https://commus.kerboul.me/webhook
```

> Remplace `${{ secrets.GITHUB_SECRET }}` par le secret utilisé côté serveur et ajoute-le dans les secrets GitHub.

## 5. Mise à jour manuelle

Pour forcer une mise à jour :
```bash
curl -X POST -H "X-Hub-Signature-256: sha256=<signature>" https://commus.kerboul.me/webhook
```

---

**Résumé** :
- Le webhook déclenche un `git pull`, rebuild le site et redémarre le frontend automatiquement.
- Le reverse proxy doit pointer vers le port 4173 du conteneur frontend.
- Le domaine https://commus.kerboul.me affichera toujours la dernière version du site après chaque push.
