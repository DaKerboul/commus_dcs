# Étude — Faire de commus.kerboul.me la référence stats Twitch DCS FR

*Rédigé le 2026-07-29. Les chiffres de cette étude sont **mesurés** sur l'API Twitch et sur la base de production, pas estimés.*

---

## 1. Où on en est

Le module Twitch actuel fait une chose, et la fait bien : **la découverte**. Un appel à `Get Streams?game_id=313331&language=fr` toutes les 15 minutes, et tout streamer FR qui lance DCS entre automatiquement en base.

Résultat après 5 mois : **135 streamers découverts, 838 jours d'activité, 143 jours d'historique** (depuis le 2026-03-06). C'est un actif réel, et personne d'autre ne l'a.

Le problème est ce qu'on fait de chaque relevé :

| Donnée reçue de Twitch | Ce qu'on en fait |
|---|---|
| `viewer_count` | Écrasé au relevé suivant |
| `started_at` (début exact du live) | Écrasé |
| `title` | Écrasé |
| **`id`** (identifiant de session) | **Jamais lu** |
| `tags`, `is_mature`, `game_id` | Ignorés |

Ne survit que `streamer_dcs_days` : une ligne par (streamer, jour), c'est-à-dire un booléen « il a streamé ce jour-là ». Pas de durée, pas d'audience, pas d'horaire.

**Le gisement gaspillé** : `TwitchStream.id` est déjà déclaré dans nos types (`server/utils/twitch.ts:9`) mais n'est jamais stocké. C'est l'identifiant unique d'une session de stream. Avec lui, regrouper les relevés en sessions devient trivial et **exact** — pas besoin de deviner les frontières. On jette cette clé toutes les 15 minutes depuis mars.

---

## 2. Ce que l'API permet vraiment

J'ai testé chaque endpoint avec nos identifiants de production plutôt que de me fier à la documentation. Deux résultats contredisent ce que j'attendais.

### Ce qui marche SANS le consentement des streamers (app token seul)

| Endpoint | Ce qu'on obtient | Vérifié |
|---|---|---|
| `Get Streams` | `id` (session), `viewer_count`, `started_at`, `title`, `game_id`, `language`, **`tags`**, `is_mature` | ✅ |
| **`Get Channel Followers`** | **`total` — le nombre de followers** | ✅ 2 830 / 616 / 2 864 / 151 sur 4 chaînes |
| `Get Videos` (archives) | `duration` exacte, `view_count`, `stream_id`, `created_at` | ✅ 7 VODs, la plus récente `3h37m0s`, 557 vues |
| `Get Clips` | `view_count`, `creator_name`, `vod_offset`, `duration` | ✅ 20 clips |
| `Get Channel Information` | **`broadcaster_language`**, `tags`, titre, jeu courant | ✅ `fr` + tags `["DCSWorld","armeedelair","Français",…]` |

> **Surprise n°1 — les followers sont publics.** Je m'attendais à devoir demander une autorisation OAuth à chaque streamer (l'endpoint a été restreint en 2023). En réalité, la **liste** des followers exige un user token, mais le **total** est renvoyé avec un simple app token. On peut donc suivre la croissance de chaque chaîne sans rien demander à personne. C'est la statistique la plus attendue sur ce genre de site, et elle est à portée immédiate.

### Ce qui restera hors de portée

Sans que chaque streamer autorise explicitement notre application :

- Abonnés payants, revenus, données démographiques
- Endpoints d'analytics (`Get Game Analytics`, `Get Extension Analytics`)
- Rétention d'audience, sources de trafic, chat
- **L'historique passé** : Twitch ne fournit aucune archive de sessions. Tout ce qui n'a pas été échantillonné en direct est perdu à jamais.

Cette dernière limite est structurelle et gouverne toute la stratégie : **la profondeur d'historique ne s'achète pas, elle se capitalise**. Chaque jour sans échantillonnage fin est un jour définitivement perdu. C'est l'argument principal pour agir tôt plutôt que parfaitement.

### Le quota n'est pas un facteur

Mesuré : **800 points/minute, 1 point par appel**. Notre usage actuel : ~1 appel toutes les 15 minutes. Même en passant à un relevé par minute avec plusieurs appels, on resterait sous 1 % du quota. **Le coût API n'est pas une contrainte de conception ici** — c'est rare, autant en profiter.

---

## 3. Le point aveugle de la découverte

Mesure faite pendant l'étude : **11 streams DCS live dans le monde, 0 en français** (`en:7, de:3, ru:1`).

Notre filtre `language=fr` porte sur la langue **déclarée du stream**. Or beaucoup de francophones ne la renseignent pas, ou streament sous une autre étiquette. On les rate entièrement.

Deux signaux, tous deux disponibles sans consentement, corrigent ça :

