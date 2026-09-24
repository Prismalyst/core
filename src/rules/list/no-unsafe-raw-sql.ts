import { PrismaExpression } from '../../types/prisma.types.js';
import { RuleWithoutFunction } from '../../types/rule.eslint.types.js';

export function noUnsafeRawSQL(expression: PrismaExpression, rule: RuleWithoutFunction) {
  return rule.methods.includes(expression.method);
}
