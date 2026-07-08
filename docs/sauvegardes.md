# Sauvegardes et restauration

Les volumes Docker assurent la persistance après un redémarrage, mais ne remplacent pas une sauvegarde externe. Cette procédure décrit la cible à mettre en place et doit être validée dans un environnement de test avant son automatisation en production.

## Données à protéger

- Base MySQL métier.
- Base MariaDB et fichiers Matomo.
- Configuration Uptime Kuma.
- Données Grafana non provisionnées par Git.
- Historique Prometheus si sa conservation est requise.
- Données et configuration Caddy nécessaires au fonctionnement TLS.
- Fichier `.env.production`, dans un coffre de secrets séparé.

## Principes

- Chiffrer les archives avant leur transfert.
- Stocker au moins une copie hors du VPS.
- Limiter l’accès aux clés et journaux de sauvegarde.
- Définir une durée de rétention et surveiller les échecs.
- Tester régulièrement une restauration complète.
- Ne jamais ajouter une archive, une clé ou `.env.production` au dépôt Git.

## Sauvegarde de MySQL

Depuis la racine du projet sur le VPS, créez un répertoire protégé hors du dépôt, puis exportez la base :

```bash
umask 077
mkdir -p <REPERTOIRE_SAUVEGARDES>

docker compose --env-file .env.production -f docker-compose.prod.yml exec -T db \
  sh -c 'mysqldump --single-transaction -u root -p"$MYSQL_ROOT_PASSWORD" eventmanager' \
  > <REPERTOIRE_SAUVEGARDES>/eventmanager.sql
```

Chiffrez ensuite le fichier avec l’outil retenu par l’équipe, transférez l’archive vers le stockage externe et supprimez de façon appropriée la copie SQL non chiffrée. Ne placez jamais le mot de passe directement dans la ligne de commande ou dans un script versionné.

## Restauration de MySQL

Avant toute restauration :

1. Informez l’équipe et stoppez les écritures applicatives.
2. Sauvegardez l’état courant.
3. Vérifiez l’intégrité et déchiffrez l’archive dans un emplacement protégé.
4. Restaurez d’abord sur un environnement isolé si possible.

```bash
docker compose --env-file .env.production -f docker-compose.prod.yml exec -T db \
  sh -c 'mysql -u root -p"$MYSQL_ROOT_PASSWORD" eventmanager' \
  < <REPERTOIRE_SAUVEGARDES>/eventmanager.sql
```

Redémarrez ou reconstruisez les services seulement si nécessaire, puis vérifiez `/health`, l’authentification, les événements, les inscriptions et les journaux d’accès.

## Validation

Une sauvegarde n’est considérée comme exploitable qu’après un test de restauration. Consignez hors du dépôt la date, la version de l’application, l’archive testée, le résultat et la personne ayant effectué le contrôle.

L’option `docker compose down -v` ne doit jamais être utilisée en production : elle supprimerait les volumes persistants.
