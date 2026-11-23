// Étape 3 - Supprimer une dépense : ExpenseOwnerGuard + @CurrentUser()
// Lancer : npm run test:etape3
import 'reflect-metadata';
import {
  type ExecutionContext,
  Controller,
  ForbiddenException,
  Get,
  NotFoundException,
  UseGuards,
} from '@nestjs/common';
import request from 'supertest';
import { afterEach, describe, expect, it } from 'vitest';
import { JwtAuthGuard } from '../src/auth/guards/auth.guard.js';
import { CurrentUser } from '../src/auth/decorators/current-user.decorator.js';
import { ExpenseOwnerGuard } from '../src/expenses/guards/expense-owner.guard.js';
import { ExpensesModule } from '../src/expenses/expenses.module.js';
import {
  ALICE,
  BOB,
  CAROLE,
  DAN,
  createTestApp,
  expectRejection,
  expectStatus,
  sampleData,
  type TestApp,
} from './support/test-app.js';
import { createFakePrisma } from './support/fake-prisma.js';

// Contrôleur jetable, uniquement pour tester le décorateur.
@Controller('decorator-test')
@UseGuards(JwtAuthGuard)
class DecoratorTestController {
  @Get('user')
  whole(@CurrentUser() user: unknown) {
    return { user };
  }

  @Get('user-id')
  idOnly(@CurrentUser('userId') userId: unknown) {
    return { userId };
  }
}

function fakeContext(request: unknown): ExecutionContext {
  return {
    switchToHttp: () => ({ getRequest: () => request }),
  } as unknown as ExecutionContext;
}

