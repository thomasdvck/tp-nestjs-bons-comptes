import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module.js';
import { ExpensesController } from './expenses.controller.js';
import { ExpensesService } from './expenses.service.js';

// Un module regroupe un contrôleur et ses services.
// TODO étape 1 : déclarez ExpensesController dans « controllers »
//   et ExpensesService dans « providers ».
@Module({
  imports: [PrismaModule],
  controllers: [ExpensesController],
  providers: [ExpensesService],
})
export class ExpensesModule {}
