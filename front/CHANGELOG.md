# Changelog Frontend - SORTIR

---

## [1.0.0] - 22.08.2025

### Modifié

- Revue et amélioration de l'accessibilité selon les critères RGAA
- Modification de la mire d'authentification afin d'améliorer l'ux, cohérence des messages d'erreur avec l'api
- Correction de l'affiche de l'historique dans le menu hamburger
- Correction diverses de de configurations d'environnements

---

## [0.7.0] - 21.08.2025

### Ajouté

- Possibilité d'avoir accès à l'historique des événements au format tablette/smartphone

### Modifié

- Reorganisation totale de l'ancien menu vertical vers un menu horizontal

---

## [0.6.0] - 20.08.2025

### Ajouté

- Mise en place des détails de l'événement
- Intégration des informations et ajouts de la carte
- Nouvelle sidebar qui gère depuis le cache de session les événements consultés
- Gestion automatique du rafraichissement et de la suppresion de l'historique

### Modifié

- Correction de certains tests bloquant

### Techniques

- Ajout de la dépendance maplibre-gl v5.6.2
- Remanie du layout de l'application permettant une meilleure responsivité(?)

---

## [0.5.0] - 19.08.2025

### Ajouté

- Implémentation du feed basé sur les préférences de l'utilisateur nécessitant que l'utilisateur soit connecté pour y avoir accès
- Mise en place d'un cache pour optimiser la vitesse et limiter le nombre d'appel
- Ajout des badges de genre sur les cartes événements

### Modifié

- Nouvelle navigation

---

## [0.4.0] - 18.08.2025

### Ajouté

- Interface profil utilisateur
- Selecteur de gestion des préférences
- Mise en place d'un guard d'authentification

---

## [0.3.0] - 18.08.2025

### Ajouté

- Interface d'authentification
- Composant AuthComponent pour connexion et inscription avec modal responsive
- Support des tokens JWT avec validation d'expiration auto
- Navbar verticale compacte avec icônes et tooltips (à refacto)

### Modifié

- Enrichissement du module auth avec gestion des préférences
- Réorganisation de l'architecture : déplacement du module auth vers core/auth
- Tests unitaires complets pour les services et composants d'authentification

### Technique

- Persistance localStorage pour les jwt
- Validation JWT côté client avec vérification d'expiration

## [0.2.0] - 18.08.2025

### Ajouté

- Cache client intelligent évitant les requêtes excessives vers le back
- Scroll 'infini' optimisé avec le cache local sur le feed d'événements
- Configuration des environnements de dev ou prod

### Modifié

- Routing simplifié avec le contenu principal sur la racine /

### Technique

- Cache côté client, implémentation avec Map + TTL automatique et signals Angular
- **Lazy loading** : optimisation des bundles avec chargement à la demande

---

## [0.2.0] - 17.08.2025

### Ajouté

- Mise en place d'un cache intelligent pour éviter les requêtes excessives vers le back (ttl de 15 minutes)
- Scroll 'infini' sur le feed d'événements

### Modifié

- Modification du routing

## [0.1.0] - 31.07.2025

### Ajouté

- Configuration initiale Angular 20
- Routing et structure basique
- Configuration TypeScript
- Tests unitaires avec Jasmine/Karma
- Configuration ESLint et Prettier
