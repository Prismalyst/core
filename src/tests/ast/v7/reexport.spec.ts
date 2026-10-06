import * as TS from 'typescript';
import { describe, expect, it } from 'vitest';

import { createAstParser } from '../../../ast/parser/create-ast-parser.js';
import { createAstUtils } from '../../../ast/utils/create-ast-utils.js';
import { createTestProgram } from './helpers/create-test-program.js';
import { getPrismaExpressions } from './helpers/get-prisma-expressions.js';

const FIXTURE_PATH = 'src/tests/ast/v7/fixtures/reexport.ts';

describe('Re-export', () => {
  const { program, sourceFile } = createTestProgram(FIXTURE_PATH);

  const { findCallExpressions } = createAstParser(TS);

  const checker = program.getTypeChecker();

  const astUtils = createAstUtils(TS, checker);

  const callExpressions = findCallExpressions(sourceFile);

  it('should find all three queries through the re-exported Prisma client', () => {
    expect(callExpressions).toHaveLength(3);
  });

  const prismaExpressions = getPrismaExpressions(callExpressions, { program, astUtils });

  it('should recognize all three queries as Prisma expressions through the re-export', () => {
    expect(prismaExpressions).toHaveLength(3);
  });

  it('should detect the expected method, arguments, and context for every expression', () => {
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

    // User query through the re-exported client.
    expect(prismaExpressions[0]).toEqual(
      expect.objectContaining({
        method: 'findMany',
        args: [],
        expressionContext: topLevelContext,
        prismaContext,
      }),
    );

    // Post query through the re-exported client.
    expect(prismaExpressions[1]).toEqual(
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

    // Comment creation through the re-exported client.
    expect(prismaExpressions[2]).toEqual(
      expect.objectContaining({
        method: 'create',
        args: [{ data: { authorId: 1, postId: 1, body: 'x' } }],
        expressionContext: topLevelContext,
        prismaContext: {
          ...prismaContext,
          model: 'Comment',
        },
      }),
    );
  });
});
