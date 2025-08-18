# Changelog Frontend - SORTIR

---

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
