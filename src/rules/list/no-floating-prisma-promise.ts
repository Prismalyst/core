import { PrismaExpression } from '../../types/prisma.types.js';
import { RuleReturnType, RuleWithoutFunction } from '../../types/rule.eslint.types.js';

export function noFloatingPrismaPromise(
  expression: Pick<PrismaExpression, 'node' | 'method' | 'prismaContext' | 'expressionContext'>,
  rule: RuleWithoutFunction,
): RuleReturnType {
  const isRuleMethod = rule.methods.includes(expression.method);

  if (!isRuleMethod) return { isTriggered: false };

  if (
    expression.prismaContext.isFloatingPrismaPromise &&
    !expression.expressionContext.isExpressionInsideAwaitExpression
  )
    return { isTriggered: true, nodeToHighlight: expression.node };

  return { isTriggered: false };
}
