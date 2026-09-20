import type { PrismaExpression } from '../../types/prisma.types.js';
import type { Rule } from '../../types/rule.eslint.types.js';

export function noQueryInLoop(expression: PrismaExpression, rule: Rule): boolean {
  const isRuleMethod = rule.methods.includes(expression.method);

  if (!isRuleMethod) return false;

  return expression.prisma.isExpressionInsideLoop;
}
