import type { PrismaCall } from '../../types/prisma.types.js';
import type { Rule } from '../../types/rule.eslint.types.js';

export function noQueryInLoop(caller: PrismaCall, rule: Rule): boolean {
  const isRuleMethod = rule.methods.includes(caller.method);

  if (!isRuleMethod) return false;

  return caller.prisma.isCallInsideLoop;
}
