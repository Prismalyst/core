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
  console.log('noUnindexedFilter');
  const isRuleMethod = rule.methods.includes(expression.method);

  console.log('isRuleMethod', isRuleMethod);
  if (!isRuleMethod) return false;

  const firstArg = expression.args[0];
  console.log('firstArg', firstArg);

  const isFirstArgIsObject = isObject(firstArg);
  console.log('isFirstArgIsObject', isFirstArgIsObject);

  // Prisma already highlights this as an error
  if (!isFirstArgIsObject) return false;

  const whereArg = firstArg.where;
  console.log('whereArg', whereArg);

  // That's not our case
  if (whereArg === undefined) return false;

  const isWhereArgIsObject = isObject(whereArg);
  console.log('isWhereArgIsObject', isWhereArgIsObject);

  // Prisma already highlights this as an error
  if (!isWhereArgIsObject) return false;

  // That's not our case
  if (isObjectEmpty(whereArg)) return false;

  const whereKeys = Object.keys(whereArg);
  console.log('whereKeys', whereKeys);
  const indexes = dmmf.datamodel.indexes;
  console.log('indexes', indexes);

  const indexedKeys = new Set<string>();

  const model = expression.prismaContext.model;
  console.log('model', model);

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

  console.log('indexedKeys', indexedKeys);

  if (indexedKeys.size !== whereKeys.length) {
    return true;
  }

  return false;
}
