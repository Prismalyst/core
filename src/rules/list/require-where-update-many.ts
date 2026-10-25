import { PrismaExpression } from '../../types/prisma.types.js';
import { RuleReturnType, RuleWithoutFunction } from '../../types/rule.eslint.types.js';

import { isObjectEmpty } from '../utils/is-object-empty.js';
import { isObject } from '../utils/is-object.js';

import { getProperty } from '../../ast/utils/get-property.js';

export function requireWhereUpdateMany(
  expression: Pick<PrismaExpression, 'node' | 'method' | 'args'>,
  rule: RuleWithoutFunction,
): RuleReturnType {
  const isRuleMethod = rule.methods.includes(expression.method);

  if (!isRuleMethod) return { isTriggered: false };

  const firstArg = expression.args[0];

  // Prisma already highlights this as an error
  if (firstArg === undefined || !isObject(firstArg.value)) return { isTriggered: false };

  const whereArg = getProperty(firstArg, ['where']);

  // Disallow prisma.user.updateMany({})
  if (whereArg === undefined) return { isTriggered: true, nodeToHighlight: firstArg.node };

  const whereArgValue = whereArg.value;

  // Disallow explicit undefined
  if (whereArgValue === undefined)
    return { isTriggered: true, nodeToHighlight: whereArg.valueNode ?? whereArg.node };

  // Disallow prisma.user.updateMany({ where: {} })
  if (isObject(whereArgValue) && isObjectEmpty(whereArgValue))
    return { isTriggered: true, nodeToHighlight: whereArg.valueNode ?? whereArg.node };

  return { isTriggered: false };
}
