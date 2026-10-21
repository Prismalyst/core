import { describe, expect, it } from 'vitest';

import type { RuleWithoutFunction } from '../../../types/rule.eslint.types.js';

import { maxTake } from '../../../rules/list/max-take.js';

import { wrapArguments } from '../../helpers/wrap-arguments.js';

const rule: RuleWithoutFunction = {
  name: 'max-take',
  astType: 'callExpression',
  methods: ['findMany'],
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
  ])('returns violation=$expected for take=$take with max=$max', ({ take, max, expected }) => {
    expect(maxTake({ method: 'findMany', args: wrapArguments([{ take }]) }, rule, { max })).toBe(
      expected,
    );
  });

  it('ignores methods outside the rule even when take exceeds the maximum', () => {
    expect(
      maxTake({ method: 'findFirst', args: wrapArguments([{ take: 101 }]) }, rule, { max: 100 }),
    ).toBe(false);
  });

  it('ignores methods outside the rule when arguments are missing', () => {
    expect(maxTake({ method: 'count', args: [] }, rule, { max: 100 })).toBe(false);
  });

  it('reports only methods in the custom rule configuration', () => {
    const customRule = { ...rule, methods: ['findFirst'] };

    expect(
      maxTake({ method: 'findFirst', args: wrapArguments([{ take: 101 }]) }, customRule, {
        max: 100,
      }),
    ).toBe(true);
    expect(
      maxTake({ method: 'findMany', args: wrapArguments([{ take: 101 }]) }, customRule, {
        max: 100,
      }),
    ).toBe(false);
  });

  it('reports a query without arguments', () => {
    expect(maxTake({ method: 'findMany', args: [] }, rule, { max: 100 })).toBe(true);
  });

  it('reports an explicitly undefined query argument', () => {
    expect(
      maxTake({ method: 'findMany', args: wrapArguments([undefined]) }, rule, { max: 100 }),
    ).toBe(true);
  });

  it.each([
    { name: 'an empty options object', argument: {} },
    { name: 'a filter without take', argument: { where: { active: true } } },
    { name: 'an explicitly undefined take', argument: { take: undefined } },
  ])('reports an unbounded query with $name', ({ argument }) => {
    expect(
      maxTake({ method: 'findMany', args: wrapArguments([argument]) }, rule, { max: 100 }),
    ).toBe(true);
  });

  it('ignores a non-number take value', () => {
    const take = {};

    expect(
      maxTake({ method: 'findMany', args: wrapArguments([{ take }]) }, rule, { max: 100 }),
    ).toBe(false);
  });
});
