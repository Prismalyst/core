import { PrismaPg } from '@prisma/adapter-pg';

import { PrismaClient } from '../../../schemas/v7/generated/prisma/client.js';

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: 'fake' }) });

await prisma.user.findMany();
await prisma.user.findFirst();
await prisma.user.update({
  where: {
    id: 1,
  },
  data: {
    name: 'username',
  },
});
await prisma.user.delete({
  where: {
    id: 1,
  },
});
await prisma.user.create({
  data: {
    name: 'user2',
    email: 'user@mail.com',
  },
});

await prisma.$transaction(async (tx) => {
  await tx.user.findMany();
  await tx.user.findFirst();
});

await prisma.$connect();
await prisma.$disconnect();