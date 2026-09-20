import type { PrismaExpression } from '../../types/prisma.types.js';
import type { Rule, RuleOptions } from '../../types/rule.eslint.types.js';

export function noPrismaClientInFunction(
  expression: PrismaExpression,
  rule: Rule,
  options: RuleOptions,
): boolean {
  // We can guarantee that incoming expression is a prisma-generated class
  // So we don't need to check it directly with "rule.methods.includes(expression.method)"

  const ignoredFiles = options.ignoredFiles;
  const allowedFunctionsNames = options.allowedFunctionsNames;
  const allowInTests = options.allowInTests;

  const isExpressionInsideFunctionLike =
    expression.prisma.isExpressionInsideFunction || expression.prisma.isExpressionInsideClassMethod;

  
}
