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
