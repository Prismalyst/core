import type { PrismaExpression } from '../../types/prisma.types.js';
import type { RuleOptions, RuleWithoutFunction } from '../../types/rule.eslint.types.js';

import { isExpressionInAllowedFunction } from '../utils/is-expression-in-allowed-function.js';
import { isExpressionInIgnoredFiles } from '../utils/is-expression-in-ignored-files.js';
import { isExpressionInTestFile } from '../utils/is-expression-in-test-file.js';
import { isExpressionInsideConstructor } from '../utils/is-expression-inside-constructor.js';
import { isExpressionInsideFunctionLike } from '../utils/is-expression-inside-function-like.js';

export type NoPrismaClientInFunctionOptions = {
  ignoredFiles: string[];
  allowedFunctionsNames: string[];
  allowInTests: boolean;
};

export function noPrismaClientInFunction(
  expression: PrismaExpression,
  _rule: RuleWithoutFunction,
  options: RuleOptions<NoPrismaClientInFunctionOptions>,
): boolean {
  // We can guarantee that incoming expression is a prisma-generated class
  // So we don't need to check it directly with "rule.methods.includes(expression.method)"

  const ignoredFiles = options.ignoredFiles;
  const allowedFunctionsNames = options.allowedFunctionsNames;
  const allowInTests = options.allowInTests;

  const isInsideFunctionLike = isExpressionInsideFunctionLike(expression);
  const isInsideConstructor = isExpressionInsideConstructor(expression);
  const isInIgnoredFile = isExpressionInIgnoredFiles(expression.filename, ignoredFiles);
  const isInAllowedFunction = isExpressionInAllowedFunction(expression, allowedFunctionsNames);
  const isInTestFile = isExpressionInTestFile(expression.filename);

  if (!isInsideFunctionLike) return false;
  if (isInsideConstructor) return false;
  if (isInIgnoredFile) return false;
  if (isInAllowedFunction) return false;
  if (allowInTests && isInTestFile) return false;

  return true;
}
