import { PrismaCall } from '../../types/prisma.types.js';
import { Rule } from '../../types/rule.eslint.types.js';

export function requireWhereDeleteMany(caller: PrismaCall, rule: Rule) {
  const isRuleMethod = rule.methods.includes(caller.method);

  if (!isRuleMethod) return false;

  const firstArg = caller.args[0] as Record<string, unknown>;

  if (firstArg === undefined) return true;

  if (firstArg.where === undefined) return true;
  if (firstArg.where === null) return true;

  if (Object.keys(firstArg.where).length === 0) return true;

  return false;
}
