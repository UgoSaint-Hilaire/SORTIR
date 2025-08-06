# Changelog de SORTIR 2

## [0.3.0] - 06.08.2025

### Ajouté

- Intégration drivers PostgreSQL et TypeORM
- Ajout du champ username pour les users
- Sauvegarde des tokens blacklistés en bdd

### Modifié

- Données RAM → PostgreSQL
- UsersService avec un pattern Repository

### Technique

- Dépendances : @nestjs/typeorm, typeorm, pg
- Configuration TypeORM avec synchronization
- Entités User et BlacklistedToken
- Méthodes findByEmail et findByUsername

## [0.2.0] - 06.08.2025

### Ajouté

- Système d'authentification JWT complet
- Module Auth : login, register, logout avec validation
- Module Users : gestion profils utilisateurs
- Hashage bcrypt des mots de passe
- Guards Passport (Local + JWT) pour protection routes
- Blacklist tokens pour le logout
- Gestion d'erreurs avec codes HTTP
- Variables d'environnement

### Technique

- Dépendances : @nestjs/passport, @nestjs/jwt, bcrypt, passport-local, passport-jwt
- Architecture modulaire auth/users séparée
- Configuration @nestjs/config pour variables environnement

## [0.1.0] - 31.07.2025

### Ajouté

- Configuration initiale
- Frontend Angular 20 avec routing et structure basique
- Backend NestJS avec API REST basqiue
- Configuration TypeScript pour frontend et backend
- Tests unitaires avec Jest (backend) et Jasmine/Karma (frontend)
- Workflows GitHub Actions pour le CI
- Workflow automatisation des tests de sécurité
- Début de la documentation technique

### Technique

- Synchronisation des versions à 0.1.0 entre frontend et backend
- Configuration de ESLint
- Configuration de Prettier

---

## MEMO : FORMATS POUR LA SUITE

### [Version] - Date

#### Ajouté

- Nouvelles fonctionnalités

#### Modifié

- Modifications de fonctionnalités existantes

#### Supprimé

- Fonctionnalités supprimées

#### Fix

- Corrections de bugs

#### Technique

- Précisions technique
