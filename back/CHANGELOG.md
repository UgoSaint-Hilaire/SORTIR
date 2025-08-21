# Changelog Backend - SORTIR

---

## [0.11.0] - 20.08.2025

### Ajouté

- Nouvelle route permettant la récupération des détails d'un évènement

### Modifié

- Service AuthService mis à jour pour inclure les préférences utilisateur lors de la connexion et l'inscription
- Tests unitaires mis à jour pour valider l'intégration des préférences

## [0.10.1] - 19.08.2025

### Modifié

- Fix du comportement des modifications des préférences, maintenant fonctionnel

## [0.10.0] - 18.08.2025

### Ajouté

- Intégration des préférences users dans la réponse d'authentification

### Modifié

- Service AuthService mis à jour pour inclure les préférences utilisateur lors de la connexion et l'inscription
- Tests unitaires mis à jour pour valider l'intégration des préférences

## [0.9.0] - 18.08.2025

### Ajouté

- Configuration des CORS (demandera surement un refacto)

### Modifié

- Refacto de la logique de la méthode getPublicFeed

### Technique

- getPublicFeed retourne maintenant 150 événements sans pagination
- mise en place de $sample
- suppression de la méthode shuffleArray

## [0.8.0] - 16.08.2025

### Ajouté

- Nouvelle gestion des rôles utilisateurs (membre et admin)
- Mise en place de guards protégeant des routes critiques admin :
  - `/scheduler/manual-schedule`
  - `/scheduler/logs`
  - `/events/sync`

### Modifié

- Réorganisation des ficheirs du module d'authenfication

### Technique

- Changement du port par défaut (anciennement 3000, maintenant 3001)
- Nouveau champs role dans la table users
- Migration de la base de données pour ajouter le champ role
- Mise à jour de certains test pour qu'ils prennent en compte le champs role
- Suppression des tests pas utiles sur les strategies de Passport

## [0.7.0] - 13.08.2025

### Ajouté

- CRON Jobs permettant la synchronisation événements J+60 à 6h tous les jours
- Service de logs dédié avec fichier `logs/scheduler.log`
- Tests unitaires ajoutés au module events

### Technique

- Dépendance @nestjs/schedule pour gestion cron jobs

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
