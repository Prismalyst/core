import type * as TS from 'typescript';

export function createAstParser(ts: typeof TS) {
  function findVariableStatements(sourceFile: TS.SourceFile): TS.VariableStatement[] {
    const statements: TS.VariableStatement[] = [];

    function visit(node: TS.Node): void {
      if (ts.isVariableStatement(node)) {
        statements.push(node);
      }

      ts.forEachChild(node, visit);
    }

    visit(sourceFile);

    return statements;
  }

  function findCallExpressions(sourceFile: TS.SourceFile): TS.CallExpression[] {
    const calls: TS.CallExpression[] = [];

    function visit(node: TS.Node): void {
      if (ts.isCallExpression(node)) {
        calls.push(node);
      }

      ts.forEachChild(node, visit);
    }

    visit(sourceFile);

    return calls;
  }

  function findNewExpressions(sourceFile: TS.SourceFile): TS.NewExpression[] {
    const calls: TS.NewExpression[] = [];

    function visit(node: TS.Node): void {
      if (ts.isNewExpression(node)) {
        calls.push(node);
      }

      ts.forEachChild(node, visit);
    }

    visit(sourceFile);

    return calls;
  }

  return {
    findVariableStatements,
    findCallExpressions,
    findNewExpressions,
  };
}

export type AstParser = ReturnType<typeof createAstParser>;
