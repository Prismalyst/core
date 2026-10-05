import { PrismaPg } from '@prisma/adapter-pg';

import { PrismaClient } from '../../../schemas/v7/generated/prisma/client.js';

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: 'fake' }) });

await prisma.user.findMany();

async function loadUsers() {
  await prisma.user.findMany();
}

const loadUsersWithArrow = async () => {
  await prisma.user.findMany();
};

const loadUsersWithExpression = async function () {
  await prisma.user.findMany();
};

const active = true;

if (active) {
  await prisma.user.findMany({ where: { active: true } });
} else {
  await prisma.user.findMany({ where: { active: false } });
}

async function loadUsersByStatus(active: boolean) {
  if (active) {
    await prisma.user.findMany({ where: { active: true } });
  } else {
    await prisma.user.findMany({ where: { active: false } });
  }
}

const userIds = [1, 2];

for (let index = 0; index < userIds.length; index++) {
  await prisma.user.findMany();
}

for (const userId of userIds) {
  await prisma.user.findUnique({ where: { id: userId } });
}

const usersByName = { alice: 1, bob: 2 };

for (const name in usersByName) {
  await prisma.user.findMany({ where: { name } });
}

let remaining = 2;

while (remaining > 0) {
  await prisma.user.findMany();
  remaining--;
}

let attempts = 0;

do {
  await prisma.user.findMany();
  attempts++;
} while (attempts < 2);

await Promise.all(
  userIds.map(async (userId) => {
    return await prisma.user.findUnique({ where: { id: userId } });
  }),
);

await Promise.resolve(1).then(async function (userId) {
  return await prisma.user.findUnique({ where: { id: userId } });
});

async function loadUsersWithNestedFunctions() {
  await prisma.user.findMany();

  async function loadPosts() {
    await prisma.post.findMany();
  }

  const loadComments = async () => {
    await prisma.comment.findMany();
  };

  await loadPosts();
  await loadComments();
}

for (const userId of userIds) {
  async function loadUserInsideLoop() {
    await prisma.user.findUnique({ where: { id: userId } });
  }

  await loadUserInsideLoop();
}
