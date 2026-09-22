import { PrismaExpression } from './prisma.types.js';

export type RuleOptions<T = Record<string, unknown>> = Readonly<T>;

type RuleAstType = 'callExpression' | 'newExpression';

export type Rule = {
  name: string;
  astType: RuleAstType;
  methods: string[];
  function: (prismaExpression: PrismaExpression, rule: Rule, options: RuleOptions) => boolean;
};
