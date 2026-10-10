import * as TS from 'typescript';
import { describe, expect, it } from 'vitest';

import { createAstParser } from '../../../ast/parser/create-ast-parser.js';
import { createAstUtils } from '../../../ast/utils/create-ast-utils.js';
import { createTestProgram } from './helpers/create-test-program.js';
import { getPrismaExpressions } from './helpers/get-prisma-expressions.js';

const FIXTURE_PATH = 'src/tests/ast/v7/fixtures/prisma-client-detection.ts';

describe('Prisma Client Detection', () => {
  const { program, sourceFile } = createTestProgram(FIXTURE_PATH);

  const { findCallExpressions } = createAstParser(TS);

  const checker = program.getTypeChecker();

  const astUtils = createAstUtils(TS, checker);

  const callExpressions = findCallExpressions(sourceFile);

  const prismaExpressions = getPrismaExpressions(callExpressions, { program, astUtils });

  it('should find 5 call expressions in the fixture', () => {
    expect(callExpressions).toHaveLength(5);
  });

  it('should recognize 4 Prisma call expressions', () => {
    expect(prismaExpressions).toHaveLength(4);
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

  it('should detect the expected parameters for the direct client', () => {
    // await prisma.user.findMany()
    expect(prismaExpressions[0]).toEqual(
      expect.objectContaining({ method: 'findMany', args: [], prismaContext, expressionContext }),
    );
  });

  it('should detect the expected parameters for the second client', () => {
    // await db.user.findFirst()
    expect(prismaExpressions[1]).toEqual(
      expect.objectContaining({ method: 'findFirst', args: [], prismaContext, expressionContext }),
    );
  });

  it('should detect the expected parameters for the client alias', () => {
    // await db2.user.update({
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
        args: [{ where: { id: 1 }, data: { name: 'username' } }],
        prismaContext,
        expressionContext,
      }),
    );
  });

  it('should detect the expected parameters for the constructor alias', () => {
    // await foo.user.delete({
    //   where: {
    //     id: 1,
    //   },
    // })
    expect(prismaExpressions[3]).toEqual(
      expect.objectContaining({
        method: 'delete',
        args: [{ where: { id: 1 } }],
        prismaContext,
        expressionContext,
      }),
    );
  });
});
