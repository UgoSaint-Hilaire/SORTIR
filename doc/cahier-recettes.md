# Cahier de Recettes

## Module Inscription

### Scénario 1 : Création de compte réussie

**En tant qu'utilisateur, je veux créer un compte pour accéder aux fonctionnalités personnalisées**

**Étapes :**

1. Je clique sur "S'inscrire"
2. Je saisis un nom d'utilisateur valide (ex: "jean123")
3. Je saisis un email valide (ex: "jean@example.com")
4. Je saisis un mot de passe conforme (ex: "MonMotDePasse123!")
5. Je clique sur "Créer le compte"

**Résultat attendu :**

- Compte créé avec succès
- Message de confirmation affiché
- Redirection vers la page d'accueil connectée

### Scénario 2 : Échec - Données invalides

**En tant qu'utilisateur, je veux être informé des erreurs de saisie**

**Étapes :**

1. Je saisis un nom d'utilisateur trop court (ex: "ab")
2. Je saisis un email invalide (ex: "email-invalid")
3. Je saisis un mot de passe faible (ex: "123")

**Résultat attendu :**

- Messages d'erreur spécifiques affichés
- Formulaire non soumis
- Champs en erreur surlignés

### Scénario 3 : Échec - Email déjà utilisé

**En tant qu'utilisateur, je veux être informé si l'email existe déjà**

**Étapes :**

1. Je saisis des données valides
2. J'utilise un email déjà enregistré

**Résultat attendu :**

- Message "Email déjà utilisé"
- Suggestion de connexion

## Module Connexion

### Scénario 1 : Connexion réussie

**En tant qu'utilisateur, je veux me connecter pour accéder à mon compte**

**Étapes :**

1. Je clique sur "Se connecter"
2. Je saisis mon email (ex: "jean@example.com")
3. Je saisis mon mot de passe correct
4. Je clique sur "Connexion"

**Résultat attendu :**

- Connexion réussie
- Token JWT généré
- Redirection vers la page d'accueil personnalisée

### Scénario 2 : Échec - Identifiants incorrects

**En tant qu'utilisateur, je veux être informé si mes identifiants sont erronés**

**Étapes :**

1. Je saisis un email correct
2. Je saisis un mauvais mot de passe
3. Je clique sur "Connexion"

**Résultat attendu :**

- Message d'erreur
- Formulaire reste affiché
- Pas de redirection

## Module Feed

### Scénario 1 : Consultation du feed public

**En tant qu'utilisateur NON CONNECTE, je veux voir les événements disponibles**

**Étapes :**

1. Je visite la page d'accueil
2. Je consulte la liste des événements affichés
3. Je clique sur "Voir plus" pour paginer

**Résultat attendu :**

- Liste d'événements avec image, titre, date, lieu
- Pagination fonctionnelle (20 événements par page)

### Scénario 2 : Feed personnalisé connecté

**En tant qu'utilisateur connecté, je veux voir des événements selon mes préférences**

**Étapes :**

1. Je me connecte à mon compte
2. J'accède à l'onglet "Pour vous"
3. Je consulte les événements qui correspondent à mes préférences

**Résultat attendu :**

- Événements filtrés selon mes préférences (genre, classification)
- Si aucune préférence : message d'information avec bouton redirigeant vers le profil pour éditer les préférences

### Scénario 3 : Consultation détail événement

**En tant qu'utilisateur, je veux voir tous les détails d'un événement**

**Étapes :**

1. Je clique sur un événement dans le feed
2. Je consulte la page de détail
3. Je visualise la carte de localisation

**Résultat attendu :**

- Informations complètes : nom, description, date, lieu, imagge
- Carte interactive avec marqueur
- Bouton retour vers le feed

## Module Historique

### Scénario 1 : Consultation historique utilisateur connecté

**En tant qu'utilisateur, je veux revoir les événements que j'ai consultés**

**Étapes :**

1. Je clique sur un événement pour afficher les détails
2. Je quitte la page avec le bouton de retour en arrière

**Résultat attendu :**

- L'historique s'affiche à droite du feed (ou dans la navbar si format tablette/mobile)
- Liste chronologique des événements consultés (plus récent en premier)
- Pas de doublons (un événement = une seule entrée)

### Scénario 2 : Re-consultation depuis l'historique

**En tant qu'utilisateur, je veux accéder aux détails d'un événement déjà vu**

**Étapes :**

1. Je clique sur un événement précédemment vu qui se trouve dans l'historique

**Résultat attendu :**

- Redirection vers la page de détail de l'événement cliqué
- Informations mises à jour si changements
- Pas de duplication dans l'historique

## Module Gestion des Préférences

### Scénario 1 : Configuration initiale des préférences

**En tant qu'utilisateur connecté, je veux définir mes préférences pour personnaliser mon feed**

**Étapes :**

1. Je me connecte à mon compte
2. Je clique sur "Profil"
3. Je navigue dans les onglets Musique/Sports/Arts
4. Je sélectionne mes catégories préférées (ex: Rock, Football, Théâtre)
5. Je clique sur "Enregistrer"

**Résultat attendu :**

- Préférences sauvegardées en base de données
- Feed "Pour vous" mis à jour avec les nouveaux critères, remplacement de l'ancien feed

### Scénario 2 : Modification des préférences existantes

**En tant qu'utilisateur, je veux modifier mes préférences déjà configurées**

**Étapes :**

1. J'accède à mon profil avec des préférences existantes
2. Je décoche certaines catégories
3. J'en ajoute de nouvelles dans d'autres onglets
4. Je sauvegarde les modifications

**Résultat attendu :**

- Anciennes préférences supprimées
- Nouvelles préférences ajoutées
- Feed personnalisé immédiatement rafraîchi

## Module Synchronisation des Événements

### Scénario 1 : Synchronisation manuelle par l'administrateur

**En tant qu'administrateur, je veux forcer une synchronisation des événements depuis Ticketmaster**

**Étapes :**

1. Je me connecte avec un compte administrateur
2. J'accède à l'endpoint POST `/events/sync/`
3. Je lance la rappatriation

**Résultat attendu :**

- Connexion à l'API Ticketmaster réussie
- Récupération des événements J+x
- Mise à jour des événements existants (syncedAt mis à jour)
- Réponse JSON avec stats (saved/updated/errors)

### Scénario 2 : Synchronisation automatique planifiée

**En tant que système, je veux synchroniser automatiquement les événements chaque jour**

**Étapes :**

1. Le cron job s'exécute automatiquement à 6h du matin
2. Le système récupère les événements J+60
3. Les données sont sauvegardées en base MongoDB

**Résultat attendu :**

- Exécution automatique via `@Cron("0 0 6 * * *")`
- Nouveaux événements ajoutés avec horodatage
- Événements existants mis à jour
- Logs de performance (durée d'exécution)
- Gestion des erreurs automatique

### Scénario 3 : Consultation des logs de synchronisation

**En tant qu'administrateur, je veux consulter l'historique des synchronisations**

**Étapes :**

1. Je me connecte en tant qu'admin
2. J'accède à l'endpoint GET `/scheduler/logs`
3. Je consulte les logs détaillés

**Résultat attendu :**

- Fichier de logs complet retourné (text/plain)
- Détails des jobs : heure, durée, statistiques
- Erreurs tracées avec stack traces
- Historique complet des synchronisations
