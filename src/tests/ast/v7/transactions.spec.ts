import * as TS from 'typescript';
import { describe, expect, it } from 'vitest';

import { createAstParser } from '../../../ast/parser/create-ast-parser.js';
import { createAstUtils } from '../../../ast/utils/create-ast-utils.js';
import { createTestProgram } from './helpers/create-test-program.js';
import { getPrismaExpressions } from './helpers/get-prisma-expressions.js';

const FIXTURE_PATH = 'src/tests/ast/v7/fixtures/transactions.ts';

describe('Transactions', () => {
  const { program, sourceFile } = createTestProgram(FIXTURE_PATH);

  const { findCallExpressions } = createAstParser(TS);

  const checker = program.getTypeChecker();

  const astUtils = createAstUtils(TS, checker);

  const callExpressions = findCallExpressions(sourceFile);

  it('should find both transaction calls and all four queries inside them', () => {
    expect(callExpressions).toHaveLength(6);
  });

  const prismaExpressions = getPrismaExpressions(callExpressions, { program, astUtils });

  it('should recognize all six calls as Prisma expressions', () => {
    expect(prismaExpressions).toHaveLength(6);
  });

  const topLevelContext = {
    isExpressionInsideLoop: false,
    isExpressionInsideFunction: false,
    isExpressionInsideClassMethod: false,
    isExpressionInsideAwaitExpression: true,
    parentFunctionName: null,
    parentMethodName: null,
  };

  const sequentialTransactionContext = {
    isFloatingPrismaPromise: false,
    isExpressionInsideTransaction: false,
    transactionType: 'sequential',
    clientType: 'prisma',
    model: null,
  };

  const userData = { name: 'user', email: 'user@mail' };
  const postData = { title: 'title', body: 'body', slug: 'slug', authorId: 1 };

  it('should detect the expected method, arguments, and context for both transaction calls', () => {
    // Sequential transaction with its query nodes as array arguments.
    expect(prismaExpressions[0]).toEqual(
      expect.objectContaining({
        method: '$transaction',
        args: [[callExpressions[1], callExpressions[2]]],
        expressionContext: topLevelContext,
        prismaContext: sequentialTransactionContext,
      }),
    );

    // Interactive transaction with its callback node as the argument.
    expect(prismaExpressions[3]).toEqual(
      expect.objectContaining({
        method: '$transaction',
        args: [callExpressions[3]?.arguments[0]],
        expressionContext: topLevelContext,
        prismaContext: {
          ...sequentialTransactionContext,
          transactionType: 'interactive',
        },
      }),
    );
  });

  it('should detect the expected method, arguments, and context for all four queries in transactions', () => {
    // User creation through the root client in the sequential transaction.
    expect(prismaExpressions[1]).toEqual(
      expect.objectContaining({
        method: 'create',
        args: [{ data: userData }],
        expressionContext: topLevelContext,
        prismaContext: {
          ...sequentialTransactionContext,
          isFloatingPrismaPromise: true,
          isExpressionInsideTransaction: true,
          model: 'User',
        },
      }),
    );

    // Post creation through the root client in the sequential transaction.
    expect(prismaExpressions[2]).toEqual(
      expect.objectContaining({
        method: 'create',
        args: [{ data: postData }],
        expressionContext: topLevelContext,
        prismaContext: {
          ...sequentialTransactionContext,
          isFloatingPrismaPromise: true,
          isExpressionInsideTransaction: true,
          model: 'Post',
        },
      }),
    );

    // Awaited User query through the transaction client.
    expect(prismaExpressions[4]).toEqual(
      expect.objectContaining({
        method: 'findMany',
        args: [],
        expressionContext: {
          ...topLevelContext,
          isExpressionInsideFunction: true,
        },
        prismaContext: {
          isFloatingPrismaPromise: false,
          isExpressionInsideTransaction: true,
          transactionType: 'interactive',
          clientType: 'transaction',
          model: 'User',
        },
      }),
    );

    // Awaited Post creation through the transaction client.
    expect(prismaExpressions[5]).toEqual(
      expect.objectContaining({
        method: 'create',
        args: [{ data: postData }],
        expressionContext: {
          ...topLevelContext,
          isExpressionInsideFunction: true,
        },
        prismaContext: {
          isFloatingPrismaPromise: false,
          isExpressionInsideTransaction: true,
          transactionType: 'interactive',
          clientType: 'transaction',
          model: 'Post',
        },
      }),
    );
  });
});
