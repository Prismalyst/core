import { PrismaPg } from '@prisma/adapter-pg';

import { PrismaClient } from '../../../schemas/v7/generated/prisma/client.js';

const prismaClientOptions = { adapter: new PrismaPg({ connectionString: 'fake' }) };

class FakePrismaClient {
  async findMany() {
    return true;
  }
}

const prisma = new PrismaClient(prismaClientOptions);
const db = new PrismaClient(prismaClientOptions);
const prismaFake = new FakePrismaClient();

await prisma.user.findMany();
await db.user.findFirst();
await prismaFake.findMany();
