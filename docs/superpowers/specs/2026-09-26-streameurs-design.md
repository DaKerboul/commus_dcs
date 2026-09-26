# Streameurs : « qu'est-ce que je regarde » + vitrine des commus

Validé le 2026-09-26. Priorités : le spectateur (1) et le lien streams ↔ communautés (2).

## Constat

- Umami 90 j : `/streamers` 267 visiteurs, profils 147, `/streamers/stats` 12. Aucun clic
  Twitch mesuré. Après `/streamers`, la page la plus vue est `/communautes` (603).
- Base : 170 chaînes suivies, **38 actives sur DCS en 30 j** (62 au total) ; **4 reliées à une
  commu** ; 1 609 sessions dont 921 avec VOD ; pic de démarrage 20 h–22 h (Paris).
- Aucun écran ne permet de relier un streameur à une commu ; un seul lien possible par
  streameur alors que certains en ont plusieurs (Le_Bibs_ : Couteau et Ashayar).
- Profil : titre « Followers » sans graphique ; « dernier stream » calculé mais non affiché.

## Page `/streamers`

1. **En direct sur DCS** (jeu = DCS uniquement) : vignette (miniature statique Twitch
   `static-cdn.jtvnw.net/previews-ttv/live_user_<login>-640x360.jpg`), titre, spectateurs,
   durée écoulée, badges de ses commus. « Regarder ici » charge le lecteur Twitch au clic
   (façade, aucun cookie tiers avant) ; « Sur Twitch » ouvre la chaîne.
2. **Habituellement en direct** : créneau calculé sur 60 j (jours de semaine + heure de
   démarrage médiane) ; mise en avant de ceux dont le créneau tombe aujourd'hui.
3. **Rediffusions DCS** (14 derniers jours, durée de vie des VOD Twitch) : sessions à
   majorité DCS avec VOD, miniature, durée, streameur, commu.
4. **Chaînes actives** (DCS dans les 30 j) : cartes compactes, recherche et tri ; lien vers
   les chaînes inactives.
5. **Scène (30 j)** : chiffres clés + classements, intégrés ; `/streamers/stats` redirige.

Mesure Umami : `stream_watch_here`, `stream_open_twitch`, `vod_open`, `stream_to_community`.

## Profil `/streamers/<login>`

En-tête avec commus (plusieurs), créneau habituel, dernier stream DCS ; direct en tête avec
la même façade ; grille de VOD ; calendrier 3 mois conservé ; courbe des followers si
≥ 2 points, sinon section absente ; tuiles 90 j conservées.

## Fiche d'une commu

Bloc « Nos streameurs » dans `CommunityProfile` : encart direct si un membre est sur DCS,
sinon avatars + dernière VOD ; absent pour les visiteurs quand vide, fantôme en édition.

## Lien streameur ↔ commu

- Table `community_streamers` (community_id, streamer_id, status `linked|dismissed`,
  source `manager|admin|migrated`, added_by_user_id, created_at ; unique (commu, chaîne)).
  Migration : recopie des liens `streamers.community_id` existants (source `migrated`).
  La colonne n'est plus lue ; suppression dans une migration ultérieure.
- Colonne `streamer_sessions.vod_thumbnail_url`, renseignée par l'appariement quotidien des
  VOD (qui repasse sur les sessions sans miniature).
- **Suggestions**, calculées à la demande : titres de sessions DCS ou description de chaîne
  citant le nom ou le slug (≥ 4 caractères), ou `twitchUrl` de la fiche = chaîne ;
  classées par nombre de mentions, avec un titre en preuve ; hors liens et ignorées.
- **Gestionnaire** (éditeur, zone « Streameurs ») : reliés, suggestions (Ajouter/Ignorer),
  recherche parmi les chaînes suivies, ajout d'une chaîne absente par pseudo Twitch (vérifié
  via l'API, limité en fréquence). Max 20 par commu. Les liens suivent le brouillon et sont
  publiés sans validation ; « Ignorer » est immédiat.
- **Admin** `/admin/streameurs` : file de suggestions toutes commus (d'abord sans
  gestionnaire), liste des chaînes actives avec leurs commus, « pas francophone »
  (`frenchOverride=false`) et « masquer » (`isActive=false`).
- `/confidentialite` : paragraphe sur le lecteur Twitch chargé au clic.

## Hors périmètre

Pas de notifications de direct, pas de planning déclaratif, pas d'intégration du chat.

## Tests

Unitaires : créneau habituel (médiane, jours), extraction des suggestions (seuils, faux
positifs courts, exclusion des ignorés), contrat du champ `streamerIds` du brouillon.
