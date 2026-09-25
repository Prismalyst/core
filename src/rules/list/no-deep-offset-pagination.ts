import { PrismaExpression } from '../../types/prisma.types.js';
import { RuleOptions, RuleWithoutFunction } from '../../types/rule.eslint.types.js';

import { isObject } from '../utils/is-object.js';

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

  const firstArg = expression.args[0];

  const isFirstArgIsObject = isObject(firstArg);

  if (!isFirstArgIsObject) return true;

  // Prisma supports only number or explicit undefined
  if (typeof firstArg.skip !== 'number') return false;

  // Disallow explicit undefined
  if (firstArg.skip === undefined) return false;

  // Until Prismalyst don't have VS Code extension
  // We can guarantee options and options.max is defined
  // And options.max is a number
  // Because ESLint doesn't allow to pass empty rule's options
  return firstArg.skip > options.max || firstArg.skip < options.min;
}
