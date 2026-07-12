# EventManager

[![CI](https://github.com/Lydia-BEDRI/event-manager-app/actions/workflows/ci.yml/badge.svg)](https://github.com/Lydia-BEDRI/event-manager-app/actions/workflows/ci.yml)
[![CD](https://github.com/Lydia-BEDRI/event-manager-app/actions/workflows/cd.yml/badge.svg)](https://github.com/Lydia-BEDRI/event-manager-app/actions/workflows/cd.yml)

EventManager est une application web de gestion d’événements internes en entreprise. Elle permet aux organisateurs de créer et suivre leurs événements, et aux participants de s’inscrire, valider leur présence et échanger dans un espace sécurisé.

L’application est déployée sur un VPS OVH et accessible en HTTPS :

- Application : [https://eventmanager.website](https://eventmanager.website)
- Healthcheck : [https://eventmanager.website/health](https://eventmanager.website/health)

## Fonctionnalités principales

### Pour les organisateurs

- Création, modification et suppression d’événements.
- Validation manuelle des demandes de participation.
- Génération de QR codes signés pour les participants approuvés.
- Suivi des participants, des présences et des passages.
- Tableau de bord, statistiques et export des données.
- Modération des discussions événementielles.

### Pour les participants

- Consultation des événements disponibles.
- Demande de participation soumise à l’organisateur.
- Réception d’un QR code signé après validation.
- Validation de présence par lecture du QR code depuis l’application web ou Android.
- Accès au chat après validation de la présence.

### Vérification de présence

- Vérification côté serveur de la signature du QR code.
- Contrôle de l’identité de l’utilisateur connecté.
- Vérification de l’événement et de l’appartenance de la zone à cet événement.
- Une participation approuvée donne accès à toutes les zones de l’événement.
- Chaque scan est un passage journalisé, pas une entrée ou une sortie.
- Les scans répétés et simultanés sont acceptés volontairement et conservés dans l’historique.
- La capacité des zones est une information de configuration, pas une jauge de présence en temps réel.

## Stack technique

- Frontend : React.
- Backend : Node.js, TypeScript et API REST.
- Base de données : MySQL.
- Mobile : Capacitor Android.
- Déploiement : Docker Compose sur VPS.
- Reverse proxy : Caddy avec HTTPS.
- Observabilité : Prometheus, Grafana, cAdvisor, Uptime Kuma, Matomo et Sentry.

## Sécurité et conformité

- Authentification avec politique de mot de passe fort.
- Jetons JWT signés en `HS256`, secrets fournis uniquement par l’environnement et durée de vie courte des access tokens.
- Refresh token stocké côté client dans un cookie `HttpOnly`, `Secure` en production et limité au scope d’authentification.
- Double authentification TOTP et codes de secours à usage unique.
- Chiffrement des secrets TOTP en base de données.
- QR codes signés et liés au compte utilisateur.
- Validation des autorisations exclusivement côté serveur.
- Journalisation des passages.
- Analyse Trivy en CI sur les images Docker, dépendances, paquets système et fichiers Docker/Compose.
- Tests unitaires, tests d’intégration backend/frontend et tests end-to-end Playwright.
- Sauvegardes MySQL locales et sauvegarde externe sur Cloudflare R2 Object Storage via rclone.
- Gestion du consentement analytique et des données personnelles.

## Installation locale

### Prérequis

- Node.js 18 ou supérieur et npm.
- MySQL 8 si vous lancez l’application sans conteneurs.
- Docker et Docker Compose pour l’exécution conteneurisée.

### Sans conteneurs

```bash
git clone https://github.com/Lydia-BEDRI/event-manager-app
cd event-manager-app
```

Installez et démarrez MySQL 8 localement, puis créez la base et l’utilisateur attendus par le backend :

```bash
mysql -u root -p
```

```sql
CREATE DATABASE IF NOT EXISTS eventmanager CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS 'eventmanager'@'localhost' IDENTIFIED BY 'eventmanager123';
GRANT ALL PRIVILEGES ON eventmanager.* TO 'eventmanager'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

Initialisez ensuite le schéma et les données de démonstration :

```bash
mysql -u root -p eventmanager < db/init.sql
mysql -u root -p eventmanager < db/sample_data.sql
```

Configurez le backend avec le port de votre MySQL local. Sur une installation MySQL native, le port est généralement `3306` :

```bash
cd backend
npm install
cp .env.example .env
# Dans backend/.env, vérifier notamment :
# DB_HOST=localhost
# DB_PORT=3306
# DB_USER=eventmanager
# DB_PASSWORD=eventmanager123
# DB_NAME=eventmanager
npm run dev
```

Dans un second terminal :

```bash
cd frontend
npm install
cp .env.example .env
npm start
```

L’application est disponible sur [http://localhost:3000](http://localhost:3000), l’API sur [http://localhost:5000](http://localhost:5000) et son état de santé sur [http://localhost:5000/health](http://localhost:5000/health).

### Avec Docker Compose

```bash
docker compose up --build
```

Les services locaux principaux sont :

- frontend : [http://localhost:3000](http://localhost:3000) ;
- backend : [http://localhost:5000](http://localhost:5000) ;
- Mailpit : [http://localhost:8025](http://localhost:8025).

## Réinitialisation du mot de passe en local

Docker Compose configure automatiquement Mailpit comme serveur SMTP local. Depuis [http://localhost:3000/forgot-password](http://localhost:3000/forgot-password), demandez une réinitialisation, puis ouvrez [http://localhost:8025](http://localhost:8025) pour consulter le message et suivre son lien.

Si le backend est lancé directement avec `npm run dev`, démarrez Mailpit avec `docker compose up -d mailpit` et utilisez les valeurs non sensibles de `backend/.env.example` comme base de configuration.

En production, les paramètres `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASSWORD` et `SMTP_FROM` doivent être fournis uniquement par le fichier d’environnement du serveur ou un gestionnaire de secrets. Aucun identifiant réel ne doit être ajouté au dépôt.

## Double authentification TOTP

La double authentification s’active depuis la section sécurité du profil :

1. Configurez une application Authenticator avec le QR code ou la clé Base32.
2. Confirmez avec un premier code à six chiffres.
3. Conservez hors de l’application les huit codes de secours affichés une seule fois.
4. À la connexion suivante, validez le code TOTP ou un code de secours.

En production, `TWO_FACTOR_ENCRYPTION_KEY` doit être une valeur aléatoire, dédiée et conservée entre les déploiements. Sa perte rend les secrets TOTP existants indéchiffrables. Les valeurs réelles de cette clé et de `JWT_SECRET` ne doivent jamais être publiées.

## Préparer le build Android

L’application Capacitor doit utiliser une URL HTTPS absolue pour joindre l’API :

```bash
cd frontend
cp .env.android.example .env.android
# Renseigner REACT_APP_API_URL avec l’URL HTTPS de l’API.
npm run build:android
```

Le fichier `frontend/.env.android` est local et ignoré par Git. Consultez [la documentation Android](docs/android.md) pour le build et l’exécution sur un appareil.

## Commandes utiles

```bash
# Tests backend
cd backend && npm test

# Tests frontend
cd frontend && npm test

# Tests end-to-end frontend
cd frontend && npm run test:e2e

# Builds web
cd backend && npm run build
cd frontend && npm run build

# Build Android
cd frontend && npm run build:android

# Healthcheck local
curl --fail http://localhost:5000/health
```

En CI, les tests Playwright sont exécutés après les tests frontend avec Chromium. Le job Docker construit les images puis lance Trivy ; la CI bloque les vulnérabilités `CRITICAL` corrigibles et publie les rapports en artefact `trivy-security-reports`.

## Déploiement en production

Le déploiement utilise Docker Compose, Caddy comme point d’entrée HTTPS et un fichier `.env.production` présent uniquement sur le serveur. Les services applicatifs et d’observabilité sont séparés en deux fichiers Compose.

La production actuelle est hébergée sur un VPS OVH derrière HTTPS :

- Application : [https://eventmanager.website](https://eventmanager.website)
- Healthcheck : [https://eventmanager.website/health](https://eventmanager.website/health)

Les sauvegardes MySQL sont générées sur le VPS, conservées localement puis répliquées vers Cloudflare R2 Object Storage. Les secrets de sauvegarde, JWT, SMTP, TOTP et base de données restent hors Git.

La procédure complète se trouve dans [docs/deploiement-production.md](docs/deploiement-production.md).

## Workflow Git

Le workflow du projet est :

```text
feature/* → develop → main
```

Les Pull Requests sont fusionnées avec **Create a merge commit** afin de conserver l’historique entre `develop` et `main`.

## Documentation

- [Déploiement en production](docs/deploiement-production.md) : VPS, HTTPS, Docker Compose et configuration.
- [Observabilité](docs/observabilite.md) : métriques, tableaux de bord, disponibilité, analytique et erreurs.
- [Scan de sécurité Trivy](docs/securite-trivy.md) : analyse CI des images, dépendances et configurations Docker.
- [Sauvegardes](docs/sauvegardes.md) : sauvegarde chiffrée et procédure de restauration.
- [Android](docs/android.md) : configuration, build et test sur un appareil.
