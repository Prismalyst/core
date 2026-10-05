import type * as TS from 'typescript';

export type AstObject = {
  [key: string]: AstValue;
};

export type AstValue =
  AstObject | string | number | boolean | null | undefined | AstValue[] | TS.Expression;

export type AstTypeValue =
  | string
  | number
  | boolean
  | null
  | undefined
  | {
      kind: 'type';
      type: 'string' | 'number' | 'boolean' | 'unknown' | 'null' | 'undefined';
    }
  | {
      kind: 'object';
      properties: Record<string, AstTypeValue>;
    }
  | {
      kind: 'array';
      element: AstTypeValue;
    }
  | {
      kind: 'union';
      types: AstTypeValue[];
    };

type TemplateSpan = { name: string; value?: unknown };

export type TemplateAstNode = {
  kind: 'template';
  raw: string;
  templateSpans: TemplateSpan[];
};

export type SpreadAstNode = {
  kind: 'spread';
  expression: TS.Expression;
};
