import type { DMMFType } from '../../../types/rule.eslint.types.js';

import { createDmmf } from './create-dmmf.js';

type Model = DMMFType['datamodel']['models'][number];

export function createSchema(models: Model[]): DMMFType {
  const dmmf = createDmmf([]);

  return { ...dmmf, datamodel: { ...dmmf.datamodel, models } };
}
