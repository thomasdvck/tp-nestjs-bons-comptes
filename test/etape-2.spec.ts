// Étape 2 - Déclarer une dépense (POST /wallets/:walletId/expenses)
// Lancer : npm run test:etape2
import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import request from 'supertest';
import { afterEach, describe, expect, it } from 'vitest';
import { CreateExpenseDto } from '../src/expenses/dto/create-expense.dto.js';
import { ExpensesModule } from '../src/expenses/expenses.module.js';
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

const VALID = {
  title: 'Courses',
  amount: 1250,
  date: '2026-10-25',
};

async function errorsFor(input: Record<string, unknown>) {
  const dto = plainToInstance(CreateExpenseDto, input);
  const errors = await validate(dto);
  return errors.map((error) => error.property);
}

describe('Étape 2 - Déclarer une dépense (POST /wallets/:walletId/expenses)', () => {
  describe('CreateExpenseDto - validation avec class-validator', () => {
    it('accepte une dépense valide', async () => {
      const properties = await errorsFor(VALID);
      expect(
        properties,
        `Une dépense valide ne doit produire aucune erreur - erreurs sur : ${properties.join(', ')}`,
      ).toEqual([]);
    });

    it('accepte un dépenseur (paidById) au format UUID', async () => {
      const properties = await errorsFor({ ...VALID, paidById: BOB });
      expect(properties, `Erreurs inattendues sur : ${properties.join(', ')}`).toEqual([]);
    });

    it('refuse un montant égal à 0 (il doit être > 0)', async () => {
      const properties = await errorsFor({ ...VALID, amount: 0 });
      expect(properties, 'amount = 0 doit être refusé : ajoutez @Min(1).').toContain('amount');
    });

    it('refuse un montant négatif', async () => {
      const properties = await errorsFor({ ...VALID, amount: -500 });
      expect(properties, 'amount = -500 doit être refusé : ajoutez @Min(1).').toContain('amount');
    });

    it('refuse un montant à virgule (les montants sont des entiers en centimes)', async () => {
      const properties = await errorsFor({ ...VALID, amount: 12.5 });
      expect(properties, 'amount = 12.5 doit être refusé : ajoutez @IsInt().').toContain('amount');
    });

    it('refuse un montant qui n’est pas un nombre (« abc » ou « 1250 » entre guillemets)', async () => {
      expect(await errorsFor({ ...VALID, amount: 'abc' })).toContain('amount');
      expect(
        await errorsFor({ ...VALID, amount: '1250' }),
        'Le montant doit être un nombre, pas une chaîne : @IsInt().',
      ).toContain('amount');
    });

    it('refuse un titre absent, vide ou de plus de 100 caractères', async () => {
      const { title: _title, ...withoutTitle } = VALID;
      expect(await errorsFor(withoutTitle), 'title est obligatoire.').toContain('title');
      expect(
        await errorsFor({ ...VALID, title: '' }),
        'Un titre vide doit être refusé : @IsNotEmpty().',
      ).toContain('title');
      expect(
        await errorsFor({ ...VALID, title: 'x'.repeat(101) }),
        'Un titre de 101 caractères doit être refusé : @MaxLength(100).',
      ).toContain('title');
    });

    it('refuse une date mal formée (attendu : AAAA-MM-JJ)', async () => {
      expect(
        await errorsFor({ ...VALID, date: '25/10/2026' }),
        'Format « 25/10/2026 » refusé : utilisez @Matches ou @IsISO8601.',
      ).toContain('date');
      expect(await errorsFor({ ...VALID, date: '2026-13-45' })).toContain('date');
      const { date: _date, ...withoutDate } = VALID;
      expect(await errorsFor(withoutDate), 'date est obligatoire.').toContain('date');
    });

    it('refuse un paidById qui n’est pas un UUID', async () => {
      expect(
        await errorsFor({ ...VALID, paidById: 'pas-un-uuid' }),
        'paidById fourni doit être un UUID : @IsUUID().',
      ).toContain('paidById');
    });
  });

  describe('POST /wallets/:walletId/expenses', () => {
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

    it('crée la dépense et répond 201 avec son contenu', async () => {
      const http = await start();
      const response = await http
        .post('/wallets/w-open/expenses')
        .set('x-test-user', ALICE)
        .send(VALID);

      expectStatus(
        response,
        201,
        'Avez-vous ajouté @Post() et @Body() dto: CreateExpenseDto dans le contrôleur ?',
      );
      expect(response.body).toMatchObject({
        title: 'Courses',
        amount: 1250,
        date: '2026-10-25',
      });
      expect(response.body.id, 'La réponse doit contenir l’id de la dépense.').toBeDefined();
    });

    it('enregistre la dépense en base avec le bon porte-monnaie', async () => {
      const http = await start();
      await http.post('/wallets/w-open/expenses').set('x-test-user', ALICE).send(VALID);

      const stored = testApp.prisma.data.expenses.filter(
        (expense: { walletId: string; title: string }) =>
          expense.walletId === 'w-open' && expense.title === 'Courses',
      );
      expect(
        stored.length,
        'Une dépense « Courses » supplémentaire devait être créée dans w-open (prisma.expense.create).',
      ).toBe(2);
    });

    it('le dépenseur est l’utilisateur connecté quand paidById est absent', async () => {
      const http = await start();
      const response = await http
        .post('/wallets/w-open/expenses')
        .set('x-test-user', BOB)
        .send(VALID);

      expectStatus(response, 201, 'La création doit réussir.');
      expect(
        response.body.paidBy?.id,
        `Dépenseur attendu : ${BOB} (utilisateur connecté) - reçu : ${response.body.paidBy?.id}`,
      ).toBe(BOB);
    });

    it('le dépenseur peut être un autre membre ; le créateur reste l’utilisateur connecté', async () => {
      const http = await start();
      const response = await http
        .post('/wallets/w-open/expenses')
        .set('x-test-user', ALICE)
        .send({ ...VALID, paidById: BOB });

      expectStatus(response, 201, 'Alice peut saisir une dépense payée par Bob (membre).');
      expect(response.body.paidBy?.id, 'paidBy.id doit être Bob.').toBe(BOB);
      const stored = testApp.prisma.data.expenses.at(-1);
      expect(
        stored.createdById,
        `createdById attendu : ${ALICE} (celle qui saisit) - reçu : ${stored.createdById}`,
      ).toBe(ALICE);
      expect(stored.paidById).toBe(BOB);
    });

    it('refuse (403) un dépenseur qui n’est pas membre du porte-monnaie', async () => {
      const http = await start();
      const response = await http
        .post('/wallets/w-open/expenses')
        .set('x-test-user', ALICE)
        .send({ ...VALID, paidById: DAN });

      expectStatus(response, 403, 'Dan n’est pas membre : lancez ForbiddenException.');
      expect(
        testApp.prisma.data.expenses.length,
        'Aucune dépense ne doit être créée dans ce cas.',
      ).toBe(5);
    });

    it('refuse (400) un montant égal à 0 grâce au ValidationPipe', async () => {
      const http = await start();
      const response = await http
        .post('/wallets/w-open/expenses')
        .set('x-test-user', ALICE)
        .send({ ...VALID, amount: 0 });

      expectStatus(response, 400, 'Le DTO doit refuser amount = 0 (@Min(1)).');
    });

    it('refuse (400) un corps invalide', async () => {
      const http = await start();
      const response = await http
        .post('/wallets/w-open/expenses')
        .set('x-test-user', ALICE)
        .send({ title: '', amount: 'abc', date: 'hier' });

      expectStatus(response, 400, 'Tous les champs sont invalides : le ValidationPipe doit répondre 400.');
    });

    it('refuse (400) les champs inconnus (forbidNonWhitelisted)', async () => {
      const http = await start();
      const response = await http
        .post('/wallets/w-open/expenses')
        .set('x-test-user', ALICE)
        .send({ ...VALID, createdById: BOB });

      expectStatus(response, 400, 'Le champ « createdById » n’existe pas dans le DTO : il doit être rejeté.');
    });

    it('refuse (403) un utilisateur qui n’est pas membre du porte-monnaie', async () => {
      const http = await start();
      const response = await http
        .post('/wallets/w-open/expenses')
        .set('x-test-user', DAN)
        .send(VALID);

      expectStatus(response, 403, 'Utilisez assertMemberOfWallet avant de créer.');
    });

    it('refuse (403) un simple invité', async () => {
      const http = await start();
      const response = await http
        .post('/wallets/w-open/expenses')
        .set('x-test-user', CAROLE)
        .send(VALID);

      expectStatus(response, 403, 'Carole n’a pas accepté l’invitation.');
    });

    it('renvoie 404 si le porte-monnaie n’existe pas', async () => {
      const http = await start();
      const response = await http
        .post('/wallets/inconnu/expenses')
        .set('x-test-user', ALICE)
        .send(VALID);

      expectStatus(response, 404, 'Porte-monnaie inconnu : NotFoundException.');
    });

    it('renvoie 409 si le porte-monnaie est clôturé', async () => {
      const http = await start();
      const response = await http
        .post('/wallets/w-closed/expenses')
        .set('x-test-user', ALICE)
        .send(VALID);

      expectStatus(response, 409, 'On ne peut plus ajouter de dépense après la clôture : assertWalletOpen.');
    });

    it('rafraîchit wallet.updatedAt (règle métier : chaque action met à jour la date)', async () => {
      const http = await start();
      const before = testApp.prisma.data.wallets.find(
        (wallet: { id: string }) => wallet.id === 'w-open',
      ).updatedAt as Date;

      await http.post('/wallets/w-open/expenses').set('x-test-user', ALICE).send(VALID);

      const after = testApp.prisma.data.wallets.find(
        (wallet: { id: string }) => wallet.id === 'w-open',
      ).updatedAt as Date;
      expect(
        after.getTime() > before.getTime(),
        `updatedAt n’a pas changé (${before.toISOString()}). Ajoutez prisma.wallet.update({ where: { id: walletId }, data: { updatedAt: new Date() } }).`,
      ).toBe(true);
    });

    it('la nouvelle dépense apparaît dans la liste (étapes 1 + 2) et augmente le total', async () => {
      const http = await start();
      await http.post('/wallets/w-open/expenses').set('x-test-user', ALICE).send(VALID);
      const response = await http.get('/wallets/w-open/expenses').set('x-test-user', ALICE);

      expectStatus(response, 200, 'GET doit toujours fonctionner (étape 1).');
      expect(
        response.body.totalAmount,
        `Total attendu : 10349 (9099 + 1250) - reçu : ${response.body.totalAmount}`,
      ).toBe(10349);
    });

    it('renvoie 401 sans jeton', async () => {
      const http = await start();
      const response = await http.post('/wallets/w-open/expenses').send(VALID);

      expectStatus(response, 401, 'La route doit rester protégée par JwtAuthGuard.');
    });
  });
});
