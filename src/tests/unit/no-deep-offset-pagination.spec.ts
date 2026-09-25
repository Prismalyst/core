import { describe, expect, it } from 'vitest';

import type { RuleWithoutFunction } from '../../types/rule.eslint.types.js';

import { noDeepOffsetPagination } from '../../rules/list/no-deep-offset-pagination.js';

const rule: RuleWithoutFunction = {
  name: 'no-deep-offset-pagination',
  astType: 'callExpression',
  methods: ['findMany'],
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
    'returns $expected for skip=$skip with min=$min and max=$max',
    ({ skip, min, max, expected }) => {
      expect(
        noDeepOffsetPagination({ method: 'findMany', args: [{ skip }] }, rule, { min, max }),
      ).toBe(expected);
    },
  );

  it('ignores methods outside the rule even when skip exceeds the maximum', () => {
    expect(
      noDeepOffsetPagination({ method: 'findFirst', args: [{ skip: 1001 }] }, rule, {
        min: -1000,
        max: 1000,
      }),
    ).toBe(false);
  });

  it('ignores methods outside the rule when arguments are missing', () => {
    expect(
      noDeepOffsetPagination({ method: 'count', args: [] }, rule, { min: -1000, max: 1000 }),
    ).toBe(false);
  });

  it('uses the methods supplied by the rule', () => {
    const customRule = { ...rule, methods: ['findFirst'] };

    expect(
      noDeepOffsetPagination({ method: 'findFirst', args: [{ skip: 1001 }] }, customRule, {
        min: -1000,
        max: 1000,
      }),
    ).toBe(true);
    expect(
      noDeepOffsetPagination({ method: 'findMany', args: [{ skip: 1001 }] }, customRule, {
        min: -1000,
        max: 1000,
      }),
    ).toBe(false);
  });

  it('reports a query without arguments', () => {
    expect(
      noDeepOffsetPagination({ method: 'findMany', args: [] }, rule, { min: -1000, max: 1000 }),
    ).toBe(true);
  });

  it('reports an explicitly undefined query argument', () => {
    expect(
      noDeepOffsetPagination({ method: 'findMany', args: [undefined] }, rule, {
        min: -1000,
        max: 1000,
      }),
    ).toBe(true);
  });

  it.each([
    { name: 'an empty options object', argument: {} },
    { name: 'a filter without skip', argument: { where: { active: true } } },
    { name: 'an explicitly undefined skip', argument: { skip: undefined } },
  ])('allows a query with $name', ({ argument }) => {
    expect(
      noDeepOffsetPagination({ method: 'findMany', args: [argument] }, rule, {
        min: -1000,
        max: 1000,
      }),
    ).toBe(false);
  });

  it('ignores a non-number skip value', () => {
    const skip = {};

    expect(
      noDeepOffsetPagination({ method: 'findMany', args: [{ skip }] }, rule, {
        min: -1000,
        max: 1000,
      }),
    ).toBe(false);
  });
});
