import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import {
  assertMemberOfWallet,
  expenseSelect,
  toExpenseItem,
} from './expenses.helpers.js';

@Injectable()
export class ExpensesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(walletId: string, userId: string) {
    // 1. Vérifie que l'utilisateur est membre (lève 404 / 403 tout seul)
    await assertMemberOfWallet(this.prisma, walletId, userId);

    // 2. Les dépenses du porte-monnaie, de la plus récente à la plus ancienne
    const expenses = await this.prisma.expense.findMany({
      where: { walletId },
      orderBy: [{ date: 'desc' }, { id: 'desc' }],
      select: expenseSelect,
    });

    // 3. Le total en centimes
    const aggregate = await this.prisma.expense.aggregate({
      where: { walletId },
      _sum: { amount: true },
    });

    // 4. La réponse (0 et non null s'il n'y a aucune dépense)
    return {
      items: expenses.map(toExpenseItem),
      totalAmount: aggregate._sum.amount ?? 0,
    };
  }

  // TODO étape 2 : écrivez  async create(walletId: string, userId: string, dto: CreateExpenseDto)
  //   1. accès + porte-monnaie ouvert (assertMemberOfWallet, assertWalletOpen)
  //   2. dépenseur = dto.paidById ?? userId ; s'il est différent de userId,
  //      il doit être membre (isMemberOfWallet), sinon ForbiddenException
  //   3. this.prisma.expense.create({ data: {..., createdById: userId}, select: expenseSelect })
  //   4. mettre à jour wallet.updatedAt (règle métier : chaque action rafraîchit updatedAt)
  //   5. renvoyer toExpenseItem(...)

  // TODO étape 3 : écrivez  async remove(walletId: string, expenseId: string)
  //   (l'autorisation dépenseur/créateur est faite par ExpenseOwnerGuard, pas ici)
  //   1. le porte-monnaie doit exister (NotFoundException) et être ouvert (assertWalletOpen)
  //   2. supprimer la dépense, puis mettre à jour wallet.updatedAt
}
