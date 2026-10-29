import { PrismaExpression } from '../../types/prisma.types.js';
import {
  DMMFType,
  RuleOptions,
  RuleReturnType,
  RuleWithoutFunction,
} from '../../types/rule.eslint.types.js';

import { isArray } from '../utils/is-array.js';
import { isObject } from '../utils/is-object.js';

import { getProperty } from '../../ast/utils/get-property.js';

export function unstablePagination(
  expression: Pick<PrismaExpression, 'method' | 'args' | 'prismaContext'>,
  rule: RuleWithoutFunction,
  _options: RuleOptions<Record<PropertyKey, never>>,
  dmmf?: DMMFType,
): RuleReturnType {
  if (!dmmf) return { isTriggered: false };

  const isRuleMethod = rule.methods.includes(expression.method);

  if (!isRuleMethod) return { isTriggered: false };

  const firstArg = expression.args[0]?.value;

  const isFirstArgIsObject = isObject(firstArg);

  // Prisma already highlights this as an error
  if (!isFirstArgIsObject) return { isTriggered: false };

  const orderBy = getProperty(expression.args[0], ['orderBy']);

  // That's not our case
  if (orderBy === undefined) return { isTriggered: false };

  const orderByArg = orderBy.value;

  // That's not our case
  if (orderByArg === undefined) return { isTriggered: false };

  const isOrderByArgIsArray = isArray(orderByArg);
  const isOrderByArgIsObject = isObject(orderByArg);

  // Prisma already highlights this as an error
  if (!isOrderByArgIsObject && !isOrderByArgIsArray) return { isTriggered: false };

  const takeArg = getProperty(expression.args[0], ['take'])?.value;

  // That's not our case
  if (takeArg === undefined) {
    return { isTriggered: false };
  }

  const model = expression.prismaContext.model;

  if (!model) return { isTriggered: false };

  const orderByFields = new Set(
    isOrderByArgIsObject
      ? Object.keys(orderByArg)
      : orderByArg.flatMap(({ value }) => (isObject(value) ? Object.keys(value) : [])),
  );

  if (orderByFields.size === 0) return { isTriggered: false };

  const dmmfModel = dmmf.datamodel.models.find((dmmfModel) => dmmfModel.name === model);

  if (!dmmfModel) return { isTriggered: false };

  const requiredFields = new Set(
    dmmfModel.fields.filter((field) => field.isRequired).map((field) => field.name),
  );
  const uniqueKeys = [
    ...dmmfModel.fields
      .filter((field) => field.isUnique || field.isId)
      .map((field) => [field.name]),
    ...dmmfModel.uniqueFields,
    ...(dmmfModel.primaryKey ? [dmmfModel.primaryKey.fields] : []),
  ];

  // A unique order needs a complete key whose fields cannot contain nulls.
  const hasUniqueOrder = uniqueKeys.some(
    (key) =>
      key.length > 0 && key.every((field) => orderByFields.has(field) && requiredFields.has(field)),
  );

  if (hasUniqueOrder) return { isTriggered: false };

  const nodeToHighlight = orderBy.node.parent;

  return { isTriggered: true, nodeToHighlight };
}
