import { PrismaExpression } from '../../types/prisma.types.js';
import { DMMFType, RuleOptions, RuleWithoutFunction } from '../../types/rule.eslint.types.js';

import { isObjectEmpty } from '../utils/is-object-empty.js';
import { isObject } from '../utils/is-object.js';

// TODO: Find a way to highlight the node
// export type RuleReturnType = {
//   isTriggered: boolean;
//   nodeToHighlight: TS.Node
// };

export function noUnindexedFilter(
  expression: Pick<PrismaExpression, 'method' | 'args' | 'prismaContext'>,
  rule: RuleWithoutFunction,
  _options: RuleOptions<Record<PropertyKey, never>>,
  dmmf: DMMFType,
) {
  const isRuleMethod = rule.methods.includes(expression.method);

  if (!isRuleMethod) return false;

  const firstArg = expression.args[0];

  const isFirstArgIsObject = isObject(firstArg);

  // Prisma already highlights this as an error
  if (!isFirstArgIsObject) return false;

  const whereArg = firstArg.where;

  // That's not our case
  if (whereArg === undefined) return false;

  const isWhereArgIsObject = isObject(whereArg);

  // Prisma already highlights this as an error
  if (!isWhereArgIsObject) return false;

  // That's not our case
  if (isObjectEmpty(whereArg)) return false;

  const whereKeys = Object.keys(whereArg);
  const indexes = dmmf.datamodel.indexes;

  const indexedKeys = new Set<string>();

  const model = expression.prismaContext.model;

  indexes.forEach((index) => {
    if (index.model !== model) return;

    const indexFields = index.fields;

    whereKeys.forEach((whereKey) => {
      indexFields.forEach((indexField) => {
        const indexName = indexField.name;

        if (indexName === whereKey && !indexedKeys.has(whereKey)) {
          indexedKeys.add(whereKey);
        }
      });
    });
  });

  if (indexedKeys.size !== whereKeys.length) {
    return true;
  }

  return false;
}
