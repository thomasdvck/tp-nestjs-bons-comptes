# Bonus - Étape 3 : supprimer une dépense avec un Guard et un décorateur personnalisé

⏱️ Facultatif, 20 à 30 minutes après les étapes 1 et 2 · Notion : **Guard, décorateur `@CurrentUser()`, `ForbiddenException`**

## 1. Objectif

Écrire `DELETE /wallets/:walletId/expenses/:id` : seul le **dépenseur** ou le **créateur** de la dépense peut la supprimer (sinon `403`), grâce à un `ExpenseOwnerGuard` et à un décorateur `@CurrentUser()`.

## 2. Notion NestJS

### Le Guard

Un **Guard** est exécuté **avant** la méthode du contrôleur et décide si la requête peut continuer. C'est une classe qui implémente `CanActivate` :

- si `canActivate` renvoie `true` → la requête continue ;
- si elle lève une exception (`ForbiddenException`, `NotFoundException`…) → Nest répond avec le code HTTP correspondant et la méthode n'est **pas** appelée.

Un guard peut être injecté comme un service (il reçoit `PrismaService` dans son constructeur) et s'applique avec `@UseGuards(...)`, sur une classe entière ou sur **une seule méthode**. Vous connaissez déjà `JwtAuthGuard`, posé sur la classe : il vérifie le jeton et remplit `request.user`.

```ts
// project-member.guard.ts - exemple sur un autre sujet (pas la solution)
@Injectable()
export class ProjectMemberGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const { projectId } = request.params;       // paramètres de l'URL
    const { userId } = request.user;            // rempli par JwtAuthGuard

    const member = await this.prisma.projectMember.findFirst({
      where: { projectId, userId },
    });
    if (!member) {
      throw new ForbiddenException('Vous ne faites pas partie de ce projet.');
    }
    return true;
  }
}

// Sur UNE route :
@Delete(':projectId')
@UseGuards(ProjectMemberGuard)
remove(@Param('projectId') projectId: string) { /* … */ }
```

### Le décorateur de paramètre

Écrire `@Req() request` puis `request.user.userId` est répétitif. Avec `createParamDecorator`, on fabrique son propre décorateur de paramètre :

```ts
// current-locale.decorator.ts - exemple (pas la solution)
export const CurrentLocale = createParamDecorator(
  (suffix: string | undefined, context: ExecutionContext) => {
    const request = context.switchToHttp().getRequest();
    const locale = request.headers['accept-language'] ?? 'fr';
    return suffix ? `${locale}${suffix}` : locale;   // 1er argument = ce qu'on met entre parenthèses
  },
);

// Utilisation : @CurrentLocale() ou @CurrentLocale('-FR')
hello(@CurrentLocale() locale: string) { /* … */ }
```

📚 Documentation officielle : [Guards](https://docs.nestjs.com/guards) · [Décorateurs personnalisés](https://docs.nestjs.com/custom-decorators) · [Filtres d'exceptions (codes HTTP)](https://docs.nestjs.com/exception-filters)

## 3. À faire

Dans VS Code, ouvrez votre dépôt personnel cloné. Depuis sa racine, les fichiers de cette étape se trouvent dans `src\expenses` et son sous-dossier `guards`, ainsi que dans `src\auth\decorators`.

Cherchez `TODO étape 3`.

1. **`src/auth/decorators/current-user.decorator.ts` - décorateur `@CurrentUser()`** : complétez le décorateur :
   - `@CurrentUser()` renvoie `request.user` (c'est-à-dire `{ userId }`) ;
   - `@CurrentUser('userId')` renvoie directement `request.user.userId`.
2. **`src/expenses/guards/expense-owner.guard.ts` - classe `ExpenseOwnerGuard`** : complétez la méthode `canActivate` :
   1. lire `walletId` et `id` dans `request.params`, et `userId` dans `request.user` ;
   2. chercher la dépense avec `this.prisma.expense.findFirst({ where: { id, walletId }, ... })` ;
   3. introuvable → `NotFoundException` ;
   4. ni dépenseur (`paidById`) ni créateur (`createdById`) → `ForbiddenException` ;
   5. sinon renvoyer `true`.
3. **`src/expenses/expenses.service.ts` - classe `ExpensesService`** : écrivez la méthode `remove(walletId, expenseId)` (l'autorisation est faite par le guard, pas ici) :
   - le porte-monnaie doit exister (`NotFoundException`) et être ouvert (`assertWalletOpen`) ;
   - supprimer la dépense (`this.prisma.expense.delete`) ;
   - mettre à jour `updatedAt` du porte-monnaie.
4. **`src/expenses/expenses.controller.ts` - classe `ExpensesController`** :
   - ajoutez la méthode `remove` avec `@Delete(':id')`, `@UseGuards(ExpenseOwnerGuard)` et `@HttpCode(HttpStatus.NO_CONTENT)` (réponse `204`, sans corps) ;
   - **refactorisez** `findAll` et `create` pour utiliser `@CurrentUser('userId') userId: string` à la place de `@Req()`.

## 4. Indices

<details>
<summary>Indice 1 - le décorateur</summary>

```ts
export const CurrentUser = createParamDecorator(
  (field: string | undefined, context: ExecutionContext) => {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    // si `field` est fourni → request.user[field], sinon → request.user
  },
);
```

</details>

<details>
<summary>Indice 2 - structure du guard</summary>

```ts
const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
const { walletId, id } = request.params as Record<string, string>;
const { userId } = request.user;

const expense = await this.prisma.expense.findFirst({
  where: { id, walletId },
  select: { paidById: true, createdById: true },
});
```

</details>

<details>
<summary>Indice 3 - pourquoi chercher avec <code>{ id, walletId }</code> et pas seulement <code>id</code> ?</summary>

Une dépense d'un *autre* porte-monnaie ne doit pas être supprimable via l'URL de celui-ci. Avec les deux critères, elle est « introuvable » (404).

</details>

<details>
<summary>Indice 4 - la condition de refus</summary>

On refuse si l'utilisateur n'est **ni** le dépenseur **ni** le créateur : `expense.paidById !== userId && expense.createdById !== userId`.

</details>

<details>
<summary>Indice 5 - le guard n'est pas appelé (le test attend 403 mais reçoit 204)</summary>

Vérifiez `@UseGuards(ExpenseOwnerGuard)` **sur la méthode** `remove` et l'import de `ExpenseOwnerGuard` avec son `.js`.

</details>

<details>
<summary>Indice 6 - « Nest can't resolve dependencies of the ExpenseOwnerGuard »</summary>

Le guard doit être `@Injectable()` et son constructeur doit déclarer `PrismaService` avec son type (c'est déjà le cas dans le squelette fourni : ne le modifiez pas).

</details>

## 5. ✅ Checkpoint

```bash
npm run test:etape3
```

Rechargez Swagger : `DELETE /wallets/{walletId}/expenses/{id}` apparaît. Les tests vérifient les trois cas à retenir :

1. le dépenseur ou le créateur supprime sa dépense → `204` ;
2. un autre membre tente de supprimer → `403` (c'est le travail de votre `ExpenseOwnerGuard`) ;
3. une dépense inexistante → `404`.

Sauvegardez votre travail sur votre branche personnelle :

```bash
git add -A
git commit -m "étape 3"
git push
```

## 6. Bloqué ?

```bash
npm run rattrapage -- 3
```

Récupère le code de la fin de l'étape 3.
