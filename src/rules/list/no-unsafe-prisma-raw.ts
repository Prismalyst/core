import { PrismaExpression } from '../../types/prisma.types.js';
import { RuleWithoutFunction } from '../../types/rule.eslint.types.js';

export function noUnsafePrismaRaw(expression: PrismaExpression, rule: RuleWithoutFunction) {
  const isRuleMethod = rule.methods.includes(expression.method);

  if (!isRuleMethod) return false;

  const firstArg = expression.args[0];

  if (firstArg === undefined) return false;

  if (typeof firstArg === 'string') return false;

  return true;
}
