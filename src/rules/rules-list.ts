import { Rule } from '../types/rule.eslint.types.js';

import {
  PRISMA_METHODS,
  PRISMA_UNSAFE_SQL_METHODS,
} from '../constants/prisma-methods.constants.js';

import { noFloatingPrismaPromise } from './list/no-floating-prisma-promise.js';
import { noUnsafeRawSQL } from './list/no-unsafe-raw-sql.js';

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
];
