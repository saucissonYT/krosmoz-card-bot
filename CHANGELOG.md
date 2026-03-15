# Changelog

Toutes les modifications importantes de **Krosmoz Card Bot** sont documentées dans ce fichier.

- Added → nouvelles fonctionnalités
- Changed → modifications importantes
- Fixed → corrections de bugs
- Improved → améliorations internes

---
## [0.14.0] - 2026-03-15

### Added

Nouveau système complet d'achievements
Achievements liés aux mentions du bot
Achievements liés aux kamas possédés
Achievements liés aux packs spéciaux
Achievements secrets
Affichage des achievements secrets masqués (🔒 ???)
Limite de badges affichés dans /profil
Priorité aux derniers badges obtenus
Nouveau chatSystem permettant au bot de répondre lorsqu'il est mentionné
Système d'astuces du bot
Triggers de mots-clés lorsque le bot est mentionné
Achievements liés au chat avec le bot
Achievement Aura Farming
Achievement 666 cartes
Achievement Spam de mention
Achievement Noctambule
Achievement Matinal
Achievement Pack Divin
Achievement Pile ou Face
Achievement Impossible
Achievement SSR Shiny

### Changed

Réorganisation du système des achievements
Ajout du support des achievements secrets
Amélioration de la gestion des badges dans le profil
Centralisation de la logique sociale dans chatSystem

### Improved

Meilleure détection des packs spéciaux
Meilleure détection des doublons dans les packs
Meilleure robustesse du système d'achievements
Amélioration de la compatibilité avec les futures fonctionnalités sociales du bot

### Fixed

Correction d'un bug empêchant certains achievements de collection de se déclencher
Correction d'un bug de détection des doublons dans un pack
Correction de cas où user.cards pouvait être undefined
Correction de plusieurs problèmes mineurs dans la gestion des achievements

---

## [0.13.0] - 2026-03-15

### Added
- Affichage du **pity par set dans /profil**
- Affichage du **dernier daily** dans le profil
- Affichage du **streak daily** dans le profil
- Barre de progression **XP améliorée**

### Changed
- Implémentation d'une **soft pity progressive pour les SSR**
- Ajustement du système RNG des packs

### Fixed
- correction du compteur **dailyClaims** qui restait bloqué à 0
- correction de la mise à jour du **pity SSR/UR**
- correction du hard pity SSR appliqué au mauvais moment dans l'ouverture de pack
---

## [0.12.0] - 2026-03-15

### Added
- Triple fusion extrêmement rare dans le système de fusion
- Animation de fusion dans Discord
- Historique des ventes du marché
- Calcul automatique du prix moyen des cartes
- Protection anti manipulation du marché
- Migration automatique `users.json → users/<id>.json`

### Changed
- Refonte complète du système de données
- Les utilisateurs sont maintenant stockés individuellement dans `/data/users/`
- Ajout d'un **dirty save system** (sauvegarde uniquement des utilisateurs modifiés)

### Improved
- Meilleure compatibilité avec **Railway**
- Réduction massive des écritures disque
- Amélioration des performances pour les serveurs avec beaucoup de joueurs

### Fixed
- corrections de bugs inventaire
- correction d'erreurs dans le système de fusion
- correction de crashs liés au marché


---

## [0.11.0] - 2026-03-14

### Added
- Rework complet du système de fusion
- Fusion basée uniquement sur les doublons
- Coût de fusion progressif selon la rareté
- Fusion critique
- Fusion double

### Improved
- équilibrage du système de progression
- meilleure gestion des inventaires


---