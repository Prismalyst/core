import { describe, expect, it } from 'vitest';

import type { RuleWithoutFunction } from '../../../types/rule.eslint.types.js';

import { limitRelationLoading } from '../../../rules/list/limit-relation-loading.js';

import { getProperty } from '../../../ast/utils/get-property.js';
import { createExpression } from '../../helpers/create-expression.js';
import { createField } from '../../helpers/dmmf/create-field.js';
import { createModel } from '../../helpers/dmmf/create-model.js';
import { createRelation } from '../../helpers/dmmf/create-relation.js';
import { createSchema } from '../../helpers/dmmf/create-schema.js';

const rule: RuleWithoutFunction = {
  name: 'limit-relation-loading',
  astType: 'callExpression',
  methods: ['findMany', 'findUnique', 'findFirst', 'create', 'update', 'upsert', 'delete'],
  requireSchema: true,
};

const userModel = createModel('User', [
  createField('name'),
  { ...createField('tags'), isList: true },
  createRelation('posts', 'Post', { isList: true }),
  createRelation('profile', 'Profile', { isRequired: false }),
  createRelation('roles', 'Role', {
    isList: true,
    relationFromFields: [],
    relationToFields: [],
  }),
]);

const dmmf = createSchema([
  userModel,
  createModel('Post', [
    createRelation('author', 'User'),
    createRelation('comments', 'Comment', { isList: true }),
  ]),
  createModel('Profile', [createRelation('user', 'User')]),
  createModel('Comment'),
  createModel('Role', [
    createRelation('users', 'User', {
      isList: true,
      relationFromFields: [],
      relationToFields: [],
    }),
  ]),
]);

