# Document de conception — Comptes gestionnaires & pages self-service
**commus.kerboul.me — version finale, arbitrée par le lead architecte puis validée par le PO (2026-07-28)**
Synthèse des études 1 (auth), 2 (binding), 3 (édition), 4 (data/API). Contraintes respectées : zéro email, mono-instance, un bénévole, stack existante (`nuxt-auth-utils@0.5.29`, Drizzle + runner de migrations au boot).

> **Arbitrages PO (2026-07-28)** :
> 1. Claim des commus existantes = **formulaire simple modéré par l'admin** — pas de vérification automatique par les guilds Discord (mécanisme abandonné, trop de complexité pour le gain).
> 2. Discord OAuth conservé comme identité utilisateur.
> 3. Changement de **nom** : revue préalable. **Promotion editor→owner** : autonome (garde-fou dernier owner). **RGPD** : purge auto des comptes inactifs à 18 mois + mention /confidentialite.
> 4. **Admin** : authentification via **Authelia** (CT134, auth.kerboul.me, OIDC + 2FA TOTP déjà en prod sur l'infra sentinel) — voir §D1 révisé.

---

## 1. Décisions d'architecture

### D1 — Identité : Discord OAuth **exclusivement**. Pas de credentials locaux, pas de TOTP utilisateur.
Les études 1, 2 et 3 convergent ; l'étude 4 proposait un fallback username+password+TOTP obligatoire. **Rejeté** : ce fallback coûte ~40 % du chantier (Argon2, chiffrement des seeds, recovery codes, écrans d'enrôlement) pour couvrir une population "responsable DCS sans Discord" qui n'existe pas — et sa récupération de compte retombe de toute façon sur l'admin via… Discord. Discord OAuth est la seule option qui **résout** la récupération sans email (déléguée à Discord) au lieu de la déplacer sur le bénévole. Scope `identify` seul pour le login courant ; scope `guilds` demandé uniquement pendant une réclamation (D2). Aucun secret stocké en DB, aucun token OAuth conservé.

