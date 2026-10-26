import type { PrismaExpression } from '../../types/prisma.types.js';
import type { RuleReturnType, RuleWithoutFunction } from '../../types/rule.eslint.types.js';

import { isTemplateNode } from '../utils/is-template-node.js';

export function noDynamicRawQuery(
  expression: Pick<PrismaExpression, 'method' | 'args'>,
  rule: RuleWithoutFunction,
): RuleReturnType {
  if (!rule.methods.includes(expression.method)) return { isTriggered: false };

  const firstArg = expression.args[0];

  if (!firstArg) return { isTriggered: false };

  const isTemplate = isTemplateNode(firstArg.value);

  if (isTemplate) return { isTriggered: true, nodeToHighlight: firstArg.node };

  return { isTriggered: false };
}
