# Changelog Global - SORTIR

## Notes

Pour avoir un apperçu plus spécifiques des changements, consulter les docs de chaque composant :

- Voir [Backend CHANGELOG](./back/CHANGELOG.md)
- Voir [Frontend CHANGELOG](./front/CHANGELOG.md)\*

---

## [0.8.0] - [back 0.10.0 | front 0.3.0] - 18.08.2025

### Ajouté

- Interface feed fonctionnelle
- Navbar et authentification fonctionnelle

---

## [0.7.0] - [back 0.8.0 | front 0.2.0] - 16.08.2025

### Ajouté

- Gestion des rôles des utilisateurs
- Sécurisation de certaines routes pour permettre un accès aux administrateurs seulement

---

## [0.6.0] - [back 0.7.0] - 14.08.2025

### Ajouté

- Mise en place d'un job récupérant les événements ticketmaster sur J60 périodiquement (tous les jours à 6h)
- Visualisation des logs possible depuis une route dédiée pour les admins

---

## [0.5.0] - [back 0.6.0] - 12.08.2025

### Ajouté

- Ajout d'un feed customisé selon les préférences des utilisateurs connectés
- Ajout d'un feed basique pour les utilisateurs pas connectés
- Système de filtres mis en place

---

## [0.4.0] - [back 0.5.0] - 11.08.2025

### Ajouté

- Gestion des préférences des types d'événements des utilisateurs

### Technique

- Mise en place d'une nouvelle table 'user_preferences'
- Enrichissement des tests du module Users

---

## [0.3.0] - [back 0.4.0/0.4.1] - 11.08.2025

### Ajouté

- Mise en place du module de rapatriation des événements ticketmaster
- Stockage des événements dans la base MongoDB

### Technique

- Mise en place de la bdd locale MongoDB
- Ajouts des tests module events

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
