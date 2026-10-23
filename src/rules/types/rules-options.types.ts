import { Rule } from '../../types/rule.eslint.types.js';

import { MaxTakeOptions } from '../list/max-take.js';
import { NoDeepOffsetPaginationOptions } from '../list/no-deep-offset-pagination.js';
import { NoDisconnectInRequestFlowOptions } from '../list/no-disconnect-in-request-flow.js';
import { NoPrismaClientInFunctionOptions } from '../list/no-prisma-client-in-function.js';

type NoOptions = Record<PropertyKey, never>;

type RulesWithoutOptions = {
  'no-unsafe-raw-sql': NoOptions;
  'no-dynamic-raw-query': NoOptions;
  'no-unsafe-prisma-raw': NoOptions;
  'no-floating-prisma-promise': NoOptions;
  'require-where-delete-many': NoOptions;
  'require-where-update-many': NoOptions;
  'no-query-in-loop': NoOptions;
  'no-root-client-in-transaction': NoOptions;
  'no-unindexed-filter': NoOptions;
  'unstable-pagination': NoOptions;
  'warn-cascade-delete': NoOptions;
  'limit-relation-loading': NoOptions;
};

type RulesWithOptions = {
  'max-take': MaxTakeOptions;
  'no-deep-offset-pagination': NoDeepOffsetPaginationOptions;
  'no-prisma-client-in-function': NoPrismaClientInFunctionOptions;
  'no-disconnect-in-request-flow': NoDisconnectInRequestFlowOptions;
};

export type OptionsByRuleName = Readonly<RulesWithOptions & RulesWithoutOptions>;

export type RegisteredRule<TRuleName extends keyof OptionsByRuleName = keyof OptionsByRuleName> = {
  [Name in TRuleName]: Rule<OptionsByRuleName[Name]> & {
    name: Name;
  };
}[TRuleName];
