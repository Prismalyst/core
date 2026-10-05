import * as TS from 'typescript';
import { describe, expect, it } from 'vitest';

import { createAstParser } from '../../../ast/parser/create-ast-parser.js';
import { createAstUtils } from '../../../ast/utils/create-ast-utils.js';
import { createTestProgram } from './helpers/create-test-program.js';
import { getPrismaExpressions } from './helpers/get-prisma-expressions.js';

const FIXTURE_PATH = 'src/tests/ast/v7/fixtures/scope.ts';

describe('Scope', () => {
  const { program, sourceFile } = createTestProgram(FIXTURE_PATH);

  const { findCallExpressions } = createAstParser(TS);

  const checker = program.getTypeChecker();

  const astUtils = createAstUtils(TS, checker);

  const callExpressions = findCallExpressions(sourceFile);

  it('should find all query, callback, and nested function calls', () => {
    expect(callExpressions).toHaveLength(26);
  });

  const prismaExpressions = getPrismaExpressions(callExpressions, { program, astUtils });

  it('should recognize all nineteen Prisma queries and exclude other function calls', () => {
    expect(prismaExpressions).toHaveLength(19);
  });

  // Query names follow their order in the fixture.
  const [
    topLevelQuery,
    functionDeclarationQuery,
    arrowFunctionQuery,
    functionExpressionQuery,
    topLevelIfQuery,
    topLevelElseQuery,
    functionIfQuery,
    functionElseQuery,
    forQuery,
    forOfQuery,
    forInQuery,
    whileQuery,
    doWhileQuery,
    mapCallbackQuery,
    promiseCallbackQuery,
    outerFunctionQuery,
    nestedFunctionQuery,
    nestedArrowQuery,
    functionInsideLoopQuery,
  ] = prismaExpressions;

  const topLevelContext = {
    isExpressionInsideLoop: false,
    isExpressionInsideFunction: false,
    isExpressionInsideClassMethod: false,
    isExpressionInsideAwaitExpression: true,
    parentFunctionName: null,
    parentMethodName: null,
  };

  const functionContext = {
    ...topLevelContext,
    isExpressionInsideFunction: true,
  };

  const loopContext = {
    ...topLevelContext,
    isExpressionInsideLoop: true,
  };

  it('should detect top-level await outside functions and loops', () => {
    expect(topLevelQuery?.expressionContext).toEqual(topLevelContext);
  });

  describe('Function scope', () => {
    it('should detect the parent name of a function declaration', () => {
      expect(functionDeclarationQuery?.expressionContext).toEqual({
        ...functionContext,
        parentFunctionName: 'loadUsers',
      });
    });

    it('should detect an arrow function without a parent function name', () => {
      expect(arrowFunctionQuery?.expressionContext).toEqual(functionContext);
    });

    it('should detect an anonymous function expression without a parent function name', () => {
      expect(functionExpressionQuery?.expressionContext).toEqual(functionContext);
    });
  });

  describe('Conditional blocks', () => {
    it('should keep top-level if and else branches outside function scope', () => {
      expect(topLevelIfQuery?.expressionContext).toEqual(topLevelContext);
      expect(topLevelElseQuery?.expressionContext).toEqual(topLevelContext);
    });

    it('should preserve the enclosing function scope in if and else branches', () => {
      const expectedContext = {
        ...functionContext,
        parentFunctionName: 'loadUsersByStatus',
      };

      expect(functionIfQuery?.expressionContext).toEqual(expectedContext);
      expect(functionElseQuery?.expressionContext).toEqual(expectedContext);
    });
  });

  describe('Loops', () => {
    it('should detect a query inside a for loop', () => {
      expect(forQuery?.expressionContext).toEqual(loopContext);
    });

    it('should detect a query inside a for...of loop', () => {
      expect(forOfQuery?.expressionContext).toEqual(loopContext);
    });

    it('should detect a query inside a for...in loop', () => {
      expect(forInQuery?.expressionContext).toEqual(loopContext);
    });

    it('should detect a query inside a while loop', () => {
      expect(whileQuery?.expressionContext).toEqual(loopContext);
    });

    it('should detect a query inside a do...while loop', () => {
      expect(doWhileQuery?.expressionContext).toEqual(loopContext);
    });
  });

  describe('Callbacks', () => {
    it('should treat a map callback as both a function and a loop', () => {
      expect(mapCallbackQuery?.expressionContext).toEqual({
        ...functionContext,
        isExpressionInsideLoop: true,
      });
    });

    it('should treat a Promise callback as a function outside loops', () => {
      expect(promiseCallbackQuery?.expressionContext).toEqual(functionContext);
    });
  });

  describe('Nested functions', () => {
    it('should preserve the outer function name for its own query', () => {
      expect(outerFunctionQuery?.expressionContext).toEqual({
        ...functionContext,
        parentFunctionName: 'loadUsersWithNestedFunctions',
      });
    });

    it('should use the nearest function declaration as the parent', () => {
      expect(nestedFunctionQuery?.expressionContext).toEqual({
        ...functionContext,
        parentFunctionName: 'loadPosts',
      });
    });

    it('should leave the parent name null for a nested arrow function', () => {
      expect(nestedArrowQuery?.expressionContext).toEqual(functionContext);
    });

    it('should stop loop detection at a nested function boundary', () => {
      expect(functionInsideLoopQuery?.expressionContext).toEqual({
        ...functionContext,
        parentFunctionName: 'loadUserInsideLoop',
      });
    });
  });

  describe('Prisma query details', () => {
    it('should detect User findMany calls without arguments across scopes', () => {
      const queries = [
        topLevelQuery,
        functionDeclarationQuery,
        arrowFunctionQuery,
        functionExpressionQuery,
        forQuery,
        whileQuery,
        doWhileQuery,
        outerFunctionQuery,
      ];

      for (const query of queries) {
        expect(query).toEqual(
          expect.objectContaining({
            method: 'findMany',
            args: [],
            prismaContext: expect.objectContaining({ model: 'User' }),
          }),
        );
      }
    });

    it('should parse active filters in top-level and function branches', () => {
      for (const query of [topLevelIfQuery, functionIfQuery]) {
        expect(query).toEqual(
          expect.objectContaining({
            method: 'findMany',
            args: [{ where: { active: true } }],
            prismaContext: expect.objectContaining({ model: 'User' }),
          }),
        );
      }

      for (const query of [topLevelElseQuery, functionElseQuery]) {
        expect(query).toEqual(
          expect.objectContaining({
            method: 'findMany',
            args: [{ where: { active: false } }],
            prismaContext: expect.objectContaining({ model: 'User' }),
          }),
        );
      }
    });

    it('should parse numeric IDs in loop, callback, and nested function queries', () => {
      const queries = [forOfQuery, mapCallbackQuery, promiseCallbackQuery, functionInsideLoopQuery];

      for (const query of queries) {
        expect(query).toEqual(
          expect.objectContaining({
            method: 'findUnique',
            args: [{ where: { id: { kind: 'type', type: 'number' } } }],
            prismaContext: expect.objectContaining({ model: 'User' }),
          }),
        );
      }
    });

    it('should parse the name filter in a for...in loop', () => {
      expect(forInQuery).toEqual(
        expect.objectContaining({
          method: 'findMany',
          args: [{ where: { name: { kind: 'type', type: 'string' } } }],
          prismaContext: expect.objectContaining({ model: 'User' }),
        }),
      );
    });

    it('should detect Post and Comment queries inside nested functions', () => {
      expect(nestedFunctionQuery).toEqual(
        expect.objectContaining({
          method: 'findMany',
          args: [],
          prismaContext: expect.objectContaining({ model: 'Post' }),
        }),
      );

      expect(nestedArrowQuery).toEqual(
        expect.objectContaining({
          method: 'findMany',
          args: [],
          prismaContext: expect.objectContaining({ model: 'Comment' }),
        }),
      );
    });

    it('should detect awaited Prisma client queries outside transactions in every scope', () => {
      for (const prismaExpression of prismaExpressions) {
        expect(prismaExpression.prismaContext).toEqual(
          expect.objectContaining({
            isFloatingPrismaPromise: false,
            isExpressionInsideTransaction: false,
            transactionType: null,
            clientType: 'prisma',
          }),
        );
      }
    });
  });
});
