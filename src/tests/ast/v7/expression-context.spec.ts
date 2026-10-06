import * as TS from 'typescript';
import { describe, expect, it } from 'vitest';

import { createAstParser } from '../../../ast/parser/create-ast-parser.js';
import { createAstUtils } from '../../../ast/utils/create-ast-utils.js';
import { createTestProgram } from './helpers/create-test-program.js';
import { getPrismaExpressions } from './helpers/get-prisma-expressions.js';

const FIXTURE_PATH = 'src/tests/ast/v7/fixtures/expression-context.ts';

describe('Expression Context', () => {
  const { program, sourceFile } = createTestProgram(FIXTURE_PATH);

  const { findCallExpressions } = createAstParser(TS);

  const checker = program.getTypeChecker();

  const astUtils = createAstUtils(TS, checker);

  const callExpressions = findCallExpressions(sourceFile);

  const prismaExpressions = getPrismaExpressions(callExpressions, { program, astUtils });

  it('should recognize all nine Prisma expressions', () => {
    expect(prismaExpressions).toHaveLength(9);
  });

  it('should detect the expected method, arguments, and context for every expression', () => {
    const topLevelContext = {
      isExpressionInsideLoop: false,
      isExpressionInsideFunction: false,
      isExpressionInsideClassMethod: false,
      isExpressionInsideAwaitExpression: false,
      parentFunctionName: null,
      parentMethodName: null,
    };

    const prismaContext = {
      isFloatingPrismaPromise: true,
      isExpressionInsideTransaction: false,
      transactionType: null,
      clientType: 'prisma',
      model: 'User',
    };

    // Standalone query.
    expect(prismaExpressions[0]).toEqual(
      expect.objectContaining({
        method: 'findMany',
        args: [],
        expressionContext: topLevelContext,
        prismaContext,
      }),
    );

    // Query assigned to a variable.
    expect(prismaExpressions[1]).toEqual(
      expect.objectContaining({
        method: 'findMany',
        args: [],
        expressionContext: topLevelContext,
        prismaContext,
      }),
    );

    // Query passed to consume().
    expect(prismaExpressions[2]).toEqual(
      expect.objectContaining({
        method: 'findMany',
        args: [],
        expressionContext: topLevelContext,
        prismaContext,
      }),
    );

    // Query inside the Promise executor.
    expect(prismaExpressions[3]).toEqual(
      expect.objectContaining({
        method: 'findMany',
        args: [],
        expressionContext: {
          ...topLevelContext,
          isExpressionInsideFunction: true,
        },
        prismaContext,
      }),
    );

    // User query in the Promise.all array.
    expect(prismaExpressions[4]).toEqual(
      expect.objectContaining({
        method: 'findMany',
        args: [],
        expressionContext: topLevelContext,
        prismaContext,
      }),
    );

    // Post query in the Promise.all array.
    expect(prismaExpressions[5]).toEqual(
      expect.objectContaining({
        method: 'findMany',
        args: [],
        expressionContext: topLevelContext,
        prismaContext: {
          ...prismaContext,
          model: 'Post',
        },
      }),
    );

    // True branch of the ternary expression.
    expect(prismaExpressions[6]).toEqual(
      expect.objectContaining({
        method: 'findMany',
        args: [],
        expressionContext: topLevelContext,
        prismaContext,
      }),
    );

    // False branch of the ternary expression.
    expect(prismaExpressions[7]).toEqual(
      expect.objectContaining({
        method: 'findFirst',
        args: [],
        expressionContext: topLevelContext,
        prismaContext,
      }),
    );

    // Query returned by doSomething().
    expect(prismaExpressions[8]).toEqual(
      expect.objectContaining({
        method: 'findMany',
        args: [],
        expressionContext: {
          ...topLevelContext,
          isExpressionInsideFunction: true,
          parentFunctionName: 'doSomething',
        },
        prismaContext: {
          ...prismaContext,
          isFloatingPrismaPromise: false,
        },
      }),
    );
  });
});
