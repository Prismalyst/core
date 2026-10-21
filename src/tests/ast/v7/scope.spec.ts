import * as TS from 'typescript';
import { describe, expect, it } from 'vitest';

import { createAstParser } from '../../../ast/parser/create-ast-parser.js';
import { createAstUtils } from '../../../ast/utils/create-ast-utils.js';
import { wrapArguments } from '../../helpers/wrap-arguments.js';
import { createTestProgram } from './helpers/create-test-program.js';
import { getPrismaExpressions } from './helpers/get-prisma-expressions.js';

const FIXTURE_PATH = 'src/tests/ast/v7/fixtures/scope.ts';

describe('Scope', () => {
  const { program, sourceFile } = createTestProgram(FIXTURE_PATH);

  const { findCallExpressions } = createAstParser(TS);

  const checker = program.getTypeChecker();

  const astUtils = createAstUtils(TS, checker);

  const callExpressions = findCallExpressions(sourceFile);

  const prismaExpressions = getPrismaExpressions(callExpressions, { program, astUtils });

  it('should find 26 call expressions in the fixture', () => {
    expect(callExpressions).toHaveLength(26);
  });

  it('should recognize 19 Prisma call expressions', () => {
    expect(prismaExpressions).toHaveLength(19);
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

  it('should detect the expected parameters for the top-level query', () => {
    // await prisma.user.findMany()
    expect(prismaExpressions[0]).toEqual(
      expect.objectContaining({ method: 'findMany', args: [], prismaContext, expressionContext }),
    );
  });

  it('should detect the expected parameters for the function declaration', () => {
    // await prisma.user.findMany()
    expect(prismaExpressions[1]).toEqual(
      expect.objectContaining({
        method: 'findMany',
        args: [],
        prismaContext,
        expressionContext: {
          ...expressionContext,
          isExpressionInsideFunction: true,
          parentFunctionName: 'loadUsers',
        },
      }),
    );
  });

  it('should detect the expected parameters for the arrow function', () => {
    // await prisma.user.findMany()
    expect(prismaExpressions[2]).toEqual(
      expect.objectContaining({
        method: 'findMany',
        args: [],
        prismaContext,
        expressionContext: { ...expressionContext, isExpressionInsideFunction: true },
      }),
    );
  });

  it('should detect the expected parameters for the function expression', () => {
    // await prisma.user.findMany()
    expect(prismaExpressions[3]).toEqual(
      expect.objectContaining({
        method: 'findMany',
        args: [],
        prismaContext,
        expressionContext: { ...expressionContext, isExpressionInsideFunction: true },
      }),
    );
  });

  it('should detect the expected parameters for the top-level if branch', () => {
    // await prisma.user.findMany({ where: { active: true } })
    expect(prismaExpressions[4]).toEqual(
      expect.objectContaining({
        method: 'findMany',
        args: wrapArguments([{ where: { active: true } }]),
        prismaContext,
        expressionContext,
      }),
    );
  });

  it('should detect the expected parameters for the top-level else branch', () => {
    // await prisma.user.findMany({ where: { active: false } })
    expect(prismaExpressions[5]).toEqual(
      expect.objectContaining({
        method: 'findMany',
        args: wrapArguments([{ where: { active: false } }]),
        prismaContext,
        expressionContext,
      }),
    );
  });

  it('should detect the expected parameters for the function if branch', () => {
    // await prisma.user.findMany({ where: { active: true } })
    expect(prismaExpressions[6]).toEqual(
      expect.objectContaining({
        method: 'findMany',
        args: wrapArguments([{ where: { active: true } }]),
        prismaContext,
        expressionContext: {
          ...expressionContext,
          isExpressionInsideFunction: true,
          parentFunctionName: 'loadUsersByStatus',
        },
      }),
    );
  });

  it('should detect the expected parameters for the function else branch', () => {
    // await prisma.user.findMany({ where: { active: false } })
    expect(prismaExpressions[7]).toEqual(
      expect.objectContaining({
        method: 'findMany',
        args: wrapArguments([{ where: { active: false } }]),
        prismaContext,
        expressionContext: {
          ...expressionContext,
          isExpressionInsideFunction: true,
          parentFunctionName: 'loadUsersByStatus',
        },
      }),
    );
  });

  it('should detect the expected parameters for the for loop', () => {
    // await prisma.user.findMany()
    expect(prismaExpressions[8]).toEqual(
      expect.objectContaining({
        method: 'findMany',
        args: [],
        prismaContext,
        expressionContext: { ...expressionContext, isExpressionInsideLoop: true },
      }),
    );
  });

  it('should detect the expected parameters for the for...of loop', () => {
    // await prisma.user.findUnique({ where: { id: userId } })
    expect(prismaExpressions[9]).toEqual(
      expect.objectContaining({
        method: 'findUnique',
        args: wrapArguments([{ where: { id: { kind: 'type', type: 'number' } } }]),
        prismaContext,
        expressionContext: { ...expressionContext, isExpressionInsideLoop: true },
      }),
    );
  });

  it('should detect the expected parameters for the for...in loop', () => {
    // await prisma.user.findMany({ where: { name } })
    expect(prismaExpressions[10]).toEqual(
      expect.objectContaining({
        method: 'findMany',
        args: wrapArguments([{ where: { name: { kind: 'type', type: 'string' } } }]),
        prismaContext,
        expressionContext: { ...expressionContext, isExpressionInsideLoop: true },
      }),
    );
  });

  it('should detect the expected parameters for the while loop', () => {
    // await prisma.user.findMany()
    expect(prismaExpressions[11]).toEqual(
      expect.objectContaining({
        method: 'findMany',
        args: [],
        prismaContext,
        expressionContext: { ...expressionContext, isExpressionInsideLoop: true },
      }),
    );
  });

  it('should detect the expected parameters for the do...while loop', () => {
    // await prisma.user.findMany()
    expect(prismaExpressions[12]).toEqual(
      expect.objectContaining({
        method: 'findMany',
        args: [],
        prismaContext,
        expressionContext: { ...expressionContext, isExpressionInsideLoop: true },
      }),
    );
  });

  it('should detect the expected parameters for the map callback', () => {
    // await prisma.user.findUnique({ where: { id: userId } })
    expect(prismaExpressions[13]).toEqual(
      expect.objectContaining({
        method: 'findUnique',
        args: wrapArguments([{ where: { id: { kind: 'type', type: 'number' } } }]),
        prismaContext,
        expressionContext: {
          ...expressionContext,
          isExpressionInsideLoop: true,
          isExpressionInsideFunction: true,
        },
      }),
    );
  });

  it('should detect the expected parameters for the Promise callback', () => {
    // await prisma.user.findUnique({ where: { id: userId } })
    expect(prismaExpressions[14]).toEqual(
      expect.objectContaining({
        method: 'findUnique',
        args: wrapArguments([{ where: { id: { kind: 'type', type: 'number' } } }]),
        prismaContext,
        expressionContext: { ...expressionContext, isExpressionInsideFunction: true },
      }),
    );
  });

  it('should detect the expected parameters for the outer function', () => {
    // await prisma.user.findMany()
    expect(prismaExpressions[15]).toEqual(
      expect.objectContaining({
        method: 'findMany',
        args: [],
        prismaContext,
        expressionContext: {
          ...expressionContext,
          isExpressionInsideFunction: true,
          parentFunctionName: 'loadUsersWithNestedFunctions',
        },
      }),
    );
  });

  it('should detect the expected parameters for the nested function declaration', () => {
    // await prisma.post.findMany()
    expect(prismaExpressions[16]).toEqual(
      expect.objectContaining({
        method: 'findMany',
        args: [],
        prismaContext: { ...prismaContext, model: 'Post' },
        expressionContext: {
          ...expressionContext,
          isExpressionInsideFunction: true,
          parentFunctionName: 'loadPosts',
        },
      }),
    );
  });

  it('should detect the expected parameters for the nested arrow function', () => {
    // await prisma.comment.findMany()
    expect(prismaExpressions[17]).toEqual(
      expect.objectContaining({
        method: 'findMany',
        args: [],
        prismaContext: { ...prismaContext, model: 'Comment' },
        expressionContext: { ...expressionContext, isExpressionInsideFunction: true },
      }),
    );
  });

  it('should detect the expected parameters for the function declared inside a loop', () => {
    // await prisma.user.findUnique({ where: { id: userId } })
    expect(prismaExpressions[18]).toEqual(
      expect.objectContaining({
        method: 'findUnique',
        args: wrapArguments([{ where: { id: { kind: 'type', type: 'number' } } }]),
        prismaContext,
        expressionContext: {
          ...expressionContext,
          isExpressionInsideFunction: true,
          parentFunctionName: 'loadUserInsideLoop',
        },
      }),
    );
  });
});
