import type * as TS from 'typescript';

import { AstObject, AstTypeValue, ParsedValue } from '../../types/ast.types.js';

import { getProperty } from './get-property.js';

export function createNodeUtils(ts: typeof TS, checker: TS.TypeChecker) {
  const activeValues = new Set<TS.Node>();

  function isCallExpression(node: TS.Node) {
    return ts.isCallExpression(node);
  }

  function isPropertyAccessExpression(node: TS.Node) {
    return ts.isPropertyAccessExpression(node);
  }

  function isElementAccessExpression(node: TS.Node) {
    return ts.isElementAccessExpression(node);
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
  ): ParsedValue | undefined {
    const argument = node.arguments?.[index];

    if (!argument) {
      return undefined;
    }

    return parseValue(argument, checker);
  }

  function parseObject(node: TS.ObjectLiteralExpression): ParsedValue<AstObject> {
    const fields = new Map<string, ParsedValue>();

    for (const property of node.properties) {
      if (ts.isPropertyAssignment(property)) {
        const name = getPropertyName(property.name);

        const parsed = parseValue(property.initializer, checker);

        fields.set(name, { value: parsed.value, valueNode: parsed.node, node: property.name });
        continue;
      }

      if (ts.isShorthandPropertyAssignment(property)) {
        const parsed = parseValue(property.name, checker);

        fields.set(property.name.text, { ...parsed, node: property.name });
        continue;
      }

      if (ts.isSpreadAssignment(property)) {
        const parsed = parseValue(property.expression, checker);
        const value = parsed.value;

        if (typeof value !== 'object' || value === null) continue;

        for (const name of Object.keys(value)) {
          const field = getProperty(parsed, [Array.isArray(value) ? Number(name) : name]);

          if (field) fields.set(name, field);
        }
      }
    }

    return { value: Object.fromEntries(fields), node };
  }

  function parsePropertyAccess(
    node: TS.PropertyAccessExpression,
    checker: TS.TypeChecker,
  ): ParsedValue {
    const object = parseValue(node.expression, checker);
    const property = getProperty(object, [node.name.text]);

    return { value: property?.value, node };
  }

  function parseIdentifier(node: TS.Identifier, checker: TS.TypeChecker): ParsedValue {
    const symbol = checker.getSymbolAtLocation(node);

    if (!symbol) {
      return { value: node, node };
    }

    const declaration = symbol.valueDeclaration;

    if (!declaration) {
      // The global undefined symbol has no value declaration.
      if (checker.getTypeAtLocation(node).flags & ts.TypeFlags.Undefined) {
        return { value: undefined, node };
      }

      return { value: node, node };
    }

    if (ts.isVariableDeclaration(declaration) && declaration.initializer) {
      const parsed = parseValue(declaration.initializer, checker);

      return { ...parsed, node };
    }

    const type = checker.getTypeAtLocation(node);

    return parseType(type, checker, node);
  }

  function parseType(
    type: TS.Type,
    checker: TS.TypeChecker,
    node: TS.Node,
    activeTypes = new Set<TS.Type>(),
  ): ParsedValue<AstTypeValue> {
    if (activeTypes.has(type)) {
      return { value: { kind: 'type', type: 'unknown' }, node };
    }

    activeTypes.add(type);

    try {
      if (type.flags & ts.TypeFlags.Undefined) return { value: undefined, node };
      if (type.flags & ts.TypeFlags.Null) return { value: null, node };

      if (type.flags & ts.TypeFlags.StringLiteral) {
        return { value: (type as TS.StringLiteralType).value, node };
      }

      if (type.flags & ts.TypeFlags.NumberLiteral) {
        return { value: (type as TS.NumberLiteralType).value, node };
      }

      if (type.flags & ts.TypeFlags.BooleanLiteral) {
        return { value: checker.typeToString(type) === 'true', node };
      }

      if (type.flags & ts.TypeFlags.String) {
        return { value: { kind: 'type', type: 'string' }, node };
      }

      if (type.flags & ts.TypeFlags.Number) {
        return { value: { kind: 'type', type: 'number' }, node };
      }

      if (type.flags & ts.TypeFlags.Boolean) {
        return { value: { kind: 'type', type: 'boolean' }, node };
      }

      if (type.isUnion()) {
        return {
          value: {
            kind: 'union',
            types: type.types.map((member) => parseType(member, checker, node, activeTypes)),
          },
          node,
        };
      }

      if (checker.isArrayType(type)) {
        const elementType = checker.getTypeArguments(type as TS.TypeReference)[0];

        return {
          value: {
            kind: 'array',
            element: elementType
              ? parseType(elementType, checker, node, activeTypes)
              : { value: { kind: 'type', type: 'unknown' }, node },
          },
          node,
        };
      }

      if (type.flags & ts.TypeFlags.Object) {
        const properties = checker.getPropertiesOfType(type);

        return {
          value: Object.fromEntries(
            properties.map((property) => {
              const declaration = property.valueDeclaration ?? property.declarations?.[0];

              if (!declaration) {
                return [property.name, { value: { kind: 'type', type: 'unknown' }, node }];
              }

              const propertyType = checker.getTypeOfSymbolAtLocation(property, declaration);
              const propertyNode = ts.getNameOfDeclaration(declaration) ?? node;

              return [property.name, parseType(propertyType, checker, propertyNode, activeTypes)];
            }),
          ),
          node,
        };
      }

      return { value: { kind: 'type', type: 'unknown' }, node };
    } finally {
      activeTypes.delete(type);
    }
  }

  function parseValue(node: TS.Expression, checker: TS.TypeChecker): ParsedValue {
    if (activeValues.has(node)) return { value: node, node };

    activeValues.add(node);

    try {
      return parseExpression(node, checker);
    } finally {
      activeValues.delete(node);
    }
  }

  function parseExpression(node: TS.Expression, checker: TS.TypeChecker): ParsedValue {
    if (ts.isObjectLiteralExpression(node)) {
      return parseObject(node);
    }

    if (ts.isArrayLiteralExpression(node)) {
      return { value: node.elements.map((element) => parseValue(element, checker)), node };
    }

    if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) {
      return { value: node.text, node };
    }

    if (ts.isNumericLiteral(node)) {
      return { value: Number(node.text), node };
    }

    if (ts.isPrefixUnaryExpression(node) && ts.isNumericLiteral(node.operand)) {
      const value = Number(node.operand.text);

      if (node.operator === ts.SyntaxKind.MinusToken) {
        return { value: -value, node };
      }

      if (node.operator === ts.SyntaxKind.PlusToken) {
        return { value, node };
      }
    }

    if (node.kind === ts.SyntaxKind.TrueKeyword) {
      return { value: true, node };
    }

    if (node.kind === ts.SyntaxKind.FalseKeyword) {
      return { value: false, node };
    }

    if (node.kind === ts.SyntaxKind.NullKeyword) {
      return { value: null, node };
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
        value: { kind: 'template', raw: node.getText(), templateSpans },
        node,
      };
    }

    // getWhere()
    // new Date()
    // etc.
    return { value: node, node };
  }

  return {
    isCallExpression,
    isPropertyAccessExpression,
    isElementAccessExpression,
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
