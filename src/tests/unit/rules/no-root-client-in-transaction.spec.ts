import { describe, expect, it } from 'vitest';

import type { RuleWithoutFunction } from '../../../types/rule.eslint.types.js';

import { noRootClientInTransaction } from '../../../rules/list/no-root-client-in-transaction.js';

import { createExpression } from '../../helpers/create-expression.js';

const rule: RuleWithoutFunction = {
  name: 'no-root-client-in-transaction',
  astType: 'callExpression',
  methods: ['findMany'],
  requireSchema: false,
};

describe('noRootClientInTransaction', () => {
  it.each([
    { inside: true, transactionType: 'interactive', clientType: 'prisma', expected: true },
    { inside: true, transactionType: 'interactive', clientType: 'transaction', expected: false },
    { inside: true, transactionType: 'interactive', clientType: 'unknown', expected: false },
    { inside: false, transactionType: null, clientType: 'prisma', expected: false },
    { inside: true, transactionType: 'sequential', clientType: 'prisma', expected: false },
    { inside: true, transactionType: null, clientType: 'prisma', expected: false },
  ] as const)(
    'returns isTriggered=$expected for inside=$inside, type=$transactionType, client=$clientType',
    ({ inside, transactionType, clientType, expected }) => {
      const expression = createExpression('findMany', 'User', '');
      expression.prismaContext.isExpressionInsideTransaction = inside;
      expression.prismaContext.transactionType = transactionType;
      expression.prismaContext.clientType = clientType;

      const result = noRootClientInTransaction(expression, rule);

      expect(result.isTriggered).toBe(expected);

      if (result.isTriggered) {
        expect(result.nodeToHighlight.getText()).toBe('prisma.user.findMany()');
      }
    },
  );

  it('ignores methods outside the rule inside an interactive transaction', () => {
    const expression = createExpression('findFirst', 'User', '');
    expression.prismaContext.isExpressionInsideTransaction = true;
    expression.prismaContext.transactionType = 'interactive';

    const result = noRootClientInTransaction(expression, rule);

    expect(result.isTriggered).toBe(false);
  });

  it.each([
    { method: 'count', expected: true },
    { method: 'findMany', expected: false },
  ])('returns isTriggered=$expected for the custom method $method', ({ method, expected }) => {
    const customRule = { ...rule, methods: ['count'] };
    const expression = createExpression(method, 'User', '');
    expression.prismaContext.isExpressionInsideTransaction = true;
    expression.prismaContext.transactionType = 'interactive';

    const result = noRootClientInTransaction(expression, customRule);

    expect(result.isTriggered).toBe(expected);

    if (result.isTriggered) {
      expect(result.nodeToHighlight.getText()).toBe('prisma.user.count()');
    }
  });
});
