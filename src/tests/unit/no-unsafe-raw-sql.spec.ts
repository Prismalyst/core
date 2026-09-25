import { describe, expect, it } from 'vitest';

import type { RuleWithoutFunction } from '../../../types/rule.eslint.types.js';

import { noUnsafeRawSQL } from '../../list/no-unsafe-raw-sql.js';

const rule: RuleWithoutFunction = {
  name: 'no-unsafe-raw-sql',
  astType: 'callExpression',
  methods: ['$queryRawUnsafe', '$executeRawUnsafe'],
};

describe('noUnsafeRawSQL', () => {
  it.each(['$queryRawUnsafe', '$executeRawUnsafe'])('reports %s', (method) => {
    expect(noUnsafeRawSQL({ method }, rule)).toBe(true);
  });

  it.each(['$queryRaw', '$executeRaw', 'findMany', 'raw'])('ignores %s', (method) => {
    expect(noUnsafeRawSQL({ method }, rule)).toBe(false);
  });

  it('uses the methods supplied by the rule', () => {
    const customRule = { ...rule, methods: ['$queryRaw'] };
    expect(noUnsafeRawSQL({ method: '$queryRaw' }, customRule)).toBe(true);
    expect(noUnsafeRawSQL({ method: '$queryRawUnsafe' }, customRule)).toBe(false);
  });
});
