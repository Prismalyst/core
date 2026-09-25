import { describe, expect, it } from 'vitest';

import type { RuleWithoutFunction } from '../../types/rule.eslint.types.js';

import { noPrismaClientInFunction } from '../../rules/list/no-prisma-client-in-function.js';

const rule: RuleWithoutFunction = {
  name: 'no-prisma-client-in-function',
  astType: 'newExpression',
  methods: [],
};

const expressionContext = {
  isExpressionInsideLoop: false,
  isExpressionInsideFunction: false,
  isExpressionInsideClassMethod: false,
  isExpressionInsideAwaitExpression: false,
  parentFunctionName: null,
  parentMethodName: null,
};
const options = {
  ignoredFiles: [],
  allowedFunctionsNames: ['main', 'seed'],
  allowInTests: true,
};

const expression = {
  filename: '/src/users.service.ts',
  expressionContext: {
    ...expressionContext,
    isExpressionInsideFunction: true,
    parentFunctionName: 'getUsers',
  },
};

describe('noPrismaClientInFunction', () => {
  it('reports client creation inside a function', () => {
    expect(noPrismaClientInFunction(expression, rule, options)).toBe(true);
  });

  it('allows client creation at module scope', () => {
    expect(noPrismaClientInFunction({ ...expression, expressionContext }, rule, options)).toBe(
      false,
    );
  });

  it('reports client creation inside an anonymous function', () => {
    expect(
      noPrismaClientInFunction(
        {
          ...expression,
          expressionContext: { ...expression.expressionContext, parentFunctionName: null },
        },
        rule,
        options,
      ),
    ).toBe(true);
  });

  it('reports client creation inside a class method', () => {
    expect(
      noPrismaClientInFunction(
        {
          ...expression,
          expressionContext: {
            ...expressionContext,
            isExpressionInsideClassMethod: true,
            parentMethodName: 'getUsers',
          },
        },
        rule,
        options,
      ),
    ).toBe(true);
  });

  it('allows client creation inside a constructor', () => {
    expect(
      noPrismaClientInFunction(
        {
          ...expression,
          expressionContext: {
            ...expressionContext,
            isExpressionInsideClassMethod: true,
            parentMethodName: null,
          },
        },
        rule,
        options,
      ),
    ).toBe(false);
  });

  it.each(['main', 'seed'])(
    'allows client creation inside the configured function %s',
    (parentFunctionName) => {
      expect(
        noPrismaClientInFunction(
          {
            ...expression,
            expressionContext: { ...expression.expressionContext, parentFunctionName },
          },
          rule,
          options,
        ),
      ).toBe(false);
    },
  );

  it('reports seed when the allowed function list is empty', () => {
    expect(
      noPrismaClientInFunction(
        {
          ...expression,
          expressionContext: { ...expression.expressionContext, parentFunctionName: 'seed' },
        },
        rule,
        { ...options, allowedFunctionsNames: [] },
      ),
    ).toBe(true);
  });

  it('matches allowed function names exactly', () => {
    expect(
      noPrismaClientInFunction(
        {
          ...expression,
          expressionContext: { ...expression.expressionContext, parentFunctionName: 'seedUsers' },
        },
        rule,
        options,
      ),
    ).toBe(true);
  });

  it('allows a custom function name', () => {
    expect(
      noPrismaClientInFunction(expression, rule, {
        ...options,
        allowedFunctionsNames: ['getUsers'],
      }),
    ).toBe(false);
  });

  it('allows files matching a configured ignored path', () => {
    expect(
      noPrismaClientInFunction({ ...expression, filename: '/project/scripts/setup.ts' }, rule, {
        ...options,
        ignoredFiles: ['seed.ts', 'scripts/setup.ts'],
      }),
    ).toBe(false);
  });

  it('reports files that do not match ignored paths', () => {
    expect(
      noPrismaClientInFunction(expression, rule, {
        ...options,
        ignoredFiles: ['setup.ts'],
      }),
    ).toBe(true);
  });

  it.each(['/src/users.test.ts', '/src/users.spec.ts'])(
    'allows client creation in %s when allowInTests is enabled',
    (filename) => {
      expect(noPrismaClientInFunction({ ...expression, filename }, rule, options)).toBe(false);
    },
  );

  it.each(['/src/users.test.ts', '/src/users.spec.ts'])(
    'reports client creation in %s when allowInTests is disabled',
    (filename) => {
      expect(
        noPrismaClientInFunction({ ...expression, filename }, rule, {
          ...options,
          allowInTests: false,
        }),
      ).toBe(true);
    },
  );

  it('does not treat a tests directory as a test filename', () => {
    expect(
      noPrismaClientInFunction({ ...expression, filename: '/tests/users.ts' }, rule, options),
    ).toBe(true);
  });

  it('honors ignored files even when allowInTests is disabled', () => {
    expect(
      noPrismaClientInFunction({ ...expression, filename: '/src/users.spec.ts' }, rule, {
        ...options,
        ignoredFiles: ['users.spec.ts'],
        allowInTests: false,
      }),
    ).toBe(false);
  });
});
