import * as TS from 'typescript';
import { describe, expect, it } from 'vitest';

import { createAstParser } from '../../../ast/parser/create-ast-parser.js';
import { createAstUtils } from '../../../ast/utils/create-ast-utils.js';
import { createTestProgram } from './helpers/create-test-program.js';
import { getPrismaExpressions } from './helpers/get-prisma-expressions.js';

const FIXTURE_PATH = 'src/tests/ast/v7/fixtures/argument-parsing.ts';

describe('Argument Parsing', () => {
  const { program, sourceFile } = createTestProgram(FIXTURE_PATH);

  const { findCallExpressions } = createAstParser(TS);

  const checker = program.getTypeChecker();

  const astUtils = createAstUtils(TS, checker);

  const callExpressions = findCallExpressions(sourceFile);

  it('should find all eleven query calls in the argument parsing fixture', () => {
    expect(callExpressions).toHaveLength(11);
  });

  const prismaExpressions = getPrismaExpressions(callExpressions, { program, astUtils });

  it('should recognize model queries and the unsafe raw SQL query as Prisma calls', () => {
    expect(prismaExpressions).toHaveLength(11);
  });

  it('should parse literals, nested filters, variables, spreads, and SQL template arguments', () => {
    expect(prismaExpressions[0]).toEqual(
      expect.objectContaining({
        method: 'findMany',
        args: [],
      }),
    );

    expect(prismaExpressions[1]).toEqual(
      expect.objectContaining({
        method: 'findMany',
        args: [{}],
      }),
    );

    expect(prismaExpressions[2]).toEqual(
      expect.objectContaining({
        method: 'findMany',
        args: [
          {
            where: { active: true },
            take: 10,
            skip: 20,
          },
        ],
      }),
    );

    expect(prismaExpressions[3]).toEqual(
      expect.objectContaining({
        method: 'delete',
        args: [{ where: { id: 1 } }],
      }),
    );

    expect(prismaExpressions[4]).toEqual(
      expect.objectContaining({
        method: 'update',
        args: [
          {
            where: { id: 1 },
            data: { name: 'username' },
          },
        ],
      }),
    );

    expect(prismaExpressions[5]).toEqual(
      expect.objectContaining({
        method: 'findMany',
        args: [
          {
            where: {
              OR: [{ name: 'User' }, { email: { contains: '@gmail.com' } }],
            },
          },
        ],
      }),
    );

    // Everything below is argument parsing based on VS Code hover information
    expect(prismaExpressions[6]).toEqual(
      expect.objectContaining({
        method: 'findMany',
        args: [
          {
            where: { active: { kind: 'type', type: 'boolean' } },
            take: 10,
            skip: 20,
          },
        ],
      }),
    );

    expect(prismaExpressions[7]).toEqual(
      expect.objectContaining({
        method: 'findMany',
        args: [
          {
            where: { active: true },
            take: 10,
            skip: 20,
          },
        ],
      }),
    );

    expect(prismaExpressions[8]).toEqual(
      expect.objectContaining({
        method: 'findMany',
        args: [
          {
            where: { active: { kind: 'type', type: 'boolean' } },
            take: 10,
            skip: 20,
          },
        ],
      }),
    );

    expect(prismaExpressions[9]).toEqual(
      expect.objectContaining({
        method: 'findMany',
        args: [
          {
            where: { active: { kind: 'type', type: 'boolean' } },
            take: 10,
            skip: 20,
          },
        ],
      }),
    );

    expect(prismaExpressions[10]).toEqual(
      expect.objectContaining({
        method: '$queryRawUnsafe',
        args: [
          {
            kind: 'template',
            raw: '`SELECT * FROM ${active}`',
            templateSpans: [{ name: 'active', value: true }],
          },
        ],
      }),
    );
  });
});
