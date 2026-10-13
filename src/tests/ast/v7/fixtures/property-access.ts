import { PrismaPg } from '@prisma/adapter-pg';

import { PrismaClient } from '../../../schemas/v7/generated/prisma/client.js';

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: 'fake' }) });

const service = {
  prisma,
};

const container = {
  services: {
    prisma,
  },
};

await prisma.user.findMany();
await service.prisma.user.findMany();
await container.services.prisma.user.findMany();

class UserService {
  prisma;
  constructor() {
    this.prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: 'fake' }) });
  }

  async findAllUsers() {
    await this.prisma.user.findMany();
  }
}
