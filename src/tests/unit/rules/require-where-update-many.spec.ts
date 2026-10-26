import { describe, expect, it } from 'vitest';

import type { RuleWithoutFunction } from '../../../types/rule.eslint.types.js';

import { requireWhereUpdateMany } from '../../../rules/list/require-where-update-many.js';

import { createExpression } from '../../helpers/create-expression.js';

const rule: RuleWithoutFunction = {
  name: 'require-where-update-many',
  astType: 'callExpression',
  methods: ['updateMany'],
  requireSchema: false,
};

describe('requireWhereUpdateMany', () => {
  it.each([
    { name: 'an empty options object', argument: '{}', highlight: '{}' },
    {
      name: 'data without where',
      argument: '{ data: { active: true } }',
      highlight: '{ data: { active: true } }',
    },
    {
      name: 'an undefined where',
      argument: '{ data: { active: true }, where: undefined }',
      highlight: 'undefined',
    },
    {
      name: 'an empty where',
      argument: '{ data: { active: true }, where: {} }',
      highlight: '{}',
    },
  ])('reports updateMany with $name', ({ argument, highlight }) => {
    const expression = createExpression('updateMany', 'User', argument);
    const result = requireWhereUpdateMany(expression, rule);

    expect(result.isTriggered).toBe(true);

    if (result.isTriggered) {
      expect(result.nodeToHighlight.getText()).toBe(highlight);
    }
  });

  it.each([
    { name: 'no arguments', argument: '' },
    { name: 'an undefined argument', argument: 'undefined' },
    { name: 'a null argument', argument: 'null' },
    { name: 'a non-object argument', argument: '42' },
    { name: 'an id filter', argument: '{ data: { active: true }, where: { id: 1 } }' },
    {
      name: 'a nested filter',
      argument: '{ data: { active: true }, where: { id: { in: [1, 2] } } }',
    },
    // Invalid where values are already rejected by Prisma's types.
    { name: 'a null where', argument: '{ data: { active: true }, where: null }' },
    { name: 'a non-object where', argument: '{ data: { active: true }, where: 42 }' },
  ])('does not warn for updateMany with $name', ({ argument }) => {
    const expression = createExpression('updateMany', 'User', argument);
    const result = requireWhereUpdateMany(expression, rule);

    expect(result.isTriggered).toBe(false);
  });

  it('ignores methods outside the rule even without where', () => {
    const expression = createExpression('findMany', 'User', '{}');
    const result = requireWhereUpdateMany(expression, rule);

    expect(result.isTriggered).toBe(false);
  });

  it.each([
    { method: 'customMethod', expected: true },
    { method: 'updateMany', expected: false },
  ])('returns isTriggered=$expected for the custom method $method', ({ method, expected }) => {
    const customRule = { ...rule, methods: ['customMethod'] };
    const expression = createExpression(method, 'User', '{}');
    const result = requireWhereUpdateMany(expression, customRule);

    expect(result.isTriggered).toBe(expected);

    if (result.isTriggered) {
      expect(result.nodeToHighlight.getText()).toBe('{}');
    }
  });
});
