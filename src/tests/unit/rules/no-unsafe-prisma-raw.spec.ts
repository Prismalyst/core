import { describe, expect, it } from 'vitest';

import type { RuleWithoutFunction } from '../../../types/rule.eslint.types.js';

import { noUnsafePrismaRaw } from '../../../rules/list/no-unsafe-prisma-raw.js';

const rule: RuleWithoutFunction = {
  name: 'no-unsafe-prisma-raw',
  astType: 'callExpression',
  methods: ['raw', 'sql', 'join', 'empty'],
};

describe('noUnsafePrismaRaw', () => {
  it.each(['SELECT 1', ''])('allows the literal string %j in Prisma.raw', (value) => {
    expect(noUnsafePrismaRaw({ method: 'raw', args: [value] }, rule)).toBe(false);
  });

  it('reports interpolated SQL in Prisma.raw', () => {
    const value = { kind: 'template', raw: '`SELECT * FROM users WHERE id = ${id}`' };
    expect(noUnsafePrismaRaw({ method: 'raw', args: [value] }, rule)).toBe(true);
  });

  it('reports an unresolved value in Prisma.raw', () => {
    const value = {};
    expect(noUnsafePrismaRaw({ method: 'raw', args: [value] }, rule)).toBe(true);
  });

  it.each([
    { name: 'no arguments', args: [] },
    { name: 'an undefined argument', args: [undefined] },
  ])('ignores Prisma.raw calls with $name', ({ args }) => {
    expect(noUnsafePrismaRaw({ method: 'raw', args }, rule)).toBe(false);
  });

  it('ignores methods outside the rule', () => {
    expect(noUnsafePrismaRaw({ method: 'findMany', args: [{}] }, rule)).toBe(false);
  });
});
