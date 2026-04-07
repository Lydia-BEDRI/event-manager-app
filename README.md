# EventManager

[![CI](https://github.com/Lydia-BEDRI/event-manager-app/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/Lydia-BEDRI/event-manager-app/actions/workflows/ci.yml)

EventManager est une application web destinée à la gestion d’événements internes en entreprise. Elle permet aux organisateurs de créer, gérer et suivre des événements tout en offrant aux participants une expérience fluide et sécurisée.

## Fonctionnalités principales

### Pour les organisateurs

- Création, modification et suppression d’événements.
- Gestion des inscriptions avec validation manuelle.
- Génération de QR codes signés cryptographiquement pour les participants validés.
- Suivi en temps réel des participants et des présences.
- Tableau de bord avec statistiques et export des données.
- Modération des discussions dans le chat événementiel.

### Pour les participants

- Consultation des événements disponibles.
- Demande de participation avec validation par l’organisateur.
- Réception d'un QR code signé cryptographiquement après validation.
- Upload du QR code pour valider la présence via l'application web.
- Participation aux discussions dans un chat dédié après validation de présence.

### Module de vérification de présence

- Vérification par upload d'image QR code depuis l'application web.
- Validation côté serveur de la signature cryptographique.
- Contrôle de l'identité de l'utilisateur connecté.
- Détection des tentatives de double utilisation.
- Impossibilité d'utilisation par un autre compte.
- Marquage automatique de la présence et activation du chat.

## Architecture technique

- **Frontend** : Application web moderne, responsive et accessible.
- **Backend** : API REST avec gestion des rôles et des droits.
- **Base de données** : Stockage des utilisateurs, événements, accès et messages.
- **Infrastructure** : Conteneurisation et déploiement sécurisé avec SSL.

## Sécurité et conformité

- Authentification sécurisée avec politique de mot de passe fort.
- QR codes signés cryptographiquement et associés strictement au compte utilisateur.
- Vérification côté serveur obligatoire avec validation de signature.
- Invalidation automatique après scan et impossibilité de réutilisation.
- Conformité RGPD avec gestion des données personnelles et consentement.

## Installation et exécution

### Prérequis

- Node.js (v18 ou supérieur) et npm installés.
- Docker (optionnel pour le déploiement).

### Étapes

1. **Cloner le dépôt :**

   ```bash
   git clone https://github.com/Lydia-BEDRI/event-manager-app
   cd event-manager-app
   ```

2. **Backend :**

   ```bash
   cd backend
   npm install
   cp .env.example .env
   # Modifier .env avec vos valeurs
   npm run dev
   ```

3. **Frontend :**

   ```bash
   cd frontend
   npm install
   cp .env.example .env
   # Modifier .env avec vos valeurs
   npm start
   ```

4. **Accéder à l'application :**
   - Frontend : [http://localhost:3000](http://localhost:3000)
   - Backend : [http://localhost:5000](http://localhost:5000)
   - Health check : [http://localhost:5000/health](http://localhost:5000/health)

## Execution avec Docker Compose

1. **Construire et démarrer les conteneurs :**

   ```bash  
   docker-compose up --build
   ```

2. **Accéder à l'application :**

   - Frontend : [http://localhost:3000](http://localhost:3000)
   - Backend : [http://localhost:5000](http://localhost:5000)
   - Health check : [http://localhost:5000/health](http://localhost:5000/health)
