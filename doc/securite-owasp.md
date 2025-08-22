# Sécurité - OWASP Top 10 2021

## A01 - Broken Access Control

**Vulnérabilité :** Contrôle d'accès défaillant permettant aux utilisateurs d'agir en dehors de leurs permissions.

**Éléments mis en place :**

- Guards JWT sur toutes les routes protégées (`@UseGuards(JwtAuthGuard)`)
- Système de rôles avec `@Roles()` decorator et `RolesGuard`, plusieurs rôles mis en place (member vs admin)
- Validation du token JWT dans `JwtStrategy`
- Blacklist des tokens JWT
- Filtrage des données par utilisateur dans les services

## A02 - Cryptographic Failures

**Vulnérabilité :** Échecs cryptographiques exposant des données sensibles.

**Éléments mis en place :**

- Hashage bcrypt avec salt=10 pour tous les mots de passe
- Stockage sécurisé du JWT_SECRET en variable d'environnement
- Pas de stockage de données sensibles en clair
- JWT avec payload minimal (userId, email uniquement)

## A03 - Injection

**Vulnérabilité :** Injection de code malveillant (SQL, NoSQL, XSS).

**Éléments mis en place :**

- Validation stricte avec class-validator (`@IsEmail`, `@IsString`, `@MinLength`)
- DTO pour register : username min 3 chars, email valide, password min 8 chars
- DTO pour feed : validation des paramètres de pagination
- Utilisation de TypeORM/Mongoose avec requêtes paramétrées

## A04 - Insecure Design

**Vulnérabilité :** Défauts de conception dans l'architecture de sécurité.

**Éléments mis en place :**

- Rate limiting global : 10 requêtes/seconde maximum
- Rate limiting auth spécifique :
  - Login : 5 tentatives/minute, 20/15min
  - Register : 3 tentatives/minute, 10/15min
- Blacklist des tokens JWT avec entity `BlacklistedToken`
- Logging des tentatives d'authentification avec `AuthLoggerService`
- Gestion des erreurs sans exposition d'informations sensibles

## A05 - Security Misconfiguration

**Vulnérabilité :** Configurations de sécurité inappropriées ou par défaut

**Éléments mis en place :**

- CORS configuré avec origin spécifique (`app.enableCors()`)
- Variables d'environnement
- Configuration ThrottlerModule dans app.module

## A06 - Vulnerable Components

**Vulnérabilité :** Utilisation de composants avec des vulnérabilités connues

**Éléments mis en place :**

- Audit npm automatique
- GitHub Actions : workflow security.yml
- CodeQL analysis pour détection de vulnérabilités
- Audit backend et frontend séparément
- Surveillance hebdomadaire planifiée (lundis 9h UTC)

## A07 - Authentication Failures

**Vulnérabilité :** Défaillances d'authentification et de gestion de session

**Éléments mis en place :**

- Stratégies Passport : LocalStrategy et JwtStrategy
- Vérification token blacklist dans `JwtStrategy.validate()`
- Logout sécurisé avec ajout token en blacklist
- Rate limiting spécifique sur auth (login/register)
- Logging des échecs d'authentification avec IP
- Exception `TooManyRequestsException` personnalisée

## A08 - Software Integrity Failures

**Vulnérabilité :** Défaillances d'intégrité des logiciels et données

**Éléments mis en place :**

- Vérification package-lock.json avec `npm ci`
- Pipeline CI/CD avec tests obligatoires avant déploiement
- `SchedulerLoggerService` pour traçabilité des synchronisations
- Logs des succès/échecs de sync avec compteurs
- Intégrité des builds Railway après validation CI

## A09 - Logging Failures

**Vulnérabilité :** Échecs de journalisation et de surveillance

**Éléments mis en place :**

- `AuthLoggerService` dédié aux événements de sécurité
- Logs structurés avec types d'événements (`rate_limit_exceeded`)
- Fichiers de logs séparés : `auth-security.log`, `scheduler.log`
- Logging des connexions/déconnexions avec email/IP
- Monitoring Railway en temps réel avec métriques

## A10 - Server-Side Request Forgery

**Vulnérabilité :** Requêtes forgées côté serveur vers des ressources internes

**Éléments mis en place :**

- Validation domaines autorisés dans `TicketmasterService`
- Limitation aux API externes officielles (app.ticketmaster.com)
- Pas de requêtes vers ressources internes depuis l'utilisateur
- Rate limiting sur API externes pour éviter les abus
- Timeouts configurés pour les requêtes externes
