import type * as TS from 'typescript';

import { AstObject, AstTypeValue, AstValue } from '../../types/ast.types.js';

export function createNodeUtils(ts: typeof TS, checker: TS.TypeChecker) {
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

  function getParentMethodName(node: TS.Node): string | null {
    let current = node.parent;

    while (current) {
      if (ts.isFunctionLike(current)) {
        return ts.isMethodDeclaration(current) ? getPropertyName(current.name) : null;
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

  function isInsideAwaitExpression(node: TS.Node): boolean {
    let current = node.parent;

    while (current) {
      if (ts.isAwaitExpression(current)) {
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

    return parseValue(argument, checker);
  }

  function parseObject(node: TS.ObjectLiteralExpression): AstObject {
    let result: AstObject = {};

    for (const property of node.properties) {
      if (ts.isPropertyAssignment(property)) {
        const name = getPropertyName(property.name);

        result[name] = parseValue(property.initializer, checker);
        continue;
      }

      if (ts.isShorthandPropertyAssignment(property)) {
        result[property.name.text] = parseValue(property.name, checker);
      }

      if (ts.isSpreadAssignment(property)) {
        const value = parseValue(property.expression, checker);

        result = { ...result, ...(value as AstObject) };
      }
    }

    return result;
  }

  function parsePropertyAccess(
    node: TS.PropertyAccessExpression,
    checker: TS.TypeChecker,
  ): AstValue | undefined {
    const objectExpression = node.expression;
    const propertyName = node.name.text;

    if (!ts.isIdentifier(objectExpression)) {
      return undefined;
    }

    const symbol = checker.getSymbolAtLocation(objectExpression);

    if (!symbol?.valueDeclaration) {
      return undefined;
    }

    const declaration = symbol.valueDeclaration;

    if (
      !ts.isVariableDeclaration(declaration) ||
      !declaration.initializer ||
      !ts.isObjectLiteralExpression(declaration.initializer)
    ) {
      return undefined;
    }

    const objectLiteral = declaration.initializer;

    for (const property of objectLiteral.properties) {
      // { active: something }
      if (ts.isPropertyAssignment(property) && property.name.getText() === propertyName) {
        return parseValue(property.initializer, checker);
      }

      // { active }
      if (ts.isShorthandPropertyAssignment(property) && property.name.text === propertyName) {
        return parseValue(property.name, checker);
      }
    }

    return undefined;
  }

  function parseIdentifier(node: TS.Identifier, checker: TS.TypeChecker): AstValue | AstTypeValue {
    const symbol = checker.getSymbolAtLocation(node);

    if (!symbol) {
      return node;
    }

    const declaration = symbol.valueDeclaration;

    if (!declaration) {
      return node;
    }

    if (ts.isVariableDeclaration(declaration) && declaration.initializer) {
      return parseValue(declaration.initializer, checker);
    }

    const type = checker.getTypeAtLocation(node);

    return parseType(type, checker);
  }

  function parseType(type: TS.Type, checker: TS.TypeChecker): AstTypeValue {
    if (type.flags & ts.TypeFlags.Undefined) {
      return undefined;
    }

    if (type.flags & ts.TypeFlags.Null) {
      return null;
    }

    if (type.flags & ts.TypeFlags.StringLiteral) {
      return (type as TS.StringLiteralType).value;
    }

    if (type.flags & ts.TypeFlags.NumberLiteral) {
      return (type as TS.NumberLiteralType).value;
    }

    if (type.flags & ts.TypeFlags.BooleanLiteral) {
      return checker.typeToString(type) === 'true';
    }

    if (type.flags & ts.TypeFlags.String) {
      return {
        kind: 'type',
        type: 'string',
      };
    }

    if (type.flags & ts.TypeFlags.Number) {
      return {
        kind: 'type',
        type: 'number',
      };
    }

    if (type.flags & ts.TypeFlags.Boolean) {
      return {
        kind: 'type',
        type: 'boolean',
      };
    }

    if (type.isUnion()) {
      return {
        kind: 'union',
        types: type.types.map((type) => parseType(type, checker)),
      };
    }

    if (type.flags & ts.TypeFlags.Object) {
      const properties = checker.getPropertiesOfType(type);

      return {
        kind: 'object',
        properties: Object.fromEntries(
          properties.map((property) => {
            const declaration = property.valueDeclaration ?? property.declarations?.[0];

            if (!declaration) {
              return [
                property.name,
                {
                  kind: 'type',
                  type: 'unknown',
                } satisfies AstTypeValue,
              ];
            }

            const propertyType = checker.getTypeOfSymbolAtLocation(property, declaration);

            return [property.name, parseType(propertyType, checker)];
          }),
        ),
      };
    }

    return {
      kind: 'type',
      type: 'unknown',
    };
  }

  function parseValue(node: TS.Expression, checker: TS.TypeChecker): AstValue {
    if (ts.isObjectLiteralExpression(node)) {
      return parseObject(node);
    }

    if (ts.isArrayLiteralExpression(node)) {
      return node.elements.map((element) => parseValue(element, checker));
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
      return parseIdentifier(node, checker);
    }

    if (ts.isPropertyAccessExpression(node)) {
      return parsePropertyAccess(node, checker);
    }

    if (ts.isTemplateExpression(node)) {
      const templateSpans = node.templateSpans.map((span) => {
        const value = parseValue(span.expression, checker);

        return {
          name: span.expression.getText(),
          value,
        };
      });

      return {
        kind: 'template',
        raw: node.getText(),
        templateSpans,
      };
    }

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
    getParentMethodName,
    isInsideLoop,
    isInsideFunction,
    isInsideClassMethod,
    isInsideAwaitExpression,
    parseArgument,
    parseObject,
    parseValue,
  };
}

export type NodeUtils = ReturnType<typeof createNodeUtils>;
