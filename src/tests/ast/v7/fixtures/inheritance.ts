import { PrismaPg } from '@prisma/adapter-pg';

import { PrismaClient } from '../../../schemas/v7/generated/prisma/client.js';

class PrismaService extends PrismaClient {}
class DatabaseService extends PrismaService {}
class Prisma extends DatabaseService {}

const prisma = new Prisma({ adapter: new PrismaPg({ connectionString: 'fake' }) });

await prisma.user.findMany();
await prisma.post.findMany();
await prisma.comment.create({ data: { authorId: 1, postId: 1, body: 'x' } });
