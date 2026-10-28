import type { Document } from '@prisma/dmmf';
import type * as TS from 'typescript';

import { PrismaExpression } from './prisma.types.js';

type RuleAstType = 'callExpression' | 'newExpression';

export type RuleOptions<T> = Readonly<T>;

export type DMMFType = Document;

export type RuleReturnType =
  | { isTriggered: false }
  | {
      isTriggered: true;
      nodeToHighlight: TS.Node;
    };

export type Rule<TOptions = Record<PropertyKey, never>> = {
  name: string;
  astType: RuleAstType;
  methods: string[];
  requireSchema: boolean;
  function: (
    prismaExpression: PrismaExpression,
    rule: RuleWithoutFunction,
    // TODO: make "options" optional and move "dmmf" field before options
    options: RuleOptions<TOptions>,
    dmmf?: DMMFType,
  ) => RuleReturnType;
};

export type RuleWithoutFunction = Omit<Rule, 'function'>;
