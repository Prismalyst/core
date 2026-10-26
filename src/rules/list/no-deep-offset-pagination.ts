import { PrismaExpression } from '../../types/prisma.types.js';
import { RuleOptions, RuleReturnType, RuleWithoutFunction } from '../../types/rule.eslint.types.js';

import { getProperty } from '../../ast/utils/get-property.js';

export interface NoDeepOffsetPaginationOptions {
  max: number;
  min: number;
}

export function noDeepOffsetPagination(
  expression: Pick<PrismaExpression, 'method' | 'args'>,
  rule: RuleWithoutFunction,
  options: RuleOptions<NoDeepOffsetPaginationOptions>,
): RuleReturnType {
  const isRuleMethod = rule.methods.includes(expression.method);

  if (!isRuleMethod) return { isTriggered: false };

  const firstArg = expression.args[0];

  if (!firstArg) return { isTriggered: false };

  // Prisma supports only number or explicit undefined
  const skipProperty = getProperty(expression.args[0], ['skip']);

  if (!skipProperty) return { isTriggered: false };

  const skipValue = skipProperty.value;
  const skipValueNode = skipProperty.valueNode;

  if (typeof skipValue !== 'number') return { isTriggered: false };

  // Until Prismalyst don't have VS Code extension
  // We can guarantee options and options.max is defined
  // And options.max is a number
  // Because ESLint doesn't allow to pass empty rule's options

  if (skipValue > options.max || skipValue < options.min) {
    return { isTriggered: true, nodeToHighlight: skipValueNode ?? skipProperty.node };
  }

  return { isTriggered: false };
}
