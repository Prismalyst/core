import { describe, expect, it } from 'vitest';

import type { RuleWithoutFunction } from '../../../types/rule.eslint.types.js';

import { requireWhereDeleteMany } from '../../../rules/list/require-where-delete-many.js';

import { createExpression } from '../../helpers/create-expression.js';

const rule: RuleWithoutFunction = {
  name: 'require-where-delete-many',
  astType: 'callExpression',
  methods: ['deleteMany'],
  requireSchema: false,
};

describe('requireWhereDeleteMany', () => {
  it.each([
    { name: 'no arguments', argument: '', highlight: 'prisma.user.deleteMany()' },
    { name: 'an undefined argument', argument: 'undefined', highlight: 'undefined' },
    { name: 'a null argument', argument: 'null', highlight: 'null' },
    { name: 'a non-object argument', argument: '42', highlight: '42' },
    { name: 'an empty options object', argument: '{}', highlight: '{}' },
    {
      name: 'data without where',
      argument: '{ data: { active: true } }',
      highlight: '{ data: { active: true } }',
    },
    { name: 'an undefined where', argument: '{ where: undefined }', highlight: 'undefined' },
    { name: 'an empty where', argument: '{ where: {} }', highlight: '{}' },
  ])('reports deleteMany with $name', ({ argument, highlight }) => {
    const expression = createExpression('deleteMany', 'User', argument);
    const result = requireWhereDeleteMany(expression, rule);

    expect(result.isTriggered).toBe(true);

    if (result.isTriggered) {
      expect(result.nodeToHighlight.getText()).toBe(highlight);
    }
  });

  it.each([
    { name: 'an id filter', argument: '{ where: { id: 1 } }' },
    { name: 'a nested filter', argument: '{ where: { id: { in: [1, 2] } } }' },
    // Invalid where values are already rejected by Prisma's types.
    { name: 'a null where', argument: '{ where: null }' },
    { name: 'a non-object where', argument: '{ where: 42 }' },
  ])('does not warn for deleteMany with $name', ({ argument }) => {
    const expression = createExpression('deleteMany', 'User', argument);
    const result = requireWhereDeleteMany(expression, rule);

    expect(result.isTriggered).toBe(false);
  });

  it('ignores methods outside the rule even without where', () => {
    const expression = createExpression('findMany', 'User', '{}');
    const result = requireWhereDeleteMany(expression, rule);

    expect(result.isTriggered).toBe(false);
  });

  it.each([
    { method: 'customMethod', expected: true },
    { method: 'deleteMany', expected: false },
  ])('returns isTriggered=$expected for the custom method $method', ({ method, expected }) => {
    const customRule = { ...rule, methods: ['customMethod'] };
    const expression = createExpression(method, 'User', '{}');
    const result = requireWhereDeleteMany(expression, customRule);

    expect(result.isTriggered).toBe(expected);

    if (result.isTriggered) {
      expect(result.nodeToHighlight.getText()).toBe('{}');
    }
  });
});
