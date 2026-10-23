import type { Index } from '@prisma/dmmf';

export function createIndex(
  fields: string[],
  model = 'User',
  type: Index['type'] = 'normal',
): Index {
  return {
    model,
    type,
    isDefinedOnField: fields.length === 1,
    fields: fields.map((name) => ({ name })),
  };
}
