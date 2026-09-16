import { Rule } from '../types/rule.eslint.types.js';

import {
  PRISMA_METHODS,
  PRISMA_UNSAFE_SQL_METHODS,
} from '../constants/prisma-methods.constants.js';

import { noDynamicRawQuery } from './list/no-dynamic-raw-query.js';
import { noFloatingPrismaPromise } from './list/no-floating-prisma-promise.js';
import { noQueryInLoop } from './list/no-query-in-loop.js';
import { noUnsafeRawSQL } from './list/no-unsafe-raw-sql.js';
import { requireWhereDeleteMany } from './list/require-where-delete-many.js';
import { requireWhereUpdateMany } from './list/require-where-update-many.js';

export const RULES_LIST: Rule[] = [
  {
    name: 'no-unsafe-raw-sql',
    messageId: 'noUnsafeRawSQL',
    meta: {
      type: 'problem',
      docs: {
        description: 'Disallow unsafe raw SQL',
        recommended: true,
        requiresTypeChecking: true,
      },
      messages: {
        noUnsafeRawSQL:
          'Unsafe raw-query API requires explicit review, prefer TypedSQL or tagged templates',
      },
      schema: [],
    },
    methods: [...PRISMA_UNSAFE_SQL_METHODS],
    function: noUnsafeRawSQL,
  },
  {
    name: 'no-dynamic-raw-query',
    messageId: 'noDynamicRawQuery',
    meta: {
      type: 'problem',
      docs: {
        description: 'Disallow dynamic raw query',
        recommended: true,
        requiresTypeChecking: true,
      },
      messages: {
        noDynamicRawQuery: 'Dynamic value is interpolated into unsafe raw SQL',
      },
      schema: [],
    },
    methods: [...PRISMA_UNSAFE_SQL_METHODS],
    function: noDynamicRawQuery,
  },
  {
    name: 'no-floating-prisma-promise',
    messageId: 'noFloatingPrismaPromise',
    meta: {
      type: 'problem',
      docs: {
        description: 'Disallow floating Prisma promises',
        recommended: true,
        requiresTypeChecking: true,
      },
      messages: {
        noFloatingPrismaPromise:
          'Prisma query promise must be awaited, returned, or otherwise handled',
      },
      schema: [],
    },
    methods: [...PRISMA_METHODS],
    function: noFloatingPrismaPromise,
  },
  {
    name: 'require-where-delete-many',
    messageId: 'requireWhereDeleteMany',
    meta: {
      type: 'problem',
      docs: {
        description: 'Require "where" for deleteMany',
        recommended: true,
        requiresTypeChecking: true,
      },
      messages: {
        requireWhereDeleteMany: 'deleteMany() without "where" deletes every record',
      },
      schema: [],
    },
    methods: ['deleteMany'],
    function: requireWhereDeleteMany,
  },
  {
    name: 'require-where-update-many',
    messageId: 'requireWhereUpdateMany',
    meta: {
      type: 'problem',
      docs: {
        description: 'Require "where" for updateMany',
        recommended: true,
        requiresTypeChecking: true,
      },
      messages: {
        requireWhereUpdateMany: 'updateMany() without "where" updates every record',
      },
      schema: [],
    },
    methods: ['updateMany'],
    function: requireWhereUpdateMany,
  },
  {
    name: 'no-query-in-loop',
    messageId: 'noQueryInLoop',
    meta: {
      type: 'problem',
      docs: {
        description: 'Disallow Prisma queries inside a loop',
        recommended: true,
        requiresTypeChecking: true,
      },
      messages: {
        noQueryInLoop: 'Prisma query inside a loop may cause an N+1 query pattern',
      },
      schema: [],
    },
    methods: [...PRISMA_METHODS],
    function: noQueryInLoop,
  },
];
