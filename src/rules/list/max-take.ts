import { PrismaCall } from '../../types/prisma.types.js';
import { Rule, RuleOptions } from '../../types/rule.eslint.types.js';

export function maxTake(caller: PrismaCall, rule: Rule, options: RuleOptions) {
  const isRuleMethod = rule.methods.includes(caller.method);

  if (!isRuleMethod) return false;

  const firstArg = caller.args[0] as Record<string, unknown>;

  if (firstArg === undefined) return true;

  if (typeof firstArg !== 'object') return false;

  if (firstArg.take === undefined) return true;
  if (typeof firstArg.take !== 'number') return false;

  if (options.max === undefined) return false;
  if (typeof options.max !== 'number') return false;

  return firstArg.take > options.max;
}
