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
  - Fragments des 7 SSR Sberg disponibles automatiquement via `/fragments rebuild-index`

### Changed

- **`systems/setUnlockSystem.js`** — ajout de Sberg dans `SET_UNLOCK_CONFIG`
  - Débloqué au **niveau 96** ou à **70% de complétion de Katrepat**
  - Commentaire du fichier mis à jour avec la nouvelle règle
- **`README.md`** — mis à jour intégralement
  - Introduction : 2349 cartes, 7 sets (ajout de Sberg)
  - Tableau des sets : ligne `🧊 Sberg | 433` ajoutée
  - Section `### 🧊 Distribution Sberg` ajoutée après Katrepat
  - Tableau de déblocage : ligne `🧊 Sberg | 96 | Katrepat ≥ 70%` ajoutée
- **`systems/achievements/achievementCollection.js`** — `unique674` mis à jour
  - Description et condition corrigées : `1916` → `2349` cartes uniques (ajout de Sberg)

### Fixed

- **Double-comptage de `packsOpened`** (`systems/packEngine.js`)
  - `user.stats.packsOpened++` était appelé dans `openPack()` À CHAQUE pack individuel, alors que `krosmoz.js` incrémentait déjà `packsOpened += packCount` avant la boucle
  - Résultat : pour 5 packs ouverts, `packsOpened` était incrémenté de 10 au lieu de 5 — tous les achievements "Packs ouverts" (`pack50`, `pack100`…) se débloquaient deux fois trop tôt
  - Fix : suppression du `packsOpened++` dans `packEngine.js` — `krosmoz.js` reste la seule source de vérité pour ce compteur

- **Affichage incorrect du total "Packs ouverts"** (`commands/joueur/mystats.js`)
  - Le total global utilisait `s.packsOpened` (gonflé par le double-comptage) au lieu de `krosmozOpened + eventPacksOpened`
  - Exemple concret : 129 krosmoz + 16 event affichait **274** au lieu de **145**
  - Fix : `totalPacksOpened = krosmozOpened + eventOpened`, calculé une seule fois et réutilisé sur les pages Général, Packs & RNG et Events
  - Le taux SSR réel est également recalculé sur ce total corrigé

- **Succès palindrome déclenché dès la 1ère carte** (`systems/packEngine.js`)
  - `isPalindrome()` retournait `true` pour tout chiffre à 1 digit (1, 2, 3… 9 sont des palindromes), déclenchant le succès "Symétrie Parfaite" immédiatement pour chaque joueur
  - Fix : ajout de `s.length >= 2` dans `isPalindrome()` — premier palindrome atteignable : 11 cartes
  - Cohérent avec `levelPalindrome` dans `achievementLevel.js` qui appliquait déjà cette protection