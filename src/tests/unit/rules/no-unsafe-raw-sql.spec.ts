import { describe, expect, it } from 'vitest';

import type { RuleWithoutFunction } from '../../../types/rule.eslint.types.js';

import { noUnsafeRawSQL } from '../../../rules/list/no-unsafe-raw-sql.js';

const rule: RuleWithoutFunction = {
  name: 'no-unsafe-raw-sql',
  astType: 'callExpression',
  methods: ['$queryRawUnsafe', '$executeRawUnsafe'],
};

describe('noUnsafeRawSQL', () => {
  it.each(['$queryRawUnsafe', '$executeRawUnsafe'])(
    'reports calls to the configured unsafe SQL method %s',
    (method) => {
      expect(noUnsafeRawSQL({ method }, rule)).toBe(true);
    },
  );

  it.each(['$queryRaw', '$executeRaw', 'findMany', 'raw'])(
    'ignores calls to the unconfigured method %s',
    (method) => {
      expect(noUnsafeRawSQL({ method }, rule)).toBe(false);
    },
  );

  it('reports only methods in the custom rule configuration', () => {
    const customRule = { ...rule, methods: ['$queryRaw'] };
    expect(noUnsafeRawSQL({ method: '$queryRaw' }, customRule)).toBe(true);
    expect(noUnsafeRawSQL({ method: '$queryRawUnsafe' }, customRule)).toBe(false);
  });
});
