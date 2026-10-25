import { describe, expect, it } from 'vitest';

import type { RuleWithoutFunction } from '../../../types/rule.eslint.types.js';

import { noPrismaClientInFunction } from '../../../rules/list/no-prisma-client-in-function.js';

import { createPrismaClientExpression } from '../../helpers/create-prisma-client-expression.js';

const rule: RuleWithoutFunction = {
  name: 'no-prisma-client-in-function',
  astType: 'newExpression',
  methods: [],
  requireSchema: false,
};

const options = {
  ignoredFiles: [],
  allowedFunctionsNames: ['main', 'seed'],
  allowInTests: true,
};

const source = 'function getUsers() { return new PrismaClient(); }';

describe('noPrismaClientInFunction', () => {
  it('reports client creation inside a function', () => {
    const expression = createPrismaClientExpression(source);
    const result = noPrismaClientInFunction(expression, rule, options);

    expect(result.isTriggered).toBe(true);

    if (result.isTriggered) {
      expect(result.nodeToHighlight.getText()).toBe('new PrismaClient()');
    }
  });

  it('allows client creation at module scope', () => {
    const expression = createPrismaClientExpression('const prisma = new PrismaClient();');
    const result = noPrismaClientInFunction(expression, rule, options);

    expect(result.isTriggered).toBe(false);
  });

  it.each([
    {
      name: 'an anonymous function',
      source: 'const getUsers = function () { return new PrismaClient(); };',
    },
    { name: 'an arrow function', source: 'const getUsers = () => new PrismaClient();' },
  ])('reports client creation inside $name', ({ source }) => {
    const expression = createPrismaClientExpression(source);
    const result = noPrismaClientInFunction(expression, rule, options);

    expect(result.isTriggered).toBe(true);

    if (result.isTriggered) {
      expect(result.nodeToHighlight.getText()).toBe('new PrismaClient()');
    }
  });

  it('reports client creation inside a class method', () => {
    const expression = createPrismaClientExpression(
      'class UsersService { getUsers() { return new PrismaClient(); } }',
    );
    const result = noPrismaClientInFunction(expression, rule, options);

    expect(result.isTriggered).toBe(true);

    if (result.isTriggered) {
      expect(result.nodeToHighlight.getText()).toBe('new PrismaClient()');
    }
  });

  it('allows client creation inside a constructor', () => {
    const expression = createPrismaClientExpression(
      'class UsersService { constructor() { const prisma = new PrismaClient(); } }',
    );
    const result = noPrismaClientInFunction(expression, rule, options);

    expect(result.isTriggered).toBe(false);
  });

  it.each(['main', 'seed'])(
    'allows client creation inside the configured function %s',
    (parentFunctionName) => {
      const expression = createPrismaClientExpression(
        `function ${parentFunctionName}() { return new PrismaClient(); }`,
      );
      const result = noPrismaClientInFunction(expression, rule, options);

      expect(result.isTriggered).toBe(false);
    },
  );

  it('reports client creation inside seed when the allowed function list is empty', () => {
    const expression = createPrismaClientExpression(
      'function seed() { return new PrismaClient(); }',
    );
    
    const result = noPrismaClientInFunction(expression, rule, {
      ...options,
      allowedFunctionsNames: [],
    });

    expect(result.isTriggered).toBe(true);

    if (result.isTriggered) {
      expect(result.nodeToHighlight.getText()).toBe('new PrismaClient()');
    }
  });

  it('reports client creation inside seedUsers when only main and seed are allowed', () => {
    const expression = createPrismaClientExpression(
      'function seedUsers() { return new PrismaClient(); }',
    );
    const result = noPrismaClientInFunction(expression, rule, options);

    expect(result.isTriggered).toBe(true);

    if (result.isTriggered) {
      expect(result.nodeToHighlight.getText()).toBe('new PrismaClient()');
    }
  });

  it('allows client creation inside a custom allowed function', () => {
    const expression = createPrismaClientExpression(source);
    const result = noPrismaClientInFunction(expression, rule, {
      ...options,
      allowedFunctionsNames: ['getUsers'],
    });

    expect(result.isTriggered).toBe(false);
  });

  it('allows client creation in files matching a configured ignored path', () => {
    const expression = createPrismaClientExpression(source, '/project/scripts/setup.ts');
    const result = noPrismaClientInFunction(expression, rule, {
      ...options,
      ignoredFiles: ['seed.ts', 'scripts/setup.ts'],
    });

    expect(result.isTriggered).toBe(false);
  });

  it('reports client creation in functions whose files do not match ignored paths', () => {
    const expression = createPrismaClientExpression(source);
    const result = noPrismaClientInFunction(expression, rule, {
      ...options,
      ignoredFiles: ['setup.ts'],
    });

    expect(result.isTriggered).toBe(true);

    if (result.isTriggered) {
      expect(result.nodeToHighlight.getText()).toBe('new PrismaClient()');
    }
  });

  it.each(['/src/users.test.ts', '/src/users.spec.ts'])(
    'allows client creation in %s when allowInTests is enabled',
    (filename) => {
      const expression = createPrismaClientExpression(source, filename);
      const result = noPrismaClientInFunction(expression, rule, options);

      expect(result.isTriggered).toBe(false);
    },
  );

  it.each(['/src/users.test.ts', '/src/users.spec.ts'])(
    'reports client creation in %s when allowInTests is disabled',
    (filename) => {
      const expression = createPrismaClientExpression(source, filename);
      const result = noPrismaClientInFunction(expression, rule, {
        ...options,
        allowInTests: false,
      });

      expect(result.isTriggered).toBe(true);

      if (result.isTriggered) {
        expect(result.nodeToHighlight.getText()).toBe('new PrismaClient()');
      }
    },
  );

  it('does not treat a tests directory as a test filename', () => {
    const expression = createPrismaClientExpression(source, '/tests/users.ts');
    const result = noPrismaClientInFunction(expression, rule, options);

    expect(result.isTriggered).toBe(true);

    if (result.isTriggered) {
      expect(result.nodeToHighlight.getText()).toBe('new PrismaClient()');
    }
  });

  it('allows client creation in ignored test files even when allowInTests is disabled', () => {
    const expression = createPrismaClientExpression(source, '/src/users.spec.ts');
    const result = noPrismaClientInFunction(expression, rule, {
      ...options,
      ignoredFiles: ['users.spec.ts'],
      allowInTests: false,
    });

    expect(result.isTriggered).toBe(false);
  });
});
