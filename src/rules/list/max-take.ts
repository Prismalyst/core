import { PrismaExpression } from '../../types/prisma.types.js';
import { Rule, RuleOptions } from '../../types/rule.eslint.types.js';

export function maxTake(expression: PrismaExpression, rule: Rule, options: RuleOptions) {
  const isRuleMethod = rule.methods.includes(expression.method);

  if (!isRuleMethod) return false;

  const firstArg = expression.args[0] as Record<string, unknown>;

  if (firstArg === undefined) return true;

  if (typeof firstArg !== 'object') return false;

  if (firstArg.take === undefined) return true;
  if (typeof firstArg.take !== 'number') return false;

  if (options.max === undefined) return false;
  if (typeof options.max !== 'number') return false;

  return firstArg.take > options.max;
}
