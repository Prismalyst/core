import type * as TS from 'typescript';

export type PrismaCallExpression = TS.CallExpression & {
  expression: TS.PropertyAccessExpression;
};

export type PrismaCall = {
  node: PrismaCallExpression;
  method: string;
  args: unknown[];
  prisma: {
    isFloatingPrismaPromise: boolean;
    isCallInsideTransaction: boolean;
    isCallInsideLoop: boolean;
  };
  range: {
    start: {
      line: number;
      character: number;
    };
    end: {
      line: number;
      character: number;
    };
    length: number;
  };
};
