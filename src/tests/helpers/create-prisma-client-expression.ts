import * as TS from 'typescript';

import type { PrismaExpression } from '../../types/prisma.types.js';

import { createAstParser } from '../../ast/parser/create-ast-parser.js';
import { createNodeUtils } from '../../ast/utils/create-node-utils.js';

const checker = TS.createProgram([], {}).getTypeChecker();

const nodeUtils = createNodeUtils(TS, checker);
const { findNewExpressions } = createAstParser(TS);

export function createPrismaClientExpression(
  source: string,
  filename = 'query.ts',
): Pick<PrismaExpression, 'node' | 'filename' | 'expressionContext'> {
  const sourceFile = TS.createSourceFile(filename, source, TS.ScriptTarget.Latest, true);
  const node = findNewExpressions(sourceFile)[0];

  if (!node) {
    throw new Error('Expected a Prisma client constructor call in the test source.');
  }

  return {
    node,
    filename,
    expressionContext: {
      isExpressionInsideLoop: nodeUtils.isInsideLoop(node),
      isExpressionInsideFunction: nodeUtils.isInsideFunction(node),
      isExpressionInsideClassMethod: nodeUtils.isInsideClassMethod(node),
      isExpressionInsideAwaitExpression: nodeUtils.isInsideAwaitExpression(node),
      parentFunctionName: nodeUtils.getParentFunctionName(node),
      parentMethodName: nodeUtils.getParentMethodName(node),
    },
  };
}
