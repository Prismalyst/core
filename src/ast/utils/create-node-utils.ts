import type * as TS from 'typescript';

import { AstObject, AstValue } from '../../types/ast.types.js';

export function createNodeUtils(ts: typeof TS) {
  function isCallExpression(node: TS.Node) {
    return ts.isCallExpression(node);
  }

  function isPropertyAccessExpression(node: TS.Node) {
    return ts.isPropertyAccessExpression(node);
  }

  function isNewExpression(node: TS.Node) {
    return ts.isNewExpression(node);
  }

  function getPropertyName(name: TS.PropertyName): string {
    if (ts.isIdentifier(name) || ts.isStringLiteral(name) || ts.isNumericLiteral(name)) {
      return name.text;
    }

    return name.getText();
  }

  function resolveAliasedSymbol(symbol: TS.Symbol, checker: TS.TypeChecker): TS.Symbol {
    return symbol.flags & ts.SymbolFlags.Alias ? checker.getAliasedSymbol(symbol) : symbol;
  }

  function getParentFunctionName(node: TS.Node): string | null {
    let current = node.parent;

    while (current) {
      if (ts.isFunctionLike(current)) {
        return ts.isFunctionDeclaration(current) ? (current.name?.text ?? null) : null;
      }

      current = current.parent;
    }

    return null;
  }

  function isInsideLoop(node: TS.Node): boolean {
    let current: TS.Node | undefined = node;

    while (current) {
      if (
        ts.isForStatement(current) ||
        ts.isForOfStatement(current) ||
        ts.isForInStatement(current) ||
        ts.isWhileStatement(current) ||
        ts.isDoStatement(current)
      ) {
        return true;
      }

      if (ts.isFunctionLike(current)) {
        const parent = current.parent;

        if (
          ts.isCallExpression(parent) &&
          parent.arguments.includes(current as TS.Expression) &&
          ts.isPropertyAccessExpression(parent.expression) &&
          ['map', 'filter', 'reduce'].includes(parent.expression.name.text)
        ) {
          return true;
        }

        return false;
      }

      current = current.parent;
    }

    return false;
  }

  function isInsideFunction(node: TS.Node): boolean {
    let current = node.parent;

    while (current) {
      if (
        ts.isFunctionLike(current) &&
        !(ts.isClassDeclaration(current.parent) || ts.isClassExpression(current.parent))
      ) {
        return true;
      }

      current = current.parent;
    }

    return false;
  }

  function isInsideClassMethod(node: TS.Node): boolean {
    let current = node.parent;

    while (current) {
      if (
        ts.isFunctionLike(current) &&
        (ts.isClassDeclaration(current.parent) || ts.isClassExpression(current.parent))
      ) {
        return true;
      }

      current = current.parent;
    }

    return false;
  }

  function parseArgument(
    node: TS.CallExpression | TS.NewExpression,
    index = 0,
  ): AstValue | undefined {
    const argument = node.arguments?.[index];

    if (!argument) {
      return undefined;
    }

    return parseValue(argument);
  }

  function parseObject(node: TS.ObjectLiteralExpression): AstObject {
    const result: AstObject = {};

    for (const property of node.properties) {
      if (ts.isPropertyAssignment(property)) {
        const name = getPropertyName(property.name);

        result[name] = parseValue(property.initializer);
        continue;
      }

      if (ts.isShorthandPropertyAssignment(property)) {
        result[property.name.text] = property.name;
      }
    }

    return result;
  }

  function parseValue(node: TS.Expression): AstValue {
    if (ts.isObjectLiteralExpression(node)) {
      return parseObject(node);
    }

    if (ts.isArrayLiteralExpression(node)) {
      return node.elements.map(parseValue);
    }

    if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) {
      return node.text;
    }

    if (ts.isNumericLiteral(node)) {
      return Number(node.text);
    }

    if (ts.isPrefixUnaryExpression(node) && ts.isNumericLiteral(node.operand)) {
      const value = Number(node.operand.text);

      if (node.operator === ts.SyntaxKind.MinusToken) {
        return -value;
      }

      if (node.operator === ts.SyntaxKind.PlusToken) {
        return value;
      }
    }

    if (node.kind === ts.SyntaxKind.TrueKeyword) {
      return true;
    }

    if (node.kind === ts.SyntaxKind.FalseKeyword) {
      return false;
    }

    if (node.kind === ts.SyntaxKind.NullKeyword) {
      return null;
    }

    if (ts.isIdentifier(node)) {
      /**
       * For some reason { id: undefined } is not a `ts.SyntaxKind.UndefinedKeyword`
       * So we need to check it manually
       */
      if (node.text === 'undefined') {
        return undefined;
      }
    }

    if (ts.isTemplateExpression(node)) {
      return {
        kind: 'template',
        raw: node.getText(),
      };
    }

    // id
    // user.id
    // getWhere()
    // new Date()
    // etc.
    return node;
  }

  return {
    isCallExpression,
    isPropertyAccessExpression,
    isNewExpression,
    getPropertyName,
    resolveAliasedSymbol,
    getParentFunctionName,
    isInsideLoop,
    isInsideFunction,
    isInsideClassMethod,
    parseArgument,
    parseObject,
    parseValue,
  };
}

export type NodeUtils = ReturnType<typeof createNodeUtils>;
