export interface MemberPayment {
  userId: string;
  name: string;
  paidAmount: number;
}

export interface MemberBalance {
  userId: string;
  name: string;
  paidAmount: number;
  shareAmount: number;
  balance: number;
}

export interface Transfer {
  fromUserId: string;
  toUserId: string;
  amount: number;
}

function byUserId(a: { userId: string }, b: { userId: string }) {
  if (a.userId < b.userId) return -1;
  if (a.userId > b.userId) return 1;
  return 0;
}

/**
 * TODO bonus : calculez la part et le solde de chaque membre.
 *
 * Règles (voir docs/bonus.md) :
 *  - Tous les montants sont des ENTIERS en centimes (jamais de nombres à virgule).
 *  - Chaque membre doit la même part : total / nombre de membres.
 *  - Le total ne se divise pas toujours exactement : le reste de la division
 *    (reste = total % nombre de membres) est réparti à raison de 1 centime en plus
 *    pour les `reste` premiers membres, dans l'ordre croissant des userId.
 *  - solde = paidAmount - shareAmount
 *      solde > 0 : le membre doit RECEVOIR de l'argent
 *      solde < 0 : le membre doit PAYER
 *
 * Il faut renvoyer :
 *  - balances : un MemberBalance par membre (triés par userId)
 *  - transfers : computeTransfers(balances) (fonction fournie ci-dessous)
 */
export function calculateBalances(
  totalAmount: number,
  members: MemberPayment[],
): { balances: MemberBalance[]; transfers: Transfer[] } {
  void totalAmount;
  void members;
  void byUserId;
  throw new Error('TODO bonus : calculateBalances n’est pas encore écrite.');
}

function byAmountThenUserId(
  a: { userId: string; amount: number },
  b: { userId: string; amount: number },
) {
  if (a.amount !== b.amount) return b.amount - a.amount;
  return byUserId(a, b);
}

// FOURNIE - Algorithme glouton : le plus gros débiteur rembourse le plus gros
// créancier, et ainsi de suite. Au plus n - 1 virements, sans garantie de minimum.
export function computeTransfers(
  balances: { userId: string; balance: number }[],
): Transfer[] {
  const debtors = balances
    .filter((member) => member.balance < 0)
    .map((member) => ({ userId: member.userId, amount: -member.balance }));
  const creditors = balances
    .filter((member) => member.balance > 0)
    .map((member) => ({ userId: member.userId, amount: member.balance }));

  const transfers: Transfer[] = [];

  while (debtors.length > 0 && creditors.length > 0) {
    debtors.sort(byAmountThenUserId);
    creditors.sort(byAmountThenUserId);

    const debtor = debtors[0];
    const creditor = creditors[0];
    const amount = Math.min(debtor.amount, creditor.amount);

    transfers.push({
      fromUserId: debtor.userId,
      toUserId: creditor.userId,
      amount,
    });

    debtor.amount -= amount;
    creditor.amount -= amount;

    if (debtor.amount === 0) debtors.shift();
    if (creditor.amount === 0) creditors.shift();
  }

  return transfers;
}
