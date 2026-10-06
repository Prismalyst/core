import type * as TS from 'typescript';

import { PrismaNodeExpression } from '../../../types/prisma.types.js';

import { AstUtils } from '../../utils/create-ast-utils.js';

function isPropertyAccess(
  expression: TS.PropertyAccessExpression | TS.ElementAccessExpression,
  nodeUtils: AstUtils['node'],
): expression is TS.PropertyAccessExpression {
  return nodeUtils.isPropertyAccessExpression(expression);
}

function isElementAccess(
  expression: TS.PropertyAccessExpression | TS.ElementAccessExpression,
  nodeUtils: AstUtils['node'],
): expression is TS.ElementAccessExpression {
  return nodeUtils.isElementAccessExpression(expression);
}

export function defineMethod(node: PrismaNodeExpression, nodeUtils: AstUtils['node']) {
  const isNewExpression = nodeUtils.isNewExpression(node);

  if (isNewExpression) return 'PrismaClient';

  if (isPropertyAccess(node.expression, nodeUtils)) return node.expression.name.text;
  if (isElementAccess(node.expression, nodeUtils))
    return node.expression.argumentExpression.getText();

  return 'unknown';
}
