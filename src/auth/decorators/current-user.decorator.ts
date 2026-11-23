import { createParamDecorator, type ExecutionContext } from '@nestjs/common';

// TODO étape 3 : écrivez le décorateur de paramètre @CurrentUser().
//
// Objectif : écrire `@CurrentUser('userId') userId: string` dans un contrôleur, au lieu
// de `@Req() request` puis `request.user.userId`.
//   - @CurrentUser()         → renvoie l'objet request.user, c'est-à-dire { userId }
//   - @CurrentUser('userId') → renvoie directement request.user.userId
//
// Indice : la fonction reçoit (field, context). La requête s'obtient avec
//   context.switchToHttp().getRequest<AuthenticatedRequest>()
export const CurrentUser = createParamDecorator(
  (_field: string | undefined, _context: ExecutionContext) => {
    return undefined; // TODO
  },
);
