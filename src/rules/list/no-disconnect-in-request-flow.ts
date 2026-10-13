import type { PrismaExpression } from '../../types/prisma.types.js';
import type { RuleOptions, RuleWithoutFunction } from '../../types/rule.eslint.types.js';

import { isExpressionInIgnoredFiles } from '../utils/is-expression-in-ignored-files.js';
import { isExpressionInTestFile } from '../utils/is-expression-in-test-file.js';

export interface NoDisconnectInRequestFlowOptions {
  ignoredFiles: string[];
  allowInTests: boolean;
}

export function noDisconnectInRequestFlow(
  expression: Pick<PrismaExpression, 'method' | 'filename'>,
  rule: RuleWithoutFunction,
  options: RuleOptions<NoDisconnectInRequestFlowOptions>,
): boolean {
  const isRuleMethod = rule.methods.includes(expression.method);

  if (!isRuleMethod) return false;

  const ignoredFiles = options.ignoredFiles;
  const allowInTests = options.allowInTests;

  const isInIgnoredFile = isExpressionInIgnoredFiles(expression.filename, ignoredFiles);

  const isInTestFile = isExpressionInTestFile(expression.filename);

  if (isInIgnoredFile) return false;
  if (allowInTests && isInTestFile) return false;

  return true;
}
