import { PrismaExpression } from './prisma.types.js';

export type RuleOptions<T = Record<string, unknown>> = Readonly<T>;

type RuleAstType = 'callExpression' | 'newExpression';

export type Rule = {
  name: string;
  astType: RuleAstType;
  methods: string[];
  function: (
    prismaExpression: PrismaExpression,
    rule: RuleWithoutFunction,
    options: RuleOptions,
  ) => boolean;
};

export type RuleWithoutFunction = Omit<Rule, 'function'>;
