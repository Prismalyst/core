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

  const astUtils = createAstUtils(TS);

  const callExpressions = findCallExpressions(sourceFile);

  it('should find all call expressions', () => {
    expect(callExpressions).toHaveLength(4);
  });

  const prismaExpressions = getPrismaExpressions(callExpressions, { program, astUtils });

  it('should find all prisma expressions', () => {
    expect(prismaExpressions).toHaveLength(4);
  });

  it('should be valid prisma calls', () => {
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
