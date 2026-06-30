# Communautés DCS World Francophones

Annuaire web des communautés francophones de DCS World. Nuxt 3 full-stack avec PostgreSQL, filtres avancés, panel admin et formulaire de soumission.

## Stack technique

- **Frontend** : Nuxt 3 (Vue 3) + Nuxt UI v3 (Tailwind CSS v4)
- **Backend** : Nitro (API routes intégrées à Nuxt)
- **Base de données** : PostgreSQL 16 + Drizzle ORM
- **Auth** : nuxt-auth-utils (session cookie, mot de passe admin unique)
- **Déploiement** : Docker (Coolify)

## Développement local

### Prérequis

- Node.js 20+
- PostgreSQL 16 (ou Docker)

### Installation

```bash
npm install
```

### Base de données

Option A — Docker Compose (si Docker disponible) :

```bash
docker compose up -d          # Lance PostgreSQL sur le port 5432
```

Option B — PostgreSQL existant :

```bash
# Créer la DB manuellement
createdb commus_dcs
```

Dans les deux cas :

```bash
cp .env.example .env          # Adapter DATABASE_URL si besoin
npm run db:push               # Applique le schéma (sans migrations)
npm run db:seed               # Importe les 54 communautés depuis .archive/
```

### Lancer le serveur

```bash
npm run dev
```

Le site est accessible sur <http://localhost:3000> et l'admin sur <http://localhost:3000/admin/login>.

### Commandes DB utiles

| Commande | Description |
| --- | --- |
| `npm run db:push` | Applique le schéma sans fichier de migration |
| `npm run db:generate` | Génère un fichier de migration |
| `npm run db:migrate` | Exécute les migrations |
| `npm run db:seed` | Importe les données depuis les MD archivés |
| `npm run db:studio` | Lance Drizzle Studio (GUI DB) |

## Pages

| Route | Description |
| --- | --- |
| `/` | Page d'accueil avec stats et communautés featured |
| `/communautes` | Annuaire avec filtres, recherche et pagination |
| `/communautes/:slug` | Fiche détaillée d'une communauté |
| `/trouver` | Assistant de recherche en 5 étapes |
| `/stats` | Statistiques et distributions |
| `/soumettre` | Formulaire public pour proposer une communauté |
| `/contact` | Liens de contact |
| `/admin/login` | Connexion admin |
| `/admin` | Dashboard admin |
| `/admin/communautes` | CRUD des communautés |
| `/admin/submissions` | Modération des soumissions |

## API

| Endpoint | Méthode | Description |
| --- | --- | --- |
| `/api/communities` | GET | Liste filtrée + paginée |
| `/api/communities/:slug` | GET | Détail d'une communauté |
| `/api/modules` | GET | Liste des modules DCS |
| `/api/experiences` | GET | Liste des types d'expérience |
| `/api/stats` | GET | Statistiques agrégées |
| `/api/submissions` | POST | Soumettre une communauté |
| `/api/admin/*` | * | Endpoints admin (auth requise) |

## Déploiement Coolify

### 1. Créer un service PostgreSQL

Dans Coolify (<https://coolify.kerboul.me>) :

1. **New Resource** → **Database** → **PostgreSQL**
2. Configurer :
   - Database name : `commus_dcs`
   - Username : `commus`
   - Password : (générer un mot de passe fort)
3. Noter l'URL interne (ex: `postgresql://commus:PASSWORD@postgresql-xxx:5432/commus_dcs`)

### 2. Créer l'application Nuxt

1. **New Resource** → **Application** → **Dockerfile**
2. Source : connecter le repo Git `DaKerboul/commus_dcs`
3. Build Pack : **Dockerfile** (le `Dockerfile` à la racine sera utilisé)
4. Port : `3000`
5. Variables d'environnement (toutes obligatoires en production) :

   ```text
   DATABASE_URL=postgresql://commus:PASSWORD@db:5432/commus_dcs
   NUXT_DATABASE_URL=postgresql://commus:PASSWORD@db:5432/commus_dcs
   DB_PASSWORD=<mot de passe fort>
   NUXT_SESSION_SECRET=<openssl rand -hex 32>
   NUXT_SESSION_PASSWORD=<openssl rand -hex 32>
   NUXT_ADMIN_PASSWORD=<mot de passe admin ≥ 12 chars>
   NUXT_PUBLIC_SITE_URL=https://commus.kerboul.me
   NUXT_TWITCH_CLIENT_ID=<optionnel — désactive les features streamers si absent>
   NUXT_TWITCH_CLIENT_SECRET=<optionnel>
   ```

6. Health Check : `GET /api/health` sur le port 3000

### 3. Migration initiale

Le schéma est géré par des **migrations versionnées Drizzle** appliquées automatiquement au démarrage du conteneur (`server/plugins/db-migrate.ts`). Aucune action manuelle n'est requise lors d'un déploiement.

> ⚠️ **Ne jamais exécuter `db:push` contre la production.** Cette commande peut émettre des `DROP` implicites et contourner le journal de migrations. Voir [`docs/migrations.md`](docs/migrations.md).

## Variables d'environnement

| Variable | Description | Défaut |
| --- | --- | --- |
| `DATABASE_URL` | URL de connexion PostgreSQL | `postgresql://commus:commus@localhost:5432/commus_dcs` |
| `NUXT_DATABASE_URL` | Alias Nuxt de DATABASE_URL | identique à DATABASE_URL |
| `DB_PASSWORD` | Mot de passe PostgreSQL (utilisé par le compose) | ⚠️ `commus` (insécurisé) |
| `NUXT_SESSION_SECRET` | Secret HMAC pour les cookies de vote | **obligatoire en prod** |
| `NUXT_SESSION_PASSWORD` | Clé de chiffrement des sessions admin (nuxt-auth-utils) | **obligatoire en prod** |
| `NUXT_ADMIN_PASSWORD` | Mot de passe du panel admin (≥ 12 chars) | **obligatoire en prod** |
| `NUXT_PUBLIC_SITE_URL` | URL publique du site | `http://localhost:3000` |
| `NUXT_TWITCH_CLIENT_ID` | Client ID Twitch (features streamers) | optionnel |
| `NUXT_TWITCH_CLIENT_SECRET` | Secret Twitch | optionnel |
| `NUXT_RUN_MIGRATIONS` | Passer `false` pour désactiver le runner de migration | `true` |
