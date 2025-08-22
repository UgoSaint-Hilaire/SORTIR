# SORTIR

## Table des Matières

1. [Technologies](#technologies)
2. [Installation](#installation)
3. [Utilisation](#utilisation)
4. [Fonctionnalités](#fonctionnalités)
5. [API Endpoints](#api-endpoints)
6. [Tests](#tests)
7. [Documentation](#documentation)

## Technologies

### Backend

- **NestJS 11** - Framework Node.js
- **PostgreSQL** - Base utilisateurs et authentification
- **MongoDB** - Base événements
- **JWT** - Authentification
- **TypeORM** + **Mongoose** - ORM/ODM

### Frontend

- **Angular 20** - Framework frontend
- **TailwindCSS** + **DaisyUI** - Interface utilisateur
- **MapLibre GL** - Cartes interactives
- **RxJS** - Programmation réactive

## Installation

### Prérequis

- Node.js 18+
- PostgreSQL 13+
- MongoDB 5.0+

### Configuration

```bash
# Cloner le projet
git clone <repo-url>
cd SORTIR

# Backend
cd back/
cp .env.example .env
npm install
npm run start:dev

# Frontend
cd front/
npm install
npm start
```

### Variables d'environnement

Créez `.env` dans `back/` :

```bash
NODE_ENV=development
PORT=3001
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=sortir_user
DB_PASSWORD=password
DB_DATABASE=sortir_db
MONGODB_URI=mongodb://localhost:27017/sortir_events
JWT_SECRET=your-secret-key
TICKETMASTER_API_KEY=your-api-key
ALERT_EMAIL=votre_email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=meme_email_que_dessus
SMTP_PASS=mot_de_passe_application

```

## Utilisation

### Développement

```bash
# Backend (port 3001)
cd back/
npm run start:dev

# Frontend (port 4200)
cd front/
ng serve
```

### Production

```bash
# Build
npm run build

# Démarrage
npm run start:prod
```

## Fonctionnalités

- **Découverte d'événements** via API Ticketmaster
- **Authentification utilisateur** sécurisée
- **Flux personnalisés** selon préférences
- **Géolocalisation** et cartes interactives
- **Interface responsive** mobile/desktop

## API Endpoints

### Authentification (`/auth`)

- `POST /auth/login` - Connexion utilisateur
  - Body: `{ email, password }`
  - Response: JWT token + user info
- `POST /auth/register` - Inscription utilisateur
  - Body: `{ username, email, password }`
  - Response: JWT token + user info
- `POST /auth/logout` - Déconnexion utilisateur
  - Headers: `Authorization: Bearer <token>`
  - Response: Success message

### Utilisateurs (`/users`)

- `GET /users/profile` - Profil utilisateur connecté
  - Headers: `Authorization: Bearer <token>`
  - Response: User profile data
- `GET /users/preferences` - Préférences utilisateur
  - Headers: `Authorization: Bearer <token>`
  - Response: Liste des préférences (genres)
- `POST /users/preferences` - Créer préférences
  - Headers: `Authorization: Bearer <token>`
  - Body: `{ classificationId, classificationName }`
  - Response: Préférences créées
- `DELETE /users/preferences/:id` - Supprimer préférence
  - Headers: `Authorization: Bearer <token>`
  - Response: 204 No Content

### Événements (`/events`)

- `GET /events/:id` - Détail d'un événement
  - Response: Données complètes de l'événement
- `POST /events/sync` - Synchroniser événements Ticketmaster (Admin)
  - Headers: `Authorization: Bearer <token>` (role admin)
  - Body: `{ days?: number }` (1-365 jours)
  - Response: Statistiques de synchronisation
- `GET /events/stats` - Statistiques de rapatriation événements (Admin)
  - Headers: `Authorization: Bearer <token>` (role admin)
  - Response: Nombre total d'événements

### Flux d'événements (`/feed`)

- `GET /feed` - Flux personnalisé utilisateur
  - Headers: `Authorization: Bearer <token>`
  - Query: `page, limit, city, genre, startDate, endDate`
  - Response: Événements selon préférences
- `GET /feed/all` - Tous les événements
  - Headers: `Authorization: Bearer <token>`
  - Query: `page, limit, city, genre, startDate, endDate`
  - Response: Liste complète des événements
- `GET /feed/discovery` - Flux de découverte
  - Headers: `Authorization: Bearer <token>`
  - Query: `page, limit, city, genre, startDate, endDate`
  - Response: Événements hors préférences
- `GET /feed/public` - Flux public (sans authentification)
  - Query: `page, limit, city, genre, startDate, endDate`
  - Response: Événements publics

### Planificateur (`/scheduler`)

- `POST /scheduler/manual-schedule` - Lancement manuel synchronisation (Admin)
  - Headers: `Authorization: Bearer <token>` (role admin)
  - Response: Status de la tâche
- `GET /scheduler/logs` - Logs du planificateur (Admin)
  - Headers: `Authorization: Bearer <token>` (role admin)
  - Response: Historique des synchronisations

### Santé (`/health`)

- `GET /health` - Status de l'application
  - Response: `{ status: "ok", info: { database, mongodb } }`
- `GET /health/test-alert` - Test des alertes (Debug)
- `GET /health/simulate-critical` - Simulation erreur critique (Debug)

## Tests

```bash
# Backend
cd back/
npm test
npm run test:cov

# Frontend
cd front/
npm test
npm run test:cov

```

## Documentation

- [Manuel déploiement](./doc/manuel-deploiement-maj.md)
- [Documentation technique](./doc/documentation-technique-exploitation.md)
- [Sécurité OWASP](./doc/securite-owasp.md)
- [Accessibilité](./doc/accessibilite.md)
