import { PrismaPg } from '@prisma/adapter-pg';

import { PrismaClient } from '../../../schemas/v7/generated/prisma/client.js';

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: 'fake' }) });

await prisma.user.findMany();
await prisma.user.findFirst();
await prisma.user.deleteMany();
// @ts-expect-error Property 'notRealMethod' does not exist
await prisma.user.notRealMethod();
