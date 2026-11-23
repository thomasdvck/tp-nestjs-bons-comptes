import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module.js';
// TODO étape 1 : importez ExpensesController et ExpensesService
//   (./expenses.controller.js et ./expenses.service.js - n'oubliez pas le « .js »).

// Un module regroupe un contrôleur et ses services.
// TODO étape 1 : déclarez ExpensesController dans « controllers »
//   et ExpensesService dans « providers ».
@Module({
  imports: [PrismaModule],
  controllers: [],
  providers: [],
})
export class ExpensesModule {}
