import * as TS from 'typescript';
import { describe, expect, it } from 'vitest';

import { createAstParser } from '../../../ast/parser/create-ast-parser.js';
import { convertToPrismaExpression } from '../../../ast/prisma/convert-to-prisma-expression.js';
import { isPrismaExpression } from '../../../ast/prisma/is-prisma-expression.js';
import { createAstUtils } from '../../../ast/utils/create-ast-utils.js';
import { createTestProgram } from './helpers/create-test-program.js';

const FIXTURE_PATH = 'src/tests/ast/v7/fixtures/aliases.ts';

describe('Aliases', () => {
  const { program, sourceFile } = createTestProgram(FIXTURE_PATH);

  const { findVariableStatements, findCallExpressions } = createAstParser(TS);

  const astUtils = createAstUtils(TS);

  const variableStatements = findVariableStatements(sourceFile);
  const callExpressions = findCallExpressions(sourceFile);

  it('should find all variable statements', () => {
    expect(variableStatements).toHaveLength(5);
  });

  it('should find all call expressions', () => {
    expect(callExpressions).toHaveLength(5);
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

    expect(prismaExpressions).toHaveLength(5); // If everything is valid, we should have 5 prisma expressions

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
        method: 'update',
        args: [
          {
            where: {
              id: 1,
            },
            data: {
              name: 'username',
            },
          },
        ],
      }),
    );

    expect(prismaExpressions[3]).toEqual(
      expect.objectContaining({
        method: 'delete',
        args: [
          {
            where: {
              id: 1,
            },
          },
        ],
      }),
    );

    expect(prismaExpressions[4]).toEqual(
      expect.objectContaining({
        method: 'create',
        args: [
          {
            data: {
              name: 'user2',
              email: 'user@mail.com',
            },
          },
        ],
      }),
    );
  });
});
