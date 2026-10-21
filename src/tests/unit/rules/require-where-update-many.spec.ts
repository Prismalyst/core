import { describe, expect, it } from 'vitest';

import type { RuleWithoutFunction } from '../../../types/rule.eslint.types.js';

import { requireWhereUpdateMany } from '../../../rules/list/require-where-update-many.js';

import { wrapArguments } from '../../helpers/wrap-arguments.js';

const rule: RuleWithoutFunction = {
  name: 'require-where-update-many',
  astType: 'callExpression',
  methods: ['updateMany'],
  requireSchema: false,
};

describe('requireWhereUpdateMany', () => {
  it.each([
    { name: 'no arguments', args: [], expected: false },
    { name: 'an undefined argument', args: [undefined], expected: false },
    { name: 'a null argument', args: [null], expected: false },
    { name: 'a non-object argument', args: [42], expected: false },
    { name: 'an empty options object', args: [{}], expected: true },
    { name: 'data without where', args: [{ data: { active: true } }], expected: true },
    { name: 'an undefined where', args: [{ where: undefined }], expected: true },
    { name: 'an empty where', args: [{ where: {} }], expected: true },
    { name: 'an id filter', args: [{ where: { id: 1 } }], expected: false },
    { name: 'a nested filter', args: [{ where: { id: { in: [1, 2] } } }], expected: false },
    // Invalid where values are already rejected by Prisma's types.
    { name: 'a null where', args: [{ where: null }], expected: false },
    { name: 'a non-object where', args: [{ where: 42 }], expected: false },
  ])('returns violation=$expected for updateMany with $name', ({ args, expected }) => {
    expect(requireWhereUpdateMany({ method: 'updateMany', args: wrapArguments(args) }, rule)).toBe(
      expected,
    );
  });

  it('ignores methods outside the rule even without where', () => {
    expect(requireWhereUpdateMany({ method: 'findMany', args: wrapArguments([{}]) }, rule)).toBe(
      false,
    );
  });

  it('reports only methods in the custom rule configuration', () => {
    const customRule = { ...rule, methods: ['customMethod'] };
    expect(
      requireWhereUpdateMany({ method: 'customMethod', args: wrapArguments([{}]) }, customRule),
    ).toBe(true);
    expect(
      requireWhereUpdateMany({ method: 'updateMany', args: wrapArguments([{}]) }, customRule),
    ).toBe(false);
  });
});
