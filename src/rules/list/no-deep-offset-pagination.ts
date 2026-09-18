import { PrismaCall } from '../../types/prisma.types.js';
import { Rule } from '../../types/rule.eslint.types.js';

// TODO: make this configurable
const MAX_SKIP = 1_000;

export function noDeepOffsetPagination(caller: PrismaCall, rule: Rule) {
  const isRuleMethod = rule.methods.includes(caller.method);

  if (!isRuleMethod) return false;

  const firstArg = caller.args[0] as Record<string, unknown>;

  if (firstArg === undefined) return false;

  if (typeof firstArg !== 'object') return false;

  if (firstArg.skip === undefined) return false;
  if (typeof firstArg.skip !== 'number') return false;

  return firstArg.skip > MAX_SKIP;
}
