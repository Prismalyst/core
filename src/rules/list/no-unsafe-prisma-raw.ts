import { PrismaCall } from '../../types/prisma.types.js';
import { Rule } from '../../types/rule.eslint.types.js';

export function noUnsafePrismaRaw(caller: PrismaCall, rule: Rule) {
  const isRuleMethod = rule.methods.includes(caller.method);

  if (!isRuleMethod) return false;

  const firstArg = caller.args[0];

  if (firstArg === undefined) return false;

  if (typeof firstArg === 'string') return false;

  return true;
}
