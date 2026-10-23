import { PrismaExpression } from '../../types/prisma.types.js';
import { RuleOptions, RuleWithoutFunction } from '../../types/rule.eslint.types.js';

import { isObject } from '../utils/is-object.js';

import { getProperty } from '../../ast/utils/get-property.js';

export interface NoDeepOffsetPaginationOptions {
  max: number;
  min: number;
}

export function noDeepOffsetPagination(
  expression: Pick<PrismaExpression, 'method' | 'args'>,
  rule: RuleWithoutFunction,
  options: RuleOptions<NoDeepOffsetPaginationOptions>,
) {
  const isRuleMethod = rule.methods.includes(expression.method);

  if (!isRuleMethod) return false;

  const firstArg = expression.args[0]?.value;

  const isFirstArgIsObject = isObject(firstArg);

  if (!isFirstArgIsObject) return true;

  // Prisma supports only number or explicit undefined
  const skip = getProperty(expression.args[0], ['skip'])?.value;

  if (typeof skip !== 'number') return false;

  // Until Prismalyst don't have VS Code extension
  // We can guarantee options and options.max is defined
  // And options.max is a number
  // Because ESLint doesn't allow to pass empty rule's options
  return skip > options.max || skip < options.min;
}
