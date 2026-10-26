import { PrismaExpression } from '../../types/prisma.types.js';
import { RuleReturnType, RuleWithoutFunction } from '../../types/rule.eslint.types.js';

export function noUnsafeRawSQL(
  expression: Pick<PrismaExpression, 'node' | 'method'>,
  rule: RuleWithoutFunction,
): RuleReturnType {
  // Using unsafe SQL methods is a security risk by definition
  if (rule.methods.includes(expression.method))
    return { isTriggered: true, nodeToHighlight: expression.node };

  return { isTriggered: false };
}
