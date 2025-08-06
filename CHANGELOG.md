# Changelog Global - SORTIR

## Notes

Pour les changements spécifiques à chaque composant :

- Voir [Backend CHANGELOG](./back/CHANGELOG.md)
- Voir [Frontend CHANGELOG](./front/CHANGELOG.md)

---

## [0.2.0] - [back 0.2.0/0.3.0/0.3.1] - 06.08.2025

### Ajouté

- Mise en place sécurisée de l'api d'authentification : register, login, logout
- Mise en place sécurisée de l'api d'affichage profil user

### Technique

- Mise en place de la bdd locale psql
- Mise en place de la persistence des users en base
- Mise en place de la persistence des tokens blacklistés jwt en base
- Ajouts des tests module users
- Ajouts des tests module auth

---

## [0.1.0] - 31.07.2025

### Ajouté

- Configuration initiale du projet
- Frontend Angular 20 avec routing et structure basique
- Backend NestJS avec API REST basique
- Configuration TypeScript pour frontend et backend
- Tests unitaires avec Jest (backend) et Jasmine/Karma (frontend)
- Workflows GitHub Actions pour le CI/CD
- Workflow automatisation des tests de sécurité

### Technique

- Synchronisation des versions à 0.1.0 entre frontend et backend
- Configuration ESLint et Prettier
- Structure monorepo avec front/ et back/

---
