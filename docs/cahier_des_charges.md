# EventManager CDC

## 1. Présentation générale

EventManager est une application web destinée à la gestion d’événements internes en entreprise. Elle permet de centraliser la création d’événements, la gestion des inscriptions, le contrôle d’accès multi-zones via QR code ainsi que la communication en temps réel entre les participants.

## 2. Objectifs du projet

- Permettre à un organisateur de créer et administrer des événements internes depuis une interface unique
- Gérer les inscriptions des employés avec validation manuelle par l’organisateur
- Contrôler l’accès aux événements et à leurs zones à l’aide de QR codes uniques et vérifiés côté serveur
- Suivre en temps réel la présence des participants et l’historique des accès par zone
- Mettre à disposition un espace de discussion sécurisé pour les participants validés
- Fournir à l’organisateur des tableaux de suivi et des exports de données exploitables

## 3. Acteurs et rôles

### 3.1 Administrateur / Organisateur

Responsable de la gestion globale des événements.

Actions principales :

- Créer, modifier et supprimer des événements
- Définir les zones et leurs règles d’accès
- Gérer les demandes de participation
- Modérer les échanges du chat
- Consulter les statistiques et l’historique des accès
- Exporter les données

### 3.2 Participant

Employé de l’entreprise souhaitant participer à un événement.

Actions principales :

- Consulter les événements disponibles
- Demander une participation
- Recevoir un QR code après validation
- Accéder aux zones autorisées
- Participer au chat de l’événement

### 3.3 Agent de contrôle / Scanner

Responsable du contrôle d’accès sur site.

Actions principales :

- Scanner les QR codes (via import d’image ou caméra selon le support)
- Valider les accès par zone
- Détecter les tentatives de double utilisation
- Consulter l’historique des passages

## 4. Fonctionnalités fonctionnelles

### 4.1 Gestion des événements

- Création, modification et suppression d’événements
- Définition des informations principales : nom, date, lieu, capacité
- Gestion des zones associées à un événement
- Visualisation de la liste des participants

### 4.2 Inscriptions et gestion des accès

- Demande de participation par les participants
- Validation ou refus par l’organisateur
- Génération d'un QR code signé cryptographiquement après validation
- Association stricte du QR code au compte utilisateur
- Module de vérification par upload d'image QR code
- Vérification côté serveur de la signature et de l'identité
- Invalidation automatique après scan
- Prévention des doubles scans et de l'utilisation par un autre compte
- Historique des présences et accès

### 4.3 Chat événementiel

- Chat dédié à chaque événement
- Accès réservé aux participants validés
- Envoi et réception de messages en temps réel
- Conservation de l’historique des messages
- Outils de modération pour les organisateurs

### 4.4 Tableau de bord administrateur

- Suivi des participants
- Visualisation des passages et accès par zone
- Statistiques globales et détaillées
- Export des données au format CSV

## 5. Flux métier

1. L’organisateur crée un événement et définit les zones et règles d’accès.
2. Les participants consultent les événements disponibles.
3. Un participant envoie une demande de participation.
4. L’organisateur valide ou refuse la demande.
5. En cas de validation, un QR code signé cryptographiquement est généré et transmis au participant.
6. Le participant upload son QR code via le module de vérification.
7. Le serveur valide la signature cryptographique et l'identité de l'utilisateur.
8. Le participant est marqué comme "présent" et l'accès au chat en temps réel est activé.
9. Les accès sont enregistrés et consultables par l'organisateur.

## 6. Sécurité et authentification

L’application devra respecter les bonnes pratiques de sécurité enseignées et les recommandations de la CNIL.

### 6.1 Authentification

- Inscription et connexion sécurisées
- Gestion du mot de passe oublié
- Réinitialisation du mot de passe via un mécanisme sécurisé
- Politique de mot de passe fort (longueur minimale, complexité)
- Expiration périodique des mots de passe
- Blocage temporaire après tentatives de connexion infructueuses

### 6.2 Gestion des QR codes

- QR codes signés cryptographiquement pour garantir leur authenticité
- QR codes uniques et non falsifiables
- Vérification côté serveur obligatoire avec validation de la signature
- Association stricte au compte utilisateur
- Invalidation automatique après scan
- Impossibilité d'utilisation par un autre compte
- Protection contre les tentatives de réutilisation

## 7. Architecture technique

### 7.1 Frontend

- Application web moderne
- Interface utilisateur accessible et responsive

### 7.2 Backend

- API exposant les fonctionnalités métier
- Gestion des droits et des rôles
- Gestion des échanges temps réel

### 7.3 Base de données

- Stockage des utilisateurs, événements, accès et messages
- Historisation des données critiques

## 8. Infrastructure et déploiement

- Utilisation de conteneurs pour l’ensemble des services
- Déploiement sur un serveur distant accessible publiquement
- Mise en place d’un nom de domaine avec certificat SSL valide
- Sécurisation des accès réseau et des ports exposés
- Infrastructure reproductible via des outils d’automatisation

## 9. Observabilité et supervision

L’application devra intégrer des mécanismes permettant :

- Le suivi de l’état de santé des services
- La détection et le signalement des erreurs applicatives
- La collecte de données analytiques d’usage

## 10. Tests et qualité

- Tests unitaires sur la logique métier
- Tests fonctionnels sur les parcours critiques
- Tests d’interface utilisateur sur les fonctionnalités principales

La couverture devra être suffisante pour garantir la stabilité et la maintenabilité du projet.

## 11. Design et accessibilité

- Interface claire et cohérente
- Respect des bonnes pratiques UX
- Accessibilité pour les utilisateurs à mobilité réduite
- Respect des standards web pour le référencement

## 12. Conformité légale et RGPD

- Mise à disposition des pages légales obligatoires
- Politique de confidentialité et de gestion des données
- Gestion du consentement pour les cookies
- Respect des droits des utilisateurs sur leurs données

## 13. Gestion de projet

Le projet sera conduit selon une méthodologie Agile :

- Répartition équitable des tâches
- Suivi régulier de l’avancement
- Utilisation d’un outil de gestion de projet
- Historique clair des contributions

## 14. Sauvegarde et reprise des données

- Mise en place d’une politique de sauvegarde respectant la règle 3-2-1
- Sauvegarde des bases de données et fichiers non générés
- Possibilité de restauration en cas d’incident

## 15. Livrables attendus

- Dépôt Git contenant l’ensemble du code source
- Documentation permettant l’installation et l’exécution locale du projet
- Historique des contributions de chaque membre du groupe
- Présentation finale du projet
