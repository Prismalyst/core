import * as TS from 'typescript';
import { describe, expect, it } from 'vitest';

import type { PrismaExpression } from '../../../types/prisma.types.js';
import type { DMMFType, RuleWithoutFunction } from '../../../types/rule.eslint.types.js';

import { unstablePagination } from '../../../rules/list/unstable-pagination.js';

import { createAstParser } from '../../../ast/parser/create-ast-parser.js';
import { createNodeUtils } from '../../../ast/utils/create-node-utils.js';
import { getProperty } from '../../../ast/utils/get-property.js';
import { createDmmf } from '../../helpers/dmmf/create-dmmf.js';
import { createField } from '../../helpers/dmmf/create-field.js';

const rule: RuleWithoutFunction = {
  name: 'unstable-pagination',
  astType: 'callExpression',
  methods: ['findMany'],
  requireSchema: true,
};

const baseDmmf = createDmmf([]);
const dmmf: DMMFType = {
  ...baseDmmf,
  datamodel: {
    ...baseDmmf.datamodel,
    models: [
      {
        name: 'User',
        dbName: null,
        schema: null,
        fields: [
          createField('id', { isId: true }),
          createField('email', { isUnique: true }),
          createField('optionalCode', { isUnique: true, isRequired: false }),
          createField('createdAt'),
          createField('tenantId'),
          createField('externalId'),
          createField('region'),
          createField('slug'),
          createField('nullableCode', { isRequired: false }),
        ],
        uniqueFields: [
          ['tenantId', 'externalId'],
          ['region', 'slug'],
          ['tenantId', 'nullableCode'],
        ],
        uniqueIndexes: [],
        primaryKey: null,
      },
      {
        name: 'Membership',
        dbName: null,
        schema: null,
        fields: [createField('tenantId'), createField('userId')],
        uniqueFields: [],
        uniqueIndexes: [],
        primaryKey: { name: null, fields: ['tenantId', 'userId'] },
      },
    ],
  },
};

const checker = TS.createProgram([], {}).getTypeChecker();
const { parseArgument } = createNodeUtils(TS, checker);
const { findCallExpressions } = createAstParser(TS);

function createExpression(
  argument: string,
  model: string | null = 'User',
): Pick<PrismaExpression, 'method' | 'args' | 'prismaContext'> {
  const sourceFile = TS.createSourceFile(
    'query.ts',
    `prisma.user.findMany(${argument});`,
    TS.ScriptTarget.Latest,
    true,
  );
  const call = findCallExpressions(sourceFile)[0];

  if (!call) throw new Error('Expected a query call in the test source.');

  const firstArg = parseArgument(call);

  return {
    method: 'findMany',
    args: firstArg ? [firstArg] : [],
    prismaContext: {
      isFloatingPrismaPromise: false,
      isExpressionInsideTransaction: false,
      transactionType: null,
      clientType: 'prisma',
      model,
    },
  };
}

