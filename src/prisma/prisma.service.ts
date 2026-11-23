import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

// La connexion à la base est ouverte à la première requête (comportement par
// défaut de Prisma) : le serveur démarre donc même sans base de données.
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleDestroy {
  constructor() {
    super({ transactionOptions: { maxWait: 10000, timeout: 15000 } });
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
