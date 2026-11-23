import { Controller, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/auth.guard.js';
import { ApiJwtAuth } from '../common/swagger/api-docs.decorators.js';
// TODO étape 1 : importez ExpensesService (./expenses.service.js).
// Rappel : en ESM, les imports locaux doivent se terminer par « .js ».

// Toutes les routes de ce contrôleur commencent par /wallets/:walletId/expenses
// et exigent un jeton JWT (JwtAuthGuard) : c'est déjà configuré.
@Controller('wallets/:walletId/expenses')
@ApiTags('expenses')
@UseGuards(JwtAuthGuard)
@ApiJwtAuth()
export class ExpensesController {
  // TODO étape 1 : injectez ExpensesService par le constructeur.

  // TODO étape 1 : route GET (liste des dépenses + total).
  //   Décorateurs utiles : @Get(), @Param('walletId'), @Req() (type AuthenticatedRequest,
  //   l'identifiant de l'utilisateur est dans request.user.userId).
  //   Le contrôleur ne fait que déléguer au service : findAll(walletId, userId).

  // TODO étape 2 : route POST (déclarer une dépense). Utilisez @Body() avec CreateExpenseDto.

  // TODO étape 3 : route DELETE ':id' protégée par ExpenseOwnerGuard (@UseGuards).
  //   Répondre 204 (@HttpCode(HttpStatus.NO_CONTENT)).
  //   Refactorisez aussi les routes précédentes pour utiliser @CurrentUser('userId')
  //   à la place de @Req().
}
