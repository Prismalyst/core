import * as TS from 'typescript';
import { describe, expect, it } from 'vitest';

import { createAstParser } from '../../../ast/parser/create-ast-parser.js';
import { createAstUtils } from '../../../ast/utils/create-ast-utils.js';
import { createTestProgram } from './helpers/create-test-program.js';
import { getPrismaExpressions } from './helpers/get-prisma-expressions.js';

const FIXTURE_PATH = 'src/tests/ast/v7/fixtures/wrapper-functions.ts';

describe('Wrapper Functions', () => {
  const { program, sourceFile } = createTestProgram(FIXTURE_PATH);

  const { findCallExpressions } = createAstParser(TS);

  const checker = program.getTypeChecker();

  const astUtils = createAstUtils(TS, checker);

  const callExpressions = findCallExpressions(sourceFile);

  const prismaExpressions = getPrismaExpressions(callExpressions, { program, astUtils });

  it('should recognize two Prisma queries through the client returned by getPrisma', () => {
    expect(prismaExpressions).toHaveLength(2);
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

  it('should detect the expected parameters for the user query through the returned client', () => {
    expect(prismaExpressions[0]).toEqual(
      expect.objectContaining({
        method: 'findMany',
        args: [],
        expressionContext,
        prismaContext,
      }),
    );
  });

  it('should detect the expected parameters for the post query through the returned client', () => {
    expect(prismaExpressions[1]).toEqual(
      expect.objectContaining({
        method: 'findMany',
        args: [{ where: { authorId: 1 } }],
        expressionContext,
        prismaContext: { ...prismaContext, model: 'Post' },
      }),
    );
  });
});
