# Contribuer à Commus DCS FR

Merci de l'intérêt ! Ce guide couvre les deux types de contributions : ajouter une communauté dans l'annuaire, et contribuer au code du site.

---

## Ajouter ou modifier une communauté

### Via le formulaire (recommandé)

Rendez-vous sur [commus.kerboul.me](https://commus.kerboul.me) et utilisez le formulaire de soumission. Les soumissions sont examinées avant publication.

### Via une issue GitHub

Si vous préférez passer par GitHub, ouvrez une issue avec le label `nouvelle communauté` en incluant :

- Nom de la communauté
- URL (site, Discord, ou autre)
- Description courte (2-3 phrases)
- Type : escadron / serveur multijoueur / formation / événement / autre
- Langue principale : FR / FR+EN / autre

---

## Contribuer au code

### Prérequis

- Node.js 20+
- PostgreSQL 16 (ou Docker)

### Installation locale

```bash
git clone https://github.com/DaKerboul/commus_dcs
cd commus_dcs
npm install
cp .env.example .env        # adapter DATABASE_URL si besoin
npm run db:push
npm run db:seed
npm run dev
```

Le site tourne sur <http://localhost:3000>, l'admin sur <http://localhost:3000/admin/login>.

### Workflow

1. Forker le repo et créer une branche (`fix/mon-bug` ou `feat/ma-feature`)
2. Faire vos modifications
3. Vérifier que les tests passent : `npm run test`
4. Vérifier que le build passe : `npm run build`
5. Ouvrir une Pull Request vers `main`

### Tests

```bash
npm run test          # vitest run (one-shot)
npm run test:watch    # vitest en mode watch
```

Les tests sont dans `tests/unit/`. Toute nouvelle logique utilitaire mérite un test.

### Conventions

- TypeScript strict — pas de `any` implicite
- Composants Nuxt UI v3 / Tailwind CSS v4 pour l'UI
- Les routes API sont dans `server/api/`, les types partagés dans `shared/`
- Un commit par changement logique, message en anglais ou français

---

## Signaler un bug

Ouvrez une issue en décrivant :
- Ce que vous avez fait
- Ce que vous avez vu
- Ce que vous attendiez

Les screenshots et les URLs concernées sont les bienvenus.
