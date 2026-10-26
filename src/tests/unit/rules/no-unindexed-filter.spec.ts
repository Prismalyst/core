import { describe, expect, it } from 'vitest';

import type { RuleWithoutFunction } from '../../../types/rule.eslint.types.js';

import { noUnindexedFilter } from '../../../rules/list/no-unindexed-filter.js';

import { createExpression } from '../../helpers/create-expression.js';
import { createDmmf } from '../../helpers/dmmf/create-dmmf.js';
import { createIndex } from '../../helpers/dmmf/create-index.js';

const rule: RuleWithoutFunction = {
  name: 'no-unindexed-filter',
  astType: 'callExpression',
  methods: ['findMany', 'findFirst', 'count'],
  requireSchema: true,
};

const dmmf = createDmmf([
  createIndex(['id'], 'User', 'id'),
  createIndex(['email'], 'User', 'unique'),
  createIndex(['createdAt']),
  createIndex(['tenantId', 'externalId']),
]);

describe('noUnindexedFilter', () => {
  it.each([
    { name: 'no arguments', argument: '' },
    { name: 'an undefined argument', argument: 'undefined' },
    { name: 'a null argument', argument: 'null' },
    { name: 'a number argument', argument: '42' },
    { name: 'a string argument', argument: "'options'" },
    { name: 'a boolean argument', argument: 'false' },
    { name: 'an empty options object', argument: '{}' },
    { name: 'options without where', argument: '{ take: 10 }' },
    { name: 'an undefined where', argument: '{ where: undefined }' },
    { name: 'a null where', argument: '{ where: null }' },
    { name: 'a number where', argument: '{ where: 42 }' },
    { name: 'a string where', argument: "{ where: 'email' }" },
    { name: 'a boolean where', argument: '{ where: false }' },
    { name: 'an empty where', argument: '{ where: {} }' },
  ])('ignores a query with $name', ({ argument }) => {
    const expression = createExpression('findMany', 'User', argument);
    const result = noUnindexedFilter(expression, rule, {}, dmmf);

    expect(result.isTriggered).toBe(false);
  });

  it.each(rule.methods)('reports an unindexed filter for the configured method %s', (method) => {
    const expression = createExpression(method, 'User', "{ where: { name: 'Alice' } }");
    const result = noUnindexedFilter(expression, rule, {}, dmmf);

    expect(result.isTriggered).toBe(true);

    if (result.isTriggered) {
      expect(result.nodeToHighlight.getText()).toBe('name');
    }
  });

  it('ignores methods outside the rule even when the filter is unindexed', () => {
    const expression = createExpression('updateMany', 'User', "{ where: { name: 'Alice' } }");
    const result = noUnindexedFilter(expression, rule, {}, dmmf);

    expect(result.isTriggered).toBe(false);
  });

  it.each([
    { method: 'updateMany', expected: true },
    { method: 'findMany', expected: false },
  ])('returns isTriggered=$expected for the custom method $method', ({ method, expected }) => {
    const customRule = { ...rule, methods: ['updateMany'] };
    const expression = createExpression(method, 'User', "{ where: { name: 'Alice' } }");
    const result = noUnindexedFilter(expression, customRule, {}, dmmf);

    expect(result.isTriggered).toBe(expected);

    if (result.isTriggered) {
      expect(result.nodeToHighlight.getText()).toBe('name');
    }
  });

  it.each([
    { name: 'a primary key', where: '{ id: 1 }' },
    { name: 'a unique index', where: "{ email: 'alice@example.com' }" },
    { name: 'a normal index', where: "{ createdAt: '2026-01-01' }" },
    { name: 'multiple separate indexes', where: "{ id: 1, email: 'alice@example.com' }" },
    { name: 'a compound index', where: "{ tenantId: 1, externalId: 'alice' }" },
    { name: 'the leading field of a compound index', where: '{ tenantId: 1 }' },
    // Current behavior matches any field of a compound index, regardless of position.
    { name: 'the trailing field of a compound index', where: "{ externalId: 'alice' }" },
    {
      name: 'an indexed field with nested operators',
      where: "{ email: { contains: '@example.com' } }",
    },
  ])('allows a filter covered by $name', ({ where }) => {
    const expression = createExpression('findMany', 'User', `{ where: ${where} }`);
    const result = noUnindexedFilter(expression, rule, {}, dmmf);

    expect(result.isTriggered).toBe(false);
  });

  it.each([
    { name: 'no indexes', indexes: [] },
    { name: 'an index on a different field', indexes: [createIndex(['name'])] },
    { name: 'an index on another model', indexes: [createIndex(['email'], 'Post')] },
    { name: 'a different model name casing', indexes: [createIndex(['email'], 'user')] },
    { name: 'a different field name casing', indexes: [createIndex(['Email'])] },
  ])('reports an unindexed email filter with $name', ({ indexes }) => {
    const expression = createExpression(
      'findMany',
      'User',
      "{ where: { email: 'alice@example.com' } }",
    );
    const result = noUnindexedFilter(expression, rule, {}, createDmmf(indexes));

    expect(result.isTriggered).toBe(true);

    if (result.isTriggered) {
      expect(result.nodeToHighlight.getText()).toBe('email');
    }
  });

  it('allows a filter when matching and unrelated model indexes coexist', () => {
    const expression = createExpression(
      'findMany',
      'User',
      "{ where: { email: 'alice@example.com' } }",
    );
    const schema = createDmmf([createIndex(['email'], 'Post'), createIndex(['email'])]);
    const result = noUnindexedFilter(expression, rule, {}, schema);

    expect(result.isTriggered).toBe(false);
  });

  it('does not count the same field twice when multiple indexes cover it', () => {
    const expression = createExpression(
      'findMany',
      'User',
      "{ where: { email: 'alice@example.com', name: 'Alice' } }",
    );
    const schema = createDmmf([createIndex(['email']), createIndex(['email'], 'User', 'unique')]);
    const result = noUnindexedFilter(expression, rule, {}, schema);

    expect(result.isTriggered).toBe(true);

    if (result.isTriggered) {
      expect(result.nodeToHighlight.getText()).toBe('name');
    }
  });

  it('reports an unindexed filter when the model is unknown', () => {
    const expression = createExpression('findMany', null, '{ where: { id: 1 } }');
    const result = noUnindexedFilter(expression, rule, {}, dmmf);

    expect(result.isTriggered).toBe(true);

    if (result.isTriggered) {
      expect(result.nodeToHighlight.getText()).toBe('id');
    }
  });

  it.each(['AND', 'OR', 'NOT'])('treats %s as an unindexed top-level key', (operator) => {
    // Current behavior does not recursively inspect logical filters.
    const expression = createExpression(
      'findMany',
      'User',
      `{ where: { ${operator}: [{ id: 1 }] } }`,
    );
    const result = noUnindexedFilter(expression, rule, {}, dmmf);

    expect(result.isTriggered).toBe(true);

    if (result.isTriggered) {
      expect(result.nodeToHighlight.getText()).toBe(operator);
    }
  });

  it('highlights the first unindexed field after skipping indexed fields', () => {
    const expression = createExpression(
      'findMany',
      'User',
      "{ where: { id: 1, name: 'Alice', status: 'ACTIVE' } }",
    );
    const result = noUnindexedFilter(expression, rule, {}, dmmf);

    expect(result.isTriggered).toBe(true);

    if (result.isTriggered) {
      expect(result.nodeToHighlight.getText()).toBe('name');
    }
  });
});
