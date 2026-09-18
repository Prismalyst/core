import { PrismaCall } from './prisma.types.js';

// TODO: Make this more generic
export type RuleOptions = Readonly<Record<string, unknown>>;

export type Rule = {
  name: string;
  methods: string[];
  function: (prismaCall: PrismaCall, rule: Rule, options: RuleOptions) => boolean;
};
