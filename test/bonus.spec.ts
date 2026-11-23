// Bonus - Clôture : qui doit payer / recevoir combien
// Lancer : npm run test:bonus
import 'reflect-metadata';
import request from 'supertest';
import { afterEach, describe, expect, it } from 'vitest';
import {
  calculateBalances,
  type MemberPayment,
} from '../src/closure/balance-calculator.js';
import { ClosureModule } from '../src/closure/closure.module.js';
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

// Identifiants courts triés dans l'ordre alphabétique : a < b < c < d.
const A = 'a';
const B = 'b';
const C = 'c';
const D = 'd';

const member = (userId: string, paidAmount: number): MemberPayment => ({
  userId,
  name: `Membre ${userId.toUpperCase()}`,
  paidAmount,
});

// Appelle calculateBalances et indexe le résultat par userId.
function compute(totalAmount: number, members: MemberPayment[]) {
  const result = calculateBalances(totalAmount, members);
  const byId = Object.fromEntries(
    (result.balances ?? []).map((balance) => [balance.userId, balance]),
  );
  return { ...result, byId };
}

function expectValue(label: string, expected: number, received: number | undefined) {
  expect(
    received,
    `${label} - valeur attendue : ${expected} centimes, valeur reçue : ${received}`,
  ).toBe(expected);
}

