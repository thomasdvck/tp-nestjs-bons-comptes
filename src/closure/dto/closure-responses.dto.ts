import { ApiProperty } from '@nestjs/swagger';
import { WalletStatus } from '@prisma/client';

export class ClosedWalletResponseDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ example: 'Voyage à Lisbonne' })
  title: string;

  @ApiProperty({ type: String, nullable: true })
  description: string | null;

  @ApiProperty({
    enum: WalletStatus,
    enumName: 'WalletStatus',
    example: 'CLOSED',
  })
  status: WalletStatus;

  @ApiProperty({ format: 'date-time' })
  createdAt: string;

  @ApiProperty({ format: 'date-time' })
  updatedAt: string;

  @ApiProperty({ type: String, format: 'date-time', nullable: true })
  closedAt: string | null;
}

export class MemberBalanceDto {
  @ApiProperty({ format: 'uuid' })
  userId: string;

  @ApiProperty({ example: 'Élodie Laurent' })
  name: string;

  @ApiProperty({ type: 'integer', description: 'Total payé, en centimes.' })
  paidAmount: number;

  @ApiProperty({ type: 'integer', description: 'Part due, en centimes.' })
  shareAmount: number;

  @ApiProperty({
    type: 'integer',
    description:
      'Solde en centimes : positif = à recevoir, négatif = à rembourser.',
  })
  balance: number;
}

export class TransferDto {
  @ApiProperty({ format: 'uuid' })
  fromUserId: string;

  @ApiProperty({ format: 'uuid' })
  toUserId: string;

  @ApiProperty({ type: 'integer', description: 'Reste à régler, en centimes.' })
  amount: number;
}

export class BalanceResponseDto {
  @ApiProperty({ format: 'uuid' })
  walletId: string;

  @ApiProperty({
    type: 'integer',
    description: 'Total des dépenses, en centimes.',
  })
  totalAmount: number;

  @ApiProperty({ type: [MemberBalanceDto] })
  balances: MemberBalanceDto[];

  @ApiProperty({ type: [TransferDto] })
  transfers: TransferDto[];
}
