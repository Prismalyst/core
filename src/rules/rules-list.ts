import { Rule } from '../types/rule.eslint.types.js';

import { noUnsafeRawSQL } from './list/no-unsafe-raw-sql.js';

export const RULES_LIST: Rule[] = [
  {
    name: 'no-unsafe-raw-sql',
    messageId: 'noUnsafeRawSQL',
    meta: {
      type: 'suggestion',
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
    methods: ['$queryRawUnsafe', '$executeRawUnsafe'],
    function: noUnsafeRawSQL,
  },
];
