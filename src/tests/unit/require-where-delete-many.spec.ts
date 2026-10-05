import { describe, expect, it } from 'vitest';

import type { RuleWithoutFunction } from '../../types/rule.eslint.types.js';

import { requireWhereDeleteMany } from '../../rules/list/require-where-delete-many.js';

const rule: RuleWithoutFunction = {
  name: 'require-where-delete-many',
  astType: 'callExpression',
  methods: ['deleteMany'],
};

describe('requireWhereDeleteMany', () => {
  it.each([
    { name: 'no arguments', args: [], expected: true },
    { name: 'an undefined argument', args: [undefined], expected: true },
    { name: 'a null argument', args: [null], expected: true },
    { name: 'a non-object argument', args: [42], expected: true },
    { name: 'an empty options object', args: [{}], expected: true },
    { name: 'data without where', args: [{ data: { active: true } }], expected: true },
    { name: 'an undefined where', args: [{ where: undefined }], expected: true },
    { name: 'an empty where', args: [{ where: {} }], expected: true },
    { name: 'an id filter', args: [{ where: { id: 1 } }], expected: false },
    { name: 'a nested filter', args: [{ where: { id: { in: [1, 2] } } }], expected: false },
    // Invalid where values are already rejected by Prisma's types.
    { name: 'a null where', args: [{ where: null }], expected: false },
    { name: 'a non-object where', args: [{ where: 42 }], expected: false },
  ])('returns violation=$expected for deleteMany with $name', ({ args, expected }) => {
    expect(requireWhereDeleteMany({ method: 'deleteMany', args }, rule)).toBe(expected);
  });

  it('ignores methods outside the rule even without where', () => {
    expect(requireWhereDeleteMany({ method: 'findMany', args: [{}] }, rule)).toBe(false);
  });

  it('reports only methods in the custom rule configuration', () => {
    const customRule = { ...rule, methods: ['customMethod'] };
    expect(requireWhereDeleteMany({ method: 'customMethod', args: [{}] }, customRule)).toBe(true);
    expect(requireWhereDeleteMany({ method: 'deleteMany', args: [{}] }, customRule)).toBe(false);
  });
});
