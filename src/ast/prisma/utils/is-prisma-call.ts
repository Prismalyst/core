import type * as TS from 'typescript';

import { PrismaCallExpression } from '../../../types/prisma.types.js';

import { AstUtils } from '../../utils/create-ast-utils.js';

import { PRISMA_METHODS } from '../../../constants/prisma-methods.constants.js';

export function isPrismaCall(
  node: TS.Node,
  program: TS.Program,
  { node: nodeUtils, prisma: prismaUtils }: AstUtils,
): node is PrismaCallExpression {
  if (nodeUtils.isCallExpression(node) && nodeUtils.isPropertyAccessExpression(node.expression)) {
    const methodNode = node.expression.name;
    const method = methodNode.text;

    if (PRISMA_METHODS.has(method)) {
      const checker = program.getTypeChecker();

      const symbol = checker.getSymbolAtLocation(methodNode);
      const declarations = symbol?.getDeclarations() ?? [];

      const isGeneratedPrismaMethod = prismaUtils.isGeneratedPrismaFile(declarations);

      if (isGeneratedPrismaMethod) return true;
    }
  }

  return false;
}
