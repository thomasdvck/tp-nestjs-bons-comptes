import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { MAX_AMOUNT_CENTS } from '../../common/amounts.js';
import {
  IsInt,
  IsISO8601,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
  Min,
} from 'class-validator';

// Les décorateurs @ApiProperty ne servent qu'à la documentation Swagger.
// Ils ne VALIDENT rien !

export class CreateExpenseDto {
  @ApiProperty({ maxLength: 100, example: 'Billets de train' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  title: string;

  @ApiProperty({
    type: 'integer',
    description: 'Montant en centimes (4599 = 45,99 €).',
    minimum: 1,
    maximum: MAX_AMOUNT_CENTS,
    example: 4599,
  })
  @IsInt()
  @Min(1)
  amount: number;

  @ApiProperty({
    description: 'Date de la dépense (AAAA-MM-JJ).',
    format: 'date',
    example: '2026-10-25',
  })
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  @IsISO8601({ strict: true })
  date: string;

  @ApiPropertyOptional({
    description:
      'Dépenseur (membre du porte-monnaie). Par défaut : l’utilisateur connecté.',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  paidById?: string;
}
