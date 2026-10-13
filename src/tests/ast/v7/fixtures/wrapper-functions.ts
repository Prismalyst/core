import { PrismaPg } from '@prisma/adapter-pg';

import { PrismaClient } from '../../../schemas/v7/generated/prisma/client.js';

function getPrisma() {
  return new PrismaClient({ adapter: new PrismaPg({ connectionString: 'fake' }) });
}

const prisma = getPrisma();

await prisma.user.findMany();
await prisma.post.findMany({
  where: {
    authorId: 1,
  },
});
