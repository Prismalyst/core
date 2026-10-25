import { describe, expect, it } from 'vitest';

import type { RuleWithoutFunction } from '../../../types/rule.eslint.types.js';

import { noDeepOffsetPagination } from '../../../rules/list/no-deep-offset-pagination.js';

import { createExpression } from '../../helpers/create-expression.js';

const rule: RuleWithoutFunction = {
  name: 'no-deep-offset-pagination',
  astType: 'callExpression',
  methods: ['findMany'],
  requireSchema: false,
};

describe('noDeepOffsetPagination', () => {
  it.each([
    { skip: -1001, min: -1000, max: 1000, expected: true },
    { skip: -1000, min: -1000, max: 1000, expected: false },
    { skip: -999, min: -1000, max: 1000, expected: false },
    { skip: 0, min: -1000, max: 1000, expected: false },
    { skip: 999, min: -1000, max: 1000, expected: false },
    { skip: 1000, min: -1000, max: 1000, expected: false },
    { skip: 1001, min: -1000, max: 1000, expected: true },
    { skip: 9, min: 10, max: 20, expected: true },
    { skip: 10, min: 10, max: 20, expected: false },
    { skip: 20, min: 10, max: 20, expected: false },
    { skip: 21, min: 10, max: 20, expected: true },
    { skip: 1001, min: -2000, max: 2000, expected: false },
  ])(
    'returns isTriggered=$expected for skip=$skip with min=$min and max=$max',
    ({ skip, min, max, expected }) => {
      const expression = createExpression('findMany', 'User', `{ skip: ${skip} }`);
      const result = noDeepOffsetPagination(expression, rule, { min, max });

      expect(result.isTriggered).toBe(expected);

      if (result.isTriggered) {
        expect(result.nodeToHighlight.getText()).toBe(String(skip));
      }
    },
  );

  it('ignores methods outside the rule even when skip exceeds the maximum', () => {
    const expression = createExpression('findFirst', 'User', '{ skip: 1001 }');
    const result = noDeepOffsetPagination(expression, rule, { min: -1000, max: 1000 });

    expect(result.isTriggered).toBe(false);
  });

  it('ignores methods outside the rule when arguments are missing', () => {
    const expression = createExpression('count', 'User', '');
    const result = noDeepOffsetPagination(expression, rule, { min: -1000, max: 1000 });

    expect(result.isTriggered).toBe(false);
  });

  it.each([
    { method: 'findFirst', expected: true },
    { method: 'findMany', expected: false },
  ])('returns isTriggered=$expected for the custom method $method', ({ method, expected }) => {
    const customRule = { ...rule, methods: ['findFirst'] };
    const expression = createExpression(method, 'User', '{ skip: 1001 }');
    const result = noDeepOffsetPagination(expression, customRule, { min: -1000, max: 1000 });

    expect(result.isTriggered).toBe(expected);

    if (result.isTriggered) {
      expect(result.nodeToHighlight.getText()).toBe('1001');
    }
  });

  it('allows a query without arguments', () => {
    const expression = createExpression('findMany', 'User', '');
    const result = noDeepOffsetPagination(expression, rule, { min: -1000, max: 1000 });

    expect(result.isTriggered).toBe(false);
  });

  it('allows an explicitly undefined query argument', () => {
    const expression = createExpression('findMany', 'User', 'undefined');
    const result = noDeepOffsetPagination(expression, rule, { min: -1000, max: 1000 });

    expect(result.isTriggered).toBe(false);
  });

  it.each([
    { name: 'an empty options object', argument: '{}' },
    { name: 'a filter without skip', argument: '{ where: { active: true } }' },
    { name: 'an explicitly undefined skip', argument: '{ skip: undefined }' },
  ])('allows a query with $name', ({ argument }) => {
    const expression = createExpression('findMany', 'User', argument);
    const result = noDeepOffsetPagination(expression, rule, { min: -1000, max: 1000 });

    expect(result.isTriggered).toBe(false);
  });

  it('ignores a non-number skip value', () => {
    const expression = createExpression('findMany', 'User', '{ skip: {} }');
    const result = noDeepOffsetPagination(expression, rule, { min: -1000, max: 1000 });

    expect(result.isTriggered).toBe(false);
  });
});
