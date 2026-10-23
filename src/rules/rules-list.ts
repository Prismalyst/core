import { RegisteredRule } from './types/rules-options.types.js';

import {
  PRISMA_CRUD_METHODS,
  PRISMA_METHODS,
  PRISMA_READ_METHODS,
  PRISMA_SQL_HELPERS,
  PRISMA_UNSAFE_SQL_METHODS,
} from '../constants/prisma-methods.constants.js';

import { maxTake } from './list/max-take.js';
import { noDeepOffsetPagination } from './list/no-deep-offset-pagination.js';
import { noDisconnectInRequestFlow } from './list/no-disconnect-in-request-flow.js';
import { noDynamicRawQuery } from './list/no-dynamic-raw-query.js';
import { noFloatingPrismaPromise } from './list/no-floating-prisma-promise.js';
import { noPrismaClientInFunction } from './list/no-prisma-client-in-function.js';
import { noQueryInLoop } from './list/no-query-in-loop.js';
import { noRootClientInTransaction } from './list/no-root-client-in-transaction.js';
import { noUnindexedFilter } from './list/no-unindexed-filter.js';
import { noUnsafePrismaRaw } from './list/no-unsafe-prisma-raw.js';
import { noUnsafeRawSQL } from './list/no-unsafe-raw-sql.js';
import { requireWhereDeleteMany } from './list/require-where-delete-many.js';
import { requireWhereUpdateMany } from './list/require-where-update-many.js';
import { unstablePagination } from './list/unstable-pagination.js';

// TODO: migrate current rules to the new return type
export const RULES_LIST: RegisteredRule[] = [
  {
    name: 'no-unsafe-raw-sql',
    astType: 'callExpression',
    methods: [...PRISMA_UNSAFE_SQL_METHODS],
    requireSchema: false,
    function: noUnsafeRawSQL,
  },
  {
    name: 'no-dynamic-raw-query',
    astType: 'callExpression',
    methods: [...PRISMA_UNSAFE_SQL_METHODS],
    requireSchema: false,
    function: noDynamicRawQuery,
  },
  {
    name: 'no-unsafe-prisma-raw',
    astType: 'callExpression',
    methods: ['raw'],
    requireSchema: false,
    function: noUnsafePrismaRaw,
  },
  {
    name: 'no-floating-prisma-promise',
    astType: 'callExpression',
    methods: [...PRISMA_METHODS],
    requireSchema: false,
    function: noFloatingPrismaPromise,
  },
  {
    name: 'require-where-delete-many',
    astType: 'callExpression',
    methods: ['deleteMany'],
    requireSchema: false,
    function: requireWhereDeleteMany,
  },
  {
    name: 'require-where-update-many',
    astType: 'callExpression',
    methods: ['updateMany'],
    requireSchema: false,
    function: requireWhereUpdateMany,
  },
  {
    name: 'no-query-in-loop',
    astType: 'callExpression',
    methods: [...PRISMA_METHODS],
    requireSchema: false,
    function: noQueryInLoop,
  },
  {
    name: 'max-take',
    astType: 'callExpression',
    methods: ['findMany'],
    requireSchema: false,
    function: maxTake,
  },
  {
    name: 'no-deep-offset-pagination',
    astType: 'callExpression',
    methods: ['findMany'],
    requireSchema: false,
    function: noDeepOffsetPagination,
  },
  {
    name: 'no-prisma-client-in-function',
    astType: 'newExpression',
    methods: [],
    requireSchema: false,
    function: noPrismaClientInFunction,
  },
  {
    name: 'no-disconnect-in-request-flow',
    astType: 'callExpression',
    methods: ['$disconnect'],
    requireSchema: false,
    function: noDisconnectInRequestFlow,
  },
  {
    name: 'no-root-client-in-transaction',
    astType: 'callExpression',
    methods: [...PRISMA_METHODS].filter((method) => !PRISMA_SQL_HELPERS.has(method)),
    requireSchema: false,
    function: noRootClientInTransaction,
  },
  {
    name: 'no-unindexed-filter',
    astType: 'callExpression',
    methods: [...PRISMA_CRUD_METHODS],
    requireSchema: true,
    function: noUnindexedFilter,
  },
  {
    name: 'unstable-pagination',
    astType: 'callExpression',
    methods: [...PRISMA_READ_METHODS],
    requireSchema: true,
    function: unstablePagination,
  },
];
