# TP NestJS - « Les bons comptes »

Atelier de 2 heures · Master 2 MIAGE · Université de Lille · UE *Infrastructures & Frameworks*

« Les bons comptes » est une application de gestion de **porte-monnaie partagé** : des amis créent un porte-monnaie, s'invitent, déclarent leurs dépenses, puis **clôturent** le porte-monnaie pour savoir qui doit rembourser qui. Le backend est écrit avec **NestJS** (TypeScript).

Une partie de l'application est déjà écrite (comptes, porte-monnaies, invitations). **Vous écrivez la gestion des dépenses** : lister et créer. La suppression est proposée en **bonus**.

> 💡 **Aucune base de données n'est nécessaire.** Les tests démarrent une vraie application Nest en mémoire et remplacent la base par une fausse base : vous n'avez ni identifiant, ni URL, ni configuration à gérer.

## Objectifs

À la fin de l'atelier, vous saurez :

- lire la structure d'un projet NestJS (modules, contrôleurs, services) ;
- utiliser l'**injection de dépendances** ;
- valider des données entrantes avec des **DTO** et `class-validator` ;
- en bonus, protéger une route avec un **Guard** et créer un **décorateur personnalisé** ;
- tester une API NestJS avec **Vitest** (même API que Jest : `describe`, `it`, `expect`).

## Prérequis

- Node.js **24 LTS** (version 24.15.0 ou ultérieure dans la série 24), Git, VS Code, un compte GitHub.
- Notions de TypeScript / JavaScript et de HTTP (GET, POST, DELETE, codes de statut).
- **Aucune connaissance de NestJS n'est demandée.**

➡️ Suivez **[docs/00-installation.md](docs/00-installation.md)** *avant* la séance : l'installation prend 10 à 15 minutes.

## Déroulé

Le créneau de l'atelier est de **2 heures**. Si le temps manque, visez le parcours essentiel en **60 minutes**, après l'installation réalisée avant la séance. Ces durées sont indicatives.

| Étape | Fonctionnalité | Notion NestJS | Durée |
|---|---|---|---|
| [0](docs/00-installation.md) | Découverte du projet et de Swagger (installation avant la séance) | Structure d'un projet Nest | 5 min |
| [1](docs/etape-1.md) | `GET` lister les dépenses d'un porte-monnaie + total | Module, Controller, Service, injection de dépendances | 25 min |
| [2](docs/etape-2.md) | `POST` déclarer une dépense (montant > 0, dépenseur optionnel) | DTO, `class-validator`, `ValidationPipe` | 25 min |
| Conclusion | Vérifier les tests et sauvegarder le travail | Bilan | 5 min |
| [Bonus - étape 3](docs/etape-3.md) | `DELETE` : seul le dépenseur (ou le créateur) peut supprimer | Guard, décorateur `@CurrentUser()`, `ForbiddenException` | 20 à 30 min |

Chaque fiche contient : l'objectif, la notion NestJS (avec un exemple de code qui n'est **pas** la solution), la liste de ce qu'il faut faire, des indices repliables, un **checkpoint** et la marche à suivre si vous êtes bloqué.

## Comment travailler

1. Créez votre dépôt depuis ce modèle (« Use this template »), clonez-le, installez (`npm install`).
2. **Créez votre branche personnelle** nommée `prenom-tp-nestjs` (par exemple `angela-tp-nestjs`) et travaillez **uniquement** dessus :

   ```bash
   git switch -c prenom-tp-nestjs
   git push -u origin prenom-tp-nestjs
   ```

   Après chaque étape : `git add -A`, `git commit -m "étape 1"`, `git push`. Ainsi l'enseignant voit votre avancement, et le workflow de tests de GitHub tourne sur votre branche.
3. Cherchez les `// TODO étape X` dans `src/` : ils indiquent **quel fichier** et **quelle fonction** compléter.
4. Vérifiez votre travail avec le test de l'étape :

   ```bash
   npm run test:etape1   # puis npm run test:etape2
   ```

   Au départ les tests des exercices sont **rouges** - c'est normal, c'est votre travail de les faire passer. Pour le bonus, utilisez `npm run test:etape3` si vous le réalisez. Leurs messages vous disent ce qui était attendu et ce qui a été reçu.
