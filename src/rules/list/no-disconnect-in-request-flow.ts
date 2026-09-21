import type { PrismaExpression } from '../../types/prisma.types.js';
import type { Rule, RuleOptions } from '../../types/rule.eslint.types.js';

export function noDisconnectInRequestFlow(
  expression: PrismaExpression,
  rule: Rule,
  options: RuleOptions,
): boolean {
  const isRuleMethod = rule.methods.includes(expression.method);

  if (!isRuleMethod) return false;

  const ignoredFiles = options.ignoredFiles as string[];
  const allowInTests = options.allowInTests as boolean;

  // TODO: fix this
  // now sth like ['pastes.service.ts'].includes(expression.filename)
  const isExpressionInIgnoredFile = ignoredFiles.includes(expression.filename);

  const isExpressionInTestFile =
    expression.filename.includes('.test.') || expression.filename.includes('.spec.');

  if (isExpressionInIgnoredFile) return false;
  if (allowInTests && isExpressionInTestFile) return false;

  return true;
}
