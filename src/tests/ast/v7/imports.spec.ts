import * as TS from 'typescript';
import { describe, expect, it } from 'vitest';

import { createAstParser } from '../../../ast/parser/create-ast-parser.js';
import { createAstUtils } from '../../../ast/utils/create-ast-utils.js';
import { createTestProgram } from './helpers/create-test-program.js';
import { getPrismaExpressions } from './helpers/get-prisma-expressions.js';

const FIXTURE_PATH = 'src/tests/ast/v7/fixtures/imports.ts';

describe('Imports', () => {
  const { program, sourceFile } = createTestProgram(FIXTURE_PATH);

  const { findCallExpressions } = createAstParser(TS);

  const checker = program.getTypeChecker();

  const astUtils = createAstUtils(TS, checker);

  const callExpressions = findCallExpressions(sourceFile);

  it('should find queries through both the named and aliased imports', () => {
    expect(callExpressions).toHaveLength(2);
  });

  const prismaExpressions = getPrismaExpressions(callExpressions, { program, astUtils });

  it('should recognize both queries as Prisma expressions', () => {
    expect(prismaExpressions).toHaveLength(2);
  });

  const [aliasedImportQuery, namedImportQuery] = prismaExpressions;

  it('should detect a User findMany query through the aliased import', () => {
    expect(aliasedImportQuery).toEqual(
      expect.objectContaining({
        node: callExpressions[0],
        method: 'findMany',
        args: [],
        prismaContext: expect.objectContaining({ model: 'User', clientType: 'prisma' }),
      }),
    );
  });

  it('should detect a User findMany query through the named import', () => {
    expect(namedImportQuery).toEqual(
      expect.objectContaining({
        node: callExpressions[1],
        method: 'findMany',
        args: [],
        prismaContext: expect.objectContaining({ model: 'User', clientType: 'prisma' }),
      }),
    );
  });
});
