import { describe, expect, it } from 'vitest';

import type { RuleWithoutFunction } from '../../../types/rule.eslint.types.js';

import { noUnsafePrismaRaw } from '../../../rules/list/no-unsafe-prisma-raw.js';

import { createExpression } from '../../helpers/create-expression.js';

const rule: RuleWithoutFunction = {
  name: 'no-unsafe-prisma-raw',
  astType: 'callExpression',
  methods: ['raw', 'sql', 'join', 'empty'],
  requireSchema: false,
};

describe('noUnsafePrismaRaw', () => {
  it.each(["'SELECT 1'", "''", '`SELECT 1`'])(
    'allows the static string %s in Prisma.raw',
    (argument) => {
      const expression = createExpression('raw', null, argument);
      const result = noUnsafePrismaRaw(expression, rule);

      expect(result.isTriggered).toBe(false);
    },
  );

  it('reports interpolated SQL in Prisma.raw', () => {
    const query = '`SELECT * FROM users WHERE id = ${id}`';

    const expression = createExpression('raw', null, query);
    const result = noUnsafePrismaRaw(expression, rule);

    expect(result.isTriggered).toBe(true);

    if (result.isTriggered) {
      expect(result.nodeToHighlight.getText()).toBe(query);
    }
  });

  it.each([
    { name: 'an unresolved value', argument: 'query' },
    { name: 'a non-string object', argument: '{}' },
  ])('reports $name in Prisma.raw', ({ argument }) => {
    const expression = createExpression('raw', null, argument);
    const result = noUnsafePrismaRaw(expression, rule);

    expect(result.isTriggered).toBe(true);

    if (result.isTriggered) {
      expect(result.nodeToHighlight.getText()).toBe(argument);
    }
  });

  it.each([
    { name: 'no arguments', argument: '' },
    { name: 'an undefined argument', argument: 'undefined' },
  ])('ignores Prisma.raw calls with $name', ({ argument }) => {
    const expression = createExpression('raw', null, argument);
    const result = noUnsafePrismaRaw(expression, rule);

    expect(result.isTriggered).toBe(false);
  });

  it('ignores methods outside the rule', () => {
    const expression = createExpression('findMany', 'User', '{}');
    const result = noUnsafePrismaRaw(expression, rule);

    expect(result.isTriggered).toBe(false);
  });
});
