import { PrismaCall } from '../../types/prisma.types.js';
import { Rule } from '../../types/rule.eslint.types.js';

export function noUnsafePrismaRaw(caller: PrismaCall, rule: Rule) {
  return rule.methods.includes(caller.method);
}
