import { PrismaPg } from '@prisma/adapter-pg';

import { PrismaClient } from '../../../schemas/v7/generated/prisma/client.js';

class PrismaService extends PrismaClient {
  constructor() {
    super({ adapter: new PrismaPg({ connectionString: 'fake' }) });
  }
}

class UserService {
  constructor(private readonly prisma: PrismaService) {}

  async _byId(userId: number) {
    return await this.prisma.user.findUnique({
      where: {
        id: userId,
      },
    });
  }

  async _byEmail(email: string) {
    return await this.prisma.user.findUnique({
      where: {
        email,
      },
    });
  }

  async create(data: any) {
    return await this.prisma.user.create({
      data,
    });
  }

  async findAll() {
    return await this.prisma.user.findMany();
  }

  async delete(userId: number) {
    return await this.prisma.user.delete({
      where: {
        id: userId,
      },
    });
  }

  async update(userId: number, data: any) {
    return await this.prisma.user.update({
      where: {
        id: userId,
      },
      data,
    });
  }
}
