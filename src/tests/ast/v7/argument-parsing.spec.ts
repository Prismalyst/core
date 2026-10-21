import * as TS from 'typescript';
import { describe, expect, it } from 'vitest';

import { createAstParser } from '../../../ast/parser/create-ast-parser.js';
import { createAstUtils } from '../../../ast/utils/create-ast-utils.js';
import { wrapArguments } from '../../helpers/wrap-arguments.js';
import { createTestProgram } from './helpers/create-test-program.js';
import { getPrismaExpressions } from './helpers/get-prisma-expressions.js';

const FIXTURE_PATH = 'src/tests/ast/v7/fixtures/argument-parsing.ts';

describe('Argument Parsing', () => {
  const { program, sourceFile } = createTestProgram(FIXTURE_PATH);

  const { findCallExpressions } = createAstParser(TS);

  const checker = program.getTypeChecker();

  const astUtils = createAstUtils(TS, checker);

  const callExpressions = findCallExpressions(sourceFile);

  const prismaExpressions = getPrismaExpressions(callExpressions, { program, astUtils });

  it('should recognize 11 Prisma call expressions', () => {
    expect(prismaExpressions).toHaveLength(11);
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

  it('should detect the expected parameters for a query without arguments', () => {
    // await prisma.user.findMany()
    expect(prismaExpressions[0]).toEqual(
      expect.objectContaining({ method: 'findMany', args: [], prismaContext, expressionContext }),
    );
  });

  it('should detect the expected parameters for the empty options', () => {
    // await prisma.user.findMany({})
    expect(prismaExpressions[1]).toEqual(
      expect.objectContaining({
        method: 'findMany',
        args: wrapArguments([{}]),
        prismaContext,
        expressionContext,
      }),
    );
  });

  it('should detect the expected parameters for the literal filters and pagination', () => {
    // await prisma.user.findMany({
    //   where: { active: true },
    //   take: 10,
    //   skip: 20,
    // })
    expect(prismaExpressions[2]).toEqual(
      expect.objectContaining({
        method: 'findMany',
        args: wrapArguments([{ where: { active: true }, take: 10, skip: 20 }]),
        prismaContext,
        expressionContext,
      }),
    );
  });

  it('should detect the expected parameters for the numeric ID filter', () => {
    // await prisma.user.delete({
    //   where: {
    //     id: 1,
    //   },
    // })
    expect(prismaExpressions[3]).toEqual(
      expect.objectContaining({
        method: 'delete',
        args: wrapArguments([{ where: { id: 1 } }]),
        prismaContext,
        expressionContext,
      }),
    );
  });

  it('should detect the expected parameters for the update data', () => {
    // await prisma.user.update({
    //   where: {
    //     id: 1,
    //   },
    //   data: {
    //     name: 'username',
    //   },
    // })
    expect(prismaExpressions[4]).toEqual(
      expect.objectContaining({
        method: 'update',
        args: wrapArguments([{ where: { id: 1 }, data: { name: 'username' } }]),
        prismaContext,
        expressionContext,
      }),
    );
  });

  it('should detect the expected parameters for the nested OR filters', () => {
    // await prisma.user.findMany({
    //   where: {
    //     OR: [{ name: 'User' }, { email: { contains: '@gmail.com' } }],
    //   },
    // })
    expect(prismaExpressions[5]).toEqual(
      expect.objectContaining({
        method: 'findMany',
        args: wrapArguments([
          { where: { OR: [{ name: 'User' }, { email: { contains: '@gmail.com' } }] } },
        ]),
        prismaContext,
        expressionContext,
      }),
    );
  });

  it('should detect the expected parameters for the property access filter', () => {
    // await prisma.user.findMany({
    //   where: { active: whereCondition.active },
    //   take: 10,
    //   skip: 20,
    // })
    expect(prismaExpressions[6]).toEqual(
      expect.objectContaining({
        method: 'findMany',
        args: wrapArguments([
          { where: { active: { kind: 'type', type: 'boolean' } }, take: 10, skip: 20 },
        ]),
        prismaContext,
        expressionContext,
      }),
    );
  });

  it('should detect the expected parameters for the shorthand filter', () => {
    // await prisma.user.findMany({
    //   where: { active },
    //   take: 10,
    //   skip: 20,
    // })
    expect(prismaExpressions[7]).toEqual(
      expect.objectContaining({
        method: 'findMany',
        args: wrapArguments([{ where: { active: true }, take: 10, skip: 20 }]),
        prismaContext,
        expressionContext,
      }),
    );
  });

  it('should detect the expected parameters for the variable filter', () => {
    // await prisma.user.findMany({
    //   where: whereCondition,
    //   take: 10,
    //   skip: 20,
    // })
    expect(prismaExpressions[8]).toEqual(
      expect.objectContaining({
        method: 'findMany',
        args: wrapArguments([
          { where: { active: { kind: 'type', type: 'boolean' } }, take: 10, skip: 20 },
        ]),
        prismaContext,
        expressionContext,
      }),
    );
  });

  it('should detect the expected parameters for the spread filter', () => {
    // await prisma.user.findMany({
    //   where: { ...whereCondition },
    //   take: 10,
    //   skip: 20,
    // })
    expect(prismaExpressions[9]).toEqual(
      expect.objectContaining({
        method: 'findMany',
        args: wrapArguments([
          { where: { active: { kind: 'type', type: 'boolean' } }, take: 10, skip: 20 },
        ]),
        prismaContext,
        expressionContext,
      }),
    );
  });

  it('should detect the expected parameters for the SQL template', () => {
    // await prisma.$queryRawUnsafe(`SELECT * FROM ${active}`)
    expect(prismaExpressions[10]).toEqual(
      expect.objectContaining({
        method: '$queryRawUnsafe',
        args: wrapArguments([
          {
            kind: 'template',
            raw: '`SELECT * FROM ${active}`',
            templateSpans: [{ name: 'active', value: true }],
          },
        ]),
        prismaContext: { ...prismaContext, model: null },
        expressionContext,
      }),
    );
  });
});
