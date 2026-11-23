// Fausse base de données en mémoire, utilisée par les tests du TP.
//
// Elle imite la petite partie de Prisma dont vous avez besoin : les tests
// tournent donc hors ligne, sans aucune base de données.
// Vous n'avez pas besoin de lire ce fichier pour faire le TP.

/* eslint-disable @typescript-eslint/no-explicit-any */
type Row = Record<string, any>;

export interface FakeUser {
  id: string;
  name: string;
}

export interface FakeWallet {
  id: string;
  title: string;
  status: 'OPEN' | 'CLOSED';
  createdById: string;
  createdAt: Date;
  updatedAt: Date;
  closedAt: Date | null;
}

export interface FakeMember {
  walletId: string;
  userId: string;
  status: 'INVITED' | 'MEMBER';
}

export interface FakeExpense {
  id: string;
  walletId: string;
  title: string;
  amount: number;
  date: Date;
  createdAt: Date;
  paidById: string;
  createdById: string;
}

export interface FakeData {
  users: FakeUser[];
  wallets: FakeWallet[];
  members: FakeMember[];
  expenses: FakeExpense[];
}

const REQUIRED_EXPENSE_FIELDS = [
  'walletId',
  'title',
  'amount',
  'date',
  'paidById',
  'createdById',
] as const;

function matches(row: Row, where: Row = {}): boolean {
  return Object.entries(where).every(([key, value]) => {
    if (value === undefined) return true;
    if (value instanceof Date) return row[key]?.getTime() === value.getTime();
    if (value !== null && typeof value === 'object') {
      throw new Error(
        `La fausse base de test ne gère pas le filtre complexe « ${key} » : utilisez des filtres simples (égalité).`,
      );
    }
    return row[key] === value;
  });
}

function compare(a: any, b: any): number {
  const left = a instanceof Date ? a.getTime() : a;
  const right = b instanceof Date ? b.getTime() : b;
  if (left < right) return -1;
  if (left > right) return 1;
  return 0;
}

function sortRows(rows: Row[], orderBy: any): Row[] {
  if (!orderBy) return rows;
  const criteria: Record<string, 'asc' | 'desc'>[] = Array.isArray(orderBy)
    ? orderBy
    : [orderBy];
  return [...rows].sort((a, b) => {
    for (const criterion of criteria) {
      const [field, direction] = Object.entries(criterion)[0];
      const result = compare(a[field], b[field]);
      if (result !== 0) return direction === 'desc' ? -result : result;
    }
    return 0;
  });
}

export function createFakePrisma(seed: Partial<FakeData> = {}) {
  const data: FakeData = {
    users: seed.users ?? [],
    wallets: seed.wallets ?? [],
    members: seed.members ?? [],
    expenses: seed.expenses ?? [],
  };
  let nextId = 1;

  const userName = (id: string) =>
    data.users.find((user) => user.id === id)?.name ?? 'Inconnu';
  const withPaidBy = (expense: FakeExpense) => ({
    ...expense,
    paidBy: { id: expense.paidById, name: userName(expense.paidById) },
  });
  const withUser = (member: FakeMember) => ({
    ...member,
    user: { id: member.userId, name: userName(member.userId) },
  });

  const prisma: any = {
    data,

    wallet: {
      findUnique: async ({ where }: any) =>
        data.wallets.find((wallet) => matches(wallet, where)) ?? null,
      findFirst: async ({ where }: any) =>
        data.wallets.find((wallet) => matches(wallet, where)) ?? null,
      update: async ({ where, data: changes }: any) => {
        const wallet = data.wallets.find((row) => matches(row, where));
        if (!wallet) throw new Error('wallet.update : porte-monnaie introuvable');
        Object.assign(wallet, changes);
        return wallet;
      },
    },

    walletMember: {
      findUnique: async ({ where }: any) => {
        const key = where.walletId_userId ?? where;
        return data.members.find((member) => matches(member, key)) ?? null;
      },
      findFirst: async ({ where }: any) =>
        data.members.find((member) => matches(member, where)) ?? null,
      findMany: async ({ where }: any = {}) =>
        data.members.filter((member) => matches(member, where)).map(withUser),
    },

    expense: {
      findMany: async ({ where, orderBy, skip = 0, take }: any = {}) => {
        const rows = sortRows(
          data.expenses.filter((expense) => matches(expense, where)),
          orderBy,
        ) as FakeExpense[];
        const end = take === undefined ? undefined : skip + take;
        return rows.slice(skip, end).map(withPaidBy);
      },
      findFirst: async ({ where }: any) => {
        const expense = data.expenses.find((row) => matches(row, where));
        return expense ? withPaidBy(expense) : null;
      },
      findUnique: async ({ where }: any) => {
        const expense = data.expenses.find((row) => matches(row, where));
        return expense ? withPaidBy(expense) : null;
      },
      count: async ({ where }: any = {}) =>
        data.expenses.filter((expense) => matches(expense, where)).length,
      aggregate: async ({ where }: any = {}) => {
        const rows = data.expenses.filter((expense) => matches(expense, where));
        return {
          _sum: {
            amount: rows.length
              ? rows.reduce((total, row) => total + row.amount, 0)
              : null,
          },
        };
      },
      groupBy: async ({ by, where }: any) => {
        const field = by[0];
        const groups = new Map<string, number>();
        for (const expense of data.expenses.filter((row) => matches(row, where))) {
          groups.set(
            (expense as Row)[field],
            (groups.get((expense as Row)[field]) ?? 0) + expense.amount,
          );
        }
        return [...groups.entries()].map(([key, amount]) => ({
          [field]: key,
          _sum: { amount },
        }));
      },
      create: async ({ data: input }: any) => {
        for (const field of REQUIRED_EXPENSE_FIELDS) {
          if (input[field] === undefined) {
            throw new Error(
              `expense.create : le champ obligatoire « ${field} » est manquant (Prisma refuserait aussi cette création).`,
            );
          }
        }
        if (!Number.isInteger(input.amount)) {
          throw new Error('expense.create : « amount » doit être un entier.');
        }
        const expense: FakeExpense = {
          id: `exp-${nextId++}`,
          walletId: input.walletId,
          title: input.title,
          amount: input.amount,
          date: new Date(input.date),
          createdAt: new Date(),
          paidById: input.paidById,
          createdById: input.createdById,
        };
        data.expenses.push(expense);
        return withPaidBy(expense);
      },
      delete: async ({ where }: any) => {
        const index = data.expenses.findIndex((row) => matches(row, where));
        if (index === -1) throw new Error('expense.delete : dépense introuvable');
        const [removed] = data.expenses.splice(index, 1);
        return withPaidBy(removed);
      },
      deleteMany: async ({ where }: any) => {
        const before = data.expenses.length;
        data.expenses = data.expenses.filter((row) => !matches(row, where));
        return { count: before - data.expenses.length };
      },
    },

    $transaction: async (work: any) =>
      typeof work === 'function' ? work(prisma) : Promise.all(work),
  };

  return prisma;
}

export type FakePrisma = ReturnType<typeof createFakePrisma>;
