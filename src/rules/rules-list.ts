import { Rule } from '../types/rule.eslint.types.js';

import {
  PRISMA_METHODS,
  PRISMA_UNSAFE_SQL_METHODS,
} from '../constants/prisma-methods.constants.js';

import { noFloatingPrismaPromise } from './list/no-floating-prisma-promise.js';
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
        noUnsafeRawSQL: 'Unsafe raw SQL detected',
      },
      schema: [],
    },
    methods: [...PRISMA_UNSAFE_SQL_METHODS],
    function: noUnsafeRawSQL,
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
        noFloatingPrismaPromise: 'Floating Prisma promise detected',
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
        requireWhereDeleteMany: '"where" is required for deleteMany',
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
        requireWhereUpdateMany: '"where" is required for updateMany',
      },
      schema: [],
    },
    methods: ['updateMany'],
    function: requireWhereUpdateMany,
  },
];
