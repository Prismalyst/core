import type { DMMFType } from '../../../../types/rule.eslint.types.js';

export function createDmmf(indexes: DMMFType['datamodel']['indexes']): DMMFType {
  return {
    datamodel: { models: [], enums: [], types: [], indexes },
    schema: {
      inputObjectTypes: {},
      outputObjectTypes: { model: [], prisma: [] },
      enumTypes: { prisma: [] },
      fieldRefTypes: {},
    },
    mappings: { modelOperations: [], otherOperations: { read: [], write: [] } },
  };
}
