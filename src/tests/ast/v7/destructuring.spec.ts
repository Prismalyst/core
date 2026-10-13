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

  it('should recognize 5 Prisma call expressions', () => {
    expect(prismaExpressions).toHaveLength(5);
  });

  const expressionContext = {
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
    // await users.findMany()
    expect(prismaExpressions[0]).toEqual(
      expect.objectContaining({ method: 'findMany', args: [], prismaContext, expressionContext }),
    );
  });

  it('should detect the expected parameters for the destructured posts delegate', () => {
    // await posts.findMany({
    //   where: {
    //     authorId: 1,
    //   },
    // })
    expect(prismaExpressions[1]).toEqual(
      expect.objectContaining({
        method: 'findMany',
        args: [{ where: { authorId: 1 } }],
        prismaContext: { ...prismaContext, model: 'Post' },
        expressionContext,
      }),
    );
  });

  it('should detect the expected parameters for the interactive transaction call', () => {
    // await prisma.$transaction(async (tx) => {
    //   const { user: users, post: posts } = tx;
    //
    //   await users.findMany();
    //   await posts.findMany({
    //     where: {
    //       authorId: 1,
    //     },
    //   });
    // })
    expect(prismaExpressions[2]).toEqual(
      expect.objectContaining({
        method: '$transaction',
        args: [callExpressions[2]?.arguments[0]],
        prismaContext: { ...prismaContext, transactionType: 'interactive', model: null },
        expressionContext,
      }),
    );
  });

  it('should detect the expected parameters for the users delegate destructured from tx', () => {
    // await users.findMany()
    expect(prismaExpressions[3]).toEqual(
      expect.objectContaining({
        method: 'findMany',
        args: [],
        prismaContext: {
          ...prismaContext,
          isExpressionInsideTransaction: true,
          transactionType: 'interactive',
          clientType: 'transaction',
        },
        expressionContext: { ...expressionContext, isExpressionInsideFunction: true },
      }),
    );
  });

  it('should detect the expected parameters for the posts delegate destructured from tx', () => {
    // await posts.findMany({
    //     where: {
    //       authorId: 1,
    //     },
    //   })
    expect(prismaExpressions[4]).toEqual(
      expect.objectContaining({
        method: 'findMany',
        args: [{ where: { authorId: 1 } }],
        prismaContext: {
          ...prismaContext,
          isExpressionInsideTransaction: true,
          transactionType: 'interactive',
          clientType: 'transaction',
          model: 'Post',
        },
        expressionContext: { ...expressionContext, isExpressionInsideFunction: true },
      }),
    );
  });
});