describe('Étape 3 - Supprimer une dépense (Guard + décorateur personnalisé)', () => {
  describe('Décorateur @CurrentUser()', () => {
    let testApp: TestApp;

    afterEach(async () => {
      await testApp?.app.close();
    });

    it('@CurrentUser() renvoie l’objet utilisateur { userId }', async () => {
      testApp = await createTestApp({ controllers: [DecoratorTestController] });
      const response = await request(testApp.app.getHttpServer())
        .get('/decorator-test/user')
        .set('x-test-user', ALICE);

      expectStatus(response, 200, 'Le contrôleur de test doit répondre.');
      expect(
        response.body.user,
        `@CurrentUser() devait renvoyer { userId: "${ALICE}" } - reçu : ${JSON.stringify(response.body.user)}. Indice : context.switchToHttp().getRequest().user`,
      ).toEqual({ userId: ALICE });
    });

    it('@CurrentUser(\'userId\') renvoie directement l’identifiant', async () => {
      testApp = await createTestApp({ controllers: [DecoratorTestController] });
      const response = await request(testApp.app.getHttpServer())
        .get('/decorator-test/user-id')
        .set('x-test-user', BOB);

      expectStatus(response, 200, 'Le contrôleur de test doit répondre.');
      expect(
        response.body.userId,
        `@CurrentUser('userId') devait renvoyer "${BOB}" - reçu : ${JSON.stringify(response.body.userId)}. Le premier argument de la fonction est le nom du champ demandé.`,
      ).toBe(BOB);
    });
  });

  describe('ExpenseOwnerGuard (test direct du Guard)', () => {
    function guard() {
      const prisma = createFakePrisma(sampleData());
      return new ExpenseOwnerGuard(prisma);
    }
    const contextFor = (userId: string, walletId: string, id: string) =>
      fakeContext({ params: { walletId, id }, user: { userId } });

    it('autorise le dépenseur (paidById) : renvoie true', async () => {
      const result = await guard().canActivate(contextFor(ALICE, 'w-open', 'e-1'));
      expect(result, 'Alice a payé la dépense e-1 : canActivate doit renvoyer true.').toBe(true);
    });

    it('autorise le créateur de la dépense (createdById) même s’il n’est pas le dépenseur', async () => {
      // e-3 : payée par Bob, saisie par Alice.
      const result = await guard().canActivate(contextFor(ALICE, 'w-open', 'e-3'));
      expect(
        result,
        'Alice a créé la dépense e-3 (payée par Bob) : canActivate doit renvoyer true.',
      ).toBe(true);
    });

    it('refuse un membre qui n’est ni dépenseur ni créateur : ForbiddenException', async () => {
      // e-1 : payée et créée par Alice ; Bob est membre mais pas propriétaire.
      await expectRejection(
        () => guard().canActivate(contextFor(BOB, 'w-open', 'e-1')),
        ForbiddenException,
        'Bob n’est ni dépenseur ni créateur de e-1 : lancez new ForbiddenException(...).',
      );
    });

    it('refuse un utilisateur étranger au porte-monnaie : ForbiddenException', async () => {
      await expectRejection(
        () => guard().canActivate(contextFor(DAN, 'w-open', 'e-1')),
        ForbiddenException,
        'Dan n’est ni dépenseur ni créateur.',
      );
    });

    it('lève NotFoundException si la dépense n’existe pas', async () => {
      await expectRejection(
        () => guard().canActivate(contextFor(ALICE, 'w-open', 'inconnue')),
        NotFoundException,
        'Dépense inconnue : lancez new NotFoundException(...).',
      );
    });

    it('lève NotFoundException si la dépense appartient à un autre porte-monnaie', async () => {
      // e-5 existe, mais dans w-other : on la cherche dans w-open.
      await expectRejection(
        () => guard().canActivate(contextFor(DAN, 'w-open', 'e-5')),
        NotFoundException,
        'Cherchez la dépense avec { id, walletId } et non avec id seul.',
      );
    });
  });

  describe('DELETE /wallets/:walletId/expenses/:id', () => {
    let testApp: TestApp;

    afterEach(async () => {
      await testApp?.app.close();
    });

    async function start() {
      testApp = await createTestApp({
        imports: [ExpensesModule],
        data: sampleData(),
      });
      return request(testApp.app.getHttpServer());
    }

    const exists = (id: string) =>
      testApp.prisma.data.expenses.some((expense: { id: string }) => expense.id === id);

    it('le dépenseur peut supprimer : 204 et la dépense disparaît', async () => {
      const http = await start();
      const response = await http
        .delete('/wallets/w-open/expenses/e-1')
        .set('x-test-user', ALICE);

      expectStatus(
        response,
        204,
        'Avez-vous ajouté @Delete(\':id\') avec @HttpCode(HttpStatus.NO_CONTENT) dans le contrôleur ?',
      );
      expect(exists('e-1'), 'La dépense e-1 devrait avoir été supprimée.').toBe(false);
    });

    it('le créateur de la dépense (qui n’est pas le dépenseur) peut supprimer', async () => {
      const http = await start();
      const response = await http
        .delete('/wallets/w-open/expenses/e-3')
        .set('x-test-user', ALICE);

      expectStatus(response, 204, 'Alice a créé e-3 : elle peut la supprimer.');
      expect(exists('e-3')).toBe(false);
    });

    it('le dépenseur peut supprimer même s’il n’a pas créé la dépense', async () => {
      const http = await start();
      const response = await http
        .delete('/wallets/w-open/expenses/e-3')
        .set('x-test-user', BOB);

      expectStatus(response, 204, 'Bob est le dépenseur de e-3 : il peut la supprimer.');
    });

    it('un autre membre reçoit 403 et la dépense est conservée', async () => {
      const http = await start();
      const response = await http
        .delete('/wallets/w-open/expenses/e-1')
        .set('x-test-user', BOB);

      expectStatus(
        response,
        403,
        'Bob n’est ni dépenseur ni créateur de e-1. Le contrôleur doit utiliser @UseGuards(ExpenseOwnerGuard) sur la route DELETE.',
      );
      expect(exists('e-1'), 'e-1 ne doit PAS être supprimée.').toBe(true);
    });

    it('un utilisateur extérieur reçoit 403', async () => {
      const http = await start();
      const response = await http
        .delete('/wallets/w-open/expenses/e-1')
        .set('x-test-user', DAN);

      expectStatus(response, 403, 'Dan n’est pas propriétaire de la dépense.');
      expect(exists('e-1')).toBe(true);
    });

    it('un simple invité reçoit 403', async () => {
      const http = await start();
      const response = await http
        .delete('/wallets/w-open/expenses/e-1')
        .set('x-test-user', CAROLE);

      expectStatus(response, 403, 'Carole n’est pas propriétaire de la dépense.');
    });

    it('renvoie 404 pour une dépense inconnue', async () => {
      const http = await start();
      const response = await http
        .delete('/wallets/w-open/expenses/inconnue')
        .set('x-test-user', ALICE);

      expectStatus(response, 404, 'Dépense inconnue : NotFoundException (dans le Guard).');
    });

    it('renvoie 404 si la dépense existe mais dans un autre porte-monnaie', async () => {
      const http = await start();
      const response = await http
        .delete('/wallets/w-open/expenses/e-5')
        .set('x-test-user', DAN);

      expectStatus(response, 404, 'e-5 appartient à w-other, pas à w-open.');
      expect(exists('e-5'), 'e-5 ne doit pas être supprimée.').toBe(true);
    });

    it('renvoie 409 si le porte-monnaie est clôturé, sans supprimer', async () => {
      const http = await start();
      const response = await http
        .delete('/wallets/w-closed/expenses/e-4')
        .set('x-test-user', ALICE);

      expectStatus(response, 409, 'Porte-monnaie clôturé : assertWalletOpen dans ExpensesService.remove.');
      expect(exists('e-4'), 'e-4 ne doit pas être supprimée.').toBe(true);
    });

    it('rafraîchit wallet.updatedAt après la suppression', async () => {
      const http = await start();
      const wallet = () =>
        testApp.prisma.data.wallets.find((row: { id: string }) => row.id === 'w-open');
      const before = (wallet().updatedAt as Date).getTime();

      await http.delete('/wallets/w-open/expenses/e-1').set('x-test-user', ALICE);

      expect(
        (wallet().updatedAt as Date).getTime() > before,
        'updatedAt doit être mis à jour à chaque action sur le porte-monnaie.',
      ).toBe(true);
    });

    it('renvoie 401 sans jeton', async () => {
      const http = await start();
      const response = await http.delete('/wallets/w-open/expenses/e-1');

      expectStatus(response, 401, 'La route doit rester protégée par JwtAuthGuard.');
    });
  });
});
