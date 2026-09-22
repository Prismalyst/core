import { PrismaExpression } from '../../types/prisma.types.js';
import { Rule } from '../../types/rule.eslint.types.js';

export function requireWhereUpdateMany(expression: PrismaExpression, rule: Rule) {
  const isRuleMethod = rule.methods.includes(expression.method);

  if (!isRuleMethod) return false;

  const firstArg = expression.args[0] as Record<string, unknown>;

  if (firstArg === undefined) return true;

  if (firstArg.where === undefined) return true;
  if (firstArg.where === null) return true;

  if (Object.keys(firstArg.where).length === 0) return true;

  return false;
}
