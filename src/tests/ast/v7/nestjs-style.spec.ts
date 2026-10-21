import * as TS from 'typescript';
import { describe, expect, it } from 'vitest';

import { createAstParser } from '../../../ast/parser/create-ast-parser.js';
import { isPrismaExpression } from '../../../ast/prisma/is-prisma-expression.js';
import { createAstUtils } from '../../../ast/utils/create-ast-utils.js';
import { wrapArguments } from '../../helpers/wrap-arguments.js';
import { createTestProgram } from './helpers/create-test-program.js';
import { getPrismaExpressions } from './helpers/get-prisma-expressions.js';

const FIXTURE_PATH = 'src/tests/ast/v7/fixtures/nestjs-style.ts';

describe('NestJS Style', () => {
  const { program, sourceFile } = createTestProgram(FIXTURE_PATH);

  const { findCallExpressions } = createAstParser(TS);

  const checker = program.getTypeChecker();

  const astUtils = createAstUtils(TS, checker);

  const callExpressions = findCallExpressions(sourceFile);

  const prismaExpressions = getPrismaExpressions(callExpressions, { program, astUtils });

  it('should find 7 call expressions in the fixture', () => {
    expect(callExpressions).toHaveLength(7);
  });

  it('should recognize 6 Prisma call expressions', () => {
    expect(prismaExpressions).toHaveLength(6);
  });

  const expressionContext = {
    isExpressionInsideLoop: false,
    isExpressionInsideFunction: false,
    isExpressionInsideClassMethod: false,
    isExpressionInsideAwaitExpression: true,
    parentFunctionName: null,
    parentMethodName: null,
  };

  const prismaContext = {
    isFloatingPrismaPromise: false,
    isExpressionInsideTransaction: false,
    transactionType: null,
    clientType: 'prisma',
    model: 'User',
  };

  it('should detect the expected parameters for the user query in _byId', () => {
    // await this.prisma.user.findUnique({
    //       where: {
    //         id: userId,
    //       },
    //     })
    expect(prismaExpressions[0]).toEqual(
      expect.objectContaining({
        method: 'findUnique',
        args: wrapArguments([{ where: { id: { kind: 'type', type: 'number' } } }]),
        prismaContext,
        expressionContext: {
          ...expressionContext,
          isExpressionInsideClassMethod: true,
          parentMethodName: '_byId',
        },
      }),
    );
  });

  it('should detect the expected parameters for the user query in _byEmail', () => {
    // await this.prisma.user.findUnique({
    //       where: {
    //         email,
    //       },
    //     })
    expect(prismaExpressions[1]).toEqual(
      expect.objectContaining({
        method: 'findUnique',
        args: wrapArguments([{ where: { email: { kind: 'type', type: 'string' } } }]),
        prismaContext,
        expressionContext: {
          ...expressionContext,
          isExpressionInsideClassMethod: true,
          parentMethodName: '_byEmail',
        },
      }),
    );
  });

  it('should detect the expected parameters for the user query in create', () => {
    // await this.prisma.user.create({
    //       data,
    //     })
    expect(prismaExpressions[2]).toEqual(
      expect.objectContaining({
        method: 'create',
        args: wrapArguments([{ data: { kind: 'type', type: 'unknown' } }]),
        prismaContext,
        expressionContext: {
          ...expressionContext,
          isExpressionInsideClassMethod: true,
          parentMethodName: 'create',
        },
      }),
    );
  });

  it('should detect the expected parameters for the user query in findAll', () => {
    // await this.prisma.user.findMany()
    expect(prismaExpressions[3]).toEqual(
      expect.objectContaining({
        method: 'findMany',
        args: [],
        prismaContext,
        expressionContext: {
          ...expressionContext,
          isExpressionInsideClassMethod: true,
          parentMethodName: 'findAll',
        },
      }),
    );
  });

  it('should detect the expected parameters for the user query in delete', () => {
    // await this.prisma.user.delete({
    //       where: {
    //         id: userId,
    //       },
    //     })
    expect(prismaExpressions[4]).toEqual(
      expect.objectContaining({
        method: 'delete',
        args: wrapArguments([{ where: { id: { kind: 'type', type: 'number' } } }]),
        prismaContext,
        expressionContext: {
          ...expressionContext,
          isExpressionInsideClassMethod: true,
          parentMethodName: 'delete',
        },
      }),
    );
  });

  it('should detect the expected parameters for the user query in update', () => {
    // await this.prisma.user.update({
    //       where: {
    //         id: userId,
    //       },
    //       data,
    //     })
    expect(prismaExpressions[5]).toEqual(
      expect.objectContaining({
        method: 'update',
        args: wrapArguments([
          {
            where: { id: { kind: 'type', type: 'number' } },
            data: { kind: 'type', type: 'unknown' },
          },
        ]),
        prismaContext,
        expressionContext: {
          ...expressionContext,
          isExpressionInsideClassMethod: true,
          parentMethodName: 'update',
        },
      }),
    );
  });

  it('should exclude the constructor super call', () => {
    expect(isPrismaExpression(callExpressions[0]!, program, astUtils)).toBe(false);
  });
});
