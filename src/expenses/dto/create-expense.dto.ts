import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { MAX_AMOUNT_CENTS } from '../../common/amounts.js';

// Les décorateurs @ApiProperty ne servent qu'à la documentation Swagger.
// Ils ne VALIDENT rien !
//
// TODO étape 2 : ajoutez les décorateurs de class-validator pour valider les entrées.
//   Importez-les depuis 'class-validator' : IsString, IsNotEmpty, MaxLength, IsInt, Min,
//   Matches, IsISO8601, IsOptional, IsUUID.
//   ⚠ Avec le ValidationPipe de main.ts (whitelist + forbidNonWhitelisted), une propriété
//   SANS aucun décorateur class-validator est rejetée (400) : il faut décorer chaque champ.
//
// Règles attendues :
//   title    : texte non vide, 100 caractères maximum
//   amount   : entier STRICTEMENT supérieur à 0 (en centimes)
//   date     : chaîne « AAAA-MM-JJ » (date ISO valide)
//   paidById : OPTIONNEL ; s'il est fourni, c'est un UUID
export class CreateExpenseDto {
  @ApiProperty({ maxLength: 100, example: 'Billets de train' })
  title: string;

  @ApiProperty({
    type: 'integer',
    description: 'Montant en centimes (4599 = 45,99 €).',
    minimum: 1,
    maximum: MAX_AMOUNT_CENTS,
    example: 4599,
  })
  amount: number;

  @ApiProperty({
    description: 'Date de la dépense (AAAA-MM-JJ).',
    format: 'date',
    example: '2026-10-25',
  })
  date: string;

  @ApiPropertyOptional({
    description:
      'Dépenseur (membre du porte-monnaie). Par défaut : l’utilisateur connecté.',
    format: 'uuid',
  })
  paidById?: string;
}
