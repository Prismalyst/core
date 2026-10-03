import type * as TS from 'typescript';

export type TransactionType = 'interactive' | 'sequential';
export type ClientType = 'prisma' | 'transaction' | 'unknown';

export type PrismaExpressionExpression = TS.CallExpression & {
  expression: TS.PropertyAccessExpression;
};

export type PrismaClientExpression = TS.NewExpression;

export type PrismaNodeExpression = PrismaExpressionExpression | PrismaClientExpression;

export type ExpressionContext = {
  isExpressionInsideLoop: boolean;
  isExpressionInsideFunction: boolean;
  isExpressionInsideClassMethod: boolean;
  isExpressionInsideAwaitExpression: boolean;
  parentFunctionName: string | null;
  parentMethodName: string | null;
};

export type PrismaContext = {
  isFloatingPrismaPromise: boolean;
  isExpressionInsideTransaction: boolean;
  transactionType: TransactionType | null;
  clientType: ClientType;
  model: string | null;
};

type Range = {
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

export type PrismaExpression = {
  node: PrismaNodeExpression;
  range: Range;
  filename: string;
  expressionContext: ExpressionContext;
  prismaContext: PrismaContext;
  method: string;
  args: unknown[];
};