1. `Get Channel Information` → `broadcaster_language` (la langue de la **chaîne**, plus stable que celle du stream)
2. Le champ `tags` du stream → `"Français"`, `"armeedelair"`, `"FR"`…

**Proposition** : interroger la catégorie DCS **sans filtre de langue** (11 streams, un seul appel), puis classer FR / non-FR sur ces deux signaux, avec une possibilité de correction manuelle en admin. On passe d'une découverte qui rate des gens à une découverte quasi exhaustive, pour le même coût.

---

## 4. Ce qu'on peut produire

Avec un échantillonnage régulier, tout ce qui suit devient calculable. Aucune de ces statistiques n'existe aujourd'hui.

**Par session de stream** (regroupée par `stream_id`, frontières exactes)
Début et fin, durée, pic d'audience, audience moyenne, courbe d'audience, titres successifs, part de temps réellement passée sur DCS.

**Par streamer**
Heures DCS sur 7/30/90 jours et total · audience moyenne et record · nombre de sessions et durée médiane · **régularité** (jours actifs / jours écoulés) · **créneaux habituels** (heatmap heure × jour, ce qui répond à « quand puis-je le regarder ? ») · courbe de followers · répartition DCS vs autres jeux · VODs récentes avec durée et vues · meilleurs clips.

**Sur la scène FR entière**
Classements heures / audience / régularité · audience cumulée FR · calendrier collectif « qui stream quand » · croissance de la scène mois par mois · corrélation avec les événements des communautés · quelles commus ont des streamers actifs.

C'est ce dernier point qui fait la différence : **aucun site généraliste de stats Twitch ne croise streamers et communautés DCS**. SullyGnome ou TwitchTracker ont plus de profondeur brute, mais ils ne savent pas que `102th_forthequeen` est le fondateur de 102TH PHOENIX. Nous, si — le lien `streamers.communityId` existe déjà dans le schéma (il est juste inexploité : les 135 streamers ont tous `community_id` à NULL).

---

## 5. Architecture proposée

### Fréquence d'échantillonnage

Le choix se joue entre précision et volume. Mesures de dimensionnement : **5,9 streamers actifs par jour en moyenne, 14 au pic**, et une concurrence réelle de l'ordre de 1 à 4 en simultané.

| Intervalle | Précision fin de session | Lignes/an (est.) | Verdict |
|---|---|---|---|
| 15 min (actuel) | ±15 min, rate les streams courts | ~100 k | Insuffisant pour une courbe |
| **5 min** | **±5 min, courbe lisible** | **~300 k** | **Recommandé** |
| 1 min | ±1 min | ~1,5 M | Précision inutile ici |

**5 minutes** : la courbe d'audience devient exploitable, aucune session normale n'est ratée, et 300 k lignes/an est trivial pour Postgres. Le quota reste à ~1 % d'usage.

### Schéma

```sql
-- Un relevé brut. Le stream_id de Twitch donne les frontières de session gratuitement.
CREATE TABLE streamer_samples (
  id            bigserial PRIMARY KEY,
  streamer_id   integer NOT NULL REFERENCES streamers(id) ON DELETE CASCADE,
  stream_id     varchar(32) NOT NULL,   -- Twitch: identifiant de session
  observed_at   timestamptz NOT NULL,
  viewer_count  integer NOT NULL,
  game_id       varchar(32),            -- pour mesurer DCS vs autre jeu
  title         text,
  UNIQUE (streamer_id, stream_id, observed_at)
);
CREATE INDEX ON streamer_samples (streamer_id, observed_at DESC);

-- Une session, dérivée des relevés. Recalculée à la fermeture.
CREATE TABLE streamer_sessions (
  id             serial PRIMARY KEY,
  streamer_id    integer NOT NULL REFERENCES streamers(id) ON DELETE CASCADE,
  stream_id      varchar(32) NOT NULL UNIQUE,
  started_at     timestamptz NOT NULL,  -- valeur EXACTE fournie par Twitch
  ended_at       timestamptz,           -- déduite (dernier relevé + intervalle)
  duration_min   integer,
  peak_viewers   integer,
  avg_viewers    integer,
  dcs_minutes    integer,               -- temps réellement sur DCS
  titles         jsonb,
  vod_url        text,                  -- rapproché via Get Videos.stream_id
  vod_duration   varchar(16)
);

-- Agrégat quotidien, conservé indéfiniment (les relevés bruts, eux, sont purgés).
CREATE TABLE streamer_daily_stats (
  streamer_id   integer NOT NULL REFERENCES streamers(id) ON DELETE CASCADE,
  day           date NOT NULL,
  dcs_minutes   integer NOT NULL DEFAULT 0,
  total_minutes integer NOT NULL DEFAULT 0,
  sessions      integer NOT NULL DEFAULT 0,
  peak_viewers  integer NOT NULL DEFAULT 0,
  avg_viewers   integer NOT NULL DEFAULT 0,
  PRIMARY KEY (streamer_id, day)
);

-- Courbe de followers : un point par jour suffit.
CREATE TABLE streamer_follower_history (
  streamer_id integer NOT NULL REFERENCES streamers(id) ON DELETE CASCADE,
  day         date NOT NULL,
  followers   integer NOT NULL,
  PRIMARY KEY (streamer_id, day)
);
```

