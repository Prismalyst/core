import { describe, expect, it } from 'vitest';

import type { RuleWithoutFunction } from '../../../types/rule.eslint.types.js';

import { noUnsafeRawSQL } from '../../../rules/list/no-unsafe-raw-sql.js';

import { createExpression } from '../../helpers/create-expression.js';

const rule: RuleWithoutFunction = {
  name: 'no-unsafe-raw-sql',
  astType: 'callExpression',
  methods: ['$queryRawUnsafe', '$executeRawUnsafe'],
  requireSchema: false,
};

describe('noUnsafeRawSQL', () => {
  it.each(['$queryRawUnsafe', '$executeRawUnsafe'])(
    'reports calls to the configured unsafe SQL method %s',
    (method) => {
      const expression = createExpression(method, null, "'SELECT 1'");
      const result = noUnsafeRawSQL(expression, rule);

      expect(result.isTriggered).toBe(true);

      if (result.isTriggered) {
        expect(result.nodeToHighlight.getText()).toBe(`prisma.${method}('SELECT 1')`);
      }
    },
  );

  it.each([
    { method: '$queryRaw', model: null, argument: 'Prisma.sql`SELECT 1`' },
    { method: '$executeRaw', model: null, argument: 'Prisma.sql`SELECT 1`' },
    { method: 'findMany', model: 'User', argument: '{}' },
    { method: 'raw', model: null, argument: "'SELECT 1'" },
  ])('ignores calls to the unconfigured method $method', ({ method, model, argument }) => {
    const expression = createExpression(method, model, argument);
    const result = noUnsafeRawSQL(expression, rule);

    expect(result.isTriggered).toBe(false);
  });

  it.each([
    { method: '$queryRaw', argument: 'Prisma.sql`SELECT 1`', expected: true },
    { method: '$queryRawUnsafe', argument: "'SELECT 1'", expected: false },
  ])(
    'returns isTriggered=$expected for the custom method $method',
    ({ method, argument, expected }) => {
      const customRule = { ...rule, methods: ['$queryRaw'] };
      const expression = createExpression(method, null, argument);
      const result = noUnsafeRawSQL(expression, customRule);

      expect(result.isTriggered).toBe(expected);

      if (result.isTriggered) {
        expect(result.nodeToHighlight.getText()).toBe('prisma.$queryRaw(Prisma.sql`SELECT 1`)');
      }
    },
  );
});
