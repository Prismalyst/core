import type { PrismaExpression } from '../../types/prisma.types.js';
import type { RuleWithoutFunction } from '../../types/rule.eslint.types.js';

export function noRootClientInTransaction(
  expression: Pick<PrismaExpression, 'method' | 'prismaContext'>,
  rule: RuleWithoutFunction,
): boolean {
  const isRuleMethod = rule.methods.includes(expression.method);

  if (!isRuleMethod) return false;

  if (!expression.prismaContext.isExpressionInsideTransaction) return false;

  return (
    expression.prismaContext.transactionType === 'interactive' &&
    expression.prismaContext.clientType === 'prisma'
  );
}
