import type * as TS from 'typescript';

export type PrismaExpressionExpression = TS.CallExpression & {
  expression: TS.PropertyAccessExpression;
};

export type PrismaClientExpression = TS.NewExpression;

export type PrismaNodeExpression = PrismaExpressionExpression | PrismaClientExpression;

export type PrismaExpression = {
  node: PrismaNodeExpression;
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
  prisma: {
    isFloatingPrismaPromise: boolean;
    isExpressionInsideTransaction: boolean;
    isExpressionInsideLoop: boolean;
  };
  method: string;
  args: unknown[];
};
