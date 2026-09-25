import { PrismaExpression } from '../../types/prisma.types.js';
import { RuleWithoutFunction } from '../../types/rule.eslint.types.js';

export function noFloatingPrismaPromise(
  expression: Pick<PrismaExpression, 'method' | 'prismaContext' | 'expressionContext'>,
  rule: RuleWithoutFunction,
) {
  const isRuleMethod = rule.methods.includes(expression.method);

  if (!isRuleMethod) return false;

  return (
    expression.prismaContext.isFloatingPrismaPromise &&
    !expression.expressionContext.isExpressionInsideAwaitExpression
  );
}
