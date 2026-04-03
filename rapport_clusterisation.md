# Rapport de Clusterisation pour EventManager

## 1. Pré-requis et environnement

### 1.1 Machines virtuelles

- 1 Master
- 2 Workers
- OS : Debian (stable)
- Mémoire : au moins 2 Go par VM

### 1.2 Packages à installer

Docker

```bash
sudo apt update -y
sudo apt install docker.io -y
sudo systemctl enable docker
sudo systemctl start docker
```

### 1.3 Configuration réseau

Vérification IP et gateway :

```bash
ip a
ip route
dhclient       # si pas d'IP
```

Configuration IP statique : modifier `/etc/network/interfaces`

Redémarrage réseau :

```bash
sudo systemctl restart networking
```

Changer le nom de la machine : `/etc/hostname`

Reboot :

```bash
sudo reboot
```

### Réseau

- Chaque machine doit avoir une IP fixe.
- Vérifier la connectivité réseau entre Master et Workers :

```bash
ping <IP_MASTER_OR_WORKER>
```

### 1.4 Packages nécessaires

Avant de créer le cluster, les packages suivants doivent être présents sur chaque machine :

| Package | Rôle | Comment vérifier / installer |
|---------|------|-----------------------------|
| Docker | Conteneurisation et Swarm | Vérifier : `docker --version`  \
Installer : `apt update && apt install docker.io -y` |
| Git | Clonage du dépôt source | Vérifier : `git --version`  \
Installer : `apt update && apt install git -y` |
| wget | Téléchargements depuis internet | Vérifier : `wget --version`  \
Installer : `apt update && apt install wget -y` |
| nano ou vim | Édition de fichiers de configuration | Vérifier : `nano --version` ou `vim --version`  \
Installer : `apt update && apt install nano -y` ou `apt install vim -y` |

## 2. Création du cluster Docker Swarm

### 2.1 Initialisation du Master

```bash
docker swarm init --advertise-addr <IP_MASTER>
```

### 2.2 Ajouter les Workers

- Récupérer la commande `docker swarm join-token worker` sur le master
- Coller la commande sur chaque worker après installation et configuration réseau

### 2.3 Vérification du cluster

```bash
docker node ls
```

- Le master doit apparaître en `Leader`
- Les workers doivent apparaître en `Ready`

## 3. Déploiement de l’application sur le cluster

### 3.1 Préparation des fichiers

Avant de déployer l’application, les fichiers suivants doivent être présents sur le cluster :

- `stack.yml` : définit tous les services nécessaires à l’application (frontend, backend, base de données, Nginx) et leurs configurations de réseau et de réplication.
- `nginx.conf` : configure le reverse proxy pour acheminer les requêtes vers le frontend et le backend.
- `.env` : stocke les variables d’environnement et les secrets pour la base de données et l’application.

Ces fichiers permettent de standardiser le déploiement et de garantir que chaque machine du cluster utilise les mêmes configurations.

### 3.2 Stratégies et choix techniques

#### Multiples réseaux Docker overlay

- `proxynet` : communication frontend <-> Nginx
- `frontnet` : communication frontend <-> backend
- `backnet` : communication backend <-> DB (interne seulement)
- `dbnet` : réseau interne pour la base de données

Raison : isolation des flux et sécurité.

#### Reverse proxy Nginx

- Redirige les requêtes HTTP vers le frontend et `/api` vers le backend
- Permet d’exposer un seul port externe et de gérer le SSL plus tard

Raison : simplification de l’accès et sécurité via centralisation des points d’entrée.

#### Secrets et configuration

- Variables sensibles stockées dans `.env` pour l’instant
- Prévu pour migration vers Docker Secrets pour plus de sécurité

Raison : éviter de hardcoder des mots de passe ou clés dans le code ou le `stack.yml`.

#### Initialisation de la base de données

- Fichier `init.sql` pour le schéma
- Fichier `sample_data.sql` pour les données de test

### 3.2 Initialisation de la base de données

Pour créer le schéma et charger des données initiales, on utilise les fichiers suivants :

- `init.sql` : contient les instructions SQL pour créer la base de données et toutes les tables nécessaires.
- `sample_data.sql` : permet d’insérer des données de test pour vérifier que l’application fonctionne correctement.

Dans la configuration Docker, ces fichiers seront automatiquement exécutés lors du démarrage du service MySQL afin d’avoir :

- La base de données prête avec le bon schéma
- Les données initiales chargées pour les tests et la démonstration

### 3.3 Déploiement avec Docker Swarm

Pour lancer l’application sur le cluster, on utilise la commande suivante :

```bash
docker stack deploy -c stack.yml eventmanager
```

Cette commande :

- Crée les services définis dans `stack.yml` sur le cluster
- Respecte le nombre de replicas et les contraintes définies pour chaque service
- Configure automatiquement les réseaux entre les services

### 3.4 Vérification du déploiement

Après le déploiement, il est recommandé de vérifier que tous les services fonctionnent correctement :

```bash
docker service ls          # liste tous les services déployés
docker service ps <service>  # détails d’un service particulier
```

Points à vérifier :

- Le frontend est accessible via Nginx
- Le backend répond sur ses endpoints, notamment `/health`
- La base de données est initialisée avec le schéma et les données de test
- Les communications entre services (frontend, backend, DB) sont opérationnelles

### 3.5 Réplication et tolérance aux pannes

Chaque service peut avoir plusieurs replicas, assurant que si un node tombe, le service reste disponible.

Docker Swarm redistribue automatiquement les containers sur les nodes disponibles pour maintenir l’état désiré.

## 4. Initialisation de la base de données


## 5. Vérification et tests


## 6. Stratégies de sécurité


## 7. Maintenance et mise à jour


## 8. Annexes

### Schéma global de l’architecture EventManager

```
		+-------------------+
		|      Master 1     |
		|------------------|
		|  Nginx (Reverse) |
		|  Docker Swarm    |
		+------------------+
		       |
	       -------------------
	       |                 |
	   Frontnet            Backnet
	       |                 |
       +-------+-------+     +---+---+--------+
       | Frontend Pod  |     | Backend Pod(s) |
       |  Worker 1     |     | Worker 1 & 2   |
       +---------------+     +----------------+
	       |                 |
	       +-----------------+
			|
		     DBNet
			|
		   +----+-----+
		   |   DB     |
		   |  Worker2 |
		   +----------+
```

### Réseaux et rôle des services

| Réseau | Contenus / rôle |
|--------|-----------------|
| proxynet | Contient le reverse proxy Nginx, exposé à l’extérieur (ports 80/443) |
| frontnet | Contient les conteneurs Frontend et Backend pour la communication interne sécurisée |
| backnet | Contient uniquement le backend et DB pour la sécurité interne |
| dbnet | Contient uniquement la base de données (MySQL) pour isolation complète |

### Répartition Master / Worker (exemple)

| Service | Master 1 | Worker 1 | Worker 2 |
|---------|:--------:|:--------:|:--------:|
| Nginx | ✓ |  |  |
| Frontend |  | ✓ | ✓ |
| Backend |  | ✓ | ✓ |
| DB |  |  | ✓ |
