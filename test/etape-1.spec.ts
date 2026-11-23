// Étape 1 - Lister les dépenses d'un porte-monnaie (GET /wallets/:walletId/expenses)
// Lancer : npm run test:etape1
import 'reflect-metadata';
import { afterEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import { ExpensesController } from '../src/expenses/expenses.controller.js';
import { ExpensesModule } from '../src/expenses/expenses.module.js';
import { ExpensesService } from '../src/expenses/expenses.service.js';
import {
  ALICE,
  BOB,
  CAROLE,
  DAN,
  createTestApp,
  expectStatus,
  sampleData,
  type TestApp,
} from './support/test-app.js';

describe('Étape 1 - Lister les dépenses (GET /wallets/:walletId/expenses)', () => {
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

  describe('Module, contrôleur et service (injection de dépendances)', () => {
    it('ExpensesModule déclare ExpensesController dans « controllers »', () => {
      const controllers = Reflect.getMetadata('controllers', ExpensesModule) ?? [];
      expect(
        controllers,
        'ExpensesModule ne déclare aucun contrôleur : ajoutez ExpensesController dans @Module({ controllers: [...] }).',
      ).toContain(ExpensesController);
    });

    it('ExpensesModule déclare ExpensesService dans « providers »', () => {
      const providers = Reflect.getMetadata('providers', ExpensesModule) ?? [];
      expect(
        providers,
        'ExpensesModule ne déclare aucun service : ajoutez ExpensesService dans @Module({ providers: [...] }).',
      ).toContain(ExpensesService);
    });

    it('ExpensesService est injectable (@Injectable) et reçoit PrismaService dans son constructeur', () => {
      const params = Reflect.getMetadata('design:paramtypes', ExpensesService) ?? [];
      expect(
        params.map((type: { name: string }) => type?.name),
        'Le constructeur de ExpensesService doit recevoir PrismaService : constructor(private readonly prisma: PrismaService) {}',
      ).toContain('PrismaService');
    });

    it('ExpensesController reçoit ExpensesService dans son constructeur', () => {
      const params = Reflect.getMetadata('design:paramtypes', ExpensesController) ?? [];
      expect(
        params,
        'Le constructeur de ExpensesController doit recevoir ExpensesService : constructor(private readonly expensesService: ExpensesService) {}',
      ).toContain(ExpensesService);
    });
  });

  describe('GET /wallets/:walletId/expenses', () => {
    it('renvoie 200 avec la liste « items » et le « totalAmount »', async () => {
      const http = await start();
      const response = await http
        .get('/wallets/w-open/expenses')
        .set('x-test-user', ALICE);

      expectStatus(
        response,
        200,
        'Avez-vous ajouté @Get() sur la méthode du contrôleur, et déclaré le contrôleur dans le module ?',
      );
      expect(
        Array.isArray(response.body.items),
        `La réponse doit contenir un tableau « items » - reçu : ${JSON.stringify(response.body)}`,
      ).toBe(true);
      expect(
        response.body.items.length,
        'Le porte-monnaie « w-open » contient 3 dépenses.',
      ).toBe(3);
    });

    it('calcule le total en centimes (4599 + 3000 + 1500 = 9099)', async () => {
      const http = await start();
      const response = await http
        .get('/wallets/w-open/expenses')
        .set('x-test-user', ALICE);

      expectStatus(response, 200, 'La route GET doit exister.');
      expect(
        response.body.totalAmount,
        `totalAmount attendu : 9099 - reçu : ${response.body.totalAmount}`,
      ).toBe(9099);
    });

    it('ne compte que les dépenses du porte-monnaie demandé (pas celles des autres)', async () => {
      const http = await start();
      const response = await http
        .get('/wallets/w-open/expenses')
        .set('x-test-user', ALICE);

      expectStatus(response, 200, 'La route GET doit exister.');
      const titles = response.body.items?.map((item: { title: string }) => item.title);
      expect(
        titles,
        'Il faut filtrer avec where: { walletId } : la dépense « Dépense ailleurs » appartient à un autre porte-monnaie.',
      ).not.toContain('Dépense ailleurs');
      expect(response.body.totalAmount).toBe(9099);
    });

    it('trie les dépenses de la plus récente à la plus ancienne', async () => {
      const http = await start();
      const response = await http
        .get('/wallets/w-open/expenses')
        .set('x-test-user', ALICE);

      expectStatus(response, 200, 'La route GET doit exister.');
      const dates: string[] = response.body.items.map((item: { date: string }) => item.date);
      expect(
        dates,
        `Les dates doivent être en ordre décroissant (orderBy: date desc) - reçu : ${dates.join(', ')}`,
      ).toEqual(['2026-10-25', '2026-10-25', '2026-10-20']);
    });

    it('chaque dépense expose id, title, amount, date « AAAA-MM-JJ » et paidBy { id, name }', async () => {
      const http = await start();
      const response = await http
        .get('/wallets/w-open/expenses')
        .set('x-test-user', ALICE);

      expectStatus(response, 200, 'La route GET doit exister.');
      const courses = response.body.items.find(
        (item: { title: string }) => item.title === 'Courses',
      );
      expect(
        courses,
        'La dépense « Courses » devrait être dans la liste.',
      ).toBeDefined();
      expect(
        courses,
        'Utilisez select: expenseSelect puis toExpenseItem (fournis dans expenses.helpers.ts).',
      ).toMatchObject({
        id: 'e-1',
        title: 'Courses',
        amount: 4599,
        date: '2026-10-20',
        paidBy: { id: ALICE, name: 'Alice Martin' },
      });
    });

    it('renvoie une liste vide et un total de 0 (et non null) si aucune dépense', async () => {
      const http = await start();
      const response = await http
        .get('/wallets/w-empty/expenses')
        .set('x-test-user', ALICE);

      expectStatus(response, 200, 'La route GET doit exister.');
      expect(response.body.items, 'items devrait être un tableau vide').toEqual([]);
      expect(
        response.body.totalAmount,
        `totalAmount attendu : 0 - reçu : ${response.body.totalAmount} (indice : l'opérateur ?? )`,
      ).toBe(0);
    });

    it('renvoie 404 si le porte-monnaie n’existe pas', async () => {
      const http = await start();
      const response = await http
        .get('/wallets/inconnu/expenses')
        .set('x-test-user', ALICE);

      expectStatus(response, 404, 'Utilisez assertMemberOfWallet (elle lève NotFoundException).');
    });

    it('renvoie 403 si l’utilisateur n’est pas membre du porte-monnaie', async () => {
      const http = await start();
      const response = await http
        .get('/wallets/w-open/expenses')
        .set('x-test-user', DAN);

      expectStatus(response, 403, 'Dan n’est pas membre : appelez assertMemberOfWallet avant de lire les dépenses.');
    });

    it('renvoie 403 si l’utilisateur est seulement invité (invitation non acceptée)', async () => {
      const http = await start();
      const response = await http
        .get('/wallets/w-open/expenses')
        .set('x-test-user', CAROLE);

      expectStatus(response, 403, 'Carole est invitée mais n’a pas accepté : elle ne doit rien voir.');
    });

    it('un autre membre (Bob) peut lire la liste', async () => {
      const http = await start();
      const response = await http
        .get('/wallets/w-open/expenses')
        .set('x-test-user', BOB);

      expectStatus(response, 200, 'Tous les membres peuvent consulter les dépenses.');
    });

    it('renvoie 401 sans jeton : la route est protégée par JwtAuthGuard', async () => {
      const http = await start();
      const response = await http.get('/wallets/w-open/expenses');

      expectStatus(
        response,
        401,
        'Le contrôleur doit être protégé par @UseGuards(JwtAuthGuard) (déjà présent dans la classe fournie : ne le supprimez pas).',
      );
    });
  });
});
