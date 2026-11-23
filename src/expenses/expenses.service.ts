import { ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateExpenseDto } from './dto/create-expense.dto.js';
import {
  assertMemberOfWallet,
  assertWalletOpen,
  expenseSelect,
  isMemberOfWallet,
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

  async create(walletId: string, userId: string, dto: CreateExpenseDto) {
    // 1. L'utilisateur est membre (404 / 403) et le porte-monnaie est ouvert (409)
    const wallet = await assertMemberOfWallet(this.prisma, walletId, userId);
    assertWalletOpen(wallet);

    // 2. Le dépenseur : celui indiqué, sinon l'utilisateur connecté
    const paidById = dto.paidById ?? userId;
    if (paidById !== userId) {
      const payerIsMember = await isMemberOfWallet(
        this.prisma,
        walletId,
        paidById,
      );
      if (!payerIsMember) {
        throw new ForbiddenException(
          'Le dépenseur doit être membre du porte-monnaie.',
        );
      }
    }

    // 3. Création : le créateur est TOUJOURS l'utilisateur connecté
    const expense = await this.prisma.expense.create({
      data: {
        walletId,
        title: dto.title,
        amount: dto.amount,
        date: new Date(dto.date),
        paidById,
        createdById: userId,
      },
      select: expenseSelect,
    });

    // 4. Règle métier : chaque action rafraîchit updatedAt
    await this.prisma.wallet.update({
      where: { id: walletId },
      data: { updatedAt: new Date() },
    });

    // 5. Même format que dans la liste
    return toExpenseItem(expense);
  }

  // TODO étape 3 : écrivez  async remove(walletId: string, expenseId: string)
  //   (l'autorisation dépenseur/créateur est faite par ExpenseOwnerGuard, pas ici)
  //   1. le porte-monnaie doit exister (NotFoundException) et être ouvert (assertWalletOpen)
  //   2. supprimer la dépense, puis mettre à jour wallet.updatedAt
}
