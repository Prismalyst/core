import { PrismaExpression } from '../../types/prisma.types.js';
import { RuleOptions, RuleWithoutFunction } from '../../types/rule.eslint.types.js';

import { isObject } from '../utils/is-object.js';

export interface MaxTakeOptions {
  max: number;
}

export function maxTake(
  expression: Pick<PrismaExpression, 'method' | 'args'>,
  rule: RuleWithoutFunction,
  options: RuleOptions<MaxTakeOptions>,
) {
  const isRuleMethod = rule.methods.includes(expression.method);

  if (!isRuleMethod) return false;

  const firstArg = expression.args[0];

  const isFirstArgIsObject = isObject(firstArg);

  if (!isFirstArgIsObject) return true;

  // Disallow explicit undefined
  if (firstArg.take === undefined) return true;

  // Prisma supports only number or explicit undefined
  // Otherwise it will highlight this as an error
  // So we don't need to highlight it
  if (typeof firstArg.take !== 'number') return false;

  // Until Prismalyst don't have VS Code extension
  // We can guarantee options and options.max is defined
  // And options.max is a number
  // Because ESLint doesn't allow to pass empty rule's options
  return firstArg.take > options.max;
}
