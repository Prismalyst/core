import { describe, expect, it } from 'vitest';

import type { RuleWithoutFunction } from '../../../types/rule.eslint.types.js';

import { noDynamicRawQuery } from '../../list/no-dynamic-raw-query.js';

const rule: RuleWithoutFunction = {
  name: 'no-dynamic-raw-query',
  astType: 'callExpression',
  methods: ['$queryRawUnsafe', '$executeRawUnsafe'],
};

describe('noDynamicRawQuery', () => {
  const template = { kind: 'template', raw: '`SELECT * FROM users WHERE id = ${id}`' };

  it.each(['$queryRawUnsafe', '$executeRawUnsafe'])(
    'reports interpolated SQL passed to %s',
    (method) => {
      expect(noDynamicRawQuery({ method, args: [template] }, rule)).toBe(true);
    },
  );

  it.each([
    { name: 'a static SQL string', args: ['SELECT * FROM users'] },
    { name: 'a parameterized query', args: ['SELECT * FROM users WHERE id = $1', 1] },
    { name: 'no arguments', args: [] },
    { name: 'an undefined argument', args: [undefined] },
    { name: 'a null argument', args: [null] },
  ])('allows $name', ({ args }) => {
    expect(noDynamicRawQuery({ method: '$queryRawUnsafe', args }, rule)).toBe(false);
  });

  it.each(['$queryRaw', '$executeRaw'])('allows a safe tagged query through %s', (method) => {
    expect(noDynamicRawQuery({ method, args: [template] }, rule)).toBe(false);
  });

  it('checks the query rather than its parameter values', () => {
    expect(
      noDynamicRawQuery({ method: '$queryRawUnsafe', args: ['SELECT $1', template] }, rule),
    ).toBe(false);
  });

  it('uses the methods supplied by the rule', () => {
    const customRule = { ...rule, methods: ['customMethod'] };
    expect(noDynamicRawQuery({ method: 'customMethod', args: [template] }, customRule)).toBe(true);
    expect(noDynamicRawQuery({ method: '$queryRawUnsafe', args: [template] }, customRule)).toBe(
      false,
    );
  });
});
