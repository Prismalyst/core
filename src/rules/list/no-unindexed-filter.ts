import { PrismaExpression } from '../../types/prisma.types.js';
import {
  DMMFType,
  RuleOptions,
  RuleReturnType,
  RuleWithoutFunction,
} from '../../types/rule.eslint.types.js';

import { isObjectEmpty } from '../utils/is-object-empty.js';
import { isObject } from '../utils/is-object.js';

import { getProperty } from '../../ast/utils/get-property.js';

export function noUnindexedFilter(
  expression: Pick<PrismaExpression, 'method' | 'args' | 'prismaContext'>,
  rule: RuleWithoutFunction,
  _options: RuleOptions<Record<PropertyKey, never>>,
  dmmf?: DMMFType,
): RuleReturnType {
  if (!dmmf) return { isTriggered: false };

  const isRuleMethod = rule.methods.includes(expression.method);

  if (!isRuleMethod) return { isTriggered: false };

  const firstArg = expression.args[0];

  if (!firstArg) return { isTriggered: false };

  const firstArgValue = firstArg.value;

  const isFirstArgIsObject = isObject(firstArgValue);

  // Prisma already highlights this as an error
  if (!isFirstArgIsObject) return { isTriggered: false };

  const whereArg = getProperty(expression.args[0], ['where'])?.value;

  // That's not our case
  if (whereArg === undefined) return { isTriggered: false };

  const isWhereArgIsObject = isObject(whereArg);

  // Prisma already highlights this as an error
  if (!isWhereArgIsObject) return { isTriggered: false };

  // That's not our case
  if (isObjectEmpty(whereArg)) return { isTriggered: false };

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
    const unindexedKeys = whereKeys.filter((key) => !indexedKeys.has(key));

    if (unindexedKeys.length === 0) return { isTriggered: false };
    if (typeof unindexedKeys[0] !== 'string') return { isTriggered: false };

    const nodeToHighlight = getProperty(expression.args[0], ['where', unindexedKeys[0]])?.node;

    if (nodeToHighlight === undefined) return { isTriggered: true, nodeToHighlight: firstArg.node };

    return {
      isTriggered: true,
      nodeToHighlight,
    };
  }

  return { isTriggered: false };
}
