import { PrismaPg } from '@prisma/adapter-pg';

import { PrismaClient } from '../../../schemas/v7/generated/prisma/client.js';

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: 'fake' }) });

const model = 'user';
const method = 'findMany';

await prisma.user['findMany']();
await prisma['user']['findMany']();
await prisma['user'].findMany();
await prisma[model][method]();
