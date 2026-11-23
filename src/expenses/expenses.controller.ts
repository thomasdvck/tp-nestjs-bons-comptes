import { Controller,Get, Param, Req, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/auth.guard.js';
import { ApiJwtAuth } from '../common/swagger/api-docs.decorators.js';
import { ExpensesService } from './expenses.service.js';

// Toutes les routes de ce contrôleur commencent par /wallets/:walletId/expenses
// et exigent un jeton JWT (JwtAuthGuard) : c'est déjà configuré.
@Controller('wallets/:walletId/expenses')
@ApiTags('expenses')
@UseGuards(JwtAuthGuard)
@ApiJwtAuth()
export class ExpensesController {
  constructor(private readonly expensesService: ExpensesService) {}

  @Get()
  findAll(
    @Param('walletId') walletId: string,
    @Req() request: { user: { userId: string } },
  ) {
    return this.expensesService.findAll(walletId, request.user.userId);
  }

  // TODO étape 2 : route POST (déclarer une dépense). Utilisez @Body() avec CreateExpenseDto.

  // TODO étape 3 : route DELETE ':id' protégée par ExpenseOwnerGuard (@UseGuards).
  //   Répondre 204 (@HttpCode(HttpStatus.NO_CONTENT)).
  //   Refactorisez aussi les routes précédentes pour utiliser @CurrentUser('userId')
  //   à la place de @Req().
}
