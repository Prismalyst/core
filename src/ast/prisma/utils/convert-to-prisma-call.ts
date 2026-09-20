import type * as TS from 'typescript';

import { PrismaExpression, PrismaNodeExpression } from '../../../types/prisma.types.js';

import { AstUtils } from '../../utils/create-ast-utils.js';

export function convertToPrismaExpression(
  node: PrismaNodeExpression,
  program: TS.Program,
  { node: nodeUtils, prisma: prismaUtils }: AstUtils,
): PrismaExpression {
  const method = nodeUtils.isNewExpression(node) ? 'PrismaClient' : node.expression.name.text;

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
  const isExpressionInsideLoop = nodeUtils.isInsideLoop(node);
  const isExpressionInsideFunction = nodeUtils.isInsideFunction(node);
  const isExpressionInsideClassMethod = nodeUtils.isInsideClassMethod(node);
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
      parentFunctionName,
      parentMethodName,
    },
    prismaContext: {
      isFloatingPrismaPromise,
      isExpressionInsideTransaction,
    },
    method,
    args: args.map((_, index) => nodeUtils.parseArgument(node, index)),
  };
}
