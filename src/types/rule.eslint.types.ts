import { PrismaExpression } from './prisma.types.js';

type RuleAstType = 'callExpression' | 'newExpression';

export type RuleOptions<T> = Readonly<T>;

export type Rule<TOptions = Record<PropertyKey, never>> = {
  name: string;
  astType: RuleAstType;
  methods: string[];
  function: (
    prismaExpression: PrismaExpression,
    rule: RuleWithoutFunction,
    options: RuleOptions<TOptions>,
  ) => boolean;
};

export type RuleWithoutFunction = Omit<Rule, 'function'>;
