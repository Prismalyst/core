import { PrismaExpression } from '../../types/prisma.types.js';
import { RuleWithoutFunction } from '../../types/rule.eslint.types.js';

import { isObjectEmpty } from '../utils/is-object-empty.js';
import { isObject } from '../utils/is-object.js';

import { getProperty } from '../../ast/utils/get-property.js';

export function requireWhereUpdateMany(
  expression: Pick<PrismaExpression, 'method' | 'args'>,
  rule: RuleWithoutFunction,
) {
  const isRuleMethod = rule.methods.includes(expression.method);

  if (!isRuleMethod) return false;

  const firstArg = expression.args[0]?.value;

  // Prisma already highlights this as an error
  if (firstArg === undefined) return false;

  const isFirstArgIsObject = isObject(firstArg);

  // Prisma already highlights this as an error
  if (!isFirstArgIsObject) return false;

  const whereArg = getProperty(expression.args[0], ['where'])?.value;

  // Disallow explicit undefined
  if (whereArg === undefined) return true;

  const isWhereArgIsObject = isObject(whereArg);

  // Prisma already highlights this as an error
  if (!isWhereArgIsObject) return false;

  if (isObjectEmpty(whereArg)) return true;

  return false;
}
