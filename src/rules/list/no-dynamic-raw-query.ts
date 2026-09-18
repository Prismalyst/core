import type { NormalizedAstNode } from '../../types/ast.types.js';
import type { PrismaCall } from '../../types/prisma.types.js';
import type { Rule } from '../../types/rule.eslint.types.js';

function isTemplateNode(value: unknown): value is NormalizedAstNode {
  return (
    typeof value === 'object' &&
    value !== null &&
    'kind' in value &&
    value.kind === 'template' &&
    'raw' in value &&
    typeof value.raw === 'string'
  );
}

export function noDynamicRawQuery(caller: PrismaCall, rule: Rule): boolean {
  if (!rule.methods.includes(caller.method)) return false;

  return isTemplateNode(caller.args[0]);
}
