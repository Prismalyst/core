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

  const prismaExpressions = getPrismaExpressions(callExpressions, { program, astUtils });

  it('should recognize 6 Prisma call expressions', () => {
    expect(prismaExpressions).toHaveLength(6);
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

  it('should detect the expected parameters for the sequential transaction', () => {
    // await prisma.$transaction([prisma.user.create({ data: user }), prisma.post.create({ data: post })])
    expect(prismaExpressions[0]).toEqual(
      expect.objectContaining({
        method: '$transaction',
        args: [[callExpressions[1], callExpressions[2]]],
        prismaContext: { ...prismaContext, transactionType: 'sequential', model: null },
        expressionContext,
      }),
    );
  });

  it('should detect the expected parameters for the User creation in the sequential transaction', () => {
    // prisma.user.create({ data: user })
    expect(prismaExpressions[1]).toEqual(
      expect.objectContaining({
        method: 'create',
        args: [{ data: { name: 'user', email: 'user@mail' } }],
        prismaContext: {
          ...prismaContext,
          isFloatingPrismaPromise: true,
          isExpressionInsideTransaction: true,
          transactionType: 'sequential',
        },
        expressionContext,
      }),
    );
  });

  it('should detect the expected parameters for the Post creation in the sequential transaction', () => {
    // prisma.post.create({ data: post })
    expect(prismaExpressions[2]).toEqual(
      expect.objectContaining({
        method: 'create',
        args: [{ data: { title: 'title', body: 'body', slug: 'slug', authorId: 1 } }],
        prismaContext: {
          ...prismaContext,
          isFloatingPrismaPromise: true,
          isExpressionInsideTransaction: true,
          transactionType: 'sequential',
          model: 'Post',
        },
        expressionContext,
      }),
    );
  });

  it('should detect the expected parameters for the interactive transaction', () => {
    // await prisma.$transaction(async (tx) => {
    //   await tx.user.findMany();
    //   await tx.post.create({ data: post });
    // })
    expect(prismaExpressions[3]).toEqual(
      expect.objectContaining({
        method: '$transaction',
        args: [callExpressions[3]?.arguments[0]],
        prismaContext: { ...prismaContext, transactionType: 'interactive', model: null },
        expressionContext,
      }),
    );
  });

  it('should detect the expected parameters for the User query in the interactive transaction', () => {
    // await tx.user.findMany()
    expect(prismaExpressions[4]).toEqual(
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

  it('should detect the expected parameters for the Post creation in the interactive transaction', () => {
    // await tx.post.create({ data: post })
    expect(prismaExpressions[5]).toEqual(
      expect.objectContaining({
        method: 'create',
        args: [{ data: { title: 'title', body: 'body', slug: 'slug', authorId: 1 } }],
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
