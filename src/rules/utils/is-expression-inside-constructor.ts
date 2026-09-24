import { ExpressionContext } from '../../types/prisma.types.js';

export function isExpressionInsideConstructor(expressionContext: ExpressionContext) {
  return (
    expressionContext.isExpressionInsideClassMethod && expressionContext.parentMethodName === null
  );
}
