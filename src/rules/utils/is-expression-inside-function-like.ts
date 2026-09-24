import { ExpressionContext } from '../../types/prisma.types.js';

export function isExpressionInsideFunctionLike(expressionContext: ExpressionContext) {
  return (
    expressionContext.isExpressionInsideFunction || expressionContext.isExpressionInsideClassMethod
  );
}
