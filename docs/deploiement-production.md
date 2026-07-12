# Déploiement en production d’EventManager

Ce guide décrit le déploiement sur un VPS Linux sans publier son adresse, ses identifiants ni les secrets applicatifs. Remplacez les valeurs entre chevrons par celles transmises via un canal sécurisé.

La production EventManager est hébergée sur un VPS OVH et exposée en HTTPS :

- Application : https://eventmanager.website
- Healthcheck : https://eventmanager.website/health

## Prérequis

- Un VPS avec Docker, le plugin Docker Compose et Git.
- Un domaine dont les enregistrements DNS pointent vers le VPS.
- Les ports TCP 80 et 443 ainsi que UDP 443 autorisés.
- Un accès SSH par clé.
- Un fichier `.env.production` créé directement sur le serveur.

## Connexion et emplacement du projet

```bash
ssh <USER>@<VPS_IP>
cd <CHEMIN_DU_PROJET>
git branch --show-current
git status
```

L’adresse du serveur, le nom d’utilisateur et le chemin exact sont des informations d’exploitation à conserver hors du dépôt public.

## Configuration de production

Créez la configuration à partir du modèle, puis remplacez toutes les valeurs `CHANGE_ME` :

```bash
cp .env.production.example .env.production
chmod 600 .env.production
```

Le fichier `.env.production` est ignoré par Git et ne doit jamais être copié dans une issue, une Pull Request, une capture d’écran ou un journal partagé. Il contient notamment les secrets MySQL, JWT, QR code et 2FA, les accès SMTP, les DSN Sentry et les mots de passe d’administration.

Les origines attendues prennent cette forme :

```env
FRONTEND_URL=https://<DOMAINE>
ALLOWED_ORIGINS=https://<DOMAINE>,http://localhost
```

`http://localhost` permet à l’application Capacitor Android de joindre l’API. Utilisez des valeurs aléatoires et distinctes pour chaque secret.

## Architecture Docker Compose

`docker-compose.prod.yml` lance Caddy, MySQL, le backend et le frontend. `docker-compose.observability.prod.yml` ajoute Prometheus, Grafana, cAdvisor, Uptime Kuma, Matomo et sa base MariaDB.

Seul Caddy publie les ports 80 et 443. Le backend et MySQL restent sur le réseau Docker interne. Les consoles d’observabilité sont liées à `127.0.0.1` et nécessitent un tunnel SSH.

Caddy assure l’émission et le renouvellement du certificat TLS, la redirection HTTP vers HTTPS et le routage vers le frontend ou le backend. La route publique `/metrics` doit rester inaccessible.

## Premier déploiement

Vérifiez d’abord la configuration sans afficher les valeurs résolues :

```bash
docker compose \
  --env-file .env.production \
  -f docker-compose.prod.yml \
  -f docker-compose.observability.prod.yml \
  config --quiet
```

Construisez et démarrez ensuite les services :

```bash
docker compose \
  --env-file .env.production \
  -f docker-compose.prod.yml \
  -f docker-compose.observability.prod.yml \
  up -d --build

docker compose \
  --env-file .env.production \
  -f docker-compose.prod.yml \
  -f docker-compose.observability.prod.yml \
  ps
```

Lors de la création d’un volume MySQL vide, les scripts de `db/` initialisent le schéma et les données de démonstration. Avant une ouverture publique, supprimez les comptes inutiles ou remplacez leurs mots de passe documentés.

## Vérifications après déploiement

```bash
curl --fail https://<DOMAINE>/health
curl -I https://<DOMAINE>/metrics
```

Vérifiez également :

- la validité du certificat HTTPS et la redirection depuis HTTP ;
- l’accès au frontend et l’authentification ;
- l’état `healthy` des services applicatifs ;
- la connexion du backend à MySQL ;
- l’envoi d’un e-mail de réinitialisation ;
- l’absence d’exposition publique de `/metrics` et des consoles techniques.

## Mise à jour de l’application

Coordonnez toute intervention avec l’équipe, puis :

```bash
cd <CHEMIN_DU_PROJET>
git status
git pull origin main

docker compose \
  --env-file .env.production \
  -f docker-compose.prod.yml \
  -f docker-compose.observability.prod.yml \
  up -d --build
```

Contrôlez ensuite les services, le healthcheck et les logs.

## Logs et diagnostic

```bash
docker compose \
  --env-file .env.production \
  -f docker-compose.prod.yml \
  -f docker-compose.observability.prod.yml \
  logs --tail=100

docker compose \
  --env-file .env.production \
  -f docker-compose.prod.yml \
  -f docker-compose.observability.prod.yml \
  logs -f backend
```

Remplacez `backend` par le service à diagnostiquer. Ne partagez pas des logs sans vérifier qu’ils ne contiennent ni jeton, ni adresse e-mail, ni information personnelle.

## Migration d’une base existante

Les scripts d’initialisation ne s’exécutent que lors de la création d’un volume vide. Pour une base antérieure à l’ajout du contrôle d’accès QR, sauvegardez-la puis appliquez une seule fois :

```bash
docker compose --env-file .env.production -f docker-compose.prod.yml exec -T db \
  sh -c 'mysql -u root -p"$MYSQL_ROOT_PASSWORD" eventmanager' \
  < db/migrations/002-update-qr-and-access-logs.sql
```

Pour une base qui contient encore l’ancienne table d’attribution individuelle des zones, appliquez ensuite la migration de nettoyage :

```bash
docker compose --env-file .env.production -f docker-compose.prod.yml exec -T db \
  sh -c 'mysql -u root -p"$MYSQL_ROOT_PASSWORD" eventmanager' \
  < db/migrations/003-drop-zone-access.sql
```

Après cette migration, une participation approuvée donne accès à toutes les zones de l’événement. Les scans restent des passages journalisés, y compris lorsqu’ils sont répétés ou simultanés.

## Arrêt des services

Pour arrêter les conteneurs sans supprimer les données :

```bash
docker compose \
  --env-file .env.production \
  -f docker-compose.prod.yml \
  -f docker-compose.observability.prod.yml \
  down
```

> N’utilisez jamais `docker compose down -v` en production : l’option `-v` supprime les volumes qui contiennent les bases et les configurations persistantes.

Consultez également les guides [Observabilité](observabilite.md), [Sauvegardes](sauvegardes.md), [Scan de sécurité Trivy](securite-trivy.md) et [Android](android.md).
