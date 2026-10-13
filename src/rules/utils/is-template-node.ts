import { TemplateAstNode } from '../../types/ast.types.js';

export function isTemplateNode(node: unknown): node is TemplateAstNode {
  return (
    typeof node === 'object' &&
    node !== null &&
    'kind' in node &&
    node.kind === 'template' &&
    'raw' in node &&
    typeof node.raw === 'string'
  );
}
