import type { PrismaExpression } from '../../types/prisma.types.js';
import type { Rule, RuleOptions } from '../../types/rule.eslint.types.js';

import { isExpressionInIgnoredFiles } from '../utils/is-expression-in-ignored-files.js';
import { isExpressionInTestFile } from '../utils/is-expression-in-test-file.js';

export function noDisconnectInRequestFlow(
  expression: PrismaExpression,
  rule: Rule,
  options: RuleOptions,
): boolean {
  const isRuleMethod = rule.methods.includes(expression.method);

  if (!isRuleMethod) return false;

  const ignoredFiles = options.ignoredFiles as string[];
  const allowInTests = options.allowInTests as boolean;

  const isInIgnoredFile = isExpressionInIgnoredFiles(expression.filename, ignoredFiles);

  const isInTestFile = isExpressionInTestFile(expression.filename);

  if (isInIgnoredFile) return false;
  if (allowInTests && isInTestFile) return false;

  return true;
}
