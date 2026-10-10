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

  it('should find 13 call expressions in the fixture', () => {
    expect(callExpressions).toHaveLength(13);
  });

  it('should recognize 9 Prisma call expressions', () => {
    expect(prismaExpressions).toHaveLength(9);
  });

  const expressionContext = {
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

  it('should detect the expected parameters for the standalone query', () => {
    // prisma.user.findMany()
    expect(prismaExpressions[0]).toEqual(
      expect.objectContaining({ method: 'findMany', args: [], prismaContext, expressionContext }),
    );
  });

  it('should detect the expected parameters for the variable assignment', () => {
    // prisma.user.findMany()
    expect(prismaExpressions[1]).toEqual(
      expect.objectContaining({ method: 'findMany', args: [], prismaContext, expressionContext }),
    );
  });

  it('should detect the expected parameters for the consume argument', () => {
    // prisma.user.findMany()
    expect(prismaExpressions[2]).toEqual(
      expect.objectContaining({ method: 'findMany', args: [], prismaContext, expressionContext }),
    );
  });

  it('should detect the expected parameters for the Promise executor', () => {
    // prisma.user.findMany()
    expect(prismaExpressions[3]).toEqual(
      expect.objectContaining({
        method: 'findMany',
        args: [],
        prismaContext,
        expressionContext: { ...expressionContext, isExpressionInsideFunction: true },
      }),
    );
  });

  it('should detect the expected parameters for the User query in Promise.all', () => {
    // prisma.user.findMany()
    expect(prismaExpressions[4]).toEqual(
      expect.objectContaining({ method: 'findMany', args: [], prismaContext, expressionContext }),
    );
  });

  it('should detect the expected parameters for the Post query in Promise.all', () => {
    // prisma.post.findMany()
    expect(prismaExpressions[5]).toEqual(
      expect.objectContaining({
        method: 'findMany',
        args: [],
        prismaContext: { ...prismaContext, model: 'Post' },
        expressionContext,
      }),
    );
  });

  it('should detect the expected parameters for the true ternary branch', () => {
    // prisma.user.findMany()
    expect(prismaExpressions[6]).toEqual(
      expect.objectContaining({ method: 'findMany', args: [], prismaContext, expressionContext }),
    );
  });

  it('should detect the expected parameters for the false ternary branch', () => {
    // prisma.user.findFirst()
    expect(prismaExpressions[7]).toEqual(
      expect.objectContaining({ method: 'findFirst', args: [], prismaContext, expressionContext }),
    );
  });

  it('should detect the expected parameters for the returned query', () => {
    // prisma.user.findMany()
    expect(prismaExpressions[8]).toEqual(
      expect.objectContaining({
        method: 'findMany',
        args: [],
        prismaContext: { ...prismaContext, isFloatingPrismaPromise: false },
        expressionContext: {
          ...expressionContext,
          isExpressionInsideFunction: true,
          parentFunctionName: 'doSomething',
        },
      }),
    );
  });
});
