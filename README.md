# EventManager

EventManager est une application web destinée à la gestion d’événements internes en entreprise. Elle permet aux organisateurs de créer, gérer et suivre des événements tout en offrant aux participants une expérience fluide et sécurisée.

## Fonctionnalités principales

### Pour les organisateurs

- Création, modification et suppression d’événements.
- Gestion des inscriptions avec validation manuelle.
- Contrôle d’accès aux zones via QR codes uniques.
- Suivi en temps réel des participants et des accès.
- Tableau de bord avec statistiques et export des données.
- Modération des discussions dans le chat événementiel.

### Pour les participants

- Consultation des événements disponibles.
- Demande de participation avec validation par l’organisateur.
- Accès sécurisé aux zones autorisées via QR codes.
- Participation aux discussions dans un chat dédié.

### Pour les agents de contrôle

- Scan des QR codes pour valider les accès.
- Détection des tentatives de double utilisation.
- Consultation de l’historique des passages.

## Architecture technique

- **Frontend** : Application web moderne, responsive et accessible.
- **Backend** : API REST avec gestion des rôles et des droits.
- **Base de données** : Stockage des utilisateurs, événements, accès et messages.
- **Infrastructure** : Conteneurisation et déploiement sécurisé avec SSL.

## Sécurité et conformité

- Authentification sécurisée avec politique de mot de passe fort.
- QR codes uniques et vérifiés côté serveur.
- Conformité RGPD avec gestion des données personnelles et consentement.