import { PrismaExpression } from '../../types/prisma.types.js';
import { RuleOptions, RuleReturnType, RuleWithoutFunction } from '../../types/rule.eslint.types.js';

import { getProperty } from '../../ast/utils/get-property.js';

export interface MaxTakeOptions {
  max: number;
}

export function maxTake(
  expression: Pick<PrismaExpression, 'node' | 'method' | 'args'>,
  rule: RuleWithoutFunction,
  options: RuleOptions<MaxTakeOptions>,
): RuleReturnType {
  const isRuleMethod = rule.methods.includes(expression.method);

  if (!isRuleMethod) return { isTriggered: false };

  const firstArg = expression.args[0];

  if (!firstArg) return { isTriggered: true, nodeToHighlight: expression.node };

  const take = getProperty(firstArg, ['take']);

  if (!take) return { isTriggered: true, nodeToHighlight: firstArg.node };

  const takeValue = take.value as number | undefined;
  const takeValueNode = take.valueNode;

  // Disallow explicit undefined
  if (takeValue === undefined) {
    return { isTriggered: true, nodeToHighlight: takeValueNode ?? take.node };
  }

  // Prisma supports only number or explicit undefined
  // Otherwise it will highlight this as an error
  // So we don't need to highlight it
  if (typeof takeValue !== 'number') return { isTriggered: false };

  // Until Prismalyst don't have VS Code extension
  // We can guarantee options and options.max is defined
  // And options.max is a number
  // Because ESLint doesn't allow to pass empty rule's options
  if (takeValue > options.max) {
    return { isTriggered: true, nodeToHighlight: takeValueNode ?? take.node };
  }

  return { isTriggered: false };
}
