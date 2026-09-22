export const PRISMA_CREATE_METHODS = new Set(['createManyAndReturn', 'createMany', 'create']);

export const PRISMA_READ_METHODS = new Set([
  'findUniqueOrThrow',
  'findUnique',
  'findFirstOrThrow',
  'findFirst',
  'findMany',
]);

export const PRISMA_UPDATE_METHODS = new Set([
  'updateManyAndReturn',
  'updateMany',
  'update',
  'upsert',
]);

export const PRISMA_DELETE_METHODS = new Set(['deleteMany', 'delete']);

export const PRISMA_CRUD_METHODS = new Set([
  ...PRISMA_CREATE_METHODS,
  ...PRISMA_READ_METHODS,
  ...PRISMA_UPDATE_METHODS,
  ...PRISMA_DELETE_METHODS,
]);

export const PRISMA_AGGREGATE_METHODS = new Set(['count', 'aggregate', 'groupBy']);

export const PRISMA_UNSAFE_SQL_METHODS = new Set(['$queryRawUnsafe', '$executeRawUnsafe']);

export const PRISMA_SAFE_SQL_METHODS = new Set(['$queryRaw', '$executeRaw']);

export const PRISMA_SQL_METHODS = new Set([
  ...PRISMA_UNSAFE_SQL_METHODS,
  ...PRISMA_SAFE_SQL_METHODS,
]);

export const PRISMA_TRANSACTION_METHODS = new Set(['$transaction']);

export const PRISMA_SQL_HELPERS = new Set(['raw', 'sql', 'join', 'empty']);

export const PRISMA_DB_METHODS = new Set(['$db', '$disconnect', '$connect']);

export const PRISMA_METHODS = new Set([
  ...PRISMA_CREATE_METHODS,
  ...PRISMA_READ_METHODS,
  ...PRISMA_UPDATE_METHODS,
  ...PRISMA_DELETE_METHODS,
  ...PRISMA_AGGREGATE_METHODS,
  ...PRISMA_SQL_METHODS,
  ...PRISMA_TRANSACTION_METHODS,
  ...PRISMA_SQL_HELPERS,
  ...PRISMA_DB_METHODS,
]);
