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

Le site est accessible sur http://localhost:3000 et l'admin sur http://localhost:3000/admin/login.

### Commandes DB utiles

| Commande | Description |
|---|---|
| `npm run db:push` | Applique le schéma sans fichier de migration |
| `npm run db:generate` | Génère un fichier de migration |
| `npm run db:migrate` | Exécute les migrations |
| `npm run db:seed` | Importe les données depuis les MD archivés |
| `npm run db:studio` | Lance Drizzle Studio (GUI DB) |

## Pages

| Route | Description |
|---|---|
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
|---|---|---|
| `/api/communities` | GET | Liste filtrée + paginée |
| `/api/communities/:slug` | GET | Détail d'une communauté |
| `/api/modules` | GET | Liste des modules DCS |
| `/api/experiences` | GET | Liste des types d'expérience |
| `/api/stats` | GET | Statistiques agrégées |
| `/api/submissions` | POST | Soumettre une communauté |
| `/api/admin/*` | * | Endpoints admin (auth requise) |

## Déploiement Coolify

### 1. Créer un service PostgreSQL

Dans Coolify (https://coolify.kerboul.me) :
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
5. Variables d'environnement :
   ```
   DATABASE_URL=postgresql://commus:PASSWORD@postgresql-xxx:5432/commus_dcs
   NUXT_SESSION_SECRET=<générer avec openssl rand -hex 32>
   NUXT_ADMIN_PASSWORD=<mot de passe admin>
   NUXT_PUBLIC_SITE_URL=https://commus-dcs.kerboul.me
   ```
6. Health Check : `GET /` sur le port 3000

### 3. Première migration

Après le premier déploiement, se connecter au conteneur via Coolify (terminal) et exécuter :
```bash
# Le schéma est appliqué automatiquement si vous ajoutez un script de démarrage,
# ou manuellement via le terminal Coolify :
node -e "
const postgres = require('postgres');
// Le push se fait via drizzle-kit en local, puis l'app utilise le schéma existant
"
```

**Méthode recommandée** : exécuter `npm run db:push` et `npm run db:seed` en local avec la `DATABASE_URL` de production (tunnel SSH vers Coolify ou exposer temporairement le port PostgreSQL).

## Variables d'environnement

| Variable | Description | Défaut |
|---|---|---|
| `DATABASE_URL` | URL de connexion PostgreSQL | `postgresql://commus:commus@localhost:5432/commus_dcs` |
| `NUXT_SESSION_SECRET` | Secret pour les sessions cookie | (obligatoire en prod) |
| `NUXT_ADMIN_PASSWORD` | Mot de passe du panel admin | (obligatoire en prod) |
| `NUXT_PUBLIC_SITE_URL` | URL publique du site | `http://localhost:3000` |