5. Lancez `npm run start:dev` et ouvrez Swagger : <http://localhost:3000/api/docs>. Chaque route que vous écrivez y apparaît (le bouton *Try it out* ne fonctionne pas : il n'y a pas de base de données, ce sont les tests qui vérifient le comportement).

### Les TODO

Dans VS Code, ouvrez la recherche globale (`Ctrl+Maj+F`) et cherchez `TODO étape 1` : vous voyez tous les endroits à compléter pour l'étape 1.

## Rattrapage

Si vous êtes en retard ou bloqué : le dépôt **solutions** contient une branche par étape : `etape-0`, `etape-1`, `etape-2` et `etape-3`. La branche `etape-N` contient le code **terminé jusqu'à la fin de l'étape N**.

Pour récupérer le code corrigé de l'étape 2, par exemple :

```bash
npm run rattrapage -- 2
```

Le script sauvegarde d'abord votre dossier `src/` dans `.rattrapage-backup/`, puis le remplace par celui de la branche `etape-2`. L'adresse du dépôt solutions vous est donnée en séance ; si le script la demande :

```bash
# macOS / Linux / Git Bash
SOLUTIONS_URL=https://github.com/LaCoir/tp-nestjs-solutions npm run rattrapage -- 2

# PowerShell
$env:SOLUTIONS_URL="https://github.com/LaCoir/tp-nestjs-solutions"; npm run rattrapage -- 2
```

<details>
<summary>Commandes Git équivalentes (sans le script)</summary>

```bash
git remote add solutions https://github.com/LaCoir/tp-nestjs-solutions
git fetch solutions etape-2
git checkout solutions/etape-2 -- src
```

</details>

> Le rattrapage de l'étape N **remplace tout `src/`** : après, vous repartez de l'étape N + 1.

## Structure du projet

```
src/
├── main.ts                    point d'entrée (Swagger, ValidationPipe)
├── app.module.ts              module racine : assemble tous les modules
├── auth/                      connexion, jetons JWT, JwtAuthGuard        (fourni)
│   └── decorators/            @CurrentUser()                              ← étape 3
├── users/  wallets/  invitations/  memberships/  notifications/          (fournis)
├── expenses/                  ← étapes 1 à 3 : les dépenses
│   ├── expenses.module.ts
│   ├── expenses.controller.ts
│   ├── expenses.service.ts
│   ├── expenses.helpers.ts    fonctions fournies (select, accès, état du porte-monnaie)
│   ├── dto/create-expense.dto.ts
│   └── guards/expense-owner.guard.ts
├── closure/                   clôture et bilan (hors parcours du TP)
│   ├── balance-calculator.ts  calcul des parts et des soldes
│   ├── balance-data.ts        lecture en base (fournie)
│   └── closure.service.ts
├── common/                    utilitaires (Swagger)
└── prisma/                    accès à la base de données (non utilisé par les tests)
prisma/schema.prisma           schéma de la base (lecture seule)
test/                          un fichier de test par étape
docs/                          les fiches du TP
```

## Règles du métier

- Les montants sont des **entiers en centimes** (`4599` = 45,99 €). Jamais de nombres à virgule.
- Seuls les **membres** (invitation acceptée) voient et modifient les dépenses d'un porte-monnaie.
- Une dépense a un **dépenseur** (`paidById`, celui qui a payé) et un **créateur** (`createdById`, celui qui l'a saisie). Par défaut, c'est la même personne.
- Seuls le dépenseur **ou** le créateur peuvent supprimer une dépense.
- Un porte-monnaie **clôturé** n'accepte plus aucune dépense.
- Chaque action sur un porte-monnaie met à jour sa date `updatedAt`.

## Stack

NestJS 12 · TypeScript · Prisma · Swagger (`@nestjs/swagger`) · Vitest + Supertest.

## Intégration continue

Le workflow `.github/workflows/test.yml` compile le projet et lance les tests à chaque `push` (donc aussi sur votre branche personnelle). Sur le dépôt de départ, les tests des étapes échouent volontairement : l'étape correspondante est marquée « échec ignoré » dans GitHub Actions. Le workflow lance aussi les tests de clôture conservés dans le dépôt ; leur résultat n'est pas requis pour ce TP et leur échec est ignoré.
