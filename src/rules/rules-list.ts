import { Rule } from '../types/rule.eslint.types.js';

import {
  PRISMA_METHODS,
  PRISMA_SQL_HELPERS,
  PRISMA_UNSAFE_SQL_METHODS,
} from '../constants/prisma-methods.constants.js';

import { maxTake } from './list/max-take.js';
import { noDeepOffsetPagination } from './list/no-deep-offset-pagination.js';
import { noDynamicRawQuery } from './list/no-dynamic-raw-query.js';
import { noFloatingPrismaPromise } from './list/no-floating-prisma-promise.js';
import { noQueryInLoop } from './list/no-query-in-loop.js';
import { noUnsafePrismaRaw } from './list/no-unsafe-prisma-raw.js';
import { noUnsafeRawSQL } from './list/no-unsafe-raw-sql.js';
import { requireWhereDeleteMany } from './list/require-where-delete-many.js';
import { requireWhereUpdateMany } from './list/require-where-update-many.js';

export const RULES_LIST: Rule[] = [
  {
    name: 'no-unsafe-raw-sql',
    methods: [...PRISMA_UNSAFE_SQL_METHODS],
    function: noUnsafeRawSQL,
  },
  {
    name: 'no-dynamic-raw-query',
    methods: [...PRISMA_UNSAFE_SQL_METHODS],
    function: noDynamicRawQuery,
  },
  {
    name: 'no-unsafe-prisma-raw',
    methods: [...PRISMA_SQL_HELPERS],
    function: noUnsafePrismaRaw,
  },
  {
    name: 'no-floating-prisma-promise',
    methods: [...PRISMA_METHODS],
    function: noFloatingPrismaPromise,
  },
  {
    name: 'require-where-delete-many',

    methods: ['deleteMany'],
    function: requireWhereDeleteMany,
  },
  {
    name: 'require-where-update-many',
    methods: ['updateMany'],
    function: requireWhereUpdateMany,
  },
  {
    name: 'no-query-in-loop',
    methods: [...PRISMA_METHODS],
    function: noQueryInLoop,
  },
  {
    name: 'max-take',
    methods: ['findMany'],
    function: maxTake,
  },
  {
    name: 'no-deep-offset-pagination',
    methods: ['findMany'],
    function: noDeepOffsetPagination,
  },
];
