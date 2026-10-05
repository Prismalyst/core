import * as TS from 'typescript';
import { describe, expect, it } from 'vitest';

import { createAstParser } from '../../../ast/parser/create-ast-parser.js';
import { createAstUtils } from '../../../ast/utils/create-ast-utils.js';
import { createTestProgram } from './helpers/create-test-program.js';
import { getPrismaExpressions } from './helpers/get-prisma-expressions.js';

const FIXTURE_PATH = 'src/tests/ast/v7/fixtures/inheritance.ts';

describe('Inheritance', () => {
  const { program, sourceFile } = createTestProgram(FIXTURE_PATH);

  const { findCallExpressions } = createAstParser(TS);

  const checker = program.getTypeChecker();

  const astUtils = createAstUtils(TS, checker);

  const callExpressions = findCallExpressions(sourceFile);

  it('should find all call expressions', () => {
    expect(callExpressions).toHaveLength(3);
  });

  const prismaExpressions = getPrismaExpressions(callExpressions, { program, astUtils });

  it('should find all prisma expressions through multiple levels of inheritance', () => {
    expect(prismaExpressions).toHaveLength(3);
  });

  it('should detect the method, arguments, and model for each inherited prisma call', () => {
    expect(prismaExpressions[0]).toEqual(
      expect.objectContaining({
        method: 'findMany',
        args: [],
        prismaContext: expect.objectContaining({ model: 'User' }),
      }),
    );

    expect(prismaExpressions[1]).toEqual(
      expect.objectContaining({
        method: 'findMany',
        args: [],
        prismaContext: expect.objectContaining({ model: 'Post' }),
      }),
    );

    expect(prismaExpressions[2]).toEqual(
      expect.objectContaining({
        method: 'create',
        args: [{ data: { authorId: 1, postId: 1, body: 'x' } }],
        prismaContext: expect.objectContaining({ model: 'Comment' }),
      }),
    );
  });

  it('should detect the inherited prisma client and top-level await context', () => {
    for (const prismaExpression of prismaExpressions) {
      expect(prismaExpression.prismaContext).toEqual(
        expect.objectContaining({
          isFloatingPrismaPromise: false,
          isExpressionInsideTransaction: false,
          transactionType: null,
          clientType: 'prisma',
        }),
      );

      expect(prismaExpression.expressionContext).toEqual({
        isExpressionInsideLoop: false,
        isExpressionInsideFunction: false,
        isExpressionInsideClassMethod: false,
        isExpressionInsideAwaitExpression: true,
        parentFunctionName: null,
        parentMethodName: null,
      });
    }
  });
});
