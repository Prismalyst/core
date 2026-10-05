import { describe, expect, it } from 'vitest';

import type { RuleWithoutFunction } from '../../types/rule.eslint.types.js';

import { noFloatingPrismaPromise } from '../../rules/list/no-floating-prisma-promise.js';

const rule: RuleWithoutFunction = {
  name: 'no-floating-prisma-promise',
  astType: 'callExpression',
  methods: ['findMany'],
};

const expressionContext = {
  isExpressionInsideLoop: false,
  isExpressionInsideFunction: false,
  isExpressionInsideClassMethod: false,
  isExpressionInsideAwaitExpression: false,
  parentFunctionName: null,
  parentMethodName: null,
};
const prismaContext = {
  isFloatingPrismaPromise: false,
  isExpressionInsideTransaction: false,
  transactionType: null,
  clientType: 'prisma',
} as const;
describe('noFloatingPrismaPromise', () => {
  it.each([
    { floating: true, awaited: false, expected: true },
    { floating: true, awaited: true, expected: false },
    { floating: false, awaited: false, expected: false },
    { floating: false, awaited: true, expected: false },
  ])(
    'returns violation=$expected for floating=$floating and awaited=$awaited',
    ({ floating, awaited, expected }) => {
      expect(
        noFloatingPrismaPromise(
          {
            method: 'findMany',
            prismaContext: { ...prismaContext, isFloatingPrismaPromise: floating },
            expressionContext: { ...expressionContext, isExpressionInsideAwaitExpression: awaited },
          },
          rule,
        ),
      ).toBe(expected);
    },
  );

  it('ignores floating calls outside the configured methods', () => {
    expect(
      noFloatingPrismaPromise(
        {
          method: 'otherMethod',
          prismaContext: { ...prismaContext, isFloatingPrismaPromise: true },
          expressionContext,
        },
        rule,
      ),
    ).toBe(false);
  });

  it('reports only methods in the custom rule configuration', () => {
    const customRule = { ...rule, methods: ['count'] };
    const context = { ...prismaContext, isFloatingPrismaPromise: true };
    expect(
      noFloatingPrismaPromise(
        { method: 'count', prismaContext: context, expressionContext },
        customRule,
      ),
    ).toBe(true);
    expect(
      noFloatingPrismaPromise(
        { method: 'findMany', prismaContext: context, expressionContext },
        customRule,
      ),
    ).toBe(false);
  });
});
