import { describe, expect, it } from 'vitest';

import type { RuleWithoutFunction } from '../../../types/rule.eslint.types.js';

import { noDisconnectInRequestFlow } from '../../../rules/list/no-disconnect-in-request-flow.js';

import { createExpression } from '../../helpers/create-expression.js';

const rule: RuleWithoutFunction = {
  name: 'no-disconnect-in-request-flow',
  astType: 'callExpression',
  methods: ['$disconnect'],
  requireSchema: false,
};

const options = { ignoredFiles: [], allowInTests: true };

describe('noDisconnectInRequestFlow', () => {
  it('reports disconnect in an application file', () => {
    const expression = createExpression('$disconnect', null, '');
    const result = noDisconnectInRequestFlow(
      { ...expression, filename: '/src/users.service.ts' },
      rule,
      options,
    );

    expect(result.isTriggered).toBe(true);

    if (result.isTriggered) {
      expect(result.nodeToHighlight.getText()).toBe('prisma.$disconnect()');
    }
  });

  it.each([
    { method: '$connect', model: null },
    { method: 'findMany', model: 'User' },
  ])('ignores the unconfigured method $method', ({ method, model }) => {
    const expression = createExpression(method, model, '');
    const result = noDisconnectInRequestFlow(
      { ...expression, filename: '/src/users.service.ts' },
      rule,
      options,
    );

    expect(result.isTriggered).toBe(false);
  });

  it.each(['/src/users.test.ts', '/src/users.spec.ts'])(
    'allows disconnect in %s when allowInTests is enabled',
    (filename) => {
      const expression = createExpression('$disconnect', null, '');
      const result = noDisconnectInRequestFlow({ ...expression, filename }, rule, options);

      expect(result.isTriggered).toBe(false);
    },
  );

  it.each(['/src/users.test.ts', '/src/users.spec.ts'])(
    'reports disconnect in %s when allowInTests is disabled',
    (filename) => {
      const expression = createExpression('$disconnect', null, '');
      const result = noDisconnectInRequestFlow({ ...expression, filename }, rule, {
        ...options,
        allowInTests: false,
      });

      expect(result.isTriggered).toBe(true);

      if (result.isTriggered) {
        expect(result.nodeToHighlight.getText()).toBe('prisma.$disconnect()');
      }
    },
  );

  it('does not treat a tests directory as a test filename', () => {
    const expression = createExpression('$disconnect', null, '');
    const result = noDisconnectInRequestFlow(
      { ...expression, filename: '/tests/users.ts' },
      rule,
      options,
    );

    expect(result.isTriggered).toBe(true);

    if (result.isTriggered) {
      expect(result.nodeToHighlight.getText()).toBe('prisma.$disconnect()');
    }
  });

  it('allows disconnect in files matching any configured ignored path', () => {
    const expression = createExpression('$disconnect', null, '');
    const result = noDisconnectInRequestFlow(
      { ...expression, filename: '/project/scripts/shutdown.ts' },
      rule,
      {
        ...options,
        ignoredFiles: ['seed.ts', 'scripts/shutdown.ts'],
      },
    );

    expect(result.isTriggered).toBe(false);
  });

  it('reports disconnect in files that do not match ignored paths', () => {
    const expression = createExpression('$disconnect', null, '');
    const result = noDisconnectInRequestFlow(
      { ...expression, filename: '/src/users.service.ts' },
      rule,
      {
        ...options,
        ignoredFiles: ['shutdown.ts'],
      },
    );

    expect(result.isTriggered).toBe(true);

    if (result.isTriggered) {
      expect(result.nodeToHighlight.getText()).toBe('prisma.$disconnect()');
    }
  });

  it('allows disconnect in ignored test files even when allowInTests is disabled', () => {
    const expression = createExpression('$disconnect', null, '');
    const result = noDisconnectInRequestFlow(
      { ...expression, filename: '/src/users.spec.ts' },
      rule,
      {
        ignoredFiles: ['users.spec.ts'],
        allowInTests: false,
      },
    );

    expect(result.isTriggered).toBe(false);
  });

  it.each([
    { method: '$connect', expected: true },
    { method: '$disconnect', expected: false },
  ])('returns isTriggered=$expected for the custom method $method', ({ method, expected }) => {
    const customRule = { ...rule, methods: ['$connect'] };
    const expression = createExpression(method, null, '');
    const result = noDisconnectInRequestFlow(
      { ...expression, filename: '/src/users.ts' },
      customRule,
      options,
    );

    expect(result.isTriggered).toBe(expected);

    if (result.isTriggered) {
      expect(result.nodeToHighlight.getText()).toBe('prisma.$connect()');
    }
  });
});
