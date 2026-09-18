import type * as TS from 'typescript';

import { AstObject, AstValue } from '../../types/ast.types.js';

export function createNodeUtils(ts: typeof TS) {
  function isCallExpression(node: TS.Node) {
    return ts.isCallExpression(node);
  }

  function isPropertyAccessExpression(node: TS.Node) {
    return ts.isPropertyAccessExpression(node);
  }

  function getPropertyName(name: TS.PropertyName): string {
    if (ts.isIdentifier(name) || ts.isStringLiteral(name) || ts.isNumericLiteral(name)) {
      return name.text;
    }

    return name.getText();
  }

  function parseArgument(node: TS.CallExpression, index = 0): AstValue | undefined {
    const argument = node.arguments[index];

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
    getPropertyName,
    parseArgument,
    parseObject,
    parseValue,
  };
}

export type NodeUtils = ReturnType<typeof createNodeUtils>;
