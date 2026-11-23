# Étape 0 - Installation et découverte (à faire AVANT la séance)

⏱️ 15 minutes environ. Si un point bloque, notez l'erreur et venez nous voir en début de séance.

## 1. Logiciels à installer

| Outil | Version | Vérification |
|---|---|---|
| **Node.js** (LTS) | **24 LTS recommandé**, à partir de **24.15.0** | `node -v` doit afficher `v24.15.0` ou une version ultérieure de la série 24 |
| **npm** | fourni avec Node | `npm -v` |
| **Git** | récent | `git --version` |
| **VS Code** | récent | - |
| Compte **GitHub** | - | - |

> ⚠️ Utilisez de préférence **Node 24 LTS, à partir de 24.15.0**. Certaines dépendances exigent une version précise de Node. Node 22 est également compatible à partir de **22.22.3** ; les versions 23 et 25 ne sont pas prises en charge. Téléchargez Node sur <https://nodejs.org>.

### Extensions VS Code conseillées

- **Prisma** (`Prisma.prisma`) : coloration du schéma de la base.
- **Prettier** (`esbenp.prettier-vscode`) : mise en forme du code.
- **Vitest** (`vitest.explorer`) : lancer les tests depuis VS Code (facultatif).
- **REST Client** ou **Thunder Client** : envoyer des requêtes HTTP (facultatif, Swagger suffit).

## 2. Créer votre dépôt à partir du modèle

1. Ouvrez l'adresse du dépôt modèle donnée par l'enseignant (`https://github.com/LaCoir/tp-nestjs-bons-comptes`).
2. Cliquez sur le bouton vert **« Use this template »** → **« Create a new repository »**.
3. Choisissez votre compte comme propriétaire et un nom contenant votre prénom (par exemple, si l'étudiante s'appelle Angela : `angela-tp-nestjs-bons-comptes`), sélectionnez la visibilité **Public**, puis **Create repository**.

   > Ne cochez pas « Include all branches » : seule la branche principale est utile.
   Votre nouveau dépôt contient déjà les fichiers et les tests du TP.
4. **Clonez votre dépôt en remplaçant le compte et le nom de l'exemple par les vôtres :**

   ```bash
   git clone https://github.com/<votre-compte>/angela-tp-nestjs-bons-comptes.git
   cd angela-tp-nestjs-bons-comptes
   code .
   ```
5. **Créez votre branche personnelle** `prenom-tp-nestjs` (par exemple `angela-tp-nestjs`) et poussez-la :

   ```bash
   git switch -c prenom-tp-nestjs
   git push -u origin prenom-tp-nestjs
   ```

   Vous travaillerez **uniquement sur cette branche** pendant tout le TP. Après chaque étape : `git add -A`, `git commit -m "étape 1"`, `git push`.

## 3. Installer les dépendances

```bash
npm install
```

Cette commande télécharge les bibliothèques **et** génère le client Prisma (script `postinstall`). Comptez 1 à 2 minutes.

## 4. Configurer l'environnement

```bash
# macOS / Linux / Git Bash
cp .env.example .env

# PowerShell
Copy-Item .env.example .env
```

**Il n'y a rien à compléter.** Ce TP n'utilise **aucune base de données** : les tests tournent sur une fausse base en mémoire. Le fichier `.env` ne contient que des valeurs factices qui permettent au serveur de démarrer pour afficher Swagger.

> Le fichier `.env` est ignoré par Git : ne le commitez pas.

## 5. Vérifier que tout démarre

```bash
npm run build          # doit se terminer sans erreur
npm run start:dev      # démarre le serveur en mode « watch »
```

Vous devez voir `Nest application successfully started`. Ouvrez ensuite **Swagger** : <http://localhost:3000/api/docs>. (Aucune base n'est nécessaire pour démarrer.)

Arrêtez le serveur avec `Ctrl+C`. Lancez enfin les tests :

```bash
npm run test:etapes
```

Les tests des étapes 1 à 3 sont **rouges** : c'est normal avant de coder. Les étapes 1 et 2 constituent le parcours essentiel ; l'étape 3 est facultative et ses tests restent rouges tant que vous ne la réalisez pas. Pour vérifier que le reste de l'application est sain : `npx vitest run src` doit être entièrement vert.

## 6. Découvrir le projet avec Swagger (étape 0 - 5 min en séance)

Swagger est la **documentation interactive** de l'API : la liste de toutes les routes, avec ce qu'elles reçoivent et ce qu'elles renvoient.

> ℹ️ Comme il n'y a **pas de base de données**, le bouton *Try it out* ne fonctionne pas (les requêtes qui lisent ou écrivent des données échouent). Swagger sert ici à **lire le contrat de l'API** ; c'est la commande `npm run test:etapeN` qui vérifie que votre code se comporte correctement.

