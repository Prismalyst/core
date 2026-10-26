import { PrismaExpression } from '../../types/prisma.types.js';
import { RuleReturnType, RuleWithoutFunction } from '../../types/rule.eslint.types.js';

// Works just with CallExpressions:
// Prisma.raw(`SELECT id FROM "User" WHERE id = ${id};`);
export function noUnsafePrismaRaw(
  expression: Pick<PrismaExpression, 'method' | 'args'>,
  rule: RuleWithoutFunction,
): RuleReturnType {
  const isRuleMethod = rule.methods.includes(expression.method);

  if (!isRuleMethod) return { isTriggered: false };

  const firstArg = expression.args[0];

  if (firstArg?.value === undefined) return { isTriggered: false };

  const firstArgNode = firstArg.node;
  const firstArgValue = firstArg.value;

  if (typeof firstArgValue === 'string') return { isTriggered: false };

  return {
    isTriggered: true,
    nodeToHighlight: firstArgNode,
  };
}
