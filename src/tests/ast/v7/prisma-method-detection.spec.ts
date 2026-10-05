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

  it('should find calls to valid Prisma methods and notRealMethod', () => {
    expect(callExpressions).toHaveLength(4);
  });

  const prismaExpressions = getPrismaExpressions(callExpressions, { program, astUtils });

  it('should recognize the three valid Prisma methods and exclude notRealMethod', () => {
    expect(prismaExpressions).toHaveLength(3);
  });

  it('should detect findMany, findFirst, and deleteMany with no arguments', () => {
    expect(prismaExpressions[0]).toEqual(
      expect.objectContaining({
        method: 'findMany',
        args: [],
      }),
    );

    expect(prismaExpressions[1]).toEqual(
      expect.objectContaining({
        method: 'findFirst',
        args: [],
      }),
    );

    expect(prismaExpressions[2]).toEqual(
      expect.objectContaining({
        method: 'deleteMany',
        args: [],
      }),
    );
  });

  it('should reject a method that does not exist on the prisma model', () => {
    expect(isPrismaExpression(callExpressions[3]!, program, astUtils)).toBe(false);
  });
});
