import { describe, expect, it } from 'vitest';

import type { RuleWithoutFunction } from '../../../types/rule.eslint.types.js';

import { maxTake } from '../../../rules/list/max-take.js';

import { createExpression } from '../../helpers/create-expression.js';

const rule: RuleWithoutFunction = {
  name: 'max-take',
  astType: 'callExpression',
  methods: ['findMany'],
  requireSchema: false,
};

describe('maxTake', () => {
  it.each([
    { take: 0, max: 100, expected: false },
    { take: 99, max: 100, expected: false },
    { take: 100, max: 100, expected: false },
    { take: 101, max: 100, expected: true },
    { take: 10, max: 10, expected: false },
    { take: 11, max: 10, expected: true },
    { take: 101, max: 200, expected: false },
  ])('returns isTriggered=$expected for take=$take with max=$max', ({ take, max, expected }) => {
    const expression = createExpression('findMany', 'User', `{ take: ${take} }`);
    const result = maxTake(expression, rule, { max });

    expect(result.isTriggered).toBe(expected);

    if (result.isTriggered) {
      expect(result.nodeToHighlight.getText()).toBe(String(take));
    }
  });

  it('ignores methods outside the rule even when take exceeds the maximum', () => {
    const expression = createExpression('findFirst', 'User', '{ take: 101 }');
    const result = maxTake(expression, rule, { max: 100 });

    expect(result.isTriggered).toBe(false);
  });

  it('ignores methods outside the rule when arguments are missing', () => {
    const expression = createExpression('count', 'User', '');
    const result = maxTake(expression, rule, { max: 100 });

    expect(result.isTriggered).toBe(false);
  });

  it.each([
    { method: 'findFirst', expected: true },
    { method: 'findMany', expected: false },
  ])('returns isTriggered=$expected for the custom method $method', ({ method, expected }) => {
    const customRule = { ...rule, methods: ['findFirst'] };
    const expression = createExpression(method, 'User', '{ take: 101 }');
    const result = maxTake(expression, customRule, { max: 100 });

    expect(result.isTriggered).toBe(expected);

    if (result.isTriggered) {
      expect(result.nodeToHighlight.getText()).toBe('101');
    }
  });

  it('reports a query without arguments', () => {
    const expression = createExpression('findMany', 'User', '');
    const result = maxTake(expression, rule, { max: 100 });

    expect(result.isTriggered).toBe(true);

    if (result.isTriggered) {
      expect(result.nodeToHighlight.getText()).toBe('prisma.user.findMany()');
    }
  });

  it('reports an explicitly undefined query argument', () => {
    const expression = createExpression('findMany', 'User', 'undefined');
    const result = maxTake(expression, rule, { max: 100 });

    expect(result.isTriggered).toBe(true);

    if (result.isTriggered) {
      expect(result.nodeToHighlight.getText()).toBe('undefined');
    }
  });

  it.each([
    { name: 'an empty options object', argument: '{}', highlightedText: '{}' },
    {
      name: 'a filter without take',
      argument: '{ where: { active: true } }',
      highlightedText: '{ where: { active: true } }',
    },
    {
      name: 'an explicitly undefined take',
      argument: '{ take: undefined }',
      highlightedText: 'undefined',
    },
  ])('reports an unbounded query with $name', ({ argument, highlightedText }) => {
    const expression = createExpression('findMany', 'User', argument);
    const result = maxTake(expression, rule, { max: 100 });

    expect(result.isTriggered).toBe(true);

    if (result.isTriggered) {
      expect(result.nodeToHighlight.getText()).toBe(highlightedText);
    }
  });

  it('ignores a non-number take value', () => {
    const expression = createExpression('findMany', 'User', '{ take: {} }');
    const result = maxTake(expression, rule, { max: 100 });

    expect(result.isTriggered).toBe(false);
  });
});
