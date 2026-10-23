import type { DMMFType } from '../../../types/rule.eslint.types.js';

type Model = DMMFType['datamodel']['models'][number];
type Field = Model['fields'][number];

export function createModel(name: string, fields: Field[] = []): Model {
  return {
    name,
    dbName: null,
    schema: null,
    fields: [
      {
        name: 'id',
        type: 'Int',
        kind: 'scalar',
        isRequired: true,
        isList: false,
        isUnique: false,
        isId: true,
        isReadOnly: false,
        hasDefaultValue: false,
      },
      ...fields,
    ],
    uniqueFields: [],
    uniqueIndexes: [],
    primaryKey: null,
  };
}
