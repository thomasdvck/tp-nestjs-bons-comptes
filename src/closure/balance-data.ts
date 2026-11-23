import { Prisma } from '@prisma/client';

// FOURNIE - lit en base tout ce qu'il faut pour calculer un bilan :
// le total, les membres et ce que chacun a payé.
export async function loadBalanceData(
  client: Prisma.TransactionClient,
  walletId: string,
) {
  const [members, total, paidByUser] = await Promise.all([
    client.walletMember.findMany({
      where: { walletId, status: 'MEMBER' },
      select: { userId: true, user: { select: { name: true } } },
    }),
    client.expense.aggregate({
      where: { walletId },
      _sum: { amount: true },
    }),
    client.expense.groupBy({
      by: ['paidById'],
      where: { walletId },
      _sum: { amount: true },
    }),
  ]);

  const memberPayments = members.map((member) => {
    const payments = paidByUser.find((row) => row.paidById === member.userId);

    return {
      userId: member.userId,
      name: member.user.name,
      paidAmount: payments?._sum.amount ?? 0,
    };
  });

  return {
    totalAmount: total._sum.amount ?? 0,
    memberPayments,
  };
}
