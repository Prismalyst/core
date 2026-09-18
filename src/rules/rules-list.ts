import { Rule } from '../types/rule.eslint.types.js';

import {
  PRISMA_METHODS,
  PRISMA_SQL_HELPERS,
  PRISMA_UNSAFE_SQL_METHODS,
} from '../constants/prisma-methods.constants.js';

import { maxTake } from './list/max-take.js';
import { noDynamicRawQuery } from './list/no-dynamic-raw-query.js';
import { noFloatingPrismaPromise } from './list/no-floating-prisma-promise.js';
import { noQueryInLoop } from './list/no-query-in-loop.js';
import { noUnsafePrismaRaw } from './list/no-unsafe-prisma-raw.js';
import { noUnsafeRawSQL } from './list/no-unsafe-raw-sql.js';
import { requireWhereDeleteMany } from './list/require-where-delete-many.js';
import { requireWhereUpdateMany } from './list/require-where-update-many.js';
import { noDeepOffsetPagination } from './list/no-deep-offset-pagination.js';

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
    name: 'no-unsafe-prisma-raw',
    messageId: 'noUnsafePrismaRaw',
    meta: {
      type: 'problem',
      docs: {
        description: 'Disallow unsafe Prisma.raw()',
        recommended: true,
        requiresTypeChecking: true,
      },
      messages: {
        noUnsafePrismaRaw: 'Dynamic value passed to Prisma.raw() can enable SQL injection',
      },
      schema: [],
    },
    methods: [...PRISMA_SQL_HELPERS],
    function: noUnsafePrismaRaw,
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
  {
    name: 'max-take',
    messageId: 'maxTake',
    meta: {
      type: 'suggestion',
      docs: {
        description: 'Enforce maximum "take" value',
        recommended: true,
        requiresTypeChecking: true,
      },
      messages: {
        // TODO: make this configurable
        maxTake: '"take" exceeds the configured maximum of {{max}} or is missing',
      },
      schema: [],
    },
    methods: ['findMany'],
    function: maxTake,
  },
  {
    name: 'no-deep-offset-pagination',
    messageId: 'noDeepOffsetPagination',
    meta: {
      type: 'suggestion',
      docs: {
        description: 'Disallow deep offset pagination',
        recommended: true,
        requiresTypeChecking: true,
      },
      messages: {
        // TODO: make this configurable
        noDeepOffsetPagination: 'Large offset pagination is expensive, consider cursor pagination',
      },
      schema: [],
    },
    methods: ['findMany'],
    function: noDeepOffsetPagination,
  },
];
