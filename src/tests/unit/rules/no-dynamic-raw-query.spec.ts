import { describe, expect, it } from 'vitest';

import type { RuleWithoutFunction } from '../../../types/rule.eslint.types.js';

import { noDynamicRawQuery } from '../../../rules/list/no-dynamic-raw-query.js';

import { wrapArguments } from '../../helpers/wrap-arguments.js';

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
      expect(noDynamicRawQuery({ method, args: wrapArguments([template]) }, rule)).toBe(true);
    },
  );

  it.each([
    { name: 'a static SQL string', args: ['SELECT * FROM users'] },
    { name: 'a parameterized query', args: ['SELECT * FROM users WHERE id = $1', 1] },
    { name: 'no arguments', args: [] },
    { name: 'an undefined argument', args: [undefined] },
    { name: 'a null argument', args: [null] },
  ])('allows $name', ({ args }) => {
    expect(noDynamicRawQuery({ method: '$queryRawUnsafe', args: wrapArguments(args) }, rule)).toBe(
      false,
    );
  });

  it.each(['$queryRaw', '$executeRaw'])(
    'ignores interpolated SQL passed to the unconfigured method %s',
    (method) => {
      expect(noDynamicRawQuery({ method, args: wrapArguments([template]) }, rule)).toBe(false);
    },
  );

  it('allows a static SQL query with an interpolated template as a parameter value', () => {
    expect(
      noDynamicRawQuery(
        { method: '$queryRawUnsafe', args: wrapArguments(['SELECT $1', template]) },
        rule,
      ),
    ).toBe(false);
  });

  it('reports only methods in the custom rule configuration', () => {
    const customRule = { ...rule, methods: ['customMethod'] };
    expect(
      noDynamicRawQuery({ method: 'customMethod', args: wrapArguments([template]) }, customRule),
    ).toBe(true);
    expect(
      noDynamicRawQuery({ method: '$queryRawUnsafe', args: wrapArguments([template]) }, customRule),
    ).toBe(false);
  });
});
