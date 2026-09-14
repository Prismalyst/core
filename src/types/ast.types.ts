import type * as TS from 'typescript';

export type AstObject = {
  [key: string]: AstValue;
};

export type AstValue =
  AstObject | string | number | boolean | null | undefined | AstValue[] | TS.Expression;
