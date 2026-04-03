# EventManager

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

## Déploiement de la stack

### Copier le projet sur le master

Depuis la machine locale ou depuis un repository central (GitHub) :

```bash
# Sur le master
git clone https://github.com/Lydia-BEDRI/event-manager-app.git
cd event-manager-app
git checkout clusterisation
```

### Vérification des fichiers essentiels

- `stack.yml` définit tous les services, réseaux et volumes.
- `.env` contient les variables d’environnement liées à la base de données.
- `nginx.conf` configure le reverse proxy pour le frontend et le backend.
- `/db/init.sql` et `/db/sample_data.sql` contiennent le schéma et les données de test.

Il est important de s’assurer que le fichier `.env` contient bien les valeurs suivantes :

- `MYSQL_ROOT_PASSWORD`
- `MYSQL_DATABASE`
- `MYSQL_USER`
- `MYSQL_PASSWORD`

### Déploiement de la stack

Sur le master, exécuter :

```bash
# Déployer la stack Docker Swarm
docker stack deploy -c stack.yml eventmanager
```

`-c stack.yml` indique le fichier de configuration de la stack.

`eventmanager` est le nom de la stack utilisé pour référencer les services.

### Vérification des services

Pour s’assurer que tous les services sont en ligne :

```bash
# Liste des services et leur statut
docker service ls
```

Exemple d'output attendu :

```text
ID       NAME                    MODE        REPLICAS  IMAGE           PORTS
xxxxx    eventmanager_db         replicated  1/1       mysql:8.0       -
xxxxx    eventmanager_backend    replicated  2/2       backend:latest  -
xxxxx    eventmanager_frontend   replicated  3/3       frontend:latest -
xxxxx    eventmanager_nginx       replicated  1/1       nginx:alpine    80, 443
```

### Vérification de la réplication et de la tolérance

Pour voir sur quels nœuds les conteneurs tournent :

```bash
docker service ps eventmanager_backend
docker service ps eventmanager_frontend
```

Cela permet de vérifier la répartition sur le master et les workers.

Il faut aussi contrôler que les réplicas sont bien en ligne et qu’aucun conteneur n’est en état `Pending`.

Capture d'écran suggérée : affichage des réplicas avec `docker service ps` et `docker node ls`.

### Vérification des logs

Pour diagnostiquer un service en cas de problème :

```bash
docker service logs eventmanager_backend --tail 50
docker service logs eventmanager_frontend --tail 50
docker service logs eventmanager_nginx --tail 50
```

Ces commandes permettent de vérifier que le backend se connecte à la base, que le frontend démarre correctement, et que Nginx proxy bien les requêtes.

### Accès à l'application

- Frontend : http://<IP_MASTER>
- Backend : http://<IP_MASTER>:5000
- Health check : http://<IP_MASTER>:5000/health

Si HTTPS est activé avec un certificat auto-signé :

- https://<IP_MASTER>
- Il faut accepter le certificat auto-signé dans le navigateur.
