import { ExpressionContext } from '../../types/prisma.types.js';

export function isExpressionInAllowedFunction(
  expressionContext: ExpressionContext,
  allowedFunctionsNames: string[],
) {
  return (
    expressionContext.parentFunctionName &&
    allowedFunctionsNames.includes(expressionContext.parentFunctionName)
  );
}
