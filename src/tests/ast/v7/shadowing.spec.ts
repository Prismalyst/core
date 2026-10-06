import * as TS from 'typescript';
import { describe, expect, it } from 'vitest';

import { createAstParser } from '../../../ast/parser/create-ast-parser.js';
import { isPrismaExpression } from '../../../ast/prisma/is-prisma-expression.js';
import { createAstUtils } from '../../../ast/utils/create-ast-utils.js';
import { createTestProgram } from './helpers/create-test-program.js';
import { getPrismaExpressions } from './helpers/get-prisma-expressions.js';

const FIXTURE_PATH = 'src/tests/ast/v7/fixtures/shadowing.ts';

describe('Shadowing', () => {
  const { program, sourceFile } = createTestProgram(FIXTURE_PATH);

  const { findCallExpressions } = createAstParser(TS);

  const checker = program.getTypeChecker();

  const astUtils = createAstUtils(TS, checker);

  const callExpressions = findCallExpressions(sourceFile);

  it('should find both real client calls and both shadowed client calls', () => {
    expect(callExpressions).toHaveLength(4);
  });

  const [outerCallBefore, parameterCall, localVariableCall, outerCallAfter] = callExpressions;

  const prismaExpressions = getPrismaExpressions(callExpressions, { program, astUtils });

  it('should include only the two calls through the outer Prisma client', () => {
    expect(prismaExpressions).toHaveLength(2);
  });

  it('should recognize the outer Prisma client before the shadowing declarations', () => {
    expect(isPrismaExpression(outerCallBefore!, program, astUtils)).toBe(true);
    expect(prismaExpressions[0]?.node).toBe(outerCallBefore);
  });

  it('should reject a FakeClient parameter that shadows the outer Prisma client', () => {
    expect(isPrismaExpression(parameterCall!, program, astUtils)).toBe(false);
  });

  it('should reject a local FakeClient variable that shadows the outer Prisma client', () => {
    expect(isPrismaExpression(localVariableCall!, program, astUtils)).toBe(false);
  });

  it('should recognize the outer Prisma client after the shadowing declarations', () => {
    expect(isPrismaExpression(outerCallAfter!, program, astUtils)).toBe(true);
    expect(prismaExpressions[1]?.node).toBe(outerCallAfter);
  });
});
