import type { PrismaExpression } from '../../types/prisma.types.js';
import type { Rule, RuleOptions } from '../../types/rule.eslint.types.js';

// TODO: add regexp ignoredFiles (like "./src/**/*.{ts,tsx}", "./prisma/**/*.{ts,tsx}" and etc.)
export function noPrismaClientInFunction(
  expression: PrismaExpression,
  _rule: Rule,
  options: RuleOptions,
): boolean {
  // We can guarantee that incoming expression is a prisma-generated class
  // So we don't need to check it directly with "rule.methods.includes(expression.method)"

  const ignoredFiles = options.ignoredFiles as string[];
  const allowedFunctionsNames = options.allowedFunctionsNames as string[];
  const allowInTests = options.allowInTests as boolean;

  const isExpressionInsideFunctionLike =
    expression.expressionContext.isExpressionInsideFunction ||
    expression.expressionContext.isExpressionInsideClassMethod;

  const isExpressionInsideConstructor =
    expression.expressionContext.isExpressionInsideClassMethod &&
    expression.expressionContext.parentMethodName === null;

  const isExpressionInIgnoredFile = ignoredFiles.includes(expression.filename);

  const isExpressionInAllowedFunction =
    expression.expressionContext.parentFunctionName &&
    allowedFunctionsNames.includes(expression.expressionContext.parentFunctionName);

  const isExpressionInTestFile =
    expression.filename.includes('.test.') || expression.filename.includes('.spec.');

  if (!isExpressionInsideFunctionLike) return false;

  if (isExpressionInsideConstructor) return false;

  if (isExpressionInIgnoredFile) return false;
  if (isExpressionInAllowedFunction) return false;
  if (allowInTests && isExpressionInTestFile) return false;

  return true;
}
