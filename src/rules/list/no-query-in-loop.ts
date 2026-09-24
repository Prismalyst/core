import type { PrismaExpression } from '../../types/prisma.types.js';
import type { RuleWithoutFunction } from '../../types/rule.eslint.types.js';

export function noQueryInLoop(expression: PrismaExpression, rule: RuleWithoutFunction): boolean {
  const isRuleMethod = rule.methods.includes(expression.method);

  if (!isRuleMethod) return false;

  return expression.expressionContext.isExpressionInsideLoop;
}
