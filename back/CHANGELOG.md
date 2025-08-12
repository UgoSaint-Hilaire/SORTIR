# Changelog Backend - SORTIR

## [0.6.0] - 12.08.2025

### Ajouté

- Module Feed pour les recommandations d'événements
- Feed cutomisé selon les préférences utilisateurs
- Feed de découverte pour explorer de nouveaux genres (pour l'instant pas utilisé)
- Feed public pour les utilisateurs non connectés
- Filtrage par genres et segments dans le feed complet
- Tests unitaires pour le les fonctionnalités du Feed

### Technique

- DTOs pour requêtes et réponses standardisées

## [0.5.0] - 12.08.2025

### Ajouté

- Gestion des préférences utilisateurs (POST, GET, DELETE)
- Tests unitaires pour les fonctionnalités de préférences

### Modifié

- Modification du profil utilisateur : affichage des préférences
- Réorganisation de l'architecture du module Users avec des sous-dossiers

### Technique

- Nouvelle table PSQL 'user_preferences' avec clés étrangères
- Nouvelle entité UserPreference qui fait le lien avec la DB

## [0.4.1] - 11.08.2025

### Ajouté

- Ajout tests module events

### Modifié

- Réorganisation de l'architecture du module Events avec des sous-dossiers
- Correction du bug getClassificationName qui retournait undefined pour segment et genre

## [0.4.0] - 11.08.2025

### Ajouté

- Module Events pour la gestion des événements
- Service TicketmasterService pour récupérer les évents depuis l'API externe
- Service EventsService pour gérer la persistance avec MongoDB
- Controller avec endpoints /events/sync et /events/stats

### Technique

- Séparation des responsabilités dans deux services : API externe vs persistance
- Gestion des erreurs avec BadRequestException et InternalServerErrorException
- Intégration MongoDB avec Mongoose pour stockage événements

## [0.3.1] - 07.08.2025

### Technique

- Ajout tests module auth
- Ajout tests module users

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
