# Scan de sécurité Trivy

La CI exécute Trivy avant validation Docker afin de détecter les vulnérabilités :

- des images Docker backend et frontend ;
- des dépendances applicatives et paquets système du dépôt ;
- des fichiers Dockerfile et Docker Compose.

Les rapports lisibles sont publiés dans le résumé GitHub Actions et conservés en artefact `trivy-security-reports`.

## Politique CI

- Les rapports affichent les vulnérabilités `HIGH` et `CRITICAL`.
- La CI échoue sur les vulnérabilités `CRITICAL` corrigibles.
- Les vulnérabilités sans correctif sont ignorées par le blocage CI avec `ignore-unfixed: true`, car elles ne peuvent pas être résolues par une mise à jour immédiate. Elles restent visibles dès qu’un correctif existe lors d’un scan ultérieur.
- Aucun fichier `.trivyignore` n’est nécessaire pour l’instant. S’il est ajouté, chaque entrée doit contenir une justification, une date de revue et un lien vers le ticket de suivi.

## Traitement d’une vulnérabilité

1. Ouvrir l’artefact `trivy-security-reports` dans le run GitHub Actions.
2. Identifier la cible touchée : image backend, image frontend, dépendance applicative, paquet OS ou configuration Docker/Compose.
3. Vérifier si un correctif est indiqué par Trivy.
4. Corriger en priorité par une montée de version :
   - dépendance npm dans `backend/package.json` ou `frontend/package.json` ;
   - image de base dans `backend/Dockerfile` ou `frontend/Dockerfile` ;
   - image de service dans les fichiers Docker Compose ;
   - configuration Docker/Compose signalée par le scan de configuration.
5. Relancer la CI et conserver le rapport corrigé dans la Pull Request.
6. Si aucun correctif n’existe, documenter le risque dans le ticket et suivre la vulnérabilité jusqu’à disponibilité d’un patch.

## Images de base

Les images applicatives construites par la CI sont :

- backend : `node:20-alpine` ;
- frontend build : `node:20-alpine` ;
- frontend runtime : `nginx:alpine`.

Ces images sont scannées à chaque exécution de la CI. Si Trivy signale une vulnérabilité critique corrigible, la version de l’image de base doit être mise à jour avant déploiement.
