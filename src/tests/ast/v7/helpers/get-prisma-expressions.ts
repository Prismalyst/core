import type * as TS from 'typescript';

import { convertToPrismaExpression } from '../../../../ast/prisma/convert-to-prisma-expression.js';
import { isPrismaExpression } from '../../../../ast/prisma/is-prisma-expression.js';
import { AstUtils } from '../../../../ast/utils/create-ast-utils.js';

type Options = {
  program: TS.Program;
  astUtils: AstUtils;
};

export function getPrismaExpressions(
  expressions: TS.CallExpression[],
  { program, astUtils }: Options,
) {
  const prismaExpressions = [];

  for (const expression of expressions) {
    const isValid = isPrismaExpression(expression, program, astUtils);

    // Skip non-prisma calls, using typeChecker to avoid false positives
    if (!isValid) continue;

    const prismaExpression = convertToPrismaExpression(expression, program, astUtils);

    prismaExpressions.push(prismaExpression);
  }

  return prismaExpressions;
}
