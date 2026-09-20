import { PrismaCall } from './prisma.types.js';

// TODO: Make this more generic
export type RuleOptions = Readonly<Record<string, unknown>>;

type RuleAstType = 'callExpression' | 'newExpression';

export type Rule = {
  name: string;
  astType: RuleAstType;
  methods: string[];
  function: (prismaCall: PrismaCall, rule: Rule, options: RuleOptions) => boolean;
};
