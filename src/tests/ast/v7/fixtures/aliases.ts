import { PrismaPg } from '@prisma/adapter-pg';

import { PrismaClient } from '../../../schemas/v7/generated/prisma/client.js';

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: 'fake' }) });
const db = prisma;
const db1 = prisma;
const db2 = db1;
const db3 = db2;

await prisma.user.findMany();
await db.user.findFirst();
await db1.user.update({
  where: {
    id: 1,
  },
  data: {
    name: 'username',
  },
});
await db2.user.delete({
  where: {
    id: 1,
  },
});
await db3.user.create({
  data: {
    name: 'user2',
    email: 'user@mail.com',
  },
});
