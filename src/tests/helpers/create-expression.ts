import * as TS from 'typescript';

import type { PrismaExpression, PrismaExpressionExpression } from '../../types/prisma.types.js';

import { createAstParser } from '../../ast/parser/create-ast-parser.js';
import { createNodeUtils } from '../../ast/utils/create-node-utils.js';

const checker = TS.createProgram([], {}).getTypeChecker();

const { parseValue } = createNodeUtils(TS, checker);
const { findCallExpressions } = createAstParser(TS);

export function createExpression(
  method: string,
  model: string | null,
  argument: string,
): Pick<PrismaExpression, 'node' | 'method' | 'args' | 'expressionContext' | 'prismaContext'> {
  const delegate = model ? `.${model.charAt(0).toLowerCase()}${model.slice(1)}` : '';

  const sourceFile = TS.createSourceFile(
    'query.ts',
    `prisma${delegate}.${method}(${argument});`,
    TS.ScriptTarget.Latest,
    true,
  );

  const call = findCallExpressions(sourceFile)[0];

  if (!call) {
    throw new Error('Expected a Prisma method call in the test source.');
  }

  return {
    node: call as PrismaExpressionExpression,
    method,
    args: call.arguments.map((arg) => parseValue(arg, checker)),
    expressionContext: {
      isExpressionInsideLoop: false,
      isExpressionInsideFunction: false,
      isExpressionInsideClassMethod: false,
      isExpressionInsideAwaitExpression: false,
      parentFunctionName: null,
      parentMethodName: null,
    },
    prismaContext: {
      isFloatingPrismaPromise: false,
      isExpressionInsideTransaction: false,
      transactionType: null,
      clientType: 'prisma',
      model,
    },
  };
}
