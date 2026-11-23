import {
  type CanActivate,
  type ExecutionContext,
  Injectable,
  NotImplementedException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';

// TODO étape 3 : complétez ce Guard.
//
// Un Guard décide si une requête peut atteindre la route : il renvoie true (autorisé)
// ou lève une exception. Ici : seuls le DÉPENSEUR (paidById) ou le CRÉATEUR de la
// dépense (createdById) peuvent supprimer une dépense.
//
// Dans canActivate(context) :
//   1. récupérez la requête : context.switchToHttp().getRequest<AuthenticatedRequest>()
//      - request.params contient { walletId, id } (paramètres de l'URL)
//      - request.user.userId est l'utilisateur connecté (rempli par JwtAuthGuard)
//   2. cherchez la dépense : this.prisma.expense.findFirst({ where: { id, walletId }, select: {...} })
//   3. introuvable → NotFoundException('Dépense introuvable.')
//   4. ni dépenseur ni créateur → ForbiddenException(...)
//   5. sinon → return true
@Injectable()
export class ExpenseOwnerGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(_context: ExecutionContext): Promise<boolean> {
    throw new NotImplementedException('TODO étape 3 : ExpenseOwnerGuard');
  }
}
