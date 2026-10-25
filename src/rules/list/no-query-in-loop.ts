import type { PrismaExpression } from '../../types/prisma.types.js';
import type { RuleReturnType, RuleWithoutFunction } from '../../types/rule.eslint.types.js';

export function noQueryInLoop(
  expression: Pick<PrismaExpression, 'node' | 'method' | 'expressionContext'>,
  rule: RuleWithoutFunction,
): RuleReturnType {
  const isRuleMethod = rule.methods.includes(expression.method);

  if (!isRuleMethod) return { isTriggered: false };

  if (expression.expressionContext.isExpressionInsideLoop)
    return { isTriggered: true, nodeToHighlight: expression.node };

  return { isTriggered: false };
}
