import { PrismaPg } from '@prisma/adapter-pg';

import { PrismaClient } from '../../../schemas/v7/generated/prisma/client.js';

// TODO: Add extensions support
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: 'fake' }) }).$extends({
  name: 'signUp',
  model: {
    user: {
      signUp: () => {},
    },
  },
});

await prisma.user.findMany();
await prisma.post.findMany({
  where: {
    authorId: 1,
  },
});
