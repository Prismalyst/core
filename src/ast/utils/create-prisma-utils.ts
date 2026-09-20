import type * as TS from 'typescript';

export function createPrismaUtils(ts: typeof TS) {
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
    let current: TS.Node | undefined = node;

    while (current) {
      if (ts.isArrayLiteralExpression(current)) {
        const parent: TS.Node = current.parent;

        if (
          ts.isCallExpression(parent) &&
          parent.arguments.includes(current) &&
          ts.isPropertyAccessExpression(parent.expression) &&
          parent.expression.name.text === '$transaction'
        ) {
          return true;
        }
      }

      current = current.parent;
    }

    return false;
  }

  return {
    isGeneratedPrismaFile,
    isFloatingPrismaPromise,
    isInsidePrismaTransaction,
  };
}

export type PrismaUtils = ReturnType<typeof createPrismaUtils>;
