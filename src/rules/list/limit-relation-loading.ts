import type * as TS from 'typescript';

import { ParsedValue } from '../../types/ast.types.js';
import { PrismaExpression } from '../../types/prisma.types.js';
import {
  DMMFType,
  RuleOptions,
  RuleReturnType,
  RuleWithoutFunction,
} from '../../types/rule.eslint.types.js';

import { isObject } from '../utils/is-object.js';

import { getProperty } from '../../ast/utils/get-property.js';

const selectionNames = ['include', 'select'];

function hasUnboundedRelation(
  argument: ParsedValue,
  models: DMMFType['datamodel']['models'],
  currentModel: DMMFType['datamodel']['models'][number],
): { hasUnbounded: false } | { hasUnbounded: true; node: TS.Node } {
  for (const selectionName of selectionNames) {
    // select: { ... } or include: { ... } - Search for select or include
    const selection = getProperty(argument, [selectionName]);

    if (!isObject(selection?.value)) continue;

    for (const field of currentModel.fields) {
      if (field.kind !== 'object') continue;

      // select: { posts: { ... } } - Search for posts
      const relation = getProperty(selection, [field.name]);

      if (!relation) continue;

      const relationValue = relation.value;

      // Unresolved AST expressions and inferred scalar types carry a kind tag.
      const isRelationOptions = isObject(relationValue) && !Object.hasOwn(relationValue, 'kind');

      if (relationValue !== true && !isRelationOptions) continue;

      const relatedModel = models.find((dmmfModel) => dmmfModel.name === field.type);

      // Object fields can also refer to composite types rather than relations.
      if (!relatedModel) continue;

      if (field.isList && getProperty(relation, ['take'])?.value === undefined)
        return { hasUnbounded: true, node: relation.node };

      // A single-record relation can contain nested list relations.
      if (isRelationOptions) {
        const nestedResult = hasUnboundedRelation(relation, models, relatedModel);

        if (nestedResult.hasUnbounded) return nestedResult;
      }
    }
  }

  return { hasUnbounded: false };
}

export function limitRelationLoading(
  expression: Pick<PrismaExpression, 'node' | 'method' | 'args' | 'prismaContext'>,
  rule: RuleWithoutFunction,
  _options: RuleOptions<Record<PropertyKey, never>>,
  dmmf?: DMMFType,
): RuleReturnType {
  if (!dmmf) return { isTriggered: false };

  const isRuleMethod = rule.methods.includes(expression.method);

  if (!isRuleMethod) return { isTriggered: false };

  const firstArg = expression.args[0];

  if (!firstArg || !isObject(firstArg.value)) return { isTriggered: false };

  const model = expression.prismaContext.model;

  if (!model) return { isTriggered: false };

  const models = dmmf.datamodel.models;
  const dmmfModel = models.find((dmmfModel) => dmmfModel.name === model);

  if (!dmmfModel) return { isTriggered: false };

  const result = hasUnboundedRelation(firstArg, models, dmmfModel);

  if (!result.hasUnbounded) return { isTriggered: false };

  const nodeToHighlight = result.node;

  return { isTriggered: true, nodeToHighlight };
}
