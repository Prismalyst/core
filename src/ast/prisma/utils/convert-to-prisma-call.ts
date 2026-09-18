import type * as TS from 'typescript';

import { PrismaCall, PrismaCallExpression } from '../../../types/prisma.types.js';

import { AstUtils } from '../../utils/create-ast-utils.js';

export function convertToPrismaCall(
  node: PrismaCallExpression,
  program: TS.Program,
  { node: nodeUtils, prisma: prismaUtils }: AstUtils,
): PrismaCall {
  const methodNode = node.expression.name;
  const method = methodNode.text;

  const { line: startLine, character: startCharacter } = node
    .getSourceFile()
    .getLineAndCharacterOfPosition(node.getStart());

  const { line: endLine, character: endCharacter } = node
    .getSourceFile()
    .getLineAndCharacterOfPosition(node.getEnd());

  const nodeLength = node.getWidth();

  const args = node.arguments;

  const checker = program.getTypeChecker();

  const isFloatingPrismaPromise = prismaUtils.isFloatingPrismaPromise(node, node.parent, checker);
  const isCallInsideTransaction = prismaUtils.isInsidePrismaTransaction(node);
  const isCallInsideLoop = prismaUtils.isInsideLoop(node);

  return {
    node: node,
    method,
    args: args.map((_, index) => nodeUtils.parseArgument(node, index)),
    prisma: {
      isFloatingPrismaPromise,
      isCallInsideTransaction,
      isCallInsideLoop,
    },
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
  };
}
