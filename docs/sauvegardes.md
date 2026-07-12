# Sauvegardes et restauration MySQL

Les volumes Docker gardent les donnees apres un redemarrage, mais ils ne remplacent pas une vraie sauvegarde. Cette procedure met en place une sauvegarde 3-2-1 pour la base MySQL metier :

- 1 copie active : la base MySQL dans Docker.
- 1 copie locale : un dump compresse sur le VPS.
- 1 copie externe : le meme dump envoye vers Cloudflare R2 Object Storage avec rclone.

Les secrets restent hors du depot Git dans `/home/ubuntu/secure-backups/env/mysql-backup.env`.

## Fichiers ajoutes

- `backups/mysql-backup.sh` : genere le dump MySQL, compresse, calcule le SHA-256, applique la retention et envoie vers rclone.
- `backups/mysql-backup.env.example` : modele de configuration a copier sur le VPS.
- `backups/mysql-restore-test.sh` : restaure un dump dans une base separee pour valider que la sauvegarde est exploitable.

## Configuration sur le VPS

Depuis le VPS :

```bash
cd ~/applications/event-manager-app
mkdir -p ~/secure-backups/env ~/secure-backups/mysql/eventmanager
cp backups/mysql-backup.env.example ~/secure-backups/env/mysql-backup.env
nano ~/secure-backups/env/mysql-backup.env
chmod 600 ~/secure-backups/env/mysql-backup.env
chmod +x backups/mysql-backup.sh backups/mysql-restore-test.sh
```

Dans `~/secure-backups/env/mysql-backup.env`, utiliser les valeurs de production :

```bash
MYSQL_CONTAINER="eventmanager-production-db-1"
MYSQL_DATABASE="eventmanager"
MYSQL_USER="root"
MYSQL_PASSWORD="<valeur de MYSQL_ROOT_PASSWORD dans le .env de prod>"
BACKUP_DIR="/home/ubuntu/secure-backups/mysql/eventmanager"
LOG_FILE="/home/ubuntu/secure-backups/mysql/backup.log"
REMOTE_TARGET="cloudflare-r2:event-manager-backups/mysql"
RETENTION_LOCAL_DAYS=14
RETENTION_REMOTE_DAYS=60
ALERT_WEBHOOK_URL=""
```

Pour retrouver le mot de passe root MySQL :

```bash
cd ~/applications/event-manager-app
grep MYSQL_ROOT_PASSWORD .env
```

Ne jamais copier ce fichier `mysql-backup.env` dans Git.

## Stockage externe Cloudflare R2 avec rclone

Actions cote Cloudflare :

1. Ouvrir le tableau de bord Cloudflare R2.
2. Creer un bucket R2, par exemple `event-manager-backups`.
3. Creer un token d'API R2 ou des identifiants S3 limites a ce bucket.
4. Noter l'endpoint S3 R2, l'access key ID et la secret access key.
5. Limiter les droits au strict necessaire : ecriture, lecture et suppression des objets de sauvegarde.

Actions cote VPS :

```bash
sudo apt update
sudo apt install rclone
rclone config
```

Configuration type :

```text
n) New remote
name> cloudflare-r2
Storage> s3
provider> Cloudflare
access_key_id> <access key R2>
secret_access_key> <secret key R2>
endpoint> https://<ACCOUNT_ID>.r2.cloudflarestorage.com
acl> private
```

Verifier ensuite :

```bash
rclone mkdir cloudflare-r2:event-manager-backups/mysql
rclone lsd cloudflare-r2:
```

Mettre ensuite dans `mysql-backup.env` :

```bash
REMOTE_TARGET="cloudflare-r2:event-manager-backups/mysql"
```

## Test manuel d'une sauvegarde

```bash
cd ~/applications/event-manager-app
./backups/mysql-backup.sh
```

Verifier les fichiers locaux :

```bash
ls -lh ~/secure-backups/mysql/eventmanager
cat ~/secure-backups/mysql/backup.log
```

Verifier l'integrite SHA-256 :

```bash
cd ~/secure-backups/mysql/eventmanager
sha256sum -c *.sha256
```

Verifier la copie distante :

```bash
rclone ls cloudflare-r2:event-manager-backups/mysql
```

## Automatisation avec cron

Ouvrir la crontab de l'utilisateur `ubuntu` :

```bash
crontab -e
```

Executer tous les jours a 03:15 :

```cron
15 3 * * * /home/ubuntu/applications/event-manager-app/backups/mysql-backup.sh
```

Pour verifier que cron a bien tourne :

```bash
tail -n 50 ~/secure-backups/mysql/backup.log
```

## Alertes en cas d'echec

Le script journalise tout echec dans `LOG_FILE`. Pour recevoir une alerte, renseigner `ALERT_WEBHOOK_URL` dans `mysql-backup.env`.

Exemples possibles :

- Webhook Discord.
- Webhook Slack.
- URL push Uptime Kuma.
- Webhook d'un outil de monitoring.

Si `REMOTE_TARGET` est configure mais que rclone echoue, le backup est considere comme echoue.

## Politique de retention

La retention est controlee par :

```bash
RETENTION_LOCAL_DAYS=14
RETENTION_REMOTE_DAYS=60
```

Le VPS garde donc 14 jours de dumps locaux et le stockage externe garde 60 jours. Adapter ces valeurs selon l'espace disque et le besoin de restauration.

## Test de restauration dans une base separee

Ne jamais tester une restauration directement dans la base de production.

```bash
cd ~/applications/event-manager-app
./backups/mysql-restore-test.sh /home/ubuntu/secure-backups/mysql/eventmanager/eventmanager_YYYY-MM-DD_HH-MM-SS.sql.gz
```

Le script :

1. Verifie le SHA-256 si le fichier `.sha256` existe.
2. Cree ou remplace la base `eventmanager_restore_test`.
3. Restaure le dump dedans.
4. Affiche les tables restaurees.

Quand le test est fini, supprimer la base de test :

```bash
docker exec -e MYSQL_PWD="<MYSQL_ROOT_PASSWORD>" eventmanager-production-db-1 \
  mysql -uroot -e "DROP DATABASE IF EXISTS eventmanager_restore_test;"
```

## Restauration production

Avant toute restauration production :

1. Informer l'equipe.
2. Stopper les ecritures applicatives si possible.
3. Faire un backup de l'etat courant.
4. Verifier le SHA-256 de l'archive.
5. Tester la restauration dans `eventmanager_restore_test`.

Commande de restauration production, uniquement apres validation :

```bash
gunzip -c /home/ubuntu/secure-backups/mysql/eventmanager/eventmanager_YYYY-MM-DD_HH-MM-SS.sql.gz \
  | docker exec -i -e MYSQL_PWD="<MYSQL_ROOT_PASSWORD>" eventmanager-production-db-1 \
    mysql -uroot eventmanager
```

Verifier ensuite l'application :

- endpoint `/health`;
- connexion utilisateur;
- liste des evenements;
- inscriptions;
- controle d'acces et journaux d'acces.

`docker compose down -v` ne doit jamais etre utilise en production : cette commande supprime les volumes persistants.
