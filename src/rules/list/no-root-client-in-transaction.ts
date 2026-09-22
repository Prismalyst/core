import type { PrismaExpression } from '../../types/prisma.types.js';
import type { Rule } from '../../types/rule.eslint.types.js';

export function noRootClientInTransaction(expression: PrismaExpression, rule: Rule): boolean {
  const isRuleMethod = rule.methods.includes(expression.method);

  if (!isRuleMethod) return false;

  if (!expression.prismaContext.isExpressionInsideTransaction) return false;

  return (
    expression.prismaContext.transactionType === 'interactive' &&
    expression.prismaContext.clientType === 'prisma'
  );
}
