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
- **Observabilité** : Prometheus, Grafana, cAdvisor, Uptime Kuma, Sentry et Matomo.

## Sécurité et conformité

- Authentification sécurisée avec politique de mot de passe fort.
- Double authentification TOTP compatible avec les applications Authenticator.
- Codes de secours à usage unique et secrets TOTP chiffrés en base.
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

## Tests end-to-end avec Playwright

Les tests E2E couvrent les parcours stables suivants : inscription, connexion, mot de passe
oublié, création d’un événement, approbation d’une participation, refus d’un QR invalide,
acceptation d’un QR signé et protection des routes administrateur.

Playwright démarre automatiquement le backend et le frontend. La base MySQL doit être
disponible et initialisée avant l’exécution :

```bash
docker compose up -d db
npm ci --prefix backend
npm ci --prefix frontend
cd frontend
npx playwright install chromium
npm run test:e2e
```

Les variables `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` et `JWT_SECRET`
doivent correspondre à la base locale. Pour observer le navigateur ou utiliser l’interface
interactive :

```bash
npm run test:e2e:headed
npm run test:e2e:ui
```

En CI, les tests utilisent une base MySQL éphémère, un seul worker pour éviter les conflits
de données et publient le rapport HTML Playwright comme artefact en cas d’échec.

### Services, ports et responsabilités

Les consoles techniques sont liées à `127.0.0.1` par défaut. Elles ne sont donc pas
accessibles depuis une autre machine sans tunnel SSH ou reverse proxy authentifié. En
production, seuls les ports publics HTTP/HTTPS du reverse proxy doivent être ouverts.

| Service | Port hôte | Port interne | Exposition | Rôle |
|---|---:|---:|---|---|
| `frontend` | `3000` | `80` | Application | Interface React servie par Nginx. |
| `backend` | `5000` | `5000` | API | API REST, Socket.IO, `/health` et `/metrics`. |
| `db` | `3307` | `3306` | Développement | Base MySQL métier d’EventManager. À ne pas exposer sur le VPS. |
| `mailpit` | `1025` | `1025` | Local uniquement | Serveur SMTP de développement. |
| `mailpit` | `8025` | `8025` | Local uniquement | Interface de consultation des e-mails de test. |
| `prometheus` | `9090` | `9090` | Local/admin | Collecte et conserve les métriques pendant 15 jours. |
| `grafana` | `3001` | `3000` | Local/admin | Visualise les métriques et fournit le dashboard EventManager. |
| `cadvisor` | `8082` | `8080` | Local/admin | Expose CPU, mémoire, réseau et état des conteneurs à Prometheus. |
| `uptime-kuma` | `3002` | `3001` | Local/admin | Surveille la disponibilité HTTP et déclenche des alertes. |
| `matomo` | `8081` | `80` | Local/admin | Analytique web auto-hébergée soumise au consentement utilisateur. |
| `matomo-db` | aucun | `3306` | Réseau Docker | Base MariaDB dédiée à Matomo, isolée de la base métier. |

Le réseau Docker `eventmanager-network` permet aux services de se joindre par leur nom,
par exemple `http://backend:5000/health`. Les volumes nommés conservent les bases, les
dashboards, l’historique Prometheus et la configuration Uptime Kuma.

## Observabilité

### Métriques et état de santé

Le backend expose deux endpoints non authentifiés destinés aux sondes internes :

- `GET /health` vérifie simultanément le processus API et la connexion MySQL. Il renvoie
  `200` lorsque les deux sont disponibles et `503` si MySQL est indisponible.
- `GET /metrics` expose les métriques au format Prometheus.

Les métriques principales sont :

- `eventmanager_http_requests_total` : requêtes par méthode, route et statut ;
- `eventmanager_http_request_duration_seconds` : histogramme de latence HTTP ;
- `eventmanager_database_up` : disponibilité de MySQL ;
- les métriques Node.js préfixées par `eventmanager_` : mémoire, CPU, event loop et GC.

Prometheus collecte le backend et cAdvisor toutes les 15 secondes. Des règles sont
préconfigurées pour détecter un backend ou une base indisponible, plus de 5 % d’erreurs
HTTP 5xx et une latence p95 supérieure à une seconde. Grafana provisionne automatiquement
la source Prometheus et le dashboard **EventManager - Vue d’ensemble**.

Accès local :

