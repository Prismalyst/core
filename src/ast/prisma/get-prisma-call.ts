import type * as TS from 'typescript';

import { PrismaCall } from '../../types/prisma.types.js';

import { createAstUtils } from '../utils/create-ast-utils.js';
import { isPrismaCall } from './utils/is-prisma-call.js';

type CreateTsAstOptions = {
  typescript: typeof TS;
  fileName: string;
  uri: string;
  program: TS.Program;
};

export async function getPrismaCalls({
  typescript: ts,
  fileName,
  uri,
  program,
}: CreateTsAstOptions): Promise<PrismaCall[]> {
  const ast = program.getSourceFile(fileName);

  if (ast === undefined) {
    throw new Error(`Failed to create AST for file: ${fileName}`);
  }

  const calls: PrismaCall[] = [];
  const { node: nodeUtils, prisma: prismaUtils } = createAstUtils(ts);

  function visit(node: TS.Node) {
    if (isPrismaCall(node, program, { node: nodeUtils, prisma: prismaUtils })) {
      const methodNode = node.expression.name;
      const method = methodNode.text;

      const { line: startLine, character: startCharacter } = node
        .getSourceFile()
        .getLineAndCharacterOfPosition(node.getStart());

      const { line: endLine, character: endCharacter } = node
        .getSourceFile()
        .getLineAndCharacterOfPosition(node.getEnd());

      const nodeLength = node.getWidth();

      const args = node.arguments;

      const isFloatingPrismaPromise = prismaUtils.isFloatingPrismaPromise(node.parent);
      const isCallInsideTransaction = prismaUtils.isInsidePrismaTransaction(node);
      const isCallInsideLoop = prismaUtils.isInsideLoop(node);

      calls.push({
        node: node,
        method,
        args: args.map((_, index) => nodeUtils.parseArgument(node, index)),
        prisma: {
          isFloatingPrismaPromise,
          isCallInsideTransaction,
          isCallInsideLoop,
        },
        range: {
          start: {
            line: startLine,
            character: startCharacter,
          },
          end: {
            line: endLine,
            character: endCharacter,
          },
          length: nodeLength,
        },
      });
    }

    ts.forEachChild(node, visit);
  }

  visit(ast);

  return calls;
}
