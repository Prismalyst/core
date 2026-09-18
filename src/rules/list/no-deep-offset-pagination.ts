import { PrismaCall } from '../../types/prisma.types.js';
import { Rule, RuleOptions } from '../../types/rule.eslint.types.js';

export function noDeepOffsetPagination(caller: PrismaCall, rule: Rule, options: RuleOptions) {
  const isRuleMethod = rule.methods.includes(caller.method);

  if (!isRuleMethod) return false;

  const firstArg = caller.args[0] as Record<string, unknown>;

  if (firstArg === undefined) return false;

  console.log('first arg:', firstArg);

  if (typeof firstArg !== 'object') return false;

  if (firstArg.skip === undefined) return false;
  if (typeof firstArg.skip !== 'number') return false;

  if (options.max === undefined || options.min === undefined) return false;
  if (typeof options.max !== 'number' || typeof options.min !== 'number') return false;

  return firstArg.skip > options.max || firstArg.skip < options.min;
}
