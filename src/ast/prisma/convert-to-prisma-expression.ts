import type * as TS from 'typescript';

import { PrismaExpression, PrismaNodeExpression } from '../../types/prisma.types.js';

import { AstUtils } from '../utils/create-ast-utils.js';
import { defineMethod } from './utils/define-method.js';

export function convertToPrismaExpression(
  node: PrismaNodeExpression,
  program: TS.Program,
  { node: nodeUtils, prisma: prismaUtils }: AstUtils,
): PrismaExpression {
  const method = defineMethod(node, nodeUtils);

  const { line: startLine, character: startCharacter } = node
    .getSourceFile()
    .getLineAndCharacterOfPosition(node.getStart());

  const { line: endLine, character: endCharacter } = node
    .getSourceFile()
    .getLineAndCharacterOfPosition(node.getEnd());

  const nodeLength = node.getWidth();
  const filename = node.getSourceFile().fileName;

  const args = node.arguments ?? [];

  const checker = program.getTypeChecker();

  const isFloatingPrismaPromise = prismaUtils.isFloatingPrismaPromise(node, node.parent, checker);
  const isExpressionInsideTransaction = prismaUtils.isInsidePrismaTransaction(node);
  const transactionType = prismaUtils.resolveTransactionType(node);
  const clientType = prismaUtils.resolveClientType(node, checker);
  const model = prismaUtils.resolveModelName(node, checker);

  const isExpressionInsideLoop = nodeUtils.isInsideLoop(node);
  const isExpressionInsideFunction = nodeUtils.isInsideFunction(node);
  const isExpressionInsideClassMethod = nodeUtils.isInsideClassMethod(node);
  const isExpressionInsideAwaitExpression = nodeUtils.isInsideAwaitExpression(node);
  const parentFunctionName = nodeUtils.getParentFunctionName(node);
  const parentMethodName = nodeUtils.getParentMethodName(node);

  return {
    node: node,
    range: {
      start: {
        line: startLine,
        character: startCharacter,
      },
      end: {
        line: endLine,
        character: endCharacter,
      },
      length: nodeLength,
    },
    filename,
    expressionContext: {
      isExpressionInsideLoop,
      isExpressionInsideFunction,
      isExpressionInsideClassMethod,
      isExpressionInsideAwaitExpression,
      parentFunctionName,
      parentMethodName,
    },
    prismaContext: {
      isFloatingPrismaPromise,
      isExpressionInsideTransaction,
      transactionType,
      clientType,
      model,
    },
    method,
    args: args.map((argument) => nodeUtils.parseValue(argument, checker)),
  };
}
