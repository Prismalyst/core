import { PrismaPg } from '@prisma/adapter-pg';

// TODO: add legacy "import { PrismaClient } from '@prisma/client'" someday
import {
  PrismaClient,
  PrismaClient as PrismaGenerated,
} from '../../../schemas/v7/generated/prisma/client.js';

const prismaGenerated = new PrismaGenerated({
  adapter: new PrismaPg({ connectionString: 'fake' }),
});
const prismaClient = new PrismaClient({
  adapter: new PrismaPg({ connectionString: 'fake' }),
});

await prismaGenerated.user.findMany();
await prismaClient.user.findMany();
