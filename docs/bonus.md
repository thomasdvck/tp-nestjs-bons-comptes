# Hors parcours du TP - Clôturer le porte-monnaie : qui doit payer, qui doit recevoir

Cette fiche est conservée à titre de référence et ne fait pas partie du parcours demandé aux étudiants. Notion : **service métier + tests**.

## 1. Objectif

Quand le porte-monnaie est clôturé, calculer pour chaque membre sa **part**, son **solde** (ce qu'il doit payer ou recevoir) et les **virements** qui équilibrent les comptes.

## 2. Notion NestJS

Un **service métier** concentre les règles de l'application. Ici, le calcul lui-même est une **fonction pure** (`calculateBalances` : des nombres en entrée, des nombres en sortie, aucune base de données) : elle se teste très facilement. Le service Nest (`ClosureService`) l'orchestre : il vérifie les droits, lit la base, appelle la fonction pure, renvoie le résultat. Cette séparation rend la logique réutilisable et testable **sans** serveur ni base.

```ts
// pricing.ts - fonction pure (exemple, pas la solution)
export function applyDiscount(priceInCents: number, percent: number) {
  return priceInCents - Math.floor((priceInCents * percent) / 100);
}

// pricing.service.ts - le service orchestre
@Injectable()
export class PricingService {
  constructor(private readonly prisma: PrismaService) {}

  async quote(productId: string, percent: number) {
    const product = await this.prisma.product.findUniqueOrThrow({ where: { id: productId } });
    return { productId, price: applyDiscount(product.priceInCents, percent) };
  }
}
```

Les tests de cette étape sont des tests **unitaires** (Vitest, même API que Jest) : on appelle la fonction avec des valeurs et on compare avec le résultat attendu.

📚 Documentation officielle : [Providers / services](https://docs.nestjs.com/providers) · [Tests](https://docs.nestjs.com/fundamentals/testing) · [Vitest](https://vitest.dev/guide/)

## 3. La règle de calcul

Tous les montants sont des **entiers en centimes**. On n'utilise jamais de nombres à virgule : `0,1 + 0,2` ne donne pas exactement `0,3` en informatique, et on perdrait des centimes.

1. **Total** = somme de toutes les dépenses du porte-monnaie.
2. **Répartition égale** : chaque membre doit la même part.
   - part de base = `Math.floor(total / nombreDeMembres)` (division entière) ;
   - reste = `total % nombreDeMembres` (ce qui n'a pas pu être divisé).
3. **Répartition du reste** : on ajoute **1 centime** à la part des `reste` premiers membres, **dans l'ordre croissant des `userId`** (ordre alphabétique). Les autres paient la part de base. Ainsi la somme des parts est *exactement* le total, et le résultat est toujours le même (déterministe), quel que soit l'ordre dans lequel les membres arrivent.
4. **Solde** de chaque membre = `montant payé − part due`.
   - solde **> 0** : il a trop payé → il doit **recevoir** de l'argent ;
   - solde **< 0** : il n'a pas assez payé → il doit **payer** ;
   - la somme de tous les soldes vaut toujours **0**.

### Exemple chiffré

Trois membres `a`, `b`, `c` (triés par `userId`). Total : **100,00 € = 10 000 centimes**, tout payé par `a`.

| | Payé | Calcul de la part | Part due | Solde |
|---|---|---|---|---|
| `a` | 10 000 | base 3 333 **+ 1** (1ᵉʳ userId, reçoit le reste) | **3 334** | 10 000 − 3 334 = **+6 666** |
| `b` | 0 | base 3 333 | **3 333** | 0 − 3 333 = **−3 333** |
| `c` | 0 | base 3 333 | **3 333** | 0 − 3 333 = **−3 333** |

- `Math.floor(10000 / 3) = 3333` ; `10000 % 3 = 1` → un seul membre reçoit 1 centime de plus : le premier, `a`.
- Contrôle : 3 334 + 3 333 + 3 333 = **10 000** ✔ ; soldes : +6 666 − 3 333 − 3 333 = **0** ✔.
- Virements proposés : `b → a : 33,33 €` et `c → a : 33,33 €`.

Avec un total de 10 001 centimes (reste 2), ce sont `a` **et** `b` qui paient 1 centime de plus (3 334 / 3 334 / 3 333).

## 4. À faire

Dans VS Code, ouvrez votre dépôt personnel cloné. Depuis sa racine, les fichiers de ce bonus se trouvent dans le dossier `src\closure`.

Cherchez `TODO bonus`.

1. **`src/closure/balance-calculator.ts`** - écrivez `calculateBalances(totalAmount, members)` :
   - triez les membres par `userId` (sur une **copie** : `[...members].sort(...)`, la fonction `byUserId` est fournie) ;
   - calculez la part de chacun avec la règle ci-dessus ;
   - renvoyez `{ balances, transfers }` où `balances` contient, pour chaque membre, `{ userId, name, paidAmount, shareAmount, balance }` et `transfers` vaut `computeTransfers(balances)` (fonction fournie plus bas dans le fichier).
2. **`src/closure/closure.service.ts`** - écrivez `getBalance(walletId, userId)` :
   1. `await this.checkClosedWalletAccess(walletId, userId)` (fournie : 404 / 403 / 409 si le porte-monnaie est encore ouvert) ;
   2. `const data = await loadBalanceData(this.prisma, walletId)` (fournie : lit le total et ce que chacun a payé) ;
   3. appelez `calculateBalances(data.totalAmount, data.memberPayments)` ;
   4. renvoyez `{ walletId, totalAmount: data.totalAmount, balances, transfers }`.
   Pensez à décommenter / ajouter les `import` en haut du fichier (avec `.js` !) et à supprimer le `throw new NotImplementedException`.

La clôture elle-même (`POST /wallets/:id/close`, réservée au créateur) est déjà écrite : elle passe le porte-monnaie à `CLOSED` et supprime les invitations en attente.

## 5. Indices

<details>
<summary>Indice 1 - les deux nombres à calculer</summary>

```ts
const baseShare = Math.floor(totalAmount / sortedMembers.length);
const remainder = totalAmount % sortedMembers.length;
```

</details>

<details>
<summary>Indice 2 - qui reçoit le centime en plus ?</summary>

Quand vous parcourez les membres triés avec `.map((member, index) => …)`, le membre reçoit 1 centime de plus **si `index < remainder`**.

</details>

<details>
<summary>Indice 3 - le solde</summary>

`balance = member.paidAmount - shareAmount` : positif = à recevoir, négatif = à payer.

</details>

<details>
<summary>Indice 4 - des NaN dans les résultats</summary>

Un `NaN` vient presque toujours d'une division par zéro (aucun membre) ou d'un champ mal nommé (`paidAmount` ; pas `paid` ni `amount`).

</details>

<details>
<summary>Indice 5 - comment lire un message de test</summary>

`Part de A - valeur attendue : 3334 centimes, valeur reçue : 3333 centimes` : la valeur reçue est ce que **votre code** a produit. Reprenez l'exemple chiffré ci-dessus et vérifiez à la main qui doit recevoir le centime en plus.

</details>

## 6. ✅ Checkpoint

```bash
npm run test:bonus
```

Les tests couvrent le calcul des parts et des soldes (divisions exactes, reste réparti par `userId`, un seul payeur…) et la route `GET /wallets/{id}/balance` (réservée aux membres, `409` tant que le porte-monnaie est ouvert).

Sauvegardez votre travail sur votre branche personnelle :

```bash
git add -A
git commit -m "bonus"
git push
```

## 7. Bloqué ?

```bash
npm run rattrapage -- bonus
```

Récupère le code complet du bonus (voir le [README](../README.md#rattrapage)).
