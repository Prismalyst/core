import * as TS from 'typescript';
import { describe, expect, it } from 'vitest';

import { createAstParser } from '../../../ast/parser/create-ast-parser.js';
import { isPrismaExpression } from '../../../ast/prisma/is-prisma-expression.js';
import { createAstUtils } from '../../../ast/utils/create-ast-utils.js';
import { createTestProgram } from './helpers/create-test-program.js';
import { getPrismaExpressions } from './helpers/get-prisma-expressions.js';

const FIXTURE_PATH = 'src/tests/ast/v7/fixtures/prisma-method-detection.ts';

describe('Prisma Method Detection', () => {
  const { program, sourceFile } = createTestProgram(FIXTURE_PATH);

  const { findCallExpressions } = createAstParser(TS);

  const checker = program.getTypeChecker();

  const astUtils = createAstUtils(TS, checker);

  const callExpressions = findCallExpressions(sourceFile);

  const prismaExpressions = getPrismaExpressions(callExpressions, { program, astUtils });

  it('should find 4 call expressions in the fixture', () => {
    expect(callExpressions).toHaveLength(4);
  });

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

  it('should detect the expected parameters for the findMany call', () => {
    // await prisma.user.findMany()
    expect(prismaExpressions[0]).toEqual(
      expect.objectContaining({ method: 'findMany', args: [], prismaContext, expressionContext }),
    );
  });

  it('should detect the expected parameters for the findFirst call', () => {
    // await prisma.user.findFirst()
    expect(prismaExpressions[1]).toEqual(
      expect.objectContaining({ method: 'findFirst', args: [], prismaContext, expressionContext }),
    );
  });

  it('should detect the expected parameters for the deleteMany call', () => {
    // await prisma.user.deleteMany()
    expect(prismaExpressions[2]).toEqual(
      expect.objectContaining({ method: 'deleteMany', args: [], prismaContext, expressionContext }),
    );
  });

  it('should reject a method that does not exist on the prisma model', () => {
    expect(isPrismaExpression(callExpressions[3]!, program, astUtils)).toBe(false);
  });
});
