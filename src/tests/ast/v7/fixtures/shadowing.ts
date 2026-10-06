import { PrismaPg } from '@prisma/adapter-pg';

import { PrismaClient } from '../../../schemas/v7/generated/prisma/client.js';

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: 'fake' }) });

class FakeClient {
  findMany() {
    return true;
  }
}

await prisma.user.findMany();

function foo(prisma: FakeClient) {
  // @ts-expect-error Fake prisma

  prisma.user.findMany();
}

function bar() {
  const prisma = new FakeClient();

  // @ts-expect-error Fake prisma
  prisma.user.findMany();
}

await prisma.user.findMany();