**Admin — révisé (PO)** : l'authentification admin passe par **Authelia** (CT134, `auth.kerboul.me`, Authelia 4.38 déjà fournisseur OIDC pour PVE, 2FA TOTP actif, cookie domaine `kerboul.me`). Intégration en **client OIDC** :
- Déclarer un client `commus` dans `/opt/authelia/config/configuration.yml` (bloc `identity_providers.oidc.clients`, à côté du client `proxmox`) — redirect URI `https://commus.kerboul.me/api/auth/authelia/callback`, scopes `openid profile groups`.
- Côté Nuxt : handler OAuth OIDC (provider Authelia de nuxt-auth-utils si dispo dans la version installée, sinon handler OIDC générique ~100 lignes) → session `{ user: { role: 'admin' } }` si `preferred_username == 'Kerboul'` ou groupe `admins`.
- ⚠️ **PAS de forward-auth Traefik** devant `/admin` : les pages admin font des `$fetch` XHR vers `/api/admin/*` — même piège que l'incident PVE du 2026-06-17 (401 sur XHR au lieu de 302 → flow cassé). L'auth se fait dans l'app via OIDC, pas au proxy.
- Le **mot de passe env actuel reste en break-glass** (si CT134/Authelia est down, l'admin commus doit rester accessible) — derrière un flag `NUXT_ADMIN_PASSWORD_FALLBACK=true` désactivable.

### D2 — Binding : formulaire de réclamation modéré (décision PO) + owner automatique à la soumission.
**Révisé (PO, 2026-07-28)** : la vérification automatique par les guilds Discord (invites → `GET /users/@me/guilds`) est **abandonnée** — trop de complexité (scope `guilds`, résolution d'invites, vanity URLs) pour un parc de 57 fiches. Le claim devient un **formulaire simple** :
1. Sur la fiche : bouton « Vous gérez cette communauté ? ». L'utilisateur se connecte via Discord OAuth (`identify` seul) puis remplit un court formulaire : son rôle dans la commu + comment le vérifier (ex: « je suis TheQueen, fondateur, vérifiable sur notre Discord »).
2. La demande atterrit dans `/admin/reclamations` (pseudo Discord + Discord ID + message). L'admin recoupe en 2 min sur le Discord de la commu (il connaît déjà la plupart des responsables) et approuve/rejette en 1 clic. Approbation → ligne `community_members(owner, grantedVia: 'claim_form')`.
3. Anti-spam : 1 demande pending par (user, commu), rate-limit 3 demandes/jour/user.

Pour les **nouvelles soumissions** : connexion Discord *optionnelle* sur le formulaire (l'anonyme reste possible) ; à l'approbation, le soumetteur devient owner automatiquement (`grantedVia: 'submission'`) — le backfill est auto-résolvant pour toute nouvelle commu. Pour les 57 existantes : backfill passif (bouton sur la fiche + badge « fiche gérée par la communauté » comme incitation), pas de campagne.

Les **claim codes** (table `claim_codes`) sont conservés uniquement comme **liens d'invitation editor/owner** générés par un owner (Phase 3) — plus aucun rôle dans le claim initial.

### D3 — Modèle d'édition : "la page EST l'éditeur", markdown restreint, sections libres, personnalisation encadrée.
On retient intégralement le modèle de l'étude 3 : un espace `/ma-communaute` où le responsable édite la fiche **dans son rendu réel** (crayon par section, sections vides en pointillés "+ Ajouter"), au lieu d'un formulaire parallèle. Permissivité concrète : markdown restreint (h3/h4, gras, listes, liens, citations — pas de HTML, pas d'images inline) sur `description`/`objectives`, jusqu'à 4 **sections libres** titrées, galerie réorganisable, **couleur d'accent** dans une palette fermée (~10 teintes) et **bannière** recadrée 4:1. Pas de CSS custom ni de polices : l'annuaire doit rester scannable. `slug`, `featured`, `published`, `votes`, `isCommunityPillar` restent admin-only, inatteignables par construction (allowlist de champs côté serveur, jamais de spread du body).

### D4 — Modération : publication directe par défaut, revue préalable pour identité + liens + images, snapshots pour rollback.
Les études 3 et 4 divergent : édition 100 % directe avec audit post-hoc (é4) vs revue préalable ciblée (é3). **Arbitrage : le curseur de l'étude 3.** Une revue sur tout tuerait le self-service ; une publication directe des URLs ouvrirait le vecteur phishing n°1 sur un site dont la fonction est précisément de faire cliquer vers des liens externes. Donc :
- **Direct** : tous les textes, classification (enums/référentiels), sections libres, accent, réorganisation de galerie. Pire cas = du contenu médiocre sur sa propre fiche.
- **File de revue** (une seule révision pending par commu, fusionnée à chaque save → file bornée à 57) : `name` (usurpation), les 7 URLs + `otherLinks`, toute nouvelle image (logo, bannière, galerie). UI admin = diff avant/après, pattern de `submissions.vue`.
- **Rollback** : `community_snapshots` (jsonb complet avant chaque save, 10 derniers conservés) — plus simple et plus robuste que le diff-revert de l'étude 4, qu'on abandonne. Kill switch existant : `published = false`. Lien "Signaler cette page" sur les fiches publiques.
- Rôles : `owner` (gère fiche + membres, peut inviter des `editor` par lien à usage unique) / `editor` (gère la fiche). Garde-fou : impossible de retirer le dernier owner (sauf admin). Révocation et `is_blocked` en 1 clic admin.

### D5 — Transverse.
- **Sessions** : un seul cookie scellé nuxt-auth-utils. `{ user: { role: 'admin' } }` (8 h, inchangé) ou `{ user: { id, role: 'member', discordId, displayName } }` (30 j). Les memberships ne vont **jamais** dans le cookie : lookup DB à chaque écriture (révocation immédiate).
- **Factorisation** : `server/utils/auth.ts` — `requireAdmin(event)`, `requireUser(event)` (vérifie `is_blocked`), `requireCommunityRole(event, communityId, 'editor'|'owner')` (admin passe partout). Remplace les 8 copies actuelles de `requireAdmin`. `server/utils/rate-limit.ts` généralise le pattern Map in-memory (mono-instance, assumé). Extraction de la logique d'écriture de `admin/communities/[id].put.ts` vers `server/utils/community-write.ts`, partagée admin/self-service.
- **Anti-abus** : sanitisation markdown côté serveur (markdown-it `html:false` + `sanitize-html` allowlist, `rel="nofollow ugc noopener"` sur tous les liens), `normalizeUrl`/`normalizeImages` existants réutilisés, magic-number check sur les base64, rate-limits (claim 5/h, saves 30/h/commu, images 10/h/commu), validation stricte des enums.

---

## 2. Parcours utilisateur clés

### (a) Un responsable réclame la fiche existante de sa commu *(révisé PO : formulaire)*
1. Sur `/communautes/3rd-wing`, il voit « Vous gérez cette communauté ? Réclamez cette page ».
2. Clic → connexion Discord OAuth (`identify` seul, 2 clics s'il a une session Discord ouverte).
3. Formulaire court : son rôle dans la commu + un moyen de vérification (« je suis X, fondateur, vérifiable sur notre Discord »). Envoi → « Demande transmise, réponse sous quelques jours ».
4. L'admin voit la demande dans `/admin/reclamations` (pseudo + Discord ID + message), recoupe en 2 min sur le Discord de la commu, approuve en 1 clic → ligne `community_members(owner, grantedVia: 'claim_form')`. À sa prochaine visite, le responsable a accès à `/ma-communaute`.

### (b) Un visiteur soumet une nouvelle commu et devient owner
1. Sur `/soumettre`, encart optionnel : « Connectez-vous avec Discord pour gérer votre fiche après approbation » (`identify` seul). Il se connecte ; le formulaire reste sinon identique, la soumission anonyme reste possible.
2. Sa soumission porte `submittedByUserId`. L'admin la modère comme aujourd'hui — l'approbation humaine vaut vérification.
3. À l'approbation, la commu est créée **et** la ligne `community_members(owner, grantedVia: 'submission')` avec. À sa prochaine visite, son avatar en header → « Mes communautés » → sa page, éditable. Le problème du backfill est auto-résolvant pour toute nouvelle commu.

### (c) Un owner édite sa page au quotidien
1. Session de 30 j : la plupart du temps il est déjà connecté ; sinon re-clic Discord, ~2 s.
2. `/ma-communaute`, onglet **Ma page** : sa fiche telle que le public la voit, crayon par section. Il clique ✎ sur « Présentation », édite en markdown avec aperçu live dans le layout réel, Enregistrer → **publié immédiatement** (snapshot pris avant). Il bascule « Recrutement : ouvert » d'un toggle. Il ajoute une section libre « Nos serveurs publics ». Il réordonne sa galerie en drag & drop.
3. Il change son lien Discord → bandeau « 1 modification en attente de validation : lien Discord ». Le reste de son save est déjà en ligne ; seule l'URL attend. L'admin voit le diff (ancienne barrée / nouvelle en vert), approuve en 1 clic.
4. Onglet **Réglages** : il génère un lien d'invitation 72 h qu'il colle dans le salon staff de son Discord ; son co-fondateur clique, se connecte via Discord, devient `editor`.
5. Onglet **Statistiques** : votes 30 j (V1), puis vues et clics Discord (V1.1).

---

## 3. Schéma DB final (Drizzle, migration additive unique par phase)

```ts
// ── Enums ─────────────────────────────────────────────
export const memberRoleEnum = pgEnum('member_role', ['owner', 'editor'])
export const grantedViaEnum = pgEnum('granted_via', ['claim_form', 'invite_code', 'submission', 'admin'])
export const claimStatusEnum = pgEnum('claim_status', ['pending', 'approved', 'rejected'])
export const revisionStatusEnum = pgEnum('revision_status', ['pending', 'approved', 'rejected'])

// ── users — identité Discord uniquement, zéro secret ──
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  discordId: varchar('discord_id', { length: 32 }).notNull().unique(), // snowflake, stable
  discordUsername: varchar('discord_username', { length: 100 }).notNull(), // resync à chaque login
  discordAvatarUrl: text('discord_avatar_url'),
  isBlocked: boolean('is_blocked').notNull().default(false),
  lastLoginAt: timestamp('last_login_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

// ── community_members — le binding ────────────────────
export const communityMembers = pgTable('community_members', {
  id: serial('id').primaryKey(),
  communityId: integer('community_id').notNull().references(() => communities.id, { onDelete: 'cascade' }),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  role: memberRoleEnum('role').notNull().default('editor'),
  grantedVia: grantedViaEnum('granted_via').notNull(),
  invitedByUserId: integer('invited_by_user_id').references(() => users.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, t => ({
  uniq: uniqueIndex('idx_members_unique').on(t.communityId, t.userId),
  byUser: index('idx_members_user').on(t.userId),
}))

// ── claim_codes — codes admin ET liens d'invitation owner ──
export const claimCodes = pgTable('claim_codes', {
  id: serial('id').primaryKey(),
  communityId: integer('community_id').notNull().references(() => communities.id, { onDelete: 'cascade' }),
  codeHash: varchar('code_hash', { length: 64 }).notNull().unique(), // sha256, clair montré une seule fois
  grantsRole: memberRoleEnum('grants_role').notNull().default('owner'),
  createdByUserId: integer('created_by_user_id').references(() => users.id, { onDelete: 'set null' }), // null = admin
  expiresAt: timestamp('expires_at').notNull(), // 14 j admin, 72 h invitation owner
  usedByUserId: integer('used_by_user_id').references(() => users.id, { onDelete: 'set null' }),
  usedAt: timestamp('used_at'),
  revokedAt: timestamp('revoked_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

// ── claim_requests — file quand la vérif auto échoue ──
export const claimRequests = pgTable('claim_requests', {
  id: serial('id').primaryKey(),
  communityId: integer('community_id').notNull().references(() => communities.id, { onDelete: 'cascade' }),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  message: text('message'),
  status: claimStatusEnum('status').notNull().default('pending'),
  adminNote: text('admin_note'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  resolvedAt: timestamp('resolved_at'),
}, t => ({ uniq: uniqueIndex('idx_claim_req_unique').on(t.communityId, t.userId) }))

// ── community_sections — sections libres (max 4, appli) ──
export const communitySections = pgTable('community_sections', {
  id: serial('id').primaryKey(),
  communityId: integer('community_id').notNull().references(() => communities.id, { onDelete: 'cascade' }),
  title: varchar('title', { length: 80 }).notNull(),
  body: text('body').notNull(), // markdown restreint, ≤ 4000 chars, sanitisé au save
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

// ── community_revisions — champs sensibles en attente ──
export const communityRevisions = pgTable('community_revisions', {
  id: serial('id').primaryKey(),
  communityId: integer('community_id').notNull().references(() => communities.id, { onDelete: 'cascade' }),
  userId: integer('user_id').references(() => users.id, { onDelete: 'set null' }),
  fieldsPatch: jsonb('fields_patch').$type<Record<string, unknown>>().notNull(), // uniquement name/URLs/images
  status: revisionStatusEnum('status').notNull().default('pending'),
  adminNote: text('admin_note'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  reviewedAt: timestamp('reviewed_at'),
}) // règle appli : 1 seule pending par commu (fusion au save)

// ── community_snapshots — rollback (10 derniers/commu) ──
export const communitySnapshots = pgTable('community_snapshots', {
  id: serial('id').primaryKey(),
  communityId: integer('community_id').notNull().references(() => communities.id, { onDelete: 'cascade' }),
  userId: integer('user_id').references(() => users.id, { onDelete: 'set null' }),
  data: jsonb('data').notNull(), // fiche complète avant save (incl. sections, images)
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, t => ({ byCommunity: index('idx_snapshots_community').on(t.communityId, t.createdAt) }))

// ── community_events — stats agrégées (Phase 4) ───────
export const communityEvents = pgTable('community_events', {
  id: serial('id').primaryKey(),
  communityId: integer('community_id').notNull().references(() => communities.id, { onDelete: 'cascade' }),
  type: varchar('type', { length: 30 }).notNull(), // 'view' | 'click_discord' | 'click_<réseau>'
  day: date('day').notNull(),
  count: integer('count').notNull().default(0),
}, t => ({ uniq: uniqueIndex('idx_events_unique').on(t.communityId, t.type, t.day) }))

// ── Colonnes ajoutées aux tables existantes ───────────
// communities : accentColor varchar(20) (enum palette validé serveur), bannerUrl text
// submissions : submittedByUserId integer nullable → users.id (onDelete set null)
```

Migrations générées par `drizzle-kit generate` (jamais `db:push`), appliquées par le runner au boot. Purement additif : zéro impact sur les 57 lignes existantes ; en cas d'échec de migration, l'existant (annuaire, admin, soumissions) reste intact.

---

## 4. Roadmap en phases livrables

### Phase 1 — Comptes, claim par formulaire, édition des champs sûrs — **taille M** (~1 sem, allégée par l'abandon de la vérif guilds)
Valeur livrée seule : les responsables se connectent, réclament leur fiche via le formulaire et éditent les champs texte/classification existants.
- `server/utils/auth.ts` + refactor des 8 `requireAdmin` (zéro changement fonctionnel — livrable et testable seul) ; `server/utils/rate-limit.ts`.
- Migration : `users`, `community_members`, `claim_requests`, `community_snapshots`, `submissions.submittedByUserId` (la table `claim_codes` peut attendre la Phase 3).
- Discord OAuth `identify` seul (login utilisateur), formulaire de claim sur les fiches, `/admin/reclamations` (approve/reject 1 clic), `/admin/users` (bloquer, révoquer).
- `PUT /api/my/communities/[id]` allowlisté **champs directs uniquement** (texte brut, enums, référentiels — pas encore d'URLs/name/images côté self-service : renvoyés en 403 avec message « passe par l'admin » en attendant la Phase 2), snapshot avant chaque save, extraction `community-write.ts`.
- Formulaire de soumission avec connexion optionnelle → owner à l'approbation.
- Page `/ma-communaute` version formulaire simple (pas encore l'édition inline).
**Risques** : app Discord Developer Portal à créer/configurer (callback prod) — c'est le seul prérequis externe de la phase.

### Phase 2 — L'éditeur « page que je gère » + modération ciblée — **taille L** (~2-2,5 sem)
Valeur : le cœur de la promesse produit — édition inline permissive, markdown, revue des champs sensibles.
- Pipeline markdown sanitisé + composant `CommunityRichText` (fiche publique inchangée pour le texte brut existant — le markdown est un sur-ensemble, zéro migration de contenu).
- Onglet « Ma page » : édition inline section par section, réutilisation des composants de `[slug].vue`.
- `community_revisions` : name/URLs/images en file, fusion des pending, diff admin dans `/admin/revisions`, restore depuis snapshots.
- Signalement public.
**Risques** : XSS markdown (le point de sécurité n°1 du projet — sanitisation serveur systématique, revue de code dédiée) ; l'édition inline est le gros du coût front — fallback acceptable : garder le formulaire de Phase 1 par section.

### Phase 3 — Permissivité étendue + multi-membres — **taille M** (~1 sem)
- Sections libres (table + UI, max 4), bannière + couleur d'accent (palette fermée), galerie drag & drop.
- Invitations `editor` par lien à usage unique généré par un owner, gestion des membres dans Réglages, garde-fou dernier owner.
- Badge public « fiche gérée par la communauté » (moteur du backfill passif).
**Risques** : faibles — dérive visuelle si la palette s'ouvre (tenir la ligne : palette fermée, point).

### Phase 4 — Statistiques, Authelia admin & finitions — **taille S/M** (~3-4 j)
- `community_events`, endpoint track, onglet Statistiques (vues, clics Discord/réseaux, sparklines ; votes dès la Phase 1 car déjà en DB).
- **Admin via Authelia** (décision PO) : client OIDC `commus` dans la config Authelia CT134, handler OIDC côté Nuxt, mapping `preferred_username`/groupe `admins` → rôle admin, fallback mot de passe env derrière flag. PAS de forward-auth Traefik (piège XHR documenté dans sentinel-control).
- **Purge RGPD** (décision PO) : job périodique (réutiliser le pattern twitch-cron) supprimant les comptes sans login ET sans membership depuis 18 mois ; mise à jour de /confidentialite (Discord ID, pseudo, avatar, durée de rétention).
- Nettoyages : blocklist de raccourcisseurs d'URL, webhook Discord optionnel de notification des décisions de claim.

---

## 5. Points ouverts — TOUS TRANCHÉS PAR LE PO (2026-07-28)

1. ~~Seuil de la vérification automatique~~ → **sans objet** : la vérification auto par guilds est abandonnée, claim par formulaire modéré (voir D2 révisé).
2. **Champ `name`** → **revue préalable** (protection anti-usurpation, file de revue).
3. **Co-optation** → **autonome** : un owner peut promouvoir un editor en owner sans admin ; garde-fou « dernier owner » actif ; l'admin peut toujours révoquer.
4. **Rétention RGPD** → **purge auto à 18 mois** (comptes sans login ni membership) + mention dans /confidentialite.
5. **2FA admin** → **Authelia** (auth.kerboul.me, CT134 — OIDC + TOTP déjà en prod sur l'infra sentinel), intégré en client OIDC en Phase 4, fallback mot de passe env derrière flag. Voir D1 révisé.

---
*Hors périmètre confirmé : passkeys/WebAuthn (expérimental dans la 0.5.x, problème de récupération insoluble sans email), credentials locaux, TOTP utilisateur en DB, bot Discord invité sur les serveurs, vérification automatique par guilds Discord (abandonnée par le PO), toute infra email. Dépendances nouvelles : `markdown-it` + `sanitize-html` uniquement (Phase 2). Env nouveaux : `NUXT_OAUTH_DISCORD_CLIENT_ID`, `NUXT_OAUTH_DISCORD_CLIENT_SECRET` (Phase 1) ; client OIDC Authelia (Phase 4).*