**Rétention** : relevés bruts purgés à 90 jours, agrégats quotidiens gardés pour toujours. L'historique long ne coûte alors presque rien, et la courbe fine reste disponible sur la période récente — c'est là qu'on la consulte.

### Boucle de collecte

```
Toutes les 5 min (2 appels, ~2 points de quota) :
  1. Get Streams?game_id=DCS&first=100        → catégorie entière, toutes langues
  2. Get Streams?user_id=<nos streamers>       → les connus, quel que soit le jeu
  → insertion des relevés
  → sessions dont le stream_id a disparu : clôture + calcul des agrégats

Une fois par jour :
  - Get Channel Followers pour chaque streamer     (135 appels, ~10 s)
  - Get Channel Information → broadcaster_language, tags → classement FR
  - Get Videos (archives) → rapprochement VOD ↔ session via stream_id
  - Rollup quotidien, purge des relevés > 90 jours
```

Le second appel (par `user_id`) est ce qui permet de mesurer **DCS vs autres jeux** : le filtre par catégorie seul ne montre un streamer que pendant qu'il est sur DCS.

---

## 6. Découpage proposé

Chaque étape a une valeur propre ; l'ordre est dicté par « ce qui est perdu si on attend ».

**Étape 1 — Arrêter de perdre des données** · S · *le plus urgent*
Table `streamer_samples`, stockage du `stream_id`, passage à 5 minutes, découverte sans filtre de langue. Aucune UI. À faire en premier parce que chaque jour d'attente est un jour d'historique qu'on ne rattrapera jamais.

**Étape 2 — Sessions et fiche streamer** · M
Dérivation des sessions, agrégats quotidiens, refonte de `/streamers/[login]` : courbe d'audience, sessions récentes, heatmap horaire, heures et régularité. La heatmap existe déjà (`StreamCalendarHeatmap.vue`), elle passe de « jours actifs » à « intensité réelle ».

**Étape 3 — Followers, VODs, clips** · S
Suivi quotidien des followers, rapprochement VOD ↔ session, top clips. Beaucoup de valeur perçue pour peu de travail — mais la courbe de followers ne devient intéressante qu'après quelques semaines de collecte, d'où sa position après l'étape 1.

**Étape 4 — La scène FR** · M
Classements, calendrier collectif, page « Pulse Twitch DCS FR », et surtout **le lien streamers ↔ communautés** (rapprochement automatique par nom/Discord + validation admin, exploitant le `communityId` déjà présent mais vide). C'est ce croisement qui rend le site unique.

---

## 7. Ce qu'il faut savoir avant de décider

**La scène est petite.** 5,9 streamers actifs par jour, 0 FR live au moment de l'étude. Ça a deux conséquences opposées : techniquement tout est facile et gratuit ; mais l'audience de ces pages sera modeste. La valeur est moins dans le trafic que dans le fait d'être **la seule source** sur ce créneau — et dans l'attrait que ça crée pour les communautés.

**Les VODs disparaissent vite.** 14 jours pour un compte standard, 60 pour affilié/partenaire. Notre échantillonnage doit donc être la source de vérité ; les VODs ne sont qu'un enrichissement opportuniste (durée exacte, vues).

**L'historique existant reste pauvre rétroactivement.** Les 838 jours déjà collectés resteront des booléens : aucune durée ni audience ne peut être reconstruite après coup. La courbe riche démarre au jour du déploiement de l'étape 1.

**Point RGPD** : on stocke des données d'activité publique de personnes identifiables. Rien de sensible, mais il faudrait ajouter une ligne à `/confidentialite` et prévoir un moyen simple pour un streamer de demander son retrait (`streamers.isActive = false` existe déjà et suffit).

**Question ouverte, à toi** : viser la **scène FR uniquement** (cohérent avec l'identité du site, ~135 streamers) ou **DCS mondial** (11 live au lieu de 0 au moment du test, mais on quitte le positionnement « francophone » et on entre en concurrence frontale avec les gros sites de stats) ? Ma recommandation est de rester FR — c'est là qu'on est légitimes et irremplaçables.

---

## 8. Recommandation

L'écart entre ce qu'on collecte et ce qui est disponible gratuitement est important, et la marche technique est faible : le quota n'est pas une contrainte, le volume non plus, et l'identifiant de session est déjà dans nos types.

**Si une seule chose devait être faite : l'étape 1.** Elle ne produit aucune interface visible, mais c'est la seule dont le report a un coût irréversible. Tout le reste peut attendre le mois prochain sans rien perdre ; l'échantillonnage, non.
