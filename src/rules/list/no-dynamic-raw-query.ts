import type { PrismaExpression } from '../../types/prisma.types.js';
import type { RuleWithoutFunction } from '../../types/rule.eslint.types.js';

import { isTemplateNode } from '../utils/is-template-node.js';

export function noDynamicRawQuery(
  expression: PrismaExpression,
  rule: RuleWithoutFunction,
): boolean {
  if (!rule.methods.includes(expression.method)) return false;

  return isTemplateNode(expression.args[0]);
}
