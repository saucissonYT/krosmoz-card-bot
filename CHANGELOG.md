# Changelog

Toutes les modifications importantes de **Krosmoz Card Bot** sont documentées dans ce fichier.

- Added → nouvelles fonctionnalités
- Changed → modifications importantes
- Fixed → corrections de bugs
- Improved → améliorations internes


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

## [0.12.0] - 2026-03-14

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
