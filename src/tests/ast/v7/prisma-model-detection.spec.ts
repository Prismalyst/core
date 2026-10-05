import * as TS from 'typescript';
import { describe, expect, it } from 'vitest';

import { createAstParser } from '../../../ast/parser/create-ast-parser.js';
import { createAstUtils } from '../../../ast/utils/create-ast-utils.js';
import { createTestProgram } from './helpers/create-test-program.js';
import { getPrismaExpressions } from './helpers/get-prisma-expressions.js';

const FIXTURE_PATH = 'src/tests/ast/v7/fixtures/prisma-model-detection.ts';

describe('Prisma Model Detection', () => {
  const { program, sourceFile } = createTestProgram(FIXTURE_PATH);

  const { findCallExpressions } = createAstParser(TS);

  const checker = program.getTypeChecker();

  const astUtils = createAstUtils(TS, checker);

  const callExpressions = findCallExpressions(sourceFile);

  it('should find the User, Post, and Comment query calls', () => {
    expect(callExpressions).toHaveLength(3);
  });

  const prismaExpressions = getPrismaExpressions(callExpressions, { program, astUtils });

  it('should recognize queries on all three Prisma models', () => {
    expect(prismaExpressions).toHaveLength(3);
  });

  it('should detect model names, methods, and arguments for User, Post, and Comment queries', () => {
    expect(prismaExpressions[0]).toEqual(
      expect.objectContaining({
        method: 'findMany',
        args: [],
        prismaContext: expect.objectContaining({ model: 'User' }),
      }),
    );

    expect(prismaExpressions[1]).toEqual(
      expect.objectContaining({
        method: 'findMany',
        args: [],
        prismaContext: expect.objectContaining({ model: 'Post' }),
      }),
    );

    expect(prismaExpressions[2]).toEqual(
      expect.objectContaining({
        method: 'create',
        args: [{ data: { authorId: 1, postId: 1, body: 'x' } }],
        prismaContext: expect.objectContaining({ model: 'Comment' }),
      }),
    );
  });
});
