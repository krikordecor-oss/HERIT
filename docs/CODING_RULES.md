# THERMOS Coding Rules

## Architecture

- Un composant = un fichier.
- Une interface = un fichier.
- Un hook = un fichier.
- Un service = un fichier.
- Aucun composant de plus de 150 lignes.
- Aucun fichier de plus de 300 lignes.
- Toujours privilégier la composition.

---

## TypeScript

- Strict mode obligatoire.
- Aucun any sauf justification.
- Interfaces documentées.
- Props fortement typées.

---

## React

- Composants fonctionnels uniquement.
- Pas de logique métier dans les composants.
- Toute logique métier va dans services/.

---

## Design

- Style Apple / Stripe.
- Responsive.
- Accessibilité.
- Dark mode compatible.

---

## IA

Claude Code ne prend jamais d'initiative d'architecture.

Il suit uniquement les documents présents dans /docs.

Toute décision d'architecture doit être validée.