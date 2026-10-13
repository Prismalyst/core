const prisma1 = {
  user: {
    findMany() {
      return [];
    },
  },
};

class PrismaClient {
  user = { findMany() {} };
}

const prisma2 = new PrismaClient();

prisma1.user.findMany();
prisma2.user.findMany();
