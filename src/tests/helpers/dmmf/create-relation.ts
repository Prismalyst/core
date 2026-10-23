import type { DMMFType } from '../../../types/rule.eslint.types.js';

type Field = DMMFType['datamodel']['models'][number]['fields'][number];

export function createRelation(name: string, type: string, options: Partial<Field> = {}): Field {
  return {
    name,
    type,
    kind: 'object',
    isRequired: true,
    isList: false,
    isUnique: false,
    isId: false,
    isReadOnly: false,
    hasDefaultValue: false,
    relationFromFields: [`${name}Id`],
    relationToFields: ['id'],
    ...options,
  };
}
