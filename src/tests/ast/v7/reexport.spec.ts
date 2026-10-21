import * as TS from 'typescript';
import { describe, expect, it } from 'vitest';

import { createAstParser } from '../../../ast/parser/create-ast-parser.js';
import { createAstUtils } from '../../../ast/utils/create-ast-utils.js';
import { wrapArguments } from '../../helpers/wrap-arguments.js';
import { createTestProgram } from './helpers/create-test-program.js';
import { getPrismaExpressions } from './helpers/get-prisma-expressions.js';

const FIXTURE_PATH = 'src/tests/ast/v7/fixtures/reexport.ts';

describe('Re-export', () => {
  const { program, sourceFile } = createTestProgram(FIXTURE_PATH);

  const { findCallExpressions } = createAstParser(TS);

  const checker = program.getTypeChecker();

  const astUtils = createAstUtils(TS, checker);

  const callExpressions = findCallExpressions(sourceFile);

  const prismaExpressions = getPrismaExpressions(callExpressions, { program, astUtils });

  it('should recognize 3 Prisma call expressions', () => {
    expect(prismaExpressions).toHaveLength(3);
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

  it('should detect the expected parameters for the re-exported User query', () => {
    // await prisma.user.findMany()
    expect(prismaExpressions[0]).toEqual(
      expect.objectContaining({ method: 'findMany', args: [], prismaContext, expressionContext }),
    );
  });

  it('should detect the expected parameters for the re-exported Post query', () => {
    // await prisma.post.findMany()
    expect(prismaExpressions[1]).toEqual(
      expect.objectContaining({
        method: 'findMany',
        args: [],
        prismaContext: { ...prismaContext, model: 'Post' },
        expressionContext,
      }),
    );
  });

  it('should detect the expected parameters for the re-exported Comment creation', () => {
    // await prisma.comment.create({ data: { authorId: 1, postId: 1, body: 'x' } })
    expect(prismaExpressions[2]).toEqual(
      expect.objectContaining({
        method: 'create',
        args: wrapArguments([{ data: { authorId: 1, postId: 1, body: 'x' } }]),
        prismaContext: { ...prismaContext, model: 'Comment' },
        expressionContext,
      }),
    );
  });
});
