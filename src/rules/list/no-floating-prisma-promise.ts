import { PrismaCall } from '../../types/prisma.types.js';
import { Rule } from '../../types/rule.eslint.types.js';

export function noFloatingPrismaPromise(caller: PrismaCall, rule: Rule) {
  const isRuleMethod = rule.methods.includes(caller.method);

  if (!isRuleMethod) return false;

  return caller.prisma.isFloatingPrismaPromise && !caller.prisma.isCallInsideTransaction;
}