describe('Bonus - Clôture et calcul des soldes', () => {
  describe('calculateBalances - cas simples (division exacte)', () => {
    it('3 membres, 90,00 € au total : chacun doit 30,00 € (3000 centimes)', () => {
      const { byId } = compute(9000, [member(A, 6000), member(B, 3000), member(C, 0)]);

      expectValue('Part de A', 3000, byId[A]?.shareAmount);
      expectValue('Part de B', 3000, byId[B]?.shareAmount);
      expectValue('Part de C', 3000, byId[C]?.shareAmount);
    });

    it('solde = montant payé − part due (positif : à recevoir, négatif : à payer)', () => {
      const { byId } = compute(9000, [member(A, 6000), member(B, 3000), member(C, 0)]);

      expectValue('Solde de A (a payé 6000, doit 3000)', 3000, byId[A]?.balance);
      expectValue('Solde de B (a payé 3000, doit 3000)', 0, byId[B]?.balance);
      expectValue('Solde de C (a payé 0, doit 3000)', -3000, byId[C]?.balance);
    });

    it('conserve le nom et le montant payé de chaque membre', () => {
      const { byId } = compute(9000, [member(A, 6000), member(B, 3000), member(C, 0)]);

      expect(byId[A], 'Le résultat doit contenir une ligne pour le membre A.').toMatchObject({
        userId: A,
        name: 'Membre A',
        paidAmount: 6000,
      });
    });

    it('un seul membre : il doit tout, son solde est 0, aucun virement', () => {
      const { byId, transfers } = compute(5000, [member(A, 5000)]);

      expectValue('Part de A', 5000, byId[A]?.shareAmount);
      expectValue('Solde de A', 0, byId[A]?.balance);
      expect(transfers, `Aucun virement attendu - reçu : ${JSON.stringify(transfers)}`).toEqual([]);
    });

    it('total de 0 centime : toutes les parts et tous les soldes valent 0', () => {
      const { byId } = compute(0, [member(A, 0), member(B, 0)]);

      expectValue('Part de A', 0, byId[A]?.shareAmount);
      expectValue('Solde de B', 0, byId[B]?.balance);
    });
  });

  describe('calculateBalances - répartition du reste (centimes)', () => {
    it('100,00 € à 3 (reste 1) : le premier userId paie 1 centime de plus (3334 / 3333 / 3333)', () => {
      const { byId } = compute(10000, [member(A, 10000), member(B, 0), member(C, 0)]);

      expectValue('Part de A (premier userId, reçoit le centime en plus)', 3334, byId[A]?.shareAmount);
      expectValue('Part de B', 3333, byId[B]?.shareAmount);
      expectValue('Part de C', 3333, byId[C]?.shareAmount);
    });

    it('100,01 € à 3 (reste 2) : les DEUX premiers userId paient 1 centime de plus (3334 / 3334 / 3333)', () => {
      const { byId } = compute(10001, [member(A, 0), member(B, 0), member(C, 10001)]);

      expectValue('Part de A', 3334, byId[A]?.shareAmount);
      expectValue('Part de B', 3334, byId[B]?.shareAmount);
      expectValue('Part de C', 3333, byId[C]?.shareAmount);
    });

    it('le reste suit l’ordre des userId, quel que soit l’ordre des membres reçus', () => {
      // Membres fournis dans le désordre : C, A, B.
      const { byId } = compute(10000, [member(C, 0), member(A, 10000), member(B, 0)]);

      expectValue('Part de A (userId le plus petit)', 3334, byId[A]?.shareAmount);
      expectValue('Part de B', 3333, byId[B]?.shareAmount);
      expectValue('Part de C', 3333, byId[C]?.shareAmount);
    });

    it('exemple de la fiche : 100,00 € payés par A, soldes +6666 / −3333 / −3333', () => {
      const { byId } = compute(10000, [member(A, 10000), member(B, 0), member(C, 0)]);

      expectValue('Solde de A', 6666, byId[A]?.balance);
      expectValue('Solde de B', -3333, byId[B]?.balance);
      expectValue('Solde de C', -3333, byId[C]?.balance);
    });

    it.each([0, 1, 2, 3, 99, 10000, 12345, 2_147_483_647])(
      'avec un total de %i centimes et 4 membres : la somme des parts est exactement le total',
      (total) => {
        const { balances } = compute(total, [
          member(A, total),
          member(B, 0),
          member(C, 0),
          member(D, 0),
        ]);
        const sumOfShares = balances.reduce((sum, row) => sum + row.shareAmount, 0);

        expect(
          sumOfShares,
          `Somme des parts - attendue : ${total}, reçue : ${sumOfShares}. Aucun centime ne doit être perdu ni créé.`,
        ).toBe(total);
      },
    );

    it('la somme des soldes de tous les membres vaut toujours 0', () => {
      const { balances } = compute(12345, [
        member(A, 5000),
        member(B, 7345),
        member(C, 0),
        member(D, 0),
      ]);
      const sum = balances.reduce((total, row) => total + row.balance, 0);

      expect(sum, `Somme des soldes - attendue : 0, reçue : ${sum}`).toBe(0);
    });

    it('toutes les valeurs sont des entiers (jamais de virgule)', () => {
      const { balances } = compute(10000, [member(A, 10000), member(B, 0), member(C, 0)]);

      for (const row of balances) {
        expect(
          Number.isInteger(row.shareAmount) && Number.isInteger(row.balance),
          `Les montants de ${row.userId} doivent être entiers - part : ${row.shareAmount}, solde : ${row.balance}. Utilisez Math.floor et l'opérateur %.`,
        ).toBe(true);
      }
    });
  });

  describe('calculateBalances - virements proposés', () => {
    it('les débiteurs remboursent le créancier : B → A 3333 et C → A 3333', () => {
      const { transfers } = compute(10000, [member(A, 10000), member(B, 0), member(C, 0)]);

      expect(
        transfers,
        `Virements attendus : B→A 3333 et C→A 3333 - reçus : ${JSON.stringify(transfers)}. Renvoyez computeTransfers(balances).`,
      ).toEqual([
        { fromUserId: B, toUserId: A, amount: 3333 },
        { fromUserId: C, toUserId: A, amount: 3333 },
      ]);
    });

    it('une fois les virements faits, plus personne ne doit rien', () => {
      const { balances, transfers } = compute(12345, [
        member(A, 8000),
        member(B, 4345),
        member(C, 0),
        member(D, 0),
      ]);
      const remaining = Object.fromEntries(balances.map((row) => [row.userId, row.balance]));
      for (const transfer of transfers) {
        remaining[transfer.fromUserId] += transfer.amount;
        remaining[transfer.toUserId] -= transfer.amount;
      }

      expect(
        remaining,
        `Après les virements, tous les soldes devraient être 0 - reçu : ${JSON.stringify(remaining)}`,
      ).toEqual({ [A]: 0, [B]: 0, [C]: 0, [D]: 0 });
    });
  });

  describe('GET /wallets/:id/balance (ClosureService.getBalance)', () => {
    let testApp: TestApp;

    afterEach(async () => {
      await testApp?.app.close();
    });

    async function start() {
      testApp = await createTestApp({
        imports: [ClosureModule],
        data: sampleData(),
      });
      return request(testApp.app.getHttpServer());
    }

    it('renvoie le bilan d’un porte-monnaie clôturé (total, soldes, virements)', async () => {
      // w-closed : une seule dépense de 9000 payée par Alice ; membres Alice et Bob.
      const http = await start();
      const response = await http.get('/wallets/w-closed/balance').set('x-test-user', ALICE);

      expectStatus(
        response,
        200,
        'ClosureService.getBalance doit utiliser checkClosedWalletAccess, loadBalanceData puis calculateBalances.',
      );
      expect(response.body.walletId).toBe('w-closed');
      expect(
        response.body.totalAmount,
        `totalAmount attendu : 9000 - reçu : ${response.body.totalAmount}`,
      ).toBe(9000);

      const balances = Object.fromEntries(
        (response.body.balances ?? []).map(
          (row: { userId: string; balance: number }) => [row.userId, row.balance],
        ),
      );
      expect(
        balances,
        `Soldes attendus : Alice +4500, Bob −4500 - reçus : ${JSON.stringify(balances)}`,
      ).toEqual({ [ALICE]: 4500, [BOB]: -4500 });
      expect(
        response.body.transfers,
        `Virement attendu : Bob → Alice 4500 - reçu : ${JSON.stringify(response.body.transfers)}`,
      ).toEqual([{ fromUserId: BOB, toUserId: ALICE, amount: 4500 }]);
    });

    it('renvoie 409 si le porte-monnaie est encore ouvert', async () => {
      const http = await start();
      const response = await http.get('/wallets/w-open/balance').set('x-test-user', ALICE);

      expectStatus(response, 409, 'Appelez checkClosedWalletAccess avant tout calcul.');
    });

    it('renvoie 403 si l’utilisateur n’est pas membre', async () => {
      const http = await start();
      const response = await http.get('/wallets/w-closed/balance').set('x-test-user', DAN);

      expectStatus(response, 403, 'Dan n’est pas membre de w-closed.');
    });

    it('renvoie 403 pour un simple invité', async () => {
      const http = await start();
      const response = await http.get('/wallets/w-closed/balance').set('x-test-user', CAROLE);

      expectStatus(response, 403, 'Carole n’est pas membre de w-closed.');
    });

    it('renvoie 404 si le porte-monnaie n’existe pas', async () => {
      const http = await start();
      const response = await http.get('/wallets/inconnu/balance').set('x-test-user', ALICE);

      expectStatus(response, 404, 'Porte-monnaie inconnu.');
    });
  });
});
