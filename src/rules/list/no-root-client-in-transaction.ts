import type { PrismaExpression } from '../../types/prisma.types.js';
import type { RuleReturnType, RuleWithoutFunction } from '../../types/rule.eslint.types.js';

export function noRootClientInTransaction(
  expression: Pick<PrismaExpression, 'node' | 'method' | 'prismaContext'>,
  rule: RuleWithoutFunction,
): RuleReturnType {
  const isRuleMethod = rule.methods.includes(expression.method);

  if (!isRuleMethod) return { isTriggered: false };

  if (!expression.prismaContext.isExpressionInsideTransaction) return { isTriggered: false };

  if (
    expression.prismaContext.transactionType === 'interactive' &&
    expression.prismaContext.clientType === 'prisma'
  )
    return { isTriggered: true, nodeToHighlight: expression.node };

  return { isTriggered: false };
}
