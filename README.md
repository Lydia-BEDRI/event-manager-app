# EventManager

[![CI](https://github.com/Lydia-BEDRI/event-manager-app/actions/workflows/ci.yml/badge.svg)](https://github.com/Lydia-BEDRI/event-manager-app/actions/workflows/ci.yml)
[![CD](https://github.com/Lydia-BEDRI/event-manager-app/actions/workflows/cd.yml/badge.svg)](https://github.com/Lydia-BEDRI/event-manager-app/actions/workflows/cd.yml)

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
   docker compose up --build
   ```

2. **Accéder à l'application :**

   - Frontend : [http://localhost:3000](http://localhost:3000)
   - Backend : [http://localhost:5000](http://localhost:5000)
   - Health check : [http://localhost:5000/health](http://localhost:5000/health)
   - Boîte e-mail locale Mailpit : [http://localhost:8025](http://localhost:8025)

### Réinitialisation du mot de passe en local

Avec `docker compose up --build`, aucune configuration SMTP supplémentaire n'est
nécessaire dans le fichier `.env`. Docker Compose démarre Mailpit et transmet au backend
les valeurs locales `SMTP_HOST=mailpit`, `SMTP_PORT=1025` et `SMTP_SECURE=false`.

Le parcours complet fonctionne ainsi :

1. Depuis [http://localhost:3000/forgot-password](http://localhost:3000/forgot-password),
   le frontend envoie l'adresse saisie à `POST /api/auth/forgot-password`.
2. Le backend génère un token à usage unique valable 60 minutes. Seule son empreinte
   SHA-256 est conservée dans MySQL.
3. Nodemailer transmet à Mailpit un e-mail contenant un lien vers
   `http://localhost:3000/reset-password?token=...`.
4. L'e-mail est consultable dans [Mailpit](http://localhost:8025). En cliquant sur son lien,
   le frontend ouvre le formulaire de nouveau mot de passe.
5. Le frontend envoie le token et le nouveau mot de passe à `POST /api/auth/reset-password`.
   Le backend valide le token, met à jour le mot de passe et révoque les sessions existantes.

Pour tester avec les données de démonstration, utilisez par exemple
`participant1@eventmanager.fr`. L'API renvoie volontairement le même message si l'adresse
n'existe pas, afin de ne pas révéler les comptes enregistrés.

Si le backend est lancé directement avec `npm run dev` au lieu de Docker, démarrez Mailpit
séparément avec `docker compose up -d mailpit` et conservez dans `backend/.env` :

```env
SMTP_HOST=localhost
SMTP_PORT=1025
SMTP_SECURE=false
SMTP_USER=
SMTP_PASSWORD=
SMTP_FROM=EventManager <no-reply@eventmanager.local>
FRONTEND_URL=http://localhost:3000
```

### Configuration SMTP sur un VPS

Le backend utilise Mailpit par défaut en local. Sur le VPS, configurez
les variables `FRONTEND_URL`, `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`,
`SMTP_PASSWORD` et `SMTP_FROM` dans le fichier `.env` du déploiement. `FRONTEND_URL`
doit contenir l'URL HTTPS publique de l'application. Les identifiants SMTP ne doivent jamais
être ajoutés au dépôt. Utilisez `SMTP_SECURE=true` avec le port 465, ou `false` avec le
port 587 et STARTTLS. Le service Mailpit local reste inaccessible depuis Internet car ses
ports sont liés uniquement à `127.0.0.1`.
