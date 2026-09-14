import { PrismaCall } from './prisma.types.js';

export type RuleSeverity = 'problem' | 'suggestion' | 'layout';

export type Rule = {
  name: string;
  messageId: string;
  meta: {
    type: RuleSeverity;
    docs: {
      description: string;
      recommended: boolean;
      requiresTypeChecking: boolean;
    };
    messages: Record<string, string>;
    schema: never[];
  };
  methods: string[];
  function: (prismaCall: PrismaCall, rule: Rule) => boolean;
};
