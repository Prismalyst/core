import { PrismaExpression } from '../../types/prisma.types.js';
import { Rule } from '../../types/rule.eslint.types.js';

export function noFloatingPrismaPromise(expression: PrismaExpression, rule: Rule) {
  const isRuleMethod = rule.methods.includes(expression.method);

  if (!isRuleMethod) return false;

  return (
    expression.prismaContext.isFloatingPrismaPromise &&
    !expression.prismaContext.isExpressionInsideTransaction
  );
}
