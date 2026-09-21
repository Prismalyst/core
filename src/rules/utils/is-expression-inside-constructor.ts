import { PrismaExpression } from '../../types/prisma.types.js';

export function isExpressionInsideConstructor(expression: PrismaExpression) {
  return (
    expression.expressionContext.isExpressionInsideClassMethod &&
    expression.expressionContext.parentMethodName === null
  );
}
