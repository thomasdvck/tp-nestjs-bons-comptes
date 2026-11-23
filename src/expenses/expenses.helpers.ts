// Fonctions utilitaires FOURNIES : vous n'avez pas à les écrire, seulement à les appeler.
import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { PrismaService } from '../prisma/prisma.service.js';

// Colonnes renvoyées par l'API pour une dépense (à passer à `select:`).
export const expenseSelect = {
  id: true,
  title: true,
  amount: true,
  date: true,
  createdAt: true,
  paidBy: { select: { id: true, name: true } },
} satisfies Prisma.ExpenseSelect;

type ExpenseRow = Prisma.ExpenseGetPayload<{ select: typeof expenseSelect }>;

// Transforme une ligne de la base en objet JSON : la date devient « AAAA-MM-JJ ».
export function toExpenseItem(expense: ExpenseRow) {
  return {
    ...expense,
    date: expense.date.toISOString().slice(0, 10),
  };
}

// Vrai si l'utilisateur est MEMBRE (invitation acceptée) du porte-monnaie.
export async function isMemberOfWallet(
  prisma: PrismaService,
  walletId: string,
  userId: string,
): Promise<boolean> {
  const membership = await prisma.walletMember.findUnique({
    where: { walletId_userId: { walletId, userId } },
    select: { status: true },
  });
  return membership?.status === 'MEMBER';
}

// Renvoie le porte-monnaie, ou lève 404 (inconnu) / 403 (utilisateur non membre).
export async function assertMemberOfWallet(
  prisma: PrismaService,
  walletId: string,
  userId: string,
) {
  const wallet = await prisma.wallet.findUnique({
    where: { id: walletId },
    select: { status: true },
  });
  if (!wallet) {
    throw new NotFoundException('Porte-monnaie introuvable.');
  }
  if (!(await isMemberOfWallet(prisma, walletId, userId))) {
    throw new ForbiddenException('Accès refusé à ce porte-monnaie.');
  }
  return wallet;
}

// Lève 409 si le porte-monnaie est clôturé (plus de modification possible).
export function assertWalletOpen(wallet: { status: string }) {
  if (wallet.status !== 'OPEN') {
    throw new ConflictException('Ce porte-monnaie est clôturé.');
  }
}
