import type * as TS from 'typescript';

import { PrismaNodeExpression } from '../../../types/prisma.types.js';

import { AstUtils } from '../../utils/create-ast-utils.js';

import { PRISMA_METHODS } from '../../../constants/prisma-methods.constants.js';

export function isPrismaExpression(
  node: TS.Node,
  program: TS.Program,
  { node: nodeUtils, prisma: prismaUtils }: AstUtils,
): node is PrismaNodeExpression {
  if (nodeUtils.isCallExpression(node)) {
    if (!nodeUtils.isPropertyAccessExpression(node.expression)) return false;

    const methodNode = node.expression.name;
    const method = methodNode.text;

    if (!PRISMA_METHODS.has(method)) return false;

    const checker = program.getTypeChecker();

    const symbol = checker.getSymbolAtLocation(methodNode);
    const declarations = symbol?.getDeclarations() ?? [];

    const isGeneratedPrismaMethod = prismaUtils.isGeneratedPrismaFile(declarations);

    if (isGeneratedPrismaMethod) return true;
  }

  if (nodeUtils.isNewExpression(node)) {
    const checker = program.getTypeChecker();

    const symbolLocation = nodeUtils.isPropertyAccessExpression(node.expression)
      ? node.expression.name
      : node.expression;
    const symbol = checker.getSymbolAtLocation(symbolLocation);

    if (!symbol) return false;

    const resolvedSymbol = nodeUtils.resolveAliasedSymbol(symbol, checker);

    if (resolvedSymbol.getName() !== 'PrismaClient') return false;

    const declarations = resolvedSymbol.getDeclarations() ?? [];

    const isGeneratedPrismaClient = prismaUtils.isGeneratedPrismaFile(declarations);

    if (isGeneratedPrismaClient) return true;
  }

  return false;
}
