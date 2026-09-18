import { PrismaCall } from '../../types/prisma.types.js';
import { Rule } from '../../types/rule.eslint.types.js';

// TODO: make this configurable
const MAX_TAKE = 100;

export function maxTake(caller: PrismaCall, rule: Rule) {
  const isRuleMethod = rule.methods.includes(caller.method);

  if (!isRuleMethod) return false;

  if (caller.args.length === 0) return true;

  const firstArg = caller.args[0] as Record<string, unknown>;

  if (firstArg === undefined) return true;

  if (typeof firstArg !== 'object') return false;

  if (firstArg.take === undefined) return true;
  if (typeof firstArg.take !== 'number') return false;

  return firstArg.take > MAX_TAKE;
}
