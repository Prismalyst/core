import * as TS from 'typescript';
import { describe, expect, it } from 'vitest';

import { createAstParser } from '../../../ast/parser/create-ast-parser.js';
import { convertToPrismaExpression } from '../../../ast/prisma/convert-to-prisma-expression.js';
import { isPrismaExpression } from '../../../ast/prisma/is-prisma-expression.js';
import { createAstUtils } from '../../../ast/utils/create-ast-utils.js';
import { createTestProgram } from './helpers/create-test-program.js';

const FIXTURE_PATH = 'src/tests/ast/v7/fixtures/prisma-client-detection.ts';

describe('Prisma Client Detection', () => {
  const { program, sourceFile } = createTestProgram(FIXTURE_PATH);

  const { findCallExpressions } = createAstParser(TS);

  const astUtils = createAstUtils(TS);

  const callExpressions = findCallExpressions(sourceFile);

  it('should find all call expressions', () => {
    expect(callExpressions).toHaveLength(3);
  });

  it('should be valid prisma calls', () => {
    const prismaExpressions = [];

    for (const expression of callExpressions) {
      const isValid = isPrismaExpression(expression, program, astUtils);

      // Skip non-prisma calls, using typeChecker to avoid false positives
      if (!isValid) continue;

      const prismaExpression = convertToPrismaExpression(expression, program, astUtils);

      prismaExpressions.push(prismaExpression);
    }

    expect(prismaExpressions).toHaveLength(2); // If everything is valid, we should have 2 prisma expressions, third one is not a Prisma Client

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
  });
});
