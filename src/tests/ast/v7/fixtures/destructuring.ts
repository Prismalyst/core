import { PrismaPg } from '@prisma/adapter-pg';

import { PrismaClient } from '../../../schemas/v7/generated/prisma/client.js';

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: 'fake' }) });

const { user: users, post: posts } = prisma;

await users.findMany();
await posts.findMany({
  where: {
    authorId: 1,
  },
});

await prisma.$transaction(async (tx) => {
  const { user: users, post: posts } = tx;

  await users.findMany();
  await posts.findMany({
    where: {
      authorId: 1,
    },
  });
});
