import * as TS from 'typescript';
import { describe, expect, it } from 'vitest';

import { createAstParser } from '../../../ast/parser/create-ast-parser.js';
import { isPrismaExpression } from '../../../ast/prisma/is-prisma-expression.js';
import { createAstUtils } from '../../../ast/utils/create-ast-utils.js';
import { createTestProgram } from './helpers/create-test-program.js';
import { getPrismaExpressions } from './helpers/get-prisma-expressions.js';

const FIXTURE_PATH = 'src/tests/ast/v7/fixtures/nestjs-style.ts';

describe('NestJS Style', () => {
  const { program, sourceFile } = createTestProgram(FIXTURE_PATH);

  const { findCallExpressions } = createAstParser(TS);

  const checker = program.getTypeChecker();

  const astUtils = createAstUtils(TS, checker);

  const callExpressions = findCallExpressions(sourceFile);

  it('should find the constructor super call and all six service query calls', () => {
    expect(callExpressions).toHaveLength(7);
  });

  const prismaExpressions = getPrismaExpressions(callExpressions, { program, astUtils });

  it('should find all prisma expressions through the injected service', () => {
    expect(prismaExpressions).toHaveLength(6);
  });

  it('should exclude the constructor super call', () => {
    expect(isPrismaExpression(callExpressions[0]!, program, astUtils)).toBe(false);
  });

  it('should detect the method and arguments for each prisma call', () => {
    expect(prismaExpressions[0]).toEqual(
      expect.objectContaining({
        method: 'findUnique',
        args: [{ where: { id: { kind: 'type', type: 'number' } } }],
      }),
    );

    expect(prismaExpressions[1]).toEqual(
      expect.objectContaining({
        method: 'findUnique',
        args: [{ where: { email: { kind: 'type', type: 'string' } } }],
      }),
    );

    expect(prismaExpressions[2]).toEqual(
      expect.objectContaining({
        method: 'create',
        args: [{ data: { kind: 'type', type: 'unknown' } }],
      }),
    );

    expect(prismaExpressions[3]).toEqual(
      expect.objectContaining({
        method: 'findMany',
        args: [],
      }),
    );

    expect(prismaExpressions[4]).toEqual(
      expect.objectContaining({
        method: 'delete',
        args: [{ where: { id: { kind: 'type', type: 'number' } } }],
      }),
    );

    expect(prismaExpressions[5]).toEqual(
      expect.objectContaining({
        method: 'update',
        args: [
          {
            where: { id: { kind: 'type', type: 'number' } },
            data: { kind: 'type', type: 'unknown' },
          },
        ],
      }),
    );
  });

  it('should detect the prisma and class method context for each call', () => {
    const parentMethodNames = ['_byId', '_byEmail', 'create', 'findAll', 'delete', 'update'];

    for (const [index, prismaExpression] of prismaExpressions.entries()) {
      expect(prismaExpression.prismaContext).toEqual({
        isFloatingPrismaPromise: false,
        isExpressionInsideTransaction: false,
        transactionType: null,
        clientType: 'prisma',
        model: 'User',
      });

      expect(prismaExpression.expressionContext).toEqual({
        isExpressionInsideLoop: false,
        isExpressionInsideFunction: false,
        isExpressionInsideClassMethod: true,
        isExpressionInsideAwaitExpression: true,
        parentFunctionName: null,
        parentMethodName: parentMethodNames[index],
      });
    }
  });
});
