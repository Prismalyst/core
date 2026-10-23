import type { DMMFType } from '../../../types/rule.eslint.types.js';

type Field = DMMFType['datamodel']['models'][number]['fields'][number];

export function createField(
  name: string,
  options: Partial<Pick<Field, 'isUnique' | 'isId' | 'isRequired'>> = {},
): Field {
  return {
    name,
    kind: 'scalar',
    type: 'String',
    isRequired: true,
    isList: false,
    isUnique: false,
    isId: false,
    isReadOnly: false,
    hasDefaultValue: false,
    ...options,
  };
}
