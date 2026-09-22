import { PrismaExpression } from '../../types/prisma.types.js';
import { Rule } from '../../types/rule.eslint.types.js';

import { isObjectEmpty } from '../utils/is-object-empty.js';
import { isObject } from '../utils/is-object.js';

export function requireWhereDeleteMany(expression: PrismaExpression, rule: Rule) {
  const isRuleMethod = rule.methods.includes(expression.method);

  if (!isRuleMethod) return false;

  const firstArg = expression.args[0];

  // Disallow prisma.user.deleteMany()
  if (firstArg === undefined) return true;

  const isFirstArgIsObject = isObject(firstArg);

  if (!isFirstArgIsObject) return true;

  const whereArg = firstArg.where;

  // Disallow explicit undefined
  if (whereArg === undefined) return true;

  const isWhereArgIsObject = isObject(whereArg);

  // Prisma already highlights this as an error
  if (!isWhereArgIsObject) return false;

  if (isObjectEmpty(whereArg)) return true;

  return false;
}
