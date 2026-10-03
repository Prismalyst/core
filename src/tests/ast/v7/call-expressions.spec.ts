import * as TS from 'typescript';
import { describe, expect, it } from 'vitest';

import { createAstParser } from '../../../ast/parser/create-ast-parser.js';
import { createAstUtils } from '../../../ast/utils/create-ast-utils.js';
import { createTestProgram } from './helpers/create-test-program.js';
import { getPrismaExpressions } from './helpers/get-prisma-expressions.js';

const FIXTURE_PATH = 'src/tests/ast/v7/fixtures/call-expressions.ts';

describe('Call Expressions', () => {
  const { program, sourceFile } = createTestProgram(FIXTURE_PATH);

  const { findCallExpressions } = createAstParser(TS);

  const astUtils = createAstUtils(TS);

  const callExpressions = findCallExpressions(sourceFile);

  it('should find all call expressions', () => {
    expect(callExpressions).toHaveLength(10);
  });

  const prismaExpressions = getPrismaExpressions(callExpressions, { program, astUtils });

  it('should find all prisma expressions', () => {
    expect(prismaExpressions).toHaveLength(10);
  });

  it('should be valid prisma expressions', () => {
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

    expect(prismaExpressions[5]).toEqual(
      expect.objectContaining({
        method: '$transaction',
      }),
    );

    expect(prismaExpressions[6]).toEqual(
      expect.objectContaining({
        method: 'findMany',
        args: [],
      }),
    );

    expect(prismaExpressions[7]).toEqual(
      expect.objectContaining({
        method: 'findFirst',
        args: [],
      }),
    );

    expect(prismaExpressions[8]).toEqual(
      expect.objectContaining({
        method: '$connect',
        args: [],
      }),
    );

    expect(prismaExpressions[9]).toEqual(
      expect.objectContaining({
        method: '$disconnect',
        args: [],
      }),
    );
  });
});
