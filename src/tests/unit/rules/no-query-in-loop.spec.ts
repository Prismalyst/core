import { describe, expect, it } from 'vitest';

import type { RuleWithoutFunction } from '../../../types/rule.eslint.types.js';

import { noQueryInLoop } from '../../../rules/list/no-query-in-loop.js';

import { createExpression } from '../../helpers/create-expression.js';

const rule: RuleWithoutFunction = {
  name: 'no-query-in-loop',
  astType: 'callExpression',
  methods: ['findMany'],
  requireSchema: false,
};

describe('noQueryInLoop', () => {
  it.each([true, false])(
    'returns isTriggered=%s based on the loop context',
    (isExpressionInsideLoop) => {
      const expression = createExpression('findMany', 'User', '');
      expression.expressionContext.isExpressionInsideLoop = isExpressionInsideLoop;

      const result = noQueryInLoop(expression, rule);

      expect(result.isTriggered).toBe(isExpressionInsideLoop);

      if (result.isTriggered) {
        expect(result.nodeToHighlight.getText()).toBe('prisma.user.findMany()');
      }
    },
  );

  it('ignores methods outside the rule even inside a loop', () => {
    const expression = createExpression('findFirst', 'User', '');
    expression.expressionContext.isExpressionInsideLoop = true;

    const result = noQueryInLoop(expression, rule);

    expect(result.isTriggered).toBe(false);
  });

  it.each([
    { method: 'count', expected: true },
    { method: 'findMany', expected: false },
  ])('returns isTriggered=$expected for the custom method $method', ({ method, expected }) => {
    const customRule = { ...rule, methods: ['count'] };
    const expression = createExpression(method, 'User', '');
    expression.expressionContext.isExpressionInsideLoop = true;

    const result = noQueryInLoop(expression, customRule);

    expect(result.isTriggered).toBe(expected);

    if (result.isTriggered) {
      expect(result.nodeToHighlight.getText()).toBe('prisma.user.count()');
    }
  });
});
