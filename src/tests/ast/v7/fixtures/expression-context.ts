import { PrismaPg } from '@prisma/adapter-pg';

import { PrismaClient } from '../../../schemas/v7/generated/prisma/client.js';

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: 'fake' }) });

// @ts-expect-error
function consume(fn) {
  fn();
}

prisma.user.findMany();

const users = prisma.user.findMany();

consume(prisma.user.findMany());

const promise = new Promise(() => {
  prisma.user.findMany();
});

Promise.all([prisma.user.findMany(), prisma.post.findMany()]);

const ok = Math.random() > 0.5 ? true : false;

const q = ok ? prisma.user.findMany() : prisma.user.findFirst();

function doSomething() {
  return prisma.user.findMany();
}
