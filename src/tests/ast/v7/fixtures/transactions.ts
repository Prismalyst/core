import { PrismaPg } from '@prisma/adapter-pg';

import { PrismaClient } from '../../../schemas/v7/generated/prisma/client.js';

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: 'fake' }) });

const user = {
  name: 'user',
  email: 'user@mail',
};

const post = {
  title: 'title',
  body: 'body',
  slug: 'slug',
  authorId: 1,
};

await prisma.$transaction([prisma.user.create({ data: user }), prisma.post.create({ data: post })]);

await prisma.$transaction(async (tx) => {
  await tx.user.findMany();
  await tx.post.create({ data: post });
});
