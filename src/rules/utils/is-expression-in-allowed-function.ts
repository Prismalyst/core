import { PrismaExpression } from '../../types/prisma.types.js';

export function isExpressionInAllowedFunction(
  expression: PrismaExpression,
  allowedFunctionsNames: string[],
) {
  return (
    expression.expressionContext.parentFunctionName &&
    allowedFunctionsNames.includes(expression.expressionContext.parentFunctionName)
  );
}
