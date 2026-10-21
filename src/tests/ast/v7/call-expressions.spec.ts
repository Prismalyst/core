import * as TS from 'typescript';
import { describe, expect, it } from 'vitest';

import { createAstParser } from '../../../ast/parser/create-ast-parser.js';
import { createAstUtils } from '../../../ast/utils/create-ast-utils.js';
import { wrapArguments } from '../../helpers/wrap-arguments.js';
import { createTestProgram } from './helpers/create-test-program.js';
import { getPrismaExpressions } from './helpers/get-prisma-expressions.js';

const FIXTURE_PATH = 'src/tests/ast/v7/fixtures/call-expressions.ts';

describe('Call Expressions', () => {
  const { program, sourceFile } = createTestProgram(FIXTURE_PATH);

  const { findCallExpressions } = createAstParser(TS);

  const checker = program.getTypeChecker();

  const astUtils = createAstUtils(TS, checker);

  const callExpressions = findCallExpressions(sourceFile);

  const prismaExpressions = getPrismaExpressions(callExpressions, { program, astUtils });

  it('should recognize 10 Prisma call expressions', () => {
    expect(prismaExpressions).toHaveLength(10);
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

  it('should detect the expected parameters for the user findMany', () => {
    // await prisma.user.findMany()
    expect(prismaExpressions[0]).toEqual(
      expect.objectContaining({ method: 'findMany', args: [], prismaContext, expressionContext }),
    );
  });

  it('should detect the expected parameters for the user findFirst', () => {
    // await prisma.user.findFirst()
    expect(prismaExpressions[1]).toEqual(
      expect.objectContaining({ method: 'findFirst', args: [], prismaContext, expressionContext }),
    );
  });

  it('should detect the expected parameters for the user update', () => {
    // await prisma.user.update({
    //   where: {
    //     id: 1,
    //   },
    //   data: {
    //     name: 'username',
    //   },
    // })
    expect(prismaExpressions[2]).toEqual(
      expect.objectContaining({
        method: 'update',
        args: wrapArguments([{ where: { id: 1 }, data: { name: 'username' } }]),
        prismaContext,
        expressionContext,
      }),
    );
  });

  it('should detect the expected parameters for the user delete', () => {
    // await prisma.user.delete({
    //   where: {
    //     id: 1,
    //   },
    // })
    expect(prismaExpressions[3]).toEqual(
      expect.objectContaining({
        method: 'delete',
        args: wrapArguments([{ where: { id: 1 } }]),
        prismaContext,
        expressionContext,
      }),
    );
  });

  it('should detect the expected parameters for the user create', () => {
    // await prisma.user.create({
    //   data: {
    //     name: 'user2',
    //     email: 'user@mail.com',
    //   },
    // })
    expect(prismaExpressions[4]).toEqual(
      expect.objectContaining({
        method: 'create',
        args: wrapArguments([{ data: { name: 'user2', email: 'user@mail.com' } }]),
        prismaContext,
        expressionContext,
      }),
    );
  });

  it('should detect the expected parameters for the interactive transaction', () => {
    // await prisma.$transaction(async (tx) => {
    //   await tx.user.findMany();
    //   await tx.user.findFirst();
    // })
    expect(prismaExpressions[5]).toEqual(
      expect.objectContaining({
        method: '$transaction',
        args: wrapArguments([callExpressions[5]?.arguments[0]]),
        prismaContext: { ...prismaContext, transactionType: 'interactive', model: null },
        expressionContext,
      }),
    );
  });

  it('should detect the expected parameters for the transaction user findMany', () => {
    // await tx.user.findMany()
    expect(prismaExpressions[6]).toEqual(
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

  it('should detect the expected parameters for the transaction user findFirst', () => {
    // await tx.user.findFirst()
    expect(prismaExpressions[7]).toEqual(
      expect.objectContaining({
        method: 'findFirst',
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

  it('should detect the expected parameters for the client connect', () => {
    // await prisma.$connect()
    expect(prismaExpressions[8]).toEqual(
      expect.objectContaining({
        method: '$connect',
        args: [],
        prismaContext: { ...prismaContext, model: null },
        expressionContext,
      }),
    );
  });

  it('should detect the expected parameters for the client disconnect', () => {
    // await prisma.$disconnect()
    expect(prismaExpressions[9]).toEqual(
      expect.objectContaining({
        method: '$disconnect',
        args: [],
        prismaContext: { ...prismaContext, model: null },
        expressionContext,
      }),
    );
  });
});
