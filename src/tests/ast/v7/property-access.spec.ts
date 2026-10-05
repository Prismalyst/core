import * as TS from 'typescript';
import { describe, expect, it } from 'vitest';

import { createAstParser } from '../../../ast/parser/create-ast-parser.js';
import { createAstUtils } from '../../../ast/utils/create-ast-utils.js';
import { createTestProgram } from './helpers/create-test-program.js';
import { getPrismaExpressions } from './helpers/get-prisma-expressions.js';

const FIXTURE_PATH = 'src/tests/ast/v7/fixtures/property-access.ts';

describe('Property Access', () => {
  const { program, sourceFile } = createTestProgram(FIXTURE_PATH);

  const { findCallExpressions } = createAstParser(TS);

  const checker = program.getTypeChecker();

  const astUtils = createAstUtils(TS, checker);

  const callExpressions = findCallExpressions(sourceFile);

  it('should find calls through direct, nested, and class properties', () => {
    expect(callExpressions).toHaveLength(4);
  });

  const prismaExpressions = getPrismaExpressions(callExpressions, { program, astUtils });

  it('should recognize Prisma calls through direct, nested, and class properties', () => {
    expect(prismaExpressions).toHaveLength(4);
  });

  it('should detect findMany with no arguments through each property access path', () => {
    for (const prismaExpression of prismaExpressions) {
      expect(prismaExpression).toEqual(
        expect.objectContaining({
          method: 'findMany',
          args: [],
        }),
      );
    }
  });
});
