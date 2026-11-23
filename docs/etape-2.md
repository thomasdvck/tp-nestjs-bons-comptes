# Étape 2 - Déclarer une dépense

⏱️ 20 minutes · Notion : **DTO, `class-validator`, `ValidationPipe`**

## 1. Objectif

Écrire `POST /wallets/:walletId/expenses` : créer une dépense dont le montant est **strictement positif** et dont le dépenseur est **optionnel** (par défaut, l'utilisateur connecté).

## 2. Notion NestJS

Les données envoyées par un client ne sont **jamais fiables**. Nest les décrit avec un **DTO** (*Data Transfer Object*) : une classe dont chaque champ est décoré avec les règles de `class-validator`. Le **`ValidationPipe`** (déjà activé globalement dans `src/main.ts`) vérifie le corps de la requête avant d'appeler la méthode du contrôleur ; en cas d'erreur, il répond lui-même `400 Bad Request`.

Notre `ValidationPipe` est configuré avec `whitelist: true` et `forbidNonWhitelisted: true` : **une propriété sans aucun décorateur `class-validator` est rejetée** (400), et un champ inconnu aussi. Il faut donc décorer *chaque* champ.

Exemple (autre sujet - ce n'est pas la solution) :

```ts
import { IsEmail, IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

export class CreateReviewDto {
  @IsString()
  @MaxLength(200)
  comment: string;

  @IsInt()          // entier (pas 4.5, pas "4")
  @Min(1)
  @Max(5)
  rating: number;

  @IsOptional()     // le champ peut être absent…
  @IsEmail()        // …mais s'il est présent, il doit être un e-mail
  contactEmail?: string;
}

// Dans le contrôleur : @Body() permet à Nest de valider avec ce DTO.
@Post()
create(@Body() dto: CreateReviewDto) { /* dto est valide ici */ }
```

> Les décorateurs `@ApiProperty` de Swagger **documentent** mais ne **valident** rien. Ne les confondez pas avec ceux de `class-validator`.

📚 Documentation officielle : [Validation](https://docs.nestjs.com/techniques/validation) · [Pipes](https://docs.nestjs.com/pipes) · [liste des décorateurs class-validator](https://github.com/typestack/class-validator#validation-decorators)

## 3. À faire

Dans VS Code, ouvrez votre dépôt personnel cloné. Depuis sa racine, les fichiers de cette étape se trouvent dans `src\expenses` et son sous-dossier `dto`.

Cherchez `TODO étape 2`.

1. **`src/expenses/dto/create-expense.dto.ts` - classe `CreateExpenseDto`** : ajoutez les décorateurs de validation :

   | Champ | Règle |
   |---|---|
   | `title` | texte, non vide, 100 caractères maximum |
   | `amount` | entier **> 0** (en centimes) |
   | `date` | texte au format `AAAA-MM-JJ`, date ISO valide |
   | `paidById` | **optionnel** ; s'il est présent, c'est un UUID |

2. **`src/expenses/expenses.service.ts` - classe `ExpensesService`** : écrivez la méthode `create(walletId, userId, dto)` :
   1. vérifier l'accès (`assertMemberOfWallet`) puis que le porte-monnaie est ouvert (`assertWalletOpen`, lève 409 s'il est clôturé) ;
   2. dépenseur = `dto.paidById ?? userId` ; s'il est différent de l'utilisateur connecté, il doit être **membre** (`isMemberOfWallet`), sinon `ForbiddenException` ;
   3. créer la dépense avec `this.prisma.expense.create(...)` : `createdById` est **toujours** l'utilisateur connecté, `date` est `new Date(dto.date)` ;
   4. **mettre à jour `updatedAt` du porte-monnaie** (règle métier : chaque action rafraîchit cette date) avec `this.prisma.wallet.update(...)` ;
   5. renvoyer `toExpenseItem(...)`.
3. **`src/expenses/expenses.controller.ts` - classe `ExpensesController`** : ajoutez la méthode `create` avec `@Post()` et `@Body() dto: CreateExpenseDto`, puis déléguez au service.

## 4. Indices

<details>
<summary>Indice 1 - les décorateurs du DTO</summary>

`title` : `@IsString()`, `@IsNotEmpty()`, `@MaxLength(100)`.
`amount` : `@IsInt()` et `@Min(1)`.
`date` : `@Matches(/^\d{4}-\d{2}-\d{2}$/)` et/ou `@IsISO8601({ strict: true })`.
`paidById` : `@IsOptional()` puis `@IsUUID()`.

</details>

<details>
<summary>Indice 2 - « amount doit être > 0 »</summary>

`@Min(1)` : un entier plus petit que 1 (0, −5…) est refusé. Combiné à `@IsInt()`, 12.5 est refusé aussi.

</details>

<details>
<summary>Indice 3 - tout renvoie 400, même une requête correcte</summary>

Un champ du DTO n'a **aucun** décorateur `class-validator` : `whitelist` + `forbidNonWhitelisted` le rejettent. Décorez chaque champ, y compris `paidById` (`@IsOptional()` compte comme un décorateur).

</details>

<details>
<summary>Indice 4 - appeler Prisma pour créer</summary>

```ts
this.prisma.expense.create({
  data: { walletId, title: dto.title, /* … */ createdById: userId },
  select: expenseSelect,
});
```

Tous les champs de `data` sont obligatoires pour Prisma : `walletId`, `title`, `amount`, `date`, `paidById`, `createdById`.

</details>

<details>
<summary>Indice 5 - mettre à jour updatedAt</summary>

```ts
await this.prisma.wallet.update({
  where: { id: walletId },
  data: { updatedAt: new Date() },
});
```

</details>

## 5. ✅ Checkpoint

```bash
npm run test:etape2
```

Rechargez Swagger : `POST /wallets/{walletId}/expenses` apparaît, avec le corps attendu (`title`, `amount`, `date`…). Les tests vérifient les cas importants : une dépense valide est créée (`201`, le dépenseur est vous) ; `amount` à `0`, négatif ou à virgule (`12.5`) est refusé avec `400` ; un champ inconnu est refusé ; un porte-monnaie clôturé répond `409`.

Sauvegardez votre travail sur votre branche personnelle :

```bash
git add -A
git commit -m "étape 2"
git push
```

Le parcours essentiel est terminé. Si vous avez encore du temps, passez au [bonus : suppression d'une dépense](etape-3.md).

## 6. Bloqué ?

```bash
npm run rattrapage -- 2
```

Récupère le code de la fin de l'étape 2. Vous pouvez ensuite réaliser le [bonus](etape-3.md).
