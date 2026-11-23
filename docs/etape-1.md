# Étape 1 - Lister les dépenses d'un porte-monnaie

⏱️ 20 minutes · Notion : **Module, Controller, Service, injection de dépendances**

## 1. Objectif

Écrire la route `GET /wallets/:walletId/expenses` qui renvoie les dépenses d'un porte-monnaie **et** leur total en centimes.

## 2. Notion NestJS

Une application Nest est un assemblage de trois types de briques :

- le **contrôleur** (`@Controller`) reçoit la requête HTTP et choisit la méthode à appeler (`@Get`, `@Post`…). Il ne contient **pas** de logique métier ;
- le **service** (`@Injectable`) contient la logique (lire la base, calculer, vérifier des règles) ;
- le **module** (`@Module`) regroupe un contrôleur et ses services, et déclare ce qu'il importe.

Vous ne créez jamais vous-même un service avec `new`. Vous le **demandez dans le constructeur** et Nest le fournit : c'est l'**injection de dépendances**. Nest sait quoi fournir grâce au *type* du paramètre, à condition que le service soit listé dans `providers` du module.

Exemple (sur un autre sujet - les notes de cours - ce n'est pas la solution) :

```ts
// notes.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class NotesService {
  // Nest injecte PrismaService : on le « demande » dans le constructeur.
  constructor(private readonly prisma: PrismaService) {}

  findAll(courseId: string) {
    return this.prisma.note.findMany({ where: { courseId } });
  }
}

// notes.controller.ts
@Controller('courses/:courseId/notes')
export class NotesController {
  constructor(private readonly notesService: NotesService) {}

  @Get()
  findAll(@Param('courseId') courseId: string) {
    return this.notesService.findAll(courseId);
  }
}

// notes.module.ts
@Module({
  controllers: [NotesController],
  providers: [NotesService],
})
export class NotesModule {}
```

> ⚠️ **Projet ESM : les imports locaux doivent se terminer par `.js`** (`'./notes.service.js'`), même si le fichier est un `.ts`. L'auto-import de VS Code l'oublie souvent. Une erreur `Cannot find module` au démarrage vient presque toujours de là.

📚 Documentation officielle : [Contrôleurs](https://docs.nestjs.com/controllers) · [Providers](https://docs.nestjs.com/providers) · [Modules](https://docs.nestjs.com/modules)

## 3. À faire

Dans VS Code, ouvrez votre dépôt personnel cloné. Depuis sa racine, les fichiers de cette étape se trouvent dans le dossier `src\expenses`.

Cherchez `TODO étape 1` dans le projet.

1. **`src/expenses/expenses.service.ts` - classe `ExpensesService`**
   - importez `PrismaService` et ajoutez le **constructeur** qui l'injecte ;
   - écrivez `async findAll(walletId: string, userId: string)` :
     1. vérifier l'accès avec la fonction fournie `assertMemberOfWallet(this.prisma, walletId, userId)` (elle lève 404 / 403 toute seule) ;
     2. lire les dépenses : `this.prisma.expense.findMany(...)` filtrées sur le `walletId`, triées de la plus récente à la plus ancienne, avec `select: expenseSelect` ;
     3. calculer le total : `this.prisma.expense.aggregate(...)` avec `_sum: { amount: true }` ;
     4. renvoyer `{ items, totalAmount }` - les `items` passent par `toExpenseItem`, et le total vaut `0` (et non `null`) s'il n'y a aucune dépense.
2. **`src/expenses/expenses.controller.ts` - classe `ExpensesController`**
   - importez `ExpensesService`, injectez-le dans le constructeur ;
   - ajoutez une méthode `findAll` décorée par `@Get()`, qui lit `walletId` avec `@Param('walletId')` et l'utilisateur connecté avec `@Req()` (`request.user.userId`), puis **délègue** au service.
3. **`src/expenses/expenses.module.ts` - classe `ExpensesModule`**
   - déclarez le contrôleur dans `controllers` et le service dans `providers`.

Les fonctions `expenseSelect`, `toExpenseItem` et `assertMemberOfWallet` sont déjà écrites dans `src/expenses/expenses.helpers.ts` : lisez-les, puis utilisez-les.

## 4. Indices

<details>
<summary>Indice 1 - le constructeur du service</summary>

```ts
constructor(private readonly prisma: PrismaService) {}
```

Le mot-clé `private readonly` devant le paramètre crée automatiquement l'attribut `this.prisma`.

</details>

<details>
<summary>Indice 2 - filtrer et trier avec Prisma</summary>

```ts
this.prisma.expense.findMany({
  where: { walletId },
  orderBy: [{ date: 'desc' }, { id: 'desc' }],
  select: expenseSelect,
});
```

</details>

<details>
<summary>Indice 3 - le total</summary>

`aggregate` renvoie `{ _sum: { amount: number | null } }`. La valeur est `null` quand il n'y a aucune ligne : utilisez `?? 0`.

</details>

<details>
<summary>Indice 4 - le test dit que la route n'existe pas (404)</summary>

Vérifiez trois choses : `@Get()` est bien sur la méthode ; le contrôleur est dans `controllers` du module ; le module est importé dans `app.module.ts` (c'est déjà fait).

</details>

<details>
<summary>Indice 5 - Nest dit qu'il « ne peut pas résoudre les dépendances »</summary>

Le service oublié dans `providers`, ou un `import` sans `.js`, ou un paramètre de constructeur sans type. Relisez le message : il nomme la classe concernée.

</details>

## 5. ✅ Checkpoint

```bash
npm run test:etape1
```

Tous les tests de l'étape 1 doivent être verts.

Avec `npm run start:dev`, rechargez Swagger (<http://localhost:3000/api/docs>) : la route `GET /wallets/{walletId}/expenses` doit maintenant apparaître dans la section **expenses**, avec le cadenas 🔒 (route protégée). *Try it out* ne fonctionne pas sans base de données : ce sont les tests qui font foi.

Sauvegardez votre travail sur votre branche personnelle :

```bash
git add -A
git commit -m "étape 1"
git push
```

## 6. Bloqué ?

```bash
npm run rattrapage -- 1
```

Récupère le code de la fin de l'étape 1 (voir le [README](../README.md#rattrapage)). Ensuite : [étape 2](etape-2.md).