describe('unstablePagination', () => {
  it.each([
    { name: 'a nonunique field', orderBy: "{ createdAt: 'desc' }", expected: true },
    { name: 'a nonunique field in an array', orderBy: "[{ createdAt: 'desc' }]", expected: true },
    { name: 'a primary key', orderBy: "{ id: 'asc' }", expected: false },
    { name: 'a primary key in an array', orderBy: "[{ id: 'asc' }]", expected: false },
    { name: 'a required unique field', orderBy: "{ email: 'asc' }", expected: false },
    {
      name: 'a primary key tie-breaker',
      orderBy: "[{ createdAt: 'desc' }, { id: 'asc' }]",
      expected: false,
    },
    { name: 'a nullable unique field', orderBy: "{ optionalCode: 'asc' }", expected: true },
    {
      name: 'a nullable unique field with a primary key tie-breaker',
      orderBy: "[{ optionalCode: 'asc' }, { id: 'asc' }]",
      expected: false,
    },
    {
      name: 'a complete compound unique key',
      orderBy: "[{ tenantId: 'asc' }, { externalId: 'desc' }]",
      expected: false,
    },
    {
      name: 'a complete compound unique key in reverse order',
      orderBy: "[{ externalId: 'asc' }, { tenantId: 'asc' }]",
      expected: false,
    },
    { name: 'only the first compound field', orderBy: "{ tenantId: 'asc' }", expected: true },
    { name: 'only the second compound field', orderBy: "{ externalId: 'asc' }", expected: true },
    {
      name: 'fields from different compound keys',
      orderBy: "[{ tenantId: 'asc' }, { region: 'asc' }]",
      expected: true,
    },
    {
      name: 'a repeated incomplete compound field',
      orderBy: "[{ tenantId: 'asc' }, { tenantId: 'desc' }]",
      expected: true,
    },
    {
      name: 'another complete compound key',
      orderBy: "[{ region: 'asc' }, { slug: 'asc' }]",
      expected: false,
    },
    {
      name: 'a compound unique key containing a nullable field',
      orderBy: "[{ tenantId: 'asc' }, { nullableCode: 'asc' }]",
      expected: true,
    },
  ])('returns violation=$expected for $name', ({ orderBy, expected }) => {
    const expression = createExpression(`{ take: 10, orderBy: ${orderBy} }`);

    expect(unstablePagination(expression, rule, {}, dmmf).isTriggered).toBe(expected);
  });

  it.each([
    { orderBy: "[{ tenantId: 'asc' }, { userId: 'asc' }]", expected: false },
    { orderBy: "[{ userId: 'desc' }, { tenantId: 'asc' }]", expected: false },
    { orderBy: "{ tenantId: 'asc' }", expected: true },
    { orderBy: "{ userId: 'asc' }", expected: true },
  ])(
    'returns violation=$expected for compound primary key order $orderBy',
    ({ orderBy, expected }) => {
      const expression = createExpression(`{ take: 10, orderBy: ${orderBy} }`, 'Membership');

      expect(unstablePagination(expression, rule, {}, dmmf).isTriggered).toBe(expected);
    },
  );

  it.each([
    '',
    'null',
    '[]',
    '{ take: 10 }',
    "{ orderBy: { createdAt: 'desc' } }",
    "{ skip: 1, cursor: { id: '1' }, orderBy: { createdAt: 'desc' } }",
    '{ take: 10, orderBy: {} }',
    '{ take: 10, orderBy: [] }',
    '{ take: 10, orderBy: null }',
  ])('ignores a query outside the rule scope: %s', (argument) => {
    expect(unstablePagination(createExpression(argument), rule, {}, dmmf)).toEqual({
      isTriggered: false,
    });
  });

  it.each([null, 'MissingModel'])(
    'ignores a query without schema metadata for model %s',
    (model) => {
      const expression = createExpression("{ take: 10, orderBy: { createdAt: 'desc' } }", model);

      expect(unstablePagination(expression, rule, {}, dmmf)).toEqual({ isTriggered: false });
    },
  );

  it('ignores methods outside the rule', () => {
    const expression = createExpression("{ take: 10, orderBy: { createdAt: 'desc' } }");
    expression.method = 'updateMany';

    expect(unstablePagination(expression, rule, {}, dmmf)).toEqual({ isTriggered: false });
  });

  it('highlights the inline orderBy property', () => {
    const expression = createExpression("{ take: 10, orderBy: { createdAt: 'desc' } }");
    const result = unstablePagination(expression, rule, {}, dmmf);

    expect(result.isTriggered).toBe(true);
    expect(result.nodeToHighlight?.getText()).toBe("orderBy: { createdAt: 'desc' }");
  });

  it('reports the orderBy node when it has no parent', () => {
    const expression = createExpression("{ take: 10, orderBy: { createdAt: 'desc' } }");
    const orderBy = getProperty(expression.args[0], ['orderBy']);

    if (!orderBy) throw new Error('Expected an orderBy property in the test query.');

    orderBy.node = TS.factory.createIdentifier('orderBy');

    expect(unstablePagination(expression, rule, {}, dmmf)).toEqual({
      isTriggered: true,
      nodeToHighlight: orderBy.node,
    });
  });
});