describe('limitRelationLoading', () => {
  it.each([
    { selection: 'include', value: 'true' },
    { selection: 'include', value: '{}' },
    { selection: 'select', value: 'true' },
    { selection: 'select', value: '{}' },
  ])('reports and highlights $selection.posts = $value', ({ selection, value }) => {
    const expression = createExpression(
      'findMany',
      'User',
      `{ ${selection}: { posts: ${value} } }`,
    );
    const result = limitRelationLoading(expression, rule, {}, dmmf);

    expect(result.isTriggered).toBe(true);
    expect(result.nodeToHighlight).toBe(
      getProperty(expression.args[0], [selection, 'posts'])?.node,
    );
    expect(result.nodeToHighlight?.getText()).toBe('posts');
  });

  it.each(rule.methods)('reports an unbounded relation for %s', (method) => {
    const expression = createExpression(method, 'User', '{ include: { posts: true } }');

    expect(limitRelationLoading(expression, rule, {}, dmmf).isTriggered).toBe(true);
  });

  it.each(['count', 'aggregate', '$queryRaw'])('ignores the unsupported method %s', (method) => {
    const expression = createExpression(method, 'User', '{ include: { posts: true } }');

    expect(limitRelationLoading(expression, rule, {}, dmmf)).toEqual({ isTriggered: false });
  });

  it('uses the configured methods', () => {
    const customRule = { ...rule, methods: ['findUnique'] };
    const argument = '{ include: { posts: true } }';

    expect(
      limitRelationLoading(createExpression('findMany', 'User', argument), customRule, {}, dmmf),
    ).toEqual({ isTriggered: false });
    expect(
      limitRelationLoading(createExpression('findUnique', 'User', argument), customRule, {}, dmmf)
        .isTriggered,
    ).toBe(true);
  });

  it.each(['10', '0', '-10', 'pageSize'])('allows a relation with an explicit take: %s', (take) => {
    const expression = createExpression(
      'findMany',
      'User',
      `{ include: { posts: { take: ${take} } } }`,
    );

    expect(limitRelationLoading(expression, rule, {}, dmmf)).toEqual({ isTriggered: false });
  });

  it.each(['include', 'select'])('reports take: undefined in %s', (selection) => {
    const expression = createExpression(
      'findMany',
      'User',
      `{ ${selection}: { posts: { take: undefined } } }`,
    );
    const result = limitRelationLoading(expression, rule, {}, dmmf);

    expect(result.isTriggered).toBe(true);
    expect(result.nodeToHighlight?.getText()).toBe('posts');
  });

  it('does not use the top-level take as a relation limit', () => {
    const expression = createExpression(
      'findMany',
      'User',
      '{ take: 20, include: { posts: true } }',
    );

    expect(limitRelationLoading(expression, rule, {}, dmmf).isTriggered).toBe(true);
  });

  it('allows top-level pagination with a separately limited relation', () => {
    const expression = createExpression(
      'findMany',
      'User',
      '{ take: 20, include: { pastes: { take: 10 } } }',
    );
    const schema = createSchema([
      createModel('User', [createRelation('pastes', 'Paste', { isList: true })]),
      createModel('Paste'),
    ]);

    expect(limitRelationLoading(expression, rule, {}, schema)).toEqual({ isTriggered: false });
  });

  it.each([
    { name: 'no argument', argument: '' },
    { name: 'a null argument', argument: 'null' },
    { name: 'an array argument', argument: '[]' },
    { name: 'an unresolved argument', argument: 'options' },
    { name: 'no selection', argument: '{}' },
    { name: 'an empty selection', argument: '{ include: {} }' },
    { name: 'a null selection', argument: '{ include: null }' },
    { name: 'an unresolved selection', argument: '{ include: selection }' },
    { name: 'a disabled relation', argument: '{ include: { posts: false } }' },
    { name: 'an unresolved relation', argument: '{ include: { posts: relationOptions } }' },
    { name: 'an unknown field', argument: '{ include: { unknown: true } }' },
    {
      name: 'scalar fields and lists',
      argument: '{ select: { id: true, name: true, tags: true } }',
    },
    { name: 'relation counts', argument: '{ select: { _count: { select: { posts: true } } } }' },
    { name: 'a relation filter', argument: '{ where: { posts: { some: {} } } }' },
  ])('ignores $name', ({ argument }) => {
    const expression = createExpression('findMany', 'User', argument);

    expect(limitRelationLoading(expression, rule, {}, dmmf)).toEqual({ isTriggered: false });
  });

  it.each([null, 'MissingModel', 'user'])(
    'ignores a query without schema metadata for model %s',
    (model) => {
      const expression = createExpression('findMany', model, '{ include: { posts: true } }');

      expect(limitRelationLoading(expression, rule, {}, dmmf)).toEqual({ isTriggered: false });
    },
  );

  it('ignores an empty schema', () => {
    const expression = createExpression('findMany', 'User', '{ include: { posts: true } }');

    expect(limitRelationLoading(expression, rule, {}, createSchema([]))).toEqual({
      isTriggered: false,
    });
  });

  it('ignores an object field whose target is not a model', () => {
    const expression = createExpression('findMany', 'User', '{ select: { addresses: true } }');
    const baseSchema = createSchema([
      createModel('User', [createRelation('addresses', 'Address', { isList: true })]),
    ]);
    const schema = {
      ...baseSchema,
      datamodel: {
        ...baseSchema.datamodel,
        types: [createModel('Address', [createField('city')])],
      },
    };

    expect(limitRelationLoading(expression, rule, {}, schema)).toEqual({ isTriggered: false });
  });

  it.each([
    { name: 'one-to-one', model: 'User', field: 'profile' },
    { name: 'many-to-one', model: 'Post', field: 'author' },
  ])('allows a $name relation without take', ({ model, field }) => {
    const expression = createExpression('findMany', model, `{ include: { ${field}: true } }`);

    expect(limitRelationLoading(expression, rule, {}, dmmf)).toEqual({ isTriggered: false });
  });

  it('reports an unbounded many-to-many relation', () => {
    const expression = createExpression('findMany', 'User', '{ include: { roles: true } }');

    expect(limitRelationLoading(expression, rule, {}, dmmf).isTriggered).toBe(true);
  });

  it.each([
    { parentSelection: 'include', childSelection: 'include' },
    { parentSelection: 'include', childSelection: 'select' },
    { parentSelection: 'select', childSelection: 'include' },
    { parentSelection: 'select', childSelection: 'select' },
  ])(
    'highlights a nested unbounded relation through $parentSelection and $childSelection',
    ({ parentSelection, childSelection }) => {
      const expression = createExpression(
        'findMany',
        'User',
        `{ ${parentSelection}: { posts: { take: 10, ${childSelection}: { comments: true } } } }`,
      );
      const result = limitRelationLoading(expression, rule, {}, dmmf);

      expect(result.isTriggered).toBe(true);
      expect(result.nodeToHighlight).toBe(
        getProperty(expression.args[0], [parentSelection, 'posts', childSelection, 'comments'])
          ?.node,
      );
      expect(result.nodeToHighlight?.getText()).toBe('comments');
    },
  );

  it.each([
    '{ include: { profile: { select: { id: true } } } }',
    '{ include: { posts: { take: 10, include: { comments: { take: 5 } } } } }',
    '{ include: { posts: { take: 10, include: { author: true } } } }',
    '{ include: { posts: { take: 10 }, roles: { take: 5 } } }',
    '{ include: { posts: { take: 10, select: { _count: { select: { comments: true } } } } } }',
  ])('allows nested selections without an unbounded list: %s', (argument) => {
    const expression = createExpression('findMany', 'User', argument);

    expect(limitRelationLoading(expression, rule, {}, dmmf)).toEqual({ isTriggered: false });
  });

  it('preserves the violating node through multiple single-record relations', () => {
    const expression = createExpression(
      'findMany',
      'User',
      '{ include: { profile: { include: { user: { select: { posts: true } } } } } }',
    );
    const result = limitRelationLoading(expression, rule, {}, dmmf);

    expect(result.isTriggered).toBe(true);
    expect(result.nodeToHighlight).toBe(
      getProperty(expression.args[0], ['include', 'profile', 'include', 'user', 'select', 'posts'])
        ?.node,
    );
    expect(result.nodeToHighlight?.getText()).toBe('posts');
  });

  it('continues to an unbounded sibling after a bounded relation', () => {
    const expression = createExpression(
      'findMany',
      'User',
      '{ include: { posts: { take: 10 }, roles: true } }',
    );
    const result = limitRelationLoading(expression, rule, {}, dmmf);

    expect(result.isTriggered).toBe(true);
    expect(result.nodeToHighlight?.getText()).toBe('roles');
  });

  it.each([
    { value: 'true', expected: true },
    { value: '{ take: 2 }', expected: false },
  ])('returns violation=$expected for a nested self-relation', ({ value, expected }) => {
    const expression = createExpression(
      'findMany',
      'User',
      `{ include: { friends: { take: 5, include: { friends: ${value} } } } }`,
    );
    const schema = createSchema([
      createModel('User', [createRelation('friends', 'User', { isList: true })]),
    ]);
    const result = limitRelationLoading(expression, rule, {}, schema);

    expect(result.isTriggered).toBe(expected);
    if (expected) {
      expect(result.nodeToHighlight).toBe(
        getProperty(expression.args[0], ['include', 'friends', 'include', 'friends'])?.node,
      );
    }
  });
});
