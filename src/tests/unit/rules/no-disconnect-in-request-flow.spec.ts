import { describe, expect, it } from 'vitest';

import type { RuleWithoutFunction } from '../../../types/rule.eslint.types.js';

import { noDisconnectInRequestFlow } from '../../../rules/list/no-disconnect-in-request-flow.js';

const rule: RuleWithoutFunction = {
  name: 'no-disconnect-in-request-flow',
  astType: 'callExpression',
  methods: ['$disconnect'],
};

const options = { ignoredFiles: [], allowInTests: true };

describe('noDisconnectInRequestFlow', () => {
  it('reports disconnect in an application file', () => {
    expect(
      noDisconnectInRequestFlow(
        { method: '$disconnect', filename: '/src/users.service.ts' },
        rule,
        options,
      ),
    ).toBe(true);
  });

  it.each(['$connect', 'findMany'])('ignores the unconfigured method %s', (method) => {
    expect(
      noDisconnectInRequestFlow({ method, filename: '/src/users.service.ts' }, rule, options),
    ).toBe(false);
  });

  it.each(['/src/users.test.ts', '/src/users.spec.ts'])(
    'allows disconnect in %s when allowInTests is enabled',
    (filename) => {
      expect(noDisconnectInRequestFlow({ method: '$disconnect', filename }, rule, options)).toBe(
        false,
      );
    },
  );

  it.each(['/src/users.test.ts', '/src/users.spec.ts'])(
    'reports disconnect in %s when allowInTests is disabled',
    (filename) => {
      expect(
        noDisconnectInRequestFlow({ method: '$disconnect', filename }, rule, {
          ...options,
          allowInTests: false,
        }),
      ).toBe(true);
    },
  );

  it('does not treat a tests directory as a test filename', () => {
    expect(
      noDisconnectInRequestFlow(
        { method: '$disconnect', filename: '/tests/users.ts' },
        rule,
        options,
      ),
    ).toBe(true);
  });

  it('allows disconnect in files matching any configured ignored path', () => {
    expect(
      noDisconnectInRequestFlow(
        { method: '$disconnect', filename: '/project/scripts/shutdown.ts' },
        rule,
        {
          ...options,
          ignoredFiles: ['seed.ts', 'scripts/shutdown.ts'],
        },
      ),
    ).toBe(false);
  });

  it('reports disconnect in files that do not match ignored paths', () => {
    expect(
      noDisconnectInRequestFlow(
        { method: '$disconnect', filename: '/src/users.service.ts' },
        rule,
        {
          ...options,
          ignoredFiles: ['shutdown.ts'],
        },
      ),
    ).toBe(true);
  });

  it('allows disconnect in ignored test files even when allowInTests is disabled', () => {
    expect(
      noDisconnectInRequestFlow({ method: '$disconnect', filename: '/src/users.spec.ts' }, rule, {
        ignoredFiles: ['users.spec.ts'],
        allowInTests: false,
      }),
    ).toBe(false);
  });

  it('reports only methods in the custom rule configuration', () => {
    const customRule = { ...rule, methods: ['customMethod'] };
    expect(
      noDisconnectInRequestFlow(
        { method: 'customMethod', filename: '/src/users.ts' },
        customRule,
        options,
      ),
    ).toBe(true);
    expect(
      noDisconnectInRequestFlow(
        { method: '$disconnect', filename: '/src/users.ts' },
        customRule,
        options,
      ),
    ).toBe(false);
  });
});
