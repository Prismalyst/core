import { describe, expect, it } from 'vitest';

import type { RuleWithoutFunction } from '../../../types/rule.eslint.types.js';

import { noFloatingPrismaPromise } from '../../../rules/list/no-floating-prisma-promise.js';

import { createExpression } from '../../helpers/create-expression.js';

const rule: RuleWithoutFunction = {
  name: 'no-floating-prisma-promise',
  astType: 'callExpression',
  methods: ['findMany'],
  requireSchema: false,
};

describe('noFloatingPrismaPromise', () => {
  it.each([
    { floating: true, awaited: false, expected: true },
    { floating: true, awaited: true, expected: false },
    { floating: false, awaited: false, expected: false },
    { floating: false, awaited: true, expected: false },
  ])(
    'returns isTriggered=$expected for floating=$floating and awaited=$awaited',
    ({ floating, awaited, expected }) => {
      const expression = createExpression('findMany', 'User', '');
      expression.prismaContext.isFloatingPrismaPromise = floating;
      expression.expressionContext.isExpressionInsideAwaitExpression = awaited;

      const result = noFloatingPrismaPromise(expression, rule);

      expect(result.isTriggered).toBe(expected);

      if (result.isTriggered) {
        expect(result.nodeToHighlight.getText()).toBe('prisma.user.findMany()');
      }
    },
  );

  it('ignores floating calls outside the configured methods', () => {
    const expression = createExpression('findFirst', 'User', '');
    expression.prismaContext.isFloatingPrismaPromise = true;

    const result = noFloatingPrismaPromise(expression, rule);

    expect(result.isTriggered).toBe(false);
  });

  it.each([
    { method: 'count', expected: true },
    { method: 'findMany', expected: false },
  ])('returns isTriggered=$expected for the custom method $method', ({ method, expected }) => {
    const customRule = { ...rule, methods: ['count'] };
    const expression = createExpression(method, 'User', '');
    expression.prismaContext.isFloatingPrismaPromise = true;

    const result = noFloatingPrismaPromise(expression, customRule);

    expect(result.isTriggered).toBe(expected);

    if (result.isTriggered) {
      expect(result.nodeToHighlight.getText()).toBe('prisma.user.count()');
    }
  });
});
