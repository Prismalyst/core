import { PrismaExpression } from '../../types/prisma.types.js';

export function isExpressionInsideFunctionLike(expression: PrismaExpression) {
  return (
    expression.expressionContext.isExpressionInsideFunction ||
    expression.expressionContext.isExpressionInsideClassMethod
  );
}
