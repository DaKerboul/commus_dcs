# « Trouver ma commu » : classement par compatibilité

Validé le 2026-09-26.

## Pourquoi

Umami, 90 jours : 473 visiteurs sur `/trouver` (≈ 28 % des visites), 349 vont au bout (74 %).
Mais le résultat est un filtre tout-ou-rien trié par votes : 14 % de recherches à zéro
résultat, ≈ 40 % à plus de 10 résultats (jusqu'à 50), et la page la plus vue ensuite est
`/communautes` (1 511 vues) — les gens repartent chercher eux-mêmes. Le quiz doit
**choisir**, pas filtrer.

Données : 67 fiches publiées ; ≈ 25 % ont type/taille/expériences/recrutement non
renseignés, 30 % sans module. « Non renseigné » doit donc être neutre, jamais éliminatoire.

## Parcours (adaptatif, chaque écran a « Peu importe »)

1. **Niveau** : je débute / je vole régulièrement / pilote aguerri — aiguille la suite.
2. **Modules** : les plus répandus en tuiles, recherche pour les autres.
3. **Ambiance** (langage courant → types + formats) : détente / groupe régulier / structure
   militaire / compétition.
4. **Taille** : petit groupe / moyenne / grosse communauté (3 choix au lieu de 6).
5. **Envies** — débutant : besoins (tuteurs, formations SRS, entraînements publics) ;
   régulier/aguerri : rôles, formats, infrastructure.
6. **Recrutement** : oui maintenant / je regarde.

Réponses dans l'URL (retour, rechargement, partage). « Voir mes résultats » possible dès
l'étape 2 ; les questions non vues valent « peu importe ».

## Score (`shared/finder-score.ts`, fonction pure, calcul côté navigateur)

Compatibilité = points ÷ points possibles **des seuls critères répondus**.

| Critère | Poids | Règle |
|---|---|---|
| Modules | 30 | modules communs ÷ min(nb choisis, 3), plafonné à 1 ; fiche sans module → 0,5 |
| Ambiance | 20 | type exact 1 · type voisin 0,5 · « other » 0,5 ; format associé proposé → +0,25 (plafond 1) |
| Niveau | 15 | débutant : `debutants` 1 · tuteurs/entraînements publics 0,7 · `confirmes` seul 0,2 ; aguerri : l'inverse ; régulier : non noté ; sans expériences 0,5 |
| Envies | 15 | expériences communes ÷ min(nb choisies, 3) ; fiche sans expériences 0,5 |
| Taille | 10 | même tranche 1 · voisine 0,5 · inconnue 0,5 |
| Recrutement | 10 | seulement si « oui » : open 1 · unknown 0,5 · closed/none 0 |

Pas de lien Discord actif (absent ou mort selon la sonde) → −10 points de pourcentage
et raison « pas de Discord actif ». Égalité → votes.

Chaque critère produit une raison : ✓ (≥ 0,8), ~ (≥ 0,4), ✗ (< 0,4).

## Résultats

- Rappel des réponses en étiquettes cliquables (retour à la question) + « Copier le lien ».
- Podium : 3 cartes avec jauge %, 3–4 raisons, « Rejoindre le Discord » et « Voir la fiche ».
- « Autres pistes » : liste compacte classée (10 puis « Voir plus »).
- Meilleur score < 70 % (rater les modules seuls laisse ≤ 70 %) : message honnête + critère le plus bloquant + bouton pour l'ignorer.
- Pendant le quiz : encart « N commus correspondent déjà à ≥ 80 % ».

## Mesure (Umami, sans donnée personnelle)

`finder_completion` {level, topScore, answered} · `finder_result_click` {rank, score} ·
`finder_join_discord` {rank, score}.

## Hors périmètre

Pas de nouvel endpoint (l'API liste déjà les 67 fiches avec modules/expériences), pas
de saisie libre/IA, pas de disponibilités horaires (absentes des données).

## Tests

`tests/unit/finder-score.test.ts` : débutant Huey, pilote SEAD aguerri, compétiteur,
fiche incomplète jamais éliminée, critère « peu importe » neutre, Discord mort pénalisé.
