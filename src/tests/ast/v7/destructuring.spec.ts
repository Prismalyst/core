import * as TS from 'typescript';
import { describe, expect, it } from 'vitest';

import { createAstParser } from '../../../ast/parser/create-ast-parser.js';
import { createAstUtils } from '../../../ast/utils/create-ast-utils.js';
import { createTestProgram } from './helpers/create-test-program.js';
import { getPrismaExpressions } from './helpers/get-prisma-expressions.js';

const FIXTURE_PATH = 'src/tests/ast/v7/fixtures/destructuring.ts';

describe('Destructuring', () => {
  const { program, sourceFile } = createTestProgram(FIXTURE_PATH);

  const { findCallExpressions } = createAstParser(TS);

  const checker = program.getTypeChecker();

  const astUtils = createAstUtils(TS, checker);

  const callExpressions = findCallExpressions(sourceFile);

  const prismaExpressions = getPrismaExpressions(callExpressions, { program, astUtils });

  it('should recognize five Prisma expressions including the transaction and destructured queries', () => {
    expect(prismaExpressions).toHaveLength(5);
  });

  const topLevelContext = {
    isExpressionInsideLoop: false,
    isExpressionInsideFunction: false,
    isExpressionInsideClassMethod: false,
    isExpressionInsideAwaitExpression: true,
    parentFunctionName: null,
    parentMethodName: null,
  };

  const prismaContext = {
    isFloatingPrismaPromise: false,
    isExpressionInsideTransaction: false,
    transactionType: null,
    clientType: 'prisma',
    model: 'User',
  };

  it('should detect the expected parameters for the destructured users delegate', () => {
    expect(prismaExpressions[0]).toEqual(
      expect.objectContaining({
        method: 'findMany',
        args: [],
        expressionContext: topLevelContext,
        prismaContext,
      }),
    );
  });

  it('should detect the expected parameters for the destructured posts delegate', () => {
    expect(prismaExpressions[1]).toEqual(
      expect.objectContaining({
        method: 'findMany',
        args: [{ where: { authorId: 1 } }],
        expressionContext: topLevelContext,
        prismaContext: {
          ...prismaContext,
          model: 'Post',
        },
      }),
    );
  });

  it('should detect the expected parameters for the interactive transaction call', () => {
    expect(prismaExpressions[2]).toEqual(
      expect.objectContaining({
        method: '$transaction',
        args: [callExpressions[2]?.arguments[0]],
        expressionContext: topLevelContext,
        prismaContext: {
          ...prismaContext,
          transactionType: 'interactive',
          model: null,
        },
      }),
    );
  });

  const transactionExpressionContext = {
    ...topLevelContext,
    isExpressionInsideFunction: true,
  };

  const transactionPrismaContext = {
    ...prismaContext,
    isExpressionInsideTransaction: true,
    transactionType: 'interactive',
    clientType: 'transaction',
  };

  it('should detect the expected parameters for the users delegate destructured from tx', () => {
    expect(prismaExpressions[3]).toEqual(
      expect.objectContaining({
        method: 'findMany',
        args: [],
        expressionContext: transactionExpressionContext,
        prismaContext: transactionPrismaContext,
      }),
    );
  });

  it('should detect the expected parameters for the posts delegate destructured from tx', () => {
    expect(prismaExpressions[4]).toEqual(
      expect.objectContaining({
        method: 'findMany',
        args: [{ where: { authorId: 1 } }],
        expressionContext: transactionExpressionContext,
        prismaContext: { ...transactionPrismaContext, model: 'Post' },
      }),
    );
  });
});
