import { PrismaPg } from '@prisma/adapter-pg';

import { PrismaClient } from './db.js';

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: 'fake' }) });

await prisma.user.findMany();
await prisma.post.findMany();
await prisma.comment.create({ data: { authorId: 1, postId: 1, body: 'x' } });
