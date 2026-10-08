import * as TS from 'typescript';
import { describe, expect, it } from 'vitest';

import { createAstParser } from '../../../ast/parser/create-ast-parser.js';
import { createAstUtils } from '../../../ast/utils/create-ast-utils.js';
import { createTestProgram } from './helpers/create-test-program.js';
import { getPrismaExpressions } from './helpers/get-prisma-expressions.js';

const FIXTURE_PATH = 'src/tests/ast/v7/fixtures/optional-chaining.ts';

describe('Optional Chaining', () => {
  const { program, sourceFile } = createTestProgram(FIXTURE_PATH);

  const { findCallExpressions } = createAstParser(TS);

  const checker = program.getTypeChecker();

  const astUtils = createAstUtils(TS, checker);

  const callExpressions = findCallExpressions(sourceFile);

  const prismaExpressions = getPrismaExpressions(callExpressions, { program, astUtils });

  it('should recognize three Prisma call expressions with optional chaining', () => {
    expect(prismaExpressions).toHaveLength(3);
  });

  const expectedParameters = {
    method: 'findMany',
    args: [],
    expressionContext: {
      isExpressionInsideLoop: false,
      isExpressionInsideFunction: false,
      isExpressionInsideClassMethod: false,
      isExpressionInsideAwaitExpression: true,
      parentFunctionName: null,
      parentMethodName: null,
    },
    prismaContext: {
      isFloatingPrismaPromise: false,
      isExpressionInsideTransaction: false,
      transactionType: null,
      clientType: 'prisma',
      model: 'User',
    },
  };

  it('should detect the expected parameters with optional chaining on the Prisma client', () => {
    expect(prismaExpressions[0]).toEqual(expect.objectContaining(expectedParameters));
  });

  it('should detect the expected parameters with optional chaining on the model delegate', () => {
    expect(prismaExpressions[1]).toEqual(expect.objectContaining(expectedParameters));
  });

  it('should detect the expected parameters with an optional method call', () => {
    expect(prismaExpressions[2]).toEqual(expect.objectContaining(expectedParameters));
  });
});
