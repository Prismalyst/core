import type * as TS from 'typescript';

export type TransactionType = 'interactive' | 'sequential';
export type ClientType = 'prisma' | 'transaction' | 'unknown';

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
  filename: string;
  expressionContext: {
    isExpressionInsideLoop: boolean;
    isExpressionInsideFunction: boolean;
    isExpressionInsideClassMethod: boolean;
    isExpressionInsideAwaitExpression: boolean;
    parentFunctionName: string | null;
    parentMethodName: string | null;
  };
  prismaContext: {
    isFloatingPrismaPromise: boolean;
    isExpressionInsideTransaction: boolean;
    transactionType: TransactionType | null;
    clientType: ClientType;
  };
  method: string;
  args: unknown[];
};
