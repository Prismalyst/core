import { PrismaPg } from '@prisma/adapter-pg';

import { PrismaClient } from '../../../schemas/v7/generated/prisma/client.js';

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: 'fake' }) });

const db = prisma;
const db1 = prisma;
const db2 = db1;
const db3 = db2;

db.user.findMany();
db1.user.findMany();
db2.user.findMany();
db3.user.findMany();