1. Lancez `npm run start:dev` et ouvrez <http://localhost:3000/api/docs>.
2. Parcourez les sections : **users**, **auth**, **wallets**, **invitations**… Dépliez une route (par exemple `POST /wallets`) : regardez le corps attendu (*Request body*), les codes de réponse possibles et les exemples.
3. Repérez le bouton **Authorize** 🔒 : les routes protégées par `JwtAuthGuard` affichent un cadenas. Vous écrirez bientôt des routes protégées de la même façon.
4. Cherchez la section **expenses** : elle peut être absente tant qu'aucune route de dépenses n'est déclarée. Chaque route que vous écrivez y apparaîtra après rechargement de la page : c'est votre premier retour visuel.

### Visite guidée du code

Ouvrez dans l'ordre :

1. `src/main.ts` : démarrage, `ValidationPipe`, Swagger.
2. `src/app.module.ts` : le module racine importe tous les modules.
3. `src/wallets/wallets.module.ts`, `wallets.controller.ts`, `wallets.service.ts` : un module **complet** que vous prendrez pour modèle.
4. `src/expenses/` : le module que vous allez compléter (presque vide).

## FAQ - erreurs fréquentes

<details>
<summary><strong>« node » n'est pas reconnu comme commande (Windows)</strong></summary>

Node n'est pas dans le `PATH`. Réinstallez Node en laissant cochée l'option « Add to PATH », puis **fermez et rouvrez** VS Code et le terminal. Vérifiez avec `node -v`.

</details>

<details>
<summary><strong><code>npm : l'exécution de scripts est désactivée sur ce système</code> (PowerShell)</strong></summary>

Dans PowerShell, exécutez une fois : `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned`, ou utilisez l'invite de commandes (cmd) / Git Bash.

</details>

<details>
<summary><strong>Version de Node trop ancienne (<code>Unsupported engine</code>, <code>SyntaxError</code>…)</strong></summary>

Vérifiez `node -v`, puis installez **Node 24 LTS, à partir de 24.15.0**, depuis <https://nodejs.org> ou avec `nvm install 24` puis `nvm use 24`. Après le changement, relancez `npm ci`.

</details>

<details>
<summary><strong>Port 3000 déjà occupé (<code>EADDRINUSE</code>)</strong></summary>

Une autre application utilise ce port. Soit vous l'arrêtez, soit vous changez le port dans `.env` : `PORT=3005` (Swagger sera alors sur `http://localhost:3005/api/docs`).

- Windows : `netstat -ano | findstr :3000` puis `taskkill /PID <numéro> /F`
- macOS / Linux : `lsof -i :3000` puis `kill <numéro>`

</details>

<details>
<summary><strong><code>EPERM</code> / <code>operation not permitted</code> pendant <code>npm install</code> ou <code>prisma generate</code> (Windows)</strong></summary>

Un serveur ou un test encore lancé verrouille un fichier de Prisma. Arrêtez tous les terminaux qui exécutent `npm run start:dev` ou `vitest`, puis relancez `npm install`. Si le problème persiste, fermez VS Code.

</details>

<details>
<summary><strong><code>Cannot find module './xxx.service'</code> ou <code>ERR_MODULE_NOT_FOUND</code> - les imports locaux doivent se terminer par <code>.js</code></strong></summary>

Ce projet utilise les **modules ES (ESM)**. Dans ce mode, **tous les imports de fichiers locaux doivent se terminer par `.js`**, même si le fichier source est en `.ts` :

```ts
import { ExpensesService } from './expenses.service.js';   // ✅
import { ExpensesService } from './expenses.service';      // ❌ erreur au démarrage
```

L'import d'une bibliothèque (`@nestjs/common`, `class-validator`…) ne prend **pas** de `.js`. L'auto-import de VS Code oublie parfois le `.js` : ajoutez-le à la main.

</details>

<details>
<summary><strong><code>Missing JWT_SECRET</code> / <code>JWT_SECRET</code> manquant au démarrage</strong></summary>

Le fichier `.env` n'existe pas ou n'est pas à la racine du projet (à côté de `package.json`). Refaites la section 4 (copie de `.env.example`). Redémarrez le serveur après toute modification.

</details>

<details>
<summary><strong>Je n'ai pas de base de données : est-ce normal ?</strong></summary>

Oui. Les tests utilisent une fausse base en mémoire ; il n'y a rien à installer ni à configurer. Les requêtes envoyées depuis Swagger (*Try it out*) qui touchent aux données échouent : c'est attendu.

</details>

<details>
<summary><strong><code>git push</code> demande une authentification / est refusé</strong></summary>

Connectez-vous à GitHub depuis VS Code (ou installez le *Git Credential Manager*), puis refaites `git push -u origin prenom-tp-nestjs`. Vérifiez que vous poussez bien **votre** dépôt (`git remote -v`).

</details>

<details>
<summary><strong>Les tests sont tous rouges au démarrage</strong></summary>

C'est attendu : ils vérifient le code que vous allez écrire. Lisez le message d'échec : il indique la valeur attendue et la valeur reçue.

</details>
