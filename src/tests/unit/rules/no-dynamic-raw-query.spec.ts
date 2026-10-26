import { describe, expect, it } from 'vitest';

import type { RuleWithoutFunction } from '../../../types/rule.eslint.types.js';

import { noDynamicRawQuery } from '../../../rules/list/no-dynamic-raw-query.js';

import { createExpression } from '../../helpers/create-expression.js';

const rule: RuleWithoutFunction = {
  name: 'no-dynamic-raw-query',
  astType: 'callExpression',
  methods: ['$queryRawUnsafe', '$executeRawUnsafe'],
  requireSchema: false,
};

describe('noDynamicRawQuery', () => {
  it.each(['$queryRawUnsafe', '$executeRawUnsafe'])(
    'reports interpolated SQL passed to %s',
    (method) => {
      const query = '`SELECT * FROM users WHERE id = ${id}`';

      const expression = createExpression(method, null, query);
      const result = noDynamicRawQuery(expression, rule);

      expect(result.isTriggered).toBe(true);

      if (result.isTriggered) {
        expect(result.nodeToHighlight.getText()).toBe(query);
      }
    },
  );

  it.each([
    { name: 'a static SQL string', query: "'SELECT * FROM users'" },
    { name: 'a static SQL template', query: '`SELECT * FROM users`' },
    { name: 'a parameterized query', query: "'SELECT * FROM users WHERE id = $1', 1" },
    { name: 'no arguments', query: '' },
    { name: 'an undefined argument', query: 'undefined' },
    { name: 'a null argument', query: 'null' },
  ])('allows $name', ({ query }) => {
    const expression = createExpression('$queryRawUnsafe', null, query);
    const result = noDynamicRawQuery(expression, rule);

    expect(result.isTriggered).toBe(false);
  });

  it.each(['$queryRaw', '$executeRaw'])(
    'ignores interpolated SQL passed to the unconfigured method %s',
    (method) => {
      const query = '`SELECT * FROM users WHERE id = ${id}`';

      const expression = createExpression(method, null, query);
      const result = noDynamicRawQuery(expression, rule);

      expect(result.isTriggered).toBe(false);
    },
  );

  it('allows a static SQL query with an interpolated template as a parameter value', () => {
    const query = "'SELECT $1', `user-${id}`";

    const expression = createExpression('$queryRawUnsafe', null, query);
    const result = noDynamicRawQuery(expression, rule);

    expect(result.isTriggered).toBe(false);
  });

  it.each([
    { method: 'customMethod', expected: true },
    { method: '$queryRawUnsafe', expected: false },
  ])('returns isTriggered=$expected for the custom method $method', ({ method, expected }) => {
    const customRule = { ...rule, methods: ['customMethod'] };
    const query = '`SELECT * FROM users WHERE id = ${id}`';

    const expression = createExpression(method, null, query);
    const result = noDynamicRawQuery(expression, customRule);

    expect(result.isTriggered).toBe(expected);

    if (result.isTriggered) {
      expect(result.nodeToHighlight.getText()).toBe(query);
    }
  });
});
