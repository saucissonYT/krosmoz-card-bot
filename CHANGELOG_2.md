# Changelog

Toutes les modifications importantes de **Krosmoz Card Bot** sont documentées dans ce fichier.

- Added → nouvelles fonctionnalités
- Changed → modifications importantes
- Fixed → corrections de bugs
- Improved → améliorations internes

## [0.37.0] - 2026-03-31

### Added

- **Nouveau set 🧊 Sberg** — 433 cartes
  - Distribution : 157 C, 109 U, 66 R, 37 SR, 28 HR, 18 UR, 11 S, 7 SSR
  - Pyramide de raretés C > U > R > SR > HR > UR > S > SSR respectée
  - Images importées et validées via le script d'import
  - Set ajouté dans `cards/sets.json`
  - Pity indépendant pour Sberg (comme les autres sets)

### Changed

- **`systems/setUnlockSystem.js`** — ajout de Sberg dans `SET_UNLOCK_CONFIG`
  - Débloqué au **niveau 96** ou à **70% de complétion de Katrepat**
  - Commentaire du fichier mis à jour avec la nouvelle règle
- **README.md** — tableau de déblocage mis à jour (ajout de la ligne Sberg)
  - Section "🧊 Distribution Sberg" ajoutée