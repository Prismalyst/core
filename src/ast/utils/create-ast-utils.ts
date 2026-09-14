import type * as TS from 'typescript';

import { createNodeUtils } from './create-node-utils.js';
import { createPrismaUtils } from './create-prisma-utils.js';

export function createAstUtils(ts: typeof TS) {
  return {
    node: createNodeUtils(ts),
    prisma: createPrismaUtils(ts),
  };
}

export type AstUtils = ReturnType<typeof createAstUtils>;
