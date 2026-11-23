// Outils communs aux tests du TP. Vous n'avez pas besoin de modifier ce fichier.
import {
  type CanActivate,
  type ExecutionContext,
  type INestApplication,
  UnauthorizedException,
  ValidationPipe,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { expect } from 'vitest';
import { JwtAuthGuard } from '../../src/auth/guards/auth.guard.js';
import { PrismaService } from '../../src/prisma/prisma.service.js';
import {
  createFakePrisma,
  type FakeData,
  type FakePrisma,
} from './fake-prisma.js';

// Remplace JwtAuthGuard : l'utilisateur « connecté » est donné par l'en-tête
// `x-test-user`. Sans cet en-tête, la requête est refusée (401), exactement
// comme avec un vrai jeton absent.
class FakeJwtAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const userId = request.headers['x-test-user'];
    if (typeof userId !== 'string') {
      throw new UnauthorizedException('Jeton absent (test)');
    }
    request.user = { userId };
    return true;
  }
}

export interface TestApp {
  app: INestApplication;
  prisma: FakePrisma;
}

// Démarre une vraie application Nest (routage, guards, pipes) branchée sur une
// fausse base en mémoire. Aucun accès réseau.
export async function createTestApp(options: {
  imports?: unknown[];
  controllers?: unknown[];
  providers?: unknown[];
  data?: Partial<FakeData>;
}): Promise<TestApp> {
  const prisma = createFakePrisma(options.data);
  const moduleRef = await Test.createTestingModule({
    imports: (options.imports ?? []) as never[],
    controllers: (options.controllers ?? []) as never[],
    providers: (options.providers ?? []) as never[],
  })
    .overrideProvider(PrismaService)
    .useValue(prisma)
    .overrideGuard(JwtAuthGuard)
    .useValue(new FakeJwtAuthGuard())
    .compile();

  const app = moduleRef.createNestApplication();
  // Même configuration que dans src/main.ts.
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  await app.init();
  return { app, prisma };
}

export function expectStatus(
  response: { status: number; body: unknown },
  expected: number,
  hint: string,
) {
  // Une route inexistante répond aussi 404 (« Cannot GET … ») : ce n'est pas la
  // réponse métier attendue (NotFoundException lancée par votre code).
  const message = String((response.body as { message?: unknown })?.message ?? '');
  if (expected === 404 && response.status === 404 && message.startsWith('Cannot ')) {
    expect.fail(
      `La route n'existe pas (« ${message} »). Avez-vous écrit la méthode du contrôleur avec son décorateur (@Get, @Post, @Delete) et déclaré le contrôleur dans le module ?`,
    );
  }
  expect(
    response.status,
    `Statut HTTP attendu : ${expected} - reçu : ${response.status}. ${hint}\nCorps de la réponse : ${JSON.stringify(response.body)}`,
  ).toBe(expected);
}

// Vérifie qu'une promesse est rejetée avec une exception d'un type donné.
export async function expectRejection(
  action: () => Promise<unknown>,
  errorType: new (...args: never[]) => Error,
  hint: string,
) {
  let thrown: unknown;
  try {
    await action();
  } catch (error) {
    thrown = error;
  }
  expect(
    thrown instanceof errorType,
    `On attendait une exception ${errorType.name}, mais on a obtenu : ${
      thrown === undefined
        ? 'aucune exception (la méthode a réussi)'
        : `${(thrown as Error)?.constructor?.name} - ${(thrown as Error)?.message}`
    }. ${hint}`,
  ).toBe(true);
}

// Jeu de données commun aux étapes 1 à 3.
//  - Alice (créatrice) et Bob sont membres de « w-open » ; Carole est seulement invitée ;
//    Dan n'a aucun lien avec le porte-monnaie.
//  - « w-closed » est clôturé ; « w-empty » ne contient aucune dépense.
export const ALICE = '11111111-1111-4111-8111-111111111111';
export const BOB = '22222222-2222-4222-8222-222222222222';
export const CAROLE = '33333333-3333-4333-8333-333333333333';
export const DAN = '44444444-4444-4444-8444-444444444444';

const day = (iso: string) => new Date(`${iso}T00:00:00.000Z`);

export function sampleData(): FakeData {
  const wallet = (id: string, status: 'OPEN' | 'CLOSED') => ({
    id,
    title: `Porte-monnaie ${id}`,
    status,
    createdById: ALICE,
    createdAt: day('2026-10-01'),
    updatedAt: day('2026-10-01'),
    closedAt: status === 'CLOSED' ? day('2026-10-30') : null,
  });
  const member = (walletId: string, userId: string) => ({
    walletId,
    userId,
    status: 'MEMBER' as const,
  });
  const expense = (
    id: string,
    walletId: string,
    title: string,
    amount: number,
    date: string,
    paidById: string,
    createdById = paidById,
  ) => ({
    id,
    walletId,
    title,
    amount,
    date: day(date),
    createdAt: day(date),
    paidById,
    createdById,
  });

  return {
    users: [
      { id: ALICE, name: 'Alice Martin' },
      { id: BOB, name: 'Bob Durand' },
      { id: CAROLE, name: 'Carole Petit' },
      { id: DAN, name: 'Dan Leroy' },
    ],
    wallets: [
      wallet('w-open', 'OPEN'),
      wallet('w-empty', 'OPEN'),
      wallet('w-closed', 'CLOSED'),
      wallet('w-other', 'OPEN'),
    ],
    members: [
      member('w-open', ALICE),
      member('w-open', BOB),
      { walletId: 'w-open', userId: CAROLE, status: 'INVITED' },
      member('w-empty', ALICE),
      member('w-closed', ALICE),
      member('w-closed', BOB),
      member('w-other', DAN),
    ],
    expenses: [
      expense('e-1', 'w-open', 'Courses', 4599, '2026-10-20', ALICE),
      expense('e-2', 'w-open', 'Restaurant', 3000, '2026-10-25', BOB),
      // Payée par Bob mais saisie par Alice (créatrice de la dépense).
      expense('e-3', 'w-open', 'Train', 1500, '2026-10-25', BOB, ALICE),
      expense('e-4', 'w-closed', 'Gîte', 9000, '2026-10-10', ALICE),
      expense('e-5', 'w-other', 'Dépense ailleurs', 99999, '2026-10-12', DAN),
    ],
  };
}
