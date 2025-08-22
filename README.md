# SORTIR - Agrégateur d'événements

> [!NOTE]  
> Ce projet est un PROTOTYPE réalisé dans le cadre de la validation du bloc 2 de la certification RNCP39583 - Expert en Développement Logiciel.
> Ce projet est voué à évoluer jusqu'à la présentation devant le jury qui se déroulera le 17 septembre.

## Liens vers les environnements:

- ⭐ preview & test : https://sortir-pt.up.railway.app/
- production : https://sortir.up.railway.app/

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

- Node.js 20+
- PostgreSQL 13+
- MongoDB 5.0+

### Configuration

```bash
# Cloner le projet
git clone <repo-url>
cd SORTIR

# Backend
cd back/
npm install
nest start -w || npm run start:dev

# Frontend
cd front/
npm install
ng serve || npm start
```

> [!IMPORTANT]  
> Il vous faudra une base de donnée PSQL et MongoDB correctement configurées avec les variables
> se trouvant dans back/.env, sinon le serveur ne démarrera pas👇👇👇

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

- **Alimentation de la base MongoDB** sécurisé grâce au rôle 'admin'
  - enpoint pour faire un premier batch de récupération
  - scheduler automatique venant alimenter la bdd chaques jours à 6h pétante
- **Découverte d'événements et flux personnalisés**
  - plusieurs feed mis en place
  - mise en place d'un loader 'infini'
  - page de chaque événément
  - gestion d'état complexe
- **Historique**
- **Authentification utilisateur** sécurisée
- **Gestion des préférences**
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

- [Protocole CI/CD et environnements](./doc/CI-CD-environnements.md)
- [Manuel déploiement](./doc/manuel-deploiement-maj.md)
- [Sécurité OWASP](./doc/securite-owasp.md)
- [Accessibilité](./doc/accessibilite.md)