- Prometheus : [http://localhost:9090](http://localhost:9090)
- Grafana : [http://localhost:3001](http://localhost:3001)
- cAdvisor : [http://localhost:8082](http://localhost:8082)

Les identifiants Grafana proviennent de `GRAFANA_ADMIN_USER` et
`GRAFANA_ADMIN_PASSWORD`. La valeur par défaut `change-me` doit impérativement être
remplacée sur un environnement partagé.

### Surveillance Uptime Kuma

À la première ouverture de [Uptime Kuma](http://localhost:3002), créez le compte
administrateur puis ajoutez au minimum ces moniteurs HTTP depuis le réseau Docker :

| Moniteur | URL interne | Résultat attendu |
|---|---|---|
| Backend et MySQL | `http://backend:5000/health` | HTTP `200` |
| Frontend | `http://frontend:80` | HTTP `200` |
| Prometheus | `http://prometheus:9090/-/healthy` | HTTP `200` |
| Matomo | `http://matomo:80` | HTTP `200` |

Configurez ensuite un canal de notification e-mail, Slack ou Discord dans Uptime Kuma.
Sa configuration est conservée dans le volume `eventmanager-uptime-kuma-data`.

### Signalement des erreurs avec Sentry

Sentry est optionnel en local et s’active uniquement lorsqu’un DSN est fourni. Le backend
signale les exceptions non gérées, les erreurs du health check et les réponses HTTP 5xx.
Le frontend signale les erreurs JavaScript et peut envoyer un échantillon de traces.

```env
SENTRY_DSN=https://cle@organisation.ingest.sentry.io/projet-backend
REACT_APP_SENTRY_DSN=https://cle@organisation.ingest.sentry.io/projet-frontend
SENTRY_ENVIRONMENT=production
SENTRY_TRACES_SAMPLE_RATE=0.1
APP_VERSION=1.0.0
```

Les variables `REACT_APP_*` sont intégrées au bundle lors du build du frontend. Il faut
donc reconstruire l’image après leur modification. Les données personnelles ne sont pas
envoyées par défaut (`sendDefaultPii: false`).

### Analytique Matomo et consentement

Matomo utilise une base MariaDB séparée. Ouvrez [http://localhost:8081](http://localhost:8081)
au premier démarrage et terminez l’assistant avec les paramètres suivants :

```text
Serveur de base de données : matomo-db
Base : valeur de MATOMO_DATABASE
Utilisateur : valeur de MATOMO_DATABASE_USER
Mot de passe : valeur de MATOMO_DATABASE_PASSWORD
```

Créez ensuite le site EventManager et reportez son identifiant dans
`REACT_APP_MATOMO_SITE_ID`. Le tracker n’est chargé que lorsque l’utilisateur accepte les
cookies analytiques dans la page **Gestion des cookies**. Un refus ou un retrait du
consentement désactive les cookies Matomo.

### Démarrage ciblé

Pour démarrer uniquement la supervision avec l’application :

```bash
docker compose up -d --build backend frontend cadvisor prometheus grafana uptime-kuma
```

Pour inclure l’analytique auto-hébergée :

```bash
docker compose up -d matomo-db matomo
```

Pour vérifier la configuration sans lancer les conteneurs :

```bash
docker compose config --quiet
```

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

### Double authentification TOTP

Chaque utilisateur peut activer la double authentification depuis la section sécurité de
son profil. L'application affiche un QR code compatible avec Google Authenticator,
Microsoft Authenticator, Authy et les gestionnaires de mots de passe prenant en charge TOTP.

L'activation suit ce parcours :

1. L'utilisateur scanne le QR code ou saisit manuellement la clé Base32.
2. Il confirme l'installation avec le premier code à six chiffres.
3. Huit codes de secours à usage unique lui sont affichés une seule fois.
4. Aux connexions suivantes, aucun JWT de session n'est délivré avant la validation du
   code TOTP ou d'un code de secours.

Le secret TOTP est chiffré en AES-256-GCM avant son stockage. Les codes de secours ne sont
jamais enregistrés en clair : seule leur empreinte HMAC est conservée. Le challenge de
connexion expire après cinq minutes et ne peut pas être utilisé comme token d'accès.

En local, aucune variable supplémentaire n'est obligatoire : le backend utilise
`JWT_SECRET` comme clé de repli. Il est néanmoins recommandé de générer une clé dédiée
avant la première activation :

```bash
openssl rand -hex 32
```

Ajoutez la valeur obtenue dans le fichier `.env` à la racine du projet. Sur un VPS, cette
configuration avec une valeur distincte du secret JWT est obligatoire :

```env
TWO_FACTOR_ENCRYPTION_KEY=une-valeur-aleatoire-longue-et-unique
```

Cette clé doit être conservée entre les déploiements. Si elle est perdue ou remplacée, les
secrets TOTP existants ne pourront plus être déchiffrés et les utilisateurs devront réactiver
leur double authentification.

#### Activer la 2FA en local

1. Démarrez l'application avec `docker compose up --build` et attendez que les services
   `db`, `backend` et `frontend` soient sains.
2. Ouvrez [http://localhost:3000](http://localhost:3000), connectez-vous puis accédez à
   **Mon profil**.
3. Dans la section **Double authentification**, cliquez sur **Configurer**.
4. Scannez le QR code avec une application Authenticator. Si le scan est impossible,
   utilisez la clé Base32 affichée sous le QR code.
5. Saisissez le code actuel à six chiffres puis cliquez sur **Activer**.
6. Conservez les huit codes de secours affichés. Ils ne seront plus consultables après le
   rechargement de la page et chacun ne peut être utilisé qu'une seule fois.

Le statut de la section doit maintenant être **Activée** et indiquer huit codes de secours
disponibles.

#### Vérifier la connexion TOTP

1. Déconnectez-vous puis saisissez de nouveau votre e-mail et votre mot de passe.
2. L'application doit afficher **Vérification en deux étapes** sans encore créer de session.
3. Vérifiez qu'un code incorrect est refusé.
4. Saisissez le code actuel de l'application Authenticator : la connexion doit aboutir.

L'heure automatique doit être activée sur le téléphone et la machine qui héberge le backend.
Un décalage d'horloge peut rendre les codes TOTP invalides.

#### Vérifier les codes de secours

1. Recommencez une connexion et utilisez un code de secours à la place du code TOTP.
2. La connexion doit réussir et le compteur du profil doit diminuer d'une unité.
3. Déconnectez-vous et réutilisez le même code : il doit être refusé.
4. Le bouton **Régénérer les codes** permet de remplacer tous les codes restants après
   validation d'un code TOTP actuel. Les anciens codes deviennent immédiatement invalides.

Pour désactiver la protection, cliquez sur **Désactiver**, puis confirmez avec le mot de
passe actuel et un code TOTP ou un code de secours. La connexion suivante ne doit plus
demander de second facteur.

En cas d'erreur, consultez les journaux du backend avec :

```bash
docker compose logs -f backend
```
