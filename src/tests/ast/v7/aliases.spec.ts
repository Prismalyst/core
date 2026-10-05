import * as TS from 'typescript';
import { describe, expect, it } from 'vitest';

import { createAstParser } from '../../../ast/parser/create-ast-parser.js';
import { createAstUtils } from '../../../ast/utils/create-ast-utils.js';
import { createTestProgram } from './helpers/create-test-program.js';
import { getPrismaExpressions } from './helpers/get-prisma-expressions.js';

const FIXTURE_PATH = 'src/tests/ast/v7/fixtures/aliases.ts';

describe('Aliases', () => {
  const { program, sourceFile } = createTestProgram(FIXTURE_PATH);

  const { findVariableStatements, findCallExpressions } = createAstParser(TS);

  const checker = program.getTypeChecker();

  const astUtils = createAstUtils(TS, checker);

  const variableStatements = findVariableStatements(sourceFile);
  const callExpressions = findCallExpressions(sourceFile);

  it('should find the client declaration and all four alias declarations', () => {
    expect(variableStatements).toHaveLength(5);
  });

  it('should find all five calls through the client and its aliases', () => {
    expect(callExpressions).toHaveLength(5);
  });

  const prismaExpressions = getPrismaExpressions(callExpressions, { program, astUtils });

  it('should recognize Prisma calls through direct and chained client aliases', () => {
    expect(prismaExpressions).toHaveLength(5);
  });

  it('should detect methods and parse arguments for calls through client aliases', () => {
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
