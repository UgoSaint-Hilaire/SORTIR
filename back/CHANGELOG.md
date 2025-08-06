# Changelog Backend - SORTIR

## [0.3.0] - 06.08.2025

### Ajouté

- Intégration PostgreSQL + TypeORM
- Champ username pour les utilisateurs
- Persistance tokens blacklistés en base
- Variables d'environnement base de données

### Modifié

- Migration données RAM → PostgreSQL
- UsersService avec Repository pattern

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
- Blacklist tokens pour logout sécurisé
- Gestion d'erreurs avec codes HTTP

### Technique

- Dépendances : @nestjs/passport, @nestjs/jwt, bcrypt, passport-local, passport-jwt
- JWT expiration 24h configurable
- Architecture modulaire auth/users séparée
- Configuration @nestjs/config pour variables environnement

## [0.1.0] - 31.07.2025

### Ajouté

- Configuration initiale NestJS
- API REST basique
- Configuration TypeScript
- Tests unitaires avec Jest
- Configuration ESLint et Prettier
