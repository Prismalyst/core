import { describe, expect, it } from 'vitest';

import type { RuleWithoutFunction } from '../../../types/rule.eslint.types.js';

import { noQueryInLoop } from '../../../rules/list/no-query-in-loop.js';

const rule: RuleWithoutFunction = {
  name: 'no-query-in-loop',
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
describe('noQueryInLoop', () => {
  it.each([true, false])(
    'uses isExpressionInsideLoop=%s as the violation result',
    (isExpressionInsideLoop) => {
      expect(
        noQueryInLoop(
          {
            method: 'findMany',
            expressionContext: { ...expressionContext, isExpressionInsideLoop },
          },
          rule,
        ),
      ).toBe(isExpressionInsideLoop);
    },
  );

  it('ignores methods outside the rule even inside a loop', () => {
    expect(
      noQueryInLoop(
        {
          method: 'otherMethod',
          expressionContext: { ...expressionContext, isExpressionInsideLoop: true },
        },
        rule,
      ),
    ).toBe(false);
  });

  it('reports only methods in the custom rule configuration', () => {
    const customRule = { ...rule, methods: ['count'] };
    const context = { ...expressionContext, isExpressionInsideLoop: true };
    expect(noQueryInLoop({ method: 'count', expressionContext: context }, customRule)).toBe(true);
    expect(noQueryInLoop({ method: 'findMany', expressionContext: context }, customRule)).toBe(
      false,
    );
  });
});
