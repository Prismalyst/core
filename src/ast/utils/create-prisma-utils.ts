import path from 'node:path';
import type * as TS from 'typescript';

import type {
  ClientType,
  PrismaNodeExpression,
  TransactionType,
} from '../../types/prisma.types.js';

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
    if (!ts.isCallExpression(node)) return 'unknown';

    if (
      ts.isPropertyAccessExpression(node.expression) ||
      ts.isElementAccessExpression(node.expression)
    ) {
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

        if (!ts.isPropertyAccessExpression(receiver) && !ts.isElementAccessExpression(receiver))
          return 'unknown';

        receiver = receiver.expression;
      }
    }

    return 'unknown';
  }

  // TODO: Make it configurable + rewrite with node:path
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

  function resolveModelName(node: PrismaNodeExpression, checker: TS.TypeChecker): string | null {
    const expression = node.expression;

    if (!ts.isPropertyAccessExpression(expression) && !ts.isElementAccessExpression(expression)) {
      return null;
    }

    let propertyName: string;

    if (ts.isPropertyAccessExpression(expression)) {
      propertyName = expression.name.text;
    } else {
      const argument = expression.argumentExpression;

      if (!ts.isStringLiteralLike(argument)) {
        return null;
      }

      propertyName = argument.text;
    }

    const objectType = checker.getTypeAtLocation(expression.expression);
    const symbol = checker.getPropertyOfType(objectType, propertyName);

    if (!symbol) return null;

    const declarations = symbol.getDeclarations() ?? [];

    for (const declaration of declarations) {
      const fileName = declaration.getSourceFile().fileName;
      const modelsDirectory = path.join('prisma', 'models');
      const sourceDirectory = path.dirname(fileName);

      if (!sourceDirectory.includes(modelsDirectory)) continue;

      const model = path.parse(fileName).name;

      return model;
    }

    return null;
  }

  return {
    resolveTransactionType,
    resolveClientType,
    isGeneratedPrismaFile,
    isFloatingPrismaPromise,
    isInsidePrismaTransaction,
    resolveModelName,
  };
}

export type PrismaUtils = ReturnType<typeof createPrismaUtils>;
