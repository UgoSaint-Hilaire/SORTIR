# Documentation - CI/CD - Environnements de Déploiement et de Test

## CI/CD - Intégration Continue

### Protocole d'Intégration

Le projet utilise **GitHub Actions** avec deux workflows qui sont automatisés.

#### Pipeline CI/CD (`.github/workflows/ci.yml`)

**Déclencheurs :**

- Push sur branches `main`, `feat/*`, `fix/*`
- Pull Requests vers `main`

**Séquences d'intégration :**

**1. Backend** (Node.js 20.x)

- Checkout du code source
- Installation des dépendances (`npm ci`)
- Linting du code (`npm run lint`)
- Tests unitaires (`npm run test`)
- Couverture de tests (`npm run test:cov`)
- Build de production (`npm run build`)
- Upload des artefacts

**2. Frontend** (Node.js 20.x)

- Checkout du code source
- Installation des dépendances (`npm ci`)
- Linting du code (`npm run lint`)
- Tests unitaires (ChromeHeadless)
- Couverture de tests
- Build de production (`npm run build`)
- Upload des artefacts

**3. Notification** (après backend + frontend)

- Statut de succès/échec
- Messages de notification dans les logs

#### Audit de Sécurité (`.github/workflows/security.yml`)

**Déclencheurs :**

- Planifié : Chaque lundi à 9h00 UTC
- Push/PR sur branches principales

**Séquence de sécurité :**

- **CodeQL Analysis** : Analyse statique du code TypeScript
- **Backend Security Audit** : `npm audit --audit-level=moderate`
- **Frontend Security Audit** : `npm audit --audit-level=moderate`
- **Rapport de sécurité** : Synthèse des vulnérabilités détectées

---

### Environnements Hébergés (Railway)

Le projet est hébergés avec Railway et utilise plusieurs environnements :

#### Environnement preview & tests : utilisé pour les démos et les tests

- **URL Backend :** `https://sortir-api-pt.up.railway.app/`
- **URL Frontend :** `https://sortir-pt.up.railway.app/`
- **Bases de données :** MongoDB Atlas (cluster de test) et PSQL
- **Déploiement :** Déploiement AUTOMATIQUE depuis `main`, attend que le CI se termine sans erreur pour ensuite déployer l'application

#### Environnement de Production

- **URL Backend :** `https://sortir-api.up.railway.app/`
- **URL Frontend :** `https://sortir.up.railway.app/`
- **Base de données :** MongoDB Atlas (cluster de production) et PSQL
- **Déploiement :** Déploiement MANUEL depuis `release/*`, attend que le CI se termine sans erreur pour ensuite déployer l'application

**Configuration Railway :**

- **Runtime :** Node.js 20.x
- **Build automatique :** Détection des modifications Git
- **Variables d'environnement :** Séparées par environnement
- **Monitoring :** Logs en temps réel + métriques de performance

---

## Environnements de développement local

### Sur mon poste de dev :

**Éditeur de code :** Visual Studio Code
**Extensions principales utilisées :**

- TypeScript and JavaScript Language Features
- Angular Language Service
- NestJS Files
- ESLint
- Prettier
- Gitlens
- Axe Accessibility Linter
- Echo API (même utilisation que postman/bruno)

**Runtime :** Node.js v20.x (défini dans les workflows CI/CD)
**Gestionnaire de paquets :** npm

### Installation Locale

```bash
# Backend
cd back/
npm install
npm run start:dev

# Frontend
cd front/
npm install
ng serve
```

## Composants Techniques

### Compilateurs

**Backend :**

- **TypeScript Compiler** (`tsc`) via NestJS CLI
- **Configuration :** `tsconfig.json`, `tsconfig.build.json`
- **Build :** `nest build` (compilation vers `dist/`)

**Frontend :**

- **Angular Compiler** (`ngc`) + Webpack
- **Configuration :** `angular.json`, `tsconfig.app.json`
- **Build :** `ng build` (compilation vers `dist/front/`)

### Serveurs d'Application

r
**Backend :**

- **Framework :** NestJS (Express.js sous-jacent)
- **Port de développement :** 3000 (par défaut)
- **Mode production :** `node dist/main.js`

**Frontend :**

- **Framework :** Angular 20.x
- **Serveur de développement :** Angular Dev Server
- **Production :** Fichiers statiques à servi

### Outils de Gestion de Sources

**Version Control System :** Git
**Branches :**

- `main` : branche principale
- `feat/*` : nouvelles fonctionnalités
- `fix/*` : corrections de bugs
- `cleanup/*` : refacto
- `release/*` : branche de release vers l'environnement de production

---

## Protocoles de Déploiement

### Séquence de Développement

1. **Installation des dépendances**

   ```bash
   npm install  # ou npm ci en CI
   ```

2. **Développement local**

   ```bash
   npm run start:dev  # backend
   npm start          # frontend
   ```

3. **Tests en continu**
   ```bash
   npm run test:watch
   ```

### Séquence d'Intégration Continue

1. **Validation du code**

   ```bash
   npm run lint       # ESLint + auto-fix
   ```

2. **Tests unitaires**

   ```bash
   npm test           # Jest (backend) / Jasmine+Karma (frontend)
   ```

3. **Couverture de tests**

   ```bash
   npm run test:cov   # Génération rapport de couverture
   ```

4. **Build de production**

   ```bash
   npm run build      # Compilation optimisée
   ```

5. **Validation des artefacts**
   - Vérification de la taille des bundles
   - Upload vers GitHub Actions

## Critères de Qualité et Validation

### Outils de Suivi de Qualité

**Linting :**

- **ESLint** avec règles TypeScript strictes
- **Auto-fix** activé sur les règles corrigeables
- **Configuration :** `eslint.config.mts`

**Tests :**

- **Backend :** Jest avec couverture > 80%
- **Frontend :** Jasmine + Karma avec couverture > 80%
- **Mode headless :** ChromeHeadless pour les performances

**Formatage :**

- **Prettier** pour la cohérence du code
- **Configuration :** automatique via ESLint

### Critères de Validation

**Qualité minimale requise :**

- Linting sans erreur
- Tests unitaires > 80% de couverture
- Build sans erreur
- Audit de sécurité sans vulnérabilité critique

**Performance minimale requise :**

- Build frontend < 10 minutes
- Tests backend < 5 minutes
- Taille bundle optimisée (lazy loading Angular)
