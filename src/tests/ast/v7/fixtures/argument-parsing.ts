import { PrismaPg } from '@prisma/adapter-pg';

import { PrismaClient } from '../../../schemas/v7/generated/prisma/client.js';

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: 'fake' }) });

await prisma.user.findMany();

await prisma.user.findMany({});

await prisma.user.findMany({
  where: { active: true },
  take: 10,
  skip: 20,
});

await prisma.user.delete({
  where: {
    id: 1,
  },
});

await prisma.user.update({
  where: {
    id: 1,
  },
  data: {
    name: 'username',
  },
});

await prisma.user.findMany({
  where: {
    OR: [{ name: 'User' }, { email: { contains: '@gmail.com' } }],
  },
});

const active = true;
const whereCondition = { active };

await prisma.user.findMany({
  where: { active: whereCondition.active },
  take: 10,
  skip: 20,
});

await prisma.user.findMany({
  where: { active },
  take: 10,
  skip: 20,
});

await prisma.user.findMany({
  where: whereCondition,
  take: 10,
  skip: 20,
});

await prisma.user.findMany({
  where: { ...whereCondition },
  take: 10,
  skip: 20,
});

await prisma.$queryRawUnsafe(`SELECT * FROM ${active}`);
