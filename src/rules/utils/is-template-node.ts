import { NormalizedAstNode } from '../../types/ast.types.js';

export function isTemplateNode(value: unknown): value is NormalizedAstNode {
  return (
    typeof value === 'object' &&
    value !== null &&
    'kind' in value &&
    value.kind === 'template' &&
    'raw' in value &&
    typeof value.raw === 'string'
  );
}
