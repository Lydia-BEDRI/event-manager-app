# Application Android Capacitor

L’application Android embarque le frontend React et communique avec l’API de production en HTTPS.

## Configuration locale

```bash
cd frontend
cp .env.android.example .env.android
```

Renseignez l’URL publique sans ajouter le fichier à Git :

```env
REACT_APP_API_URL=https://<DOMAINE>/api
```

Le script refuse une URL relative, HTTP ou locale. `frontend/.env.android` est ignoré par Git et ne contient pas de secret ; il reste néanmoins propre à l’environnement de build.

Le backend doit autoriser l’origine Capacitor locale :

```env
ALLOWED_ORIGINS=https://<DOMAINE>,http://localhost
```

## Build et synchronisation

```bash
cd frontend
npm install
npm run build:android
```

Cette commande construit le frontend puis exécute la synchronisation Capacitor vers Android. Après un changement d’URL, reconstruisez l’application.

## Exécution sur un appareil

Si Android Studio est installé dans un emplacement non standard :

```bash
export CAPACITOR_ANDROID_STUDIO_PATH=/opt/android-studio/bin/studio
npx cap open android
```

Dans Android Studio, sélectionnez l’appareil physique, choisissez la configuration `app`, puis lancez **Run**.

## Vérifications

- Connexion et inscription avec l’API distante.
- Demande puis validation d’une participation.
- Affichage du QR code du participant.
- Autorisation de la caméra et lecture sur un appareil réel.
- Affichage des décisions d’accès autorisé et refusé.
- Journalisation d’un second passage, accepté volontairement.
- Fonctionnement sur un réseau mobile et en Wi-Fi.
- Absence de contenu mixte HTTP dans les journaux Android.

Les APK, AAB, fichiers de signature et mots de passe de keystore ne doivent jamais être ajoutés au dépôt. Conservez la clé de signature de publication dans un stockage sécurisé et sauvegardé.
