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

- Node.js 22+
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
npm run db:migrate               # Crée le schéma via les migrations versionnées
# Données : restaurer un dump de prod (gunzip -c dump.sql.gz | psql …)
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
| `npm run db:seed` | ⚠️ Obsolète : dépend d'un dossier `.archive/` supprimé |
| `npm run db:studio` | Lance Drizzle Studio (GUI DB) |

## Pages

| Route | Description |
| --- | --- |
| `/` | Page d'accueil avec stats et communautés featured |
| `/communautes` | Annuaire avec filtres, recherche et pagination |
| `/communautes/:slug` | Fiche détaillée d'une communauté |
| `/trouver` | Assistant de recherche en 5 étapes |
| `/stats` | Statistiques, graphiques et classement des streameurs |
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

## Déploiement (Coolify)

La prod tourne sur Coolify avec le build pack **Docker Compose** : `docker-compose.yaml` à la racine lance l'app Nuxt et sa base PostgreSQL 16. Un `git push` sur `main` déclenche le déploiement via le webhook de la GitHub App (build de 3 à 6 min). Procédure complète, pièges et reprise : runbook `commus-dcs-deploy.md` du dépôt d'infra.

- Le schéma est géré par des **migrations Drizzle versionnées**, appliquées au démarrage du conteneur (`server/plugins/db-migrate.ts`). Aucune action manuelle au déploiement.
- Healthcheck du compose : `GET http://127.0.0.1:3000/api/health` (liveness) ; `/api/ready` vérifie aussi la base.
- L'image embarque `font-dejavu` pour rasteriser les cartes de partage (`/api/og/:slug`).

> ⚠️ **Ne jamais exécuter `db:push` contre la production.** Cette commande peut émettre des `DROP` implicites et contourner le journal de migrations. Voir [`docs/migrations.md`](docs/migrations.md).

## Variables d'environnement

Toutes se règlent dans Coolify (chaque clé existe en build et en runtime : vérifier la **longueur** de la valeur après écriture, une clé vide passe inaperçue).

| Variable | Rôle | Défaut / note |
| --- | --- | --- |
| `DB_PASSWORD` | Mot de passe PostgreSQL du compose | ⚠️ `commus` (à changer) |
| `DATABASE_URL`, `NUXT_DATABASE_URL` | Connexion PostgreSQL | construites par le compose |
| `NUXT_SESSION_PASSWORD` | Chiffrement des sessions (nuxt-auth-utils) | **obligatoire en prod** |
| `NUXT_SESSION_SECRET` | Signature des cookies de vote | **obligatoire en prod** |
| `NUXT_PUBLIC_SITE_URL` | URL publique (liens absolus, OG, sitemap) | `https://commus.kerboul.me` |
| `NUXT_OAUTH_OIDC_CLIENT_ID`, `_CLIENT_SECRET`, `_OPENID_CONFIG`, `NUXT_ADMIN_OIDC_USERNAME` | Connexion admin via Authelia | voie normale de l'admin |
| `NUXT_ADMIN_PASSWORD`, `NUXT_ADMIN_PASSWORD_FALLBACK` | Mot de passe admin de secours | route en 404 tant que le fallback n'est pas `true` |
| `NUXT_OAUTH_DISCORD_CLIENT_ID`, `_CLIENT_SECRET` | Comptes gestionnaires **et vote** (un vote par compte Discord) | sans eux, ni connexion ni vote |
| `NUXT_TWITCH_CLIENT_ID`, `NUXT_TWITCH_CLIENT_SECRET` | Pages streameurs | optionnel |
| `NUXT_TELEGRAM_BOT_TOKEN`, `NUXT_TELEGRAM_CHAT_ID` | Notifications admin (bot partagé avec Gjallarhorn : envoi seul, jamais `getUpdates`) | optionnel |
| `NUXT_RUN_MIGRATIONS` | `false` pour couper le runner de migrations | `true` |
| `NUXT_RUN_NOTIFICATIONS` | `false` pour couper Telegram | `true` |
| `NUXT_RUN_PRIVACY_PURGE` | `false` pour couper la purge RGPD (comptes dormants 18 mois, empreintes IP des votes 30 j) | `true` |
| `NUXT_RUN_DISCORD_CHECK` | `false` pour couper la vérification hebdo des invitations Discord | `true` |
