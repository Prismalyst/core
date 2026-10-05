import * as TS from 'typescript';
import { describe, expect, it } from 'vitest';

import { createAstParser } from '../../../ast/parser/create-ast-parser.js';
import { createAstUtils } from '../../../ast/utils/create-ast-utils.js';
import { createTestProgram } from './helpers/create-test-program.js';
import { getPrismaExpressions } from './helpers/get-prisma-expressions.js';

const FIXTURE_PATH = 'src/tests/ast/v7/fixtures/prisma-client-detection.ts';

describe('Prisma Client Detection', () => {
  const { program, sourceFile } = createTestProgram(FIXTURE_PATH);

  const { findCallExpressions } = createAstParser(TS);

  const checker = program.getTypeChecker();

  const astUtils = createAstUtils(TS, checker);

  const callExpressions = findCallExpressions(sourceFile);

  it('should find calls through real Prisma clients and the fake client', () => {
    expect(callExpressions).toHaveLength(5);
  });

  const prismaExpressions = getPrismaExpressions(callExpressions, { program, astUtils });

  it('should recognize real Prisma client calls and exclude the fake client call', () => {
    expect(prismaExpressions).toHaveLength(4); // If everything is valid, we should have 4 prisma expressions, 5th is not a Prisma Client
  });

  it('should detect methods and parse arguments through client and constructor aliases', () => {
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
  });
});
