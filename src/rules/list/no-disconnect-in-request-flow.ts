import type { PrismaExpression } from '../../types/prisma.types.js';
import type {
  RuleOptions,
  RuleReturnType,
  RuleWithoutFunction,
} from '../../types/rule.eslint.types.js';

import { isExpressionInIgnoredFiles } from '../utils/is-expression-in-ignored-files.js';
import { isExpressionInTestFile } from '../utils/is-expression-in-test-file.js';

export interface NoDisconnectInRequestFlowOptions {
  ignoredFiles: string[];
  allowInTests: boolean;
}

export function noDisconnectInRequestFlow(
  expression: Pick<PrismaExpression, 'node' | 'method' | 'filename'>,
  rule: RuleWithoutFunction,
  options: RuleOptions<NoDisconnectInRequestFlowOptions>,
): RuleReturnType {
  const isRuleMethod = rule.methods.includes(expression.method);

  if (!isRuleMethod) return { isTriggered: false };

  const ignoredFiles = options.ignoredFiles;
  const allowInTests = options.allowInTests;

  const isInIgnoredFile = isExpressionInIgnoredFiles(expression.filename, ignoredFiles);

  const isInTestFile = isExpressionInTestFile(expression.filename);

  if (isInIgnoredFile) return { isTriggered: false };
  if (allowInTests && isInTestFile) return { isTriggered: false };

  return { isTriggered: true, nodeToHighlight: expression.node };
}
