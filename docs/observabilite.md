# Observabilité d’EventManager

La stack d’observabilité complète l’application sans exposer ses consoles d’administration sur Internet.

## Outils

| Service | Port local | Rôle |
|---|---:|---|
| Prometheus | `9090` | Collecte et conservation des métriques. |
| Grafana | `3001` | Visualisation et tableau de bord EventManager. |
| cAdvisor | `8082` | Métriques des conteneurs. |
| Uptime Kuma | `3002` | Surveillance de disponibilité et notifications. |
| Matomo | `8081` | Analytique web soumise au consentement. |
| Sentry | externe | Collecte optionnelle des erreurs applicatives. |

Les ports locaux sont liés à `127.0.0.1` sur le VPS. Les identifiants d’administration et DSN restent dans `.env.production` ou dans le service concerné, jamais dans Git.

## Accès par tunnel SSH

Depuis le poste d’administration :

```bash
ssh -N \
  -L 9090:127.0.0.1:9090 \
  -L 3001:127.0.0.1:3001 \
  -L 8082:127.0.0.1:8082 \
  -L 3002:127.0.0.1:3002 \
  -L 8081:127.0.0.1:8081 \
  <USER>@<VPS_IP>
```

Conservez le terminal ouvert, puis utilisez les URLs `http://localhost:<PORT>`. Préférez une clé SSH protégée par phrase secrète.

## Prometheus

Le backend fournit :

- `GET /health`, qui teste l’API et MySQL ;
- `GET /metrics`, destiné uniquement au réseau Docker interne ;
- `eventmanager_http_requests_total` ;
- `eventmanager_http_request_duration_seconds` ;
- `eventmanager_database_up` ;
- les métriques Node.js préfixées par `eventmanager_`.

Prometheus collecte le backend et cAdvisor toutes les 15 secondes, avec une rétention configurée à 15 jours. Vérifiez dans **Status > Targets** que les cibles sont `UP` et contrôlez les règles d’alerte fournies dans `observability/prometheus/alerts.yml`.

## Grafana

La source Prometheus et le tableau de bord **EventManager - Vue d’ensemble** sont provisionnés depuis `observability/grafana/`. Vérifiez les statuts du backend et de MySQL, le volume de requêtes, les erreurs HTTP et la latence p95.

Les accès proviennent de `GRAFANA_ADMIN_USER` et `GRAFANA_ADMIN_PASSWORD`. Remplacez toutes les valeurs d’exemple avant le déploiement.

## cAdvisor

cAdvisor expose à Prometheus les métriques CPU, mémoire, réseau et état des conteneurs. Vérifiez que les conteneurs applicatifs apparaissent et que leur consommation reste cohérente après un déploiement.

## Uptime Kuma

À la première ouverture, créez le compte administrateur puis configurez au minimum :

| Moniteur | URL interne | Attendu |
|---|---|---|
| Backend et MySQL | `http://backend:5000/health` | HTTP 200 |
| Frontend | `http://frontend:80` | HTTP 200 |
| Prometheus | `http://prometheus:9090/-/healthy` | HTTP 200 |
| Matomo | `http://matomo:80` | HTTP 200 |

Ajoutez un canal de notification, puis réalisez un test contrôlé d’indisponibilité et de retour à la normale. La configuration est persistée dans un volume Docker.

## Matomo

Matomo utilise une base MariaDB séparée. Lors de l’assistant initial, utilisez le service `matomo-db` et les valeurs des variables `MATOMO_DATABASE*`, sans les recopier dans la documentation.

Le frontend ne charge le tracker que si l’utilisateur accepte les cookies analytiques. Configurez `REACT_APP_MATOMO_URL` et `REACT_APP_MATOMO_SITE_ID`, reconstruisez le frontend, puis vérifiez le consentement, le refus et son retrait.

## Sentry

Sentry reste désactivé tant que les DSN correspondants sont vides. Le backend et le frontend utilisent des DSN distincts :

```env
SENTRY_DSN=
REACT_APP_SENTRY_DSN=
SENTRY_ENVIRONMENT=production
SENTRY_TRACES_SAMPLE_RATE=0.1
APP_VERSION=production
```

Les variables `REACT_APP_*` sont intégrées au bundle pendant le build. Après configuration, reconstruisez le frontend et déclenchez une erreur contrôlée dans un environnement de test. Vérifiez qu’aucune donnée personnelle n’est envoyée par défaut.

## Contrôles réguliers

- Toutes les cibles Prometheus sont `UP`.
- Le dashboard Grafana reçoit des données récentes.
- cAdvisor voit les conteneurs attendus.
- Les moniteurs Uptime Kuma sont disponibles et les notifications fonctionnent.
- Matomo respecte le choix de consentement.
- Sentry reçoit les erreurs contrôlées avec le bon environnement et la bonne version.
- Les interfaces restent inaccessibles sans tunnel SSH.
