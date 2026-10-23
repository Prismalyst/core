import * as TS from 'typescript';
import { describe, expect, it } from 'vitest';

import type { PrismaContext } from '../../../types/prisma.types.js';
import type { RuleWithoutFunction } from '../../../types/rule.eslint.types.js';

import { noUnindexedFilter } from '../../../rules/list/no-unindexed-filter.js';

import { createDmmf } from '../../helpers/dmmf/create-dmmf.js';
import { createIndex } from '../../helpers/dmmf/create-index.js';
import { wrapArguments } from '../../helpers/wrap-arguments.js';

const rule: RuleWithoutFunction = {
  name: 'no-unindexed-filter',
  astType: 'callExpression',
  methods: ['findMany', 'findFirst', 'count'],
  requireSchema: true,
};

const prismaContext: PrismaContext = {
  isFloatingPrismaPromise: false,
  isExpressionInsideTransaction: false,
  transactionType: null,
  clientType: 'prisma',
  model: 'User',
};

const dmmf = createDmmf([
  createIndex(['id'], 'User', 'id'),
  createIndex(['email'], 'User', 'unique'),
  createIndex(['createdAt']),
  createIndex(['tenantId', 'externalId']),
]);

describe('noUnindexedFilter', () => {
  it.each([
    { name: 'no arguments', args: [] },
    { name: 'an undefined argument', args: [undefined] },
    { name: 'a null argument', args: [null] },
    { name: 'a number argument', args: [42] },
    { name: 'a string argument', args: ['options'] },
    { name: 'a boolean argument', args: [false] },
    { name: 'an empty options object', args: [{}] },
    { name: 'options without where', args: [{ take: 10 }] },
    { name: 'an undefined where', args: [{ where: undefined }] },
    { name: 'a null where', args: [{ where: null }] },
    { name: 'a number where', args: [{ where: 42 }] },
    { name: 'a string where', args: [{ where: 'email' }] },
    { name: 'a boolean where', args: [{ where: false }] },
    { name: 'an empty where', args: [{ where: {} }] },
  ])('ignores a query with $name', ({ args }) => {
    expect(
      noUnindexedFilter(
        { method: 'findMany', args: wrapArguments(args), prismaContext },
        rule,
        {},
        dmmf,
      ),
    ).toEqual({ isTriggered: false });
  });

  it.each(rule.methods)('reports an unindexed filter for the configured method %s', (method) => {
    expect(
      noUnindexedFilter(
        { method, args: wrapArguments([{ where: { name: 'Alice' } }]), prismaContext },
        rule,
        {},
        dmmf,
      ),
    ).toEqual({ isTriggered: true, nodeToHighlight: expect.anything() });
  });

  it('ignores methods outside the rule even when the filter is unindexed', () => {
    expect(
      noUnindexedFilter(
        {
          method: 'updateMany',
          args: wrapArguments([{ where: { name: 'Alice' } }]),
          prismaContext,
        },
        rule,
        {},
        dmmf,
      ),
    ).toEqual({ isTriggered: false });
  });

  it('reports only methods in the custom rule configuration', () => {
    const customRule = { ...rule, methods: ['updateMany'] };
    const args = wrapArguments([{ where: { name: 'Alice' } }]);

    expect(
      noUnindexedFilter({ method: 'updateMany', args, prismaContext }, customRule, {}, dmmf),
    ).toEqual({ isTriggered: true, nodeToHighlight: expect.anything() });
    expect(
      noUnindexedFilter({ method: 'findMany', args, prismaContext }, customRule, {}, dmmf),
    ).toEqual({ isTriggered: false });
  });

  it.each([
    { name: 'a primary key', where: { id: 1 } },
    { name: 'a unique index', where: { email: 'alice@example.com' } },
    { name: 'a normal index', where: { createdAt: '2026-01-01' } },
    { name: 'multiple separate indexes', where: { id: 1, email: 'alice@example.com' } },
    { name: 'a compound index', where: { tenantId: 1, externalId: 'alice' } },
    { name: 'the leading field of a compound index', where: { tenantId: 1 } },
    // Current behavior matches any field of a compound index, regardless of position.
    { name: 'the trailing field of a compound index', where: { externalId: 'alice' } },
    {
      name: 'an indexed field with nested operators',
      where: { email: { contains: '@example.com' } },
    },
  ])('allows a filter covered by $name', ({ where }) => {
    expect(
      noUnindexedFilter(
        { method: 'findMany', args: wrapArguments([{ where }]), prismaContext },
        rule,
        {},
        dmmf,
      ),
    ).toEqual({ isTriggered: false });
  });

  it.each([
    { name: 'no indexes', indexes: [] },
    { name: 'an index on a different field', indexes: [createIndex(['name'])] },
    { name: 'an index on another model', indexes: [createIndex(['email'], 'Post')] },
    { name: 'a different model name casing', indexes: [createIndex(['email'], 'user')] },
    { name: 'a different field name casing', indexes: [createIndex(['Email'])] },
  ])('reports an unindexed email filter with $name', ({ indexes }) => {
    expect(
      noUnindexedFilter(
        {
          method: 'findMany',
          args: wrapArguments([{ where: { email: 'alice@example.com' } }]),
          prismaContext,
        },
        rule,
        {},
        createDmmf(indexes),
      ),
    ).toEqual({ isTriggered: true, nodeToHighlight: expect.anything() });
  });

  it('allows a filter when matching and unrelated model indexes coexist', () => {
    expect(
      noUnindexedFilter(
        {
          method: 'findMany',
          args: wrapArguments([{ where: { email: 'alice@example.com' } }]),
          prismaContext,
        },
        rule,
        {},
        createDmmf([createIndex(['email'], 'Post'), createIndex(['email'])]),
      ),
    ).toEqual({ isTriggered: false });
  });

  it('does not count the same field twice when multiple indexes cover it', () => {
    expect(
      noUnindexedFilter(
        {
          method: 'findMany',
          args: wrapArguments([{ where: { email: 'alice@example.com', name: 'Alice' } }]),
          prismaContext,
        },
        rule,
        {},
        createDmmf([createIndex(['email']), createIndex(['email'], 'User', 'unique')]),
      ),
    ).toEqual({ isTriggered: true, nodeToHighlight: expect.anything() });
  });

  it('reports an unindexed filter when the model is unknown', () => {
    expect(
      noUnindexedFilter(
        {
          method: 'findMany',
          args: wrapArguments([{ where: { id: 1 } }]),
          prismaContext: { ...prismaContext, model: null },
        },
        rule,
        {},
        dmmf,
      ),
    ).toEqual({ isTriggered: true, nodeToHighlight: expect.anything() });
  });

  it.each(['AND', 'OR', 'NOT'])('treats %s as an unindexed top-level key', (operator) => {
    // Current behavior does not recursively inspect logical filters.
    expect(
      noUnindexedFilter(
        {
          method: 'findMany',
          args: wrapArguments([{ where: { [operator]: [{ id: 1 }] } }]),
          prismaContext,
        },
        rule,
        {},
        dmmf,
      ),
    ).toEqual({ isTriggered: true, nodeToHighlight: expect.anything() });
  });

  it('highlights the first unindexed field after skipping indexed fields', () => {
    const idNode = TS.factory.createNumericLiteral(1);
    const nameNode = TS.factory.createStringLiteral('Alice');
    const statusNode = TS.factory.createStringLiteral('ACTIVE');
    const whereNode = TS.factory.createObjectLiteralExpression();
    const args = [
      {
        node: TS.factory.createObjectLiteralExpression(),
        value: {
          where: {
            node: whereNode,
            value: {
              id: { value: 1, node: idNode },
              name: { value: 'Alice', node: nameNode },
              status: { value: 'ACTIVE', node: statusNode },
            },
          },
        },
      },
    ];

    const result = noUnindexedFilter({ method: 'findMany', args, prismaContext }, rule, {}, dmmf);

    expect(result.isTriggered).toBe(true);
    expect(result.nodeToHighlight).toBe(nameNode);
  });

  it('reports a violation even when the unindexed field has no source node', () => {
    const name = { value: 'Alice', node: TS.factory.createStringLiteral('Alice') };
    Reflect.deleteProperty(name, 'node');
    const args = [
      {
        node: TS.factory.createObjectLiteralExpression(),
        value: {
          where: {
            node: TS.factory.createObjectLiteralExpression(),
            value: { name },
          },
        },
      },
    ];

    expect(noUnindexedFilter({ method: 'findMany', args, prismaContext }, rule, {}, dmmf)).toEqual({
      isTriggered: true,
    });
  });
});
