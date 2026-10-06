import { describe, expect, it } from 'vitest';

import type { RuleWithoutFunction } from '../../../types/rule.eslint.types.js';

import { noRootClientInTransaction } from '../../../rules/list/no-root-client-in-transaction.js';

const rule: RuleWithoutFunction = {
  name: 'no-root-client-in-transaction',
  astType: 'callExpression',
  methods: ['findMany'],
};

const prismaContext = {
  isFloatingPrismaPromise: false,
  isExpressionInsideTransaction: false,
  transactionType: null,
  clientType: 'prisma',
} as const;
describe('noRootClientInTransaction', () => {
  it.each([
    { inside: true, transactionType: 'interactive', clientType: 'prisma', expected: true },
    { inside: true, transactionType: 'interactive', clientType: 'transaction', expected: false },
    { inside: true, transactionType: 'interactive', clientType: 'unknown', expected: false },
    { inside: false, transactionType: null, clientType: 'prisma', expected: false },
    { inside: true, transactionType: 'sequential', clientType: 'prisma', expected: false },
    { inside: true, transactionType: null, clientType: 'prisma', expected: false },
  ] as const)(
    'returns violation=$expected for inside=$inside, type=$transactionType, client=$clientType',
    ({ inside, transactionType, clientType, expected }) => {
      expect(
        noRootClientInTransaction(
          {
            method: 'findMany',
            prismaContext: {
              ...prismaContext,
              isExpressionInsideTransaction: inside,
              transactionType,
              clientType,
            },
          },
          rule,
        ),
      ).toBe(expected);
    },
  );

  it('ignores methods outside the rule inside an interactive transaction', () => {
    expect(
      noRootClientInTransaction(
        {
          method: 'raw',
          prismaContext: {
            ...prismaContext,
            isExpressionInsideTransaction: true,
            transactionType: 'interactive',
          },
        },
        rule,
      ),
    ).toBe(false);
  });

  it('reports only methods in the custom rule configuration', () => {
    const customRule = { ...rule, methods: ['count'] };
    const context = {
      ...prismaContext,
      isExpressionInsideTransaction: true,
      transactionType: 'interactive' as const,
    };
    expect(noRootClientInTransaction({ method: 'count', prismaContext: context }, customRule)).toBe(
      true,
    );
    expect(
      noRootClientInTransaction({ method: 'findMany', prismaContext: context }, customRule),
    ).toBe(false);
  });
});
