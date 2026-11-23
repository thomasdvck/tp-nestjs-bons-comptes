import { Injectable } from '@nestjs/common';
// TODO étape 1 : importez PrismaService (../prisma/prisma.service.js) pour l'injecter.
// Rappel : en ESM, les imports locaux doivent se terminer par « .js ».

// Fonctions fournies (voir expenses.helpers.ts) :
//   expenseSelect, toExpenseItem, assertMemberOfWallet, assertWalletOpen, isMemberOfWallet
// import { ... } from './expenses.helpers.js';

@Injectable()
export class ExpensesService {
  // TODO étape 1 : ajoutez un constructeur qui reçoit PrismaService par injection
  //   de dépendances (« private readonly prisma: PrismaService »).

  // TODO étape 1 : écrivez  async findAll(walletId: string, userId: string)
  //   1. vérifier l'accès avec assertMemberOfWallet(this.prisma, walletId, userId)
  //   2. lire les dépenses du porte-monnaie : this.prisma.expense.findMany(...)
  //      (tri : date décroissante, puis id décroissant ; select: expenseSelect)
  //   3. calculer le total : this.prisma.expense.aggregate({ _sum: { amount: true } })
  //   4. renvoyer { items: [...toExpenseItem], totalAmount }  (0 si aucune dépense)

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
