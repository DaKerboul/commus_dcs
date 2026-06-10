# Migrations de base de données

Ce projet utilise des **migrations versionnées** Drizzle (`db:generate` + `db:migrate`)
plutôt que `db:push`. Les migrations vivent dans `server/db/migrations/` (fichiers
`*.sql` + dossier `meta/`) et sont appliquées automatiquement au démarrage du conteneur.

## Workflow de développement

1. Modifier le schéma dans `server/db/schema.ts`.
2. Générer la migration :

   ```bash
   npm run db:generate
   ```

3. Vérifier puis **committer** les fichiers générés :
   - `server/db/migrations/XXXX_*.sql`
   - `server/db/migrations/meta/*` (notamment `meta/_journal.json`).

Ces fichiers font partie du dépôt et sont indispensables : c'est le journal des
migrations qui détermine ce qui a déjà été appliqué.

## Déploiement

Aucune action manuelle n'est requise.

Au démarrage du conteneur, le plugin Nitro `server/plugins/db-migrate.ts` :

1. **Baseline** la base existante au tout premier passage (voir ci-dessous) ;
2. applique automatiquement les migrations en attente (celles dont le `when` du
   journal est strictement postérieur à la dernière migration enregistrée en base).

Le dossier de migrations est embarqué dans l'image Docker (copié dans
`/app/server/db/migrations` au stage `runner` du `Dockerfile`), donc disponible au
runtime.

## Première fois : baseline de la prod existante

La base de **production existe déjà** : toutes ses tables ont été créées via l'ancien
`db:push`, mais **aucun journal de migration** n'a jamais été écrit côté base.

Si on lançait `migrate()` tel quel, Drizzle tenterait de rejouer la migration baseline
`0000_spotty_jack_murdock.sql` (des `CREATE TYPE` / `CREATE TABLE`) — qui
**échoueraient** puisque ces objets existent déjà.

Pour éviter cela, le runner **baseline** la base au premier passage : il insère dans
`drizzle.__drizzle_migrations` une ligne marquant la migration `0000` comme **déjà
appliquée** (avec le `created_at` correspondant au `when` du journal). Résultat :
`migrate()` considère `0000` comme appliqué et ne réexécute **pas** ses `CREATE`. La
prod existante est ainsi alignée en toute sécurité, sans toucher aux données.

Les migrations suivantes (`0001`, `0002`, …) s'appliquent ensuite normalement.

## `db:push` : prototypage local uniquement

`db:push` est désormais **réservé au prototypage LOCAL**. Ne plus jamais l'utiliser sur
la prod : il ne passe pas par le journal de migration et désynchroniserait l'état
versionné. Sur tous les environnements partagés, on n'utilise que
`db:generate` + le runner de migration au démarrage.

## Désactivation d'urgence

Pour désactiver l'exécution automatique des migrations au démarrage, définir la
variable d'environnement :

```
NUXT_RUN_MIGRATIONS=false
```

L'app démarre alors sans tenter de migrer (utile en cas d'incident ou pour un
diagnostic).

## Sûreté : le runner est fail-safe

Le runner de migration **n'interrompt jamais le démarrage de l'app**, quoi qu'il
arrive. Toute exception est attrapée et journalisée, puis le démarrage se poursuit.

L'application **n'a pas besoin** des migrations pour fonctionner (le schéma de prod
existe déjà). Le pire cas acceptable est donc : la baseline/migration n'est pas posée,
un message est loggé, et l'app démarre normalement sur le schéma existant.
