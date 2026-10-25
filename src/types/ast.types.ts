import type * as TS from 'typescript';

export type AstObject = {
  [key: string]: ParsedValue;
};

export type ParsedValue<T = AstValue> = {
  value: T;
  node: TS.Node;
  valueNode?: TS.Node;
};

export type AstValue =
  | AstObject
  | string
  | number
  | boolean
  | null
  | undefined
  | ParsedValue[]
  | TS.Expression
  | AstTypeValue
  | TemplateAstNode;

export type AstTypeValue =
  | AstObject
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
      kind: 'array';
      element: ParsedValue<AstTypeValue>;
    }
  | {
      kind: 'union';
      types: ParsedValue<AstTypeValue>[];
    };

type TemplateSpan = { name: string; value: ParsedValue };

export type TemplateAstNode = {
  kind: 'template';
  raw: string;
  templateSpans: TemplateSpan[];
};

export type SpreadAstNode = {
  kind: 'spread';
  expression: TS.Expression;
};
