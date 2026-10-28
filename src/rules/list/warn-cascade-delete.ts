import { PrismaExpression } from '../../types/prisma.types.js';
import {
  DMMFType,
  RuleOptions,
  RuleReturnType,
  RuleWithoutFunction,
} from '../../types/rule.eslint.types.js';

export function warnCascadeDelete(
  expression: Pick<PrismaExpression, 'node' | 'method' | 'prismaContext'>,
  rule: RuleWithoutFunction,
  _options: RuleOptions<Record<PropertyKey, never>>,
  dmmf?: DMMFType,
): RuleReturnType {
  if (!dmmf) return { isTriggered: false };

  const isRuleMethod = rule.methods.includes(expression.method);

  if (!isRuleMethod) return { isTriggered: false };

  const model = expression.prismaContext.model;

  if (!model) return { isTriggered: false };

  const models = dmmf.datamodel.models;
  const isKnownModel = models.some((dmmfModel) => dmmfModel.name === model);

  if (!isKnownModel) return { isTriggered: false };

  // Cascade is declared on the referencing model's relation field.
  const hasCascadeDelete = models.some((dmmfModel) =>
    dmmfModel.fields.some(
      (field) =>
        field.kind === 'object' &&
        field.type === model &&
        field.relationOnDelete === 'Cascade' &&
        (field.relationFromFields?.length ?? 0) > 0,
    ),
  );

  if (!hasCascadeDelete) return { isTriggered: false };

  const nodeToHighlight = expression.node.expression;

  return { isTriggered: true, nodeToHighlight };
}
