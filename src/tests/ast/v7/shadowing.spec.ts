import * as TS from 'typescript';
import { describe, expect, it } from 'vitest';

import { createAstParser } from '../../../ast/parser/create-ast-parser.js';
import { isPrismaExpression } from '../../../ast/prisma/is-prisma-expression.js';
import { createAstUtils } from '../../../ast/utils/create-ast-utils.js';
import { createTestProgram } from './helpers/create-test-program.js';
import { getPrismaExpressions } from './helpers/get-prisma-expressions.js';

const FIXTURE_PATH = 'src/tests/ast/v7/fixtures/shadowing.ts';

describe('Shadowing', () => {
  const { program, sourceFile } = createTestProgram(FIXTURE_PATH);

  const { findCallExpressions } = createAstParser(TS);

  const checker = program.getTypeChecker();

  const astUtils = createAstUtils(TS, checker);

  const callExpressions = findCallExpressions(sourceFile);

  const prismaExpressions = getPrismaExpressions(callExpressions, { program, astUtils });

  it('should find 4 call expressions in the fixture', () => {
    expect(callExpressions).toHaveLength(4);
  });

  it('should recognize 2 Prisma call expressions', () => {
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

  it('should detect the expected parameters for the outer client before shadowing', () => {
    // await prisma.user.findMany()
    expect(prismaExpressions[0]).toEqual(
      expect.objectContaining({
        method: 'findMany',
        args: [],
        node: callExpressions[0],
        prismaContext,
        expressionContext,
      }),
    );
  });

  it('should detect the expected parameters for the outer client after shadowing', () => {
    // await prisma.user.findMany()
    expect(prismaExpressions[1]).toEqual(
      expect.objectContaining({
        method: 'findMany',
        args: [],
        node: callExpressions[3],
        prismaContext,
        expressionContext,
      }),
    );
  });

  const [, parameterCall, localVariableCall] = callExpressions;

  it('should reject a FakeClient parameter that shadows the outer Prisma client', () => {
    expect(isPrismaExpression(parameterCall!, program, astUtils)).toBe(false);
  });

  it('should reject a local FakeClient variable that shadows the outer Prisma client', () => {
    expect(isPrismaExpression(localVariableCall!, program, astUtils)).toBe(false);
  });
});
