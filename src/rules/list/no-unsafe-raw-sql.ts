import { PrismaExpression } from '../../types/prisma.types.js';
import { Rule } from '../../types/rule.eslint.types.js';

export function noUnsafeRawSQL(expression: PrismaExpression, rule: Rule) {
  return rule.methods.includes(expression.method);
}
