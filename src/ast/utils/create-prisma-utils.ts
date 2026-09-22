import type * as TS from 'typescript';

import type { ClientType, TransactionType } from '../../types/prisma.types.js';

export function createPrismaUtils(ts: typeof TS) {
  function getTransactionType(node: TS.Node): TransactionType | null {
    if (
      !ts.isCallExpression(node) ||
      !ts.isPropertyAccessExpression(node.expression) ||
      node.expression.name.text !== '$transaction'
    )
      return null;

    const argument = node.arguments[0];

    if (!argument) return null;
    if (ts.isArrayLiteralExpression(argument)) return 'sequential';
    if (ts.isArrowFunction(argument) || ts.isFunctionExpression(argument)) return 'interactive';

    return null;
  }

  function resolveTransactionType(node: TS.Node): TransactionType | null {
    const directType = getTransactionType(node);

    if (directType) return directType;

    return findContainingTransactionType(node);
  }

  function findContainingTransactionType(node: TS.Node): TransactionType | null {
    let current = node;

    while (current.parent) {
      const parent = current.parent;

      if (ts.isCallExpression(parent) && parent.arguments[0] === current) {
        const type = getTransactionType(parent);

        if (type) return type;
      }

      current = parent;
    }

    return null;
  }

  function resolveClientType(node: TS.Node, checker: TS.TypeChecker): ClientType {
    if (!ts.isCallExpression(node) || !ts.isPropertyAccessExpression(node.expression)) {
      return 'unknown';
    }

    let receiver = node.expression.expression;

    while (true) {
      const type = checker.getTypeAtLocation(receiver);
      const connect = checker.getPropertyOfType(type, '$connect');
      const queryRaw = checker.getPropertyOfType(type, '$queryRaw');

      if (isGeneratedPrismaFile(connect?.getDeclarations() ?? [])) return 'prisma';

      // Transaction clients retain query methods but omit $connect.
      if (!connect && isGeneratedPrismaFile(queryRaw?.getDeclarations() ?? [])) {
        return 'transaction';
      }

      if (!ts.isPropertyAccessExpression(receiver)) return 'unknown';

      receiver = receiver.expression;
    }
  }

  function isGeneratedPrismaFile(declarations: TS.Declaration[]) {
    return declarations.some((declaration) => {
      const fileName = declaration.getSourceFile().fileName;

      return fileName.includes('.prisma/client') || fileName.includes('generated/prisma');
    });
  }

  function isFloatingPrismaPromise(
    node: TS.Node,
    parent: TS.Node,
    checker: TS.TypeChecker,
  ): boolean {
    const isAwaited = ts.isAwaitExpression(parent);
    const isReturnStatement = ts.isReturnStatement(parent);

    const type = checker.getTypeAtLocation(node);
    const isPromise = checker.getPropertyOfType(type, 'then') !== undefined;

    const isFloating = isPromise && !isAwaited && !isReturnStatement;

    return isFloating;
  }

  function isInsidePrismaTransaction(node: TS.Node): boolean {
    return findContainingTransactionType(node) !== null;
  }

  return {
    resolveTransactionType,
    resolveClientType,
    isGeneratedPrismaFile,
    isFloatingPrismaPromise,
    isInsidePrismaTransaction,
  };
}

export type PrismaUtils = ReturnType<typeof createPrismaUtils>;
