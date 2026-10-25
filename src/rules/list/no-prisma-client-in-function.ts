import type { PrismaExpression } from '../../types/prisma.types.js';
import type {
  RuleOptions,
  RuleReturnType,
  RuleWithoutFunction,
} from '../../types/rule.eslint.types.js';

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
  expression: Pick<PrismaExpression, 'node' | 'filename' | 'expressionContext'>,
  _rule: RuleWithoutFunction,
  options: RuleOptions<NoPrismaClientInFunctionOptions>,
): RuleReturnType {
  // We can guarantee that incoming expression is a prisma-generated class
  // So we don't need to check it directly with "rule.methods.includes(expression.method)"

  const ignoredFiles = options.ignoredFiles;
  const allowedFunctionsNames = options.allowedFunctionsNames;
  const allowInTests = options.allowInTests;

  const { expressionContext, filename } = expression;

  const isInsideFunctionLike = isExpressionInsideFunctionLike(expressionContext);
  const isInsideConstructor = isExpressionInsideConstructor(expressionContext);
  const isInIgnoredFile = isExpressionInIgnoredFiles(filename, ignoredFiles);
  const isInAllowedFunction = isExpressionInAllowedFunction(
    expressionContext,
    allowedFunctionsNames,
  );
  const isInTestFile = isExpressionInTestFile(filename);

  if (!isInsideFunctionLike) return { isTriggered: false };
  if (isInsideConstructor) return { isTriggered: false };
  if (isInIgnoredFile) return { isTriggered: false };
  if (isInAllowedFunction) return { isTriggered: false };
  if (allowInTests && isInTestFile) return { isTriggered: false };

  return { isTriggered: true, nodeToHighlight: expression.node };
}
