import { PrismaPg } from '@prisma/adapter-pg';

import { PrismaClient } from '../../../schemas/v7/generated/prisma/client.js';

const prismaClientOptions = { adapter: new PrismaPg({ connectionString: 'fake' }) };

class FakePrismaClient {
  async findMany() {
    return true;
  }
}

const Foo = PrismaClient;

const prisma = new PrismaClient(prismaClientOptions);
const foo = new Foo(prismaClientOptions);
const db = new PrismaClient(prismaClientOptions);
const db2 = db;
const prismaFake = new FakePrismaClient();

await prisma.user.findMany();
await db.user.findFirst();
await db2.user.update({
  where: {
    id: 1,
  },
  data: {
    name: 'username',
  },
});
await foo.user.delete({
  where: {
    id: 1,
  },
});
await prismaFake.findMany();
