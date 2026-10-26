import { describe, expect, it } from 'vitest';

import type { RuleWithoutFunction } from '../../../types/rule.eslint.types.js';

import { warnCascadeDelete } from '../../../rules/list/warn-cascade-delete.js';

import { createExpression } from '../../helpers/create-expression.js';
import { createModel } from '../../helpers/dmmf/create-model.js';
import { createRelation } from '../../helpers/dmmf/create-relation.js';
import { createSchema } from '../../helpers/dmmf/create-schema.js';

const rule: RuleWithoutFunction = {
  name: 'warn-cascade-delete',
  astType: 'callExpression',
  methods: ['delete', 'deleteMany'],
  requireSchema: true,
};

const userModel = createModel('User');
const postModel = createModel('Post', [
  createRelation('author', 'User', { relationOnDelete: 'Cascade' }),
]);
const dmmf = createSchema([userModel, postModel]);
const deleteArgument = '{ where: { id: 1 } }';

describe('warnCascadeDelete', () => {
  it.each(['delete', 'deleteMany'])('reports an incoming cascade for %s', (method) => {
    const expression = createExpression(method, 'User', deleteArgument);
    const result = warnCascadeDelete(expression, rule, {}, dmmf);

    expect(result.isTriggered).toBe(true);

    if (result.isTriggered) {
      expect(result.nodeToHighlight.getText()).toBe(`prisma.user.${method}`);
    }
  });

  it.each(['findMany', 'create', 'update', 'updateMany', 'upsert', 'count'])(
    'ignores the unsupported method %s even when cascade relations exist',
    (method) => {
      const expression = createExpression(method, 'User', deleteArgument);
      const result = warnCascadeDelete(expression, rule, {}, dmmf);

      expect(result.isTriggered).toBe(false);
    },
  );

  it.each([
    { method: 'delete', expected: false },
    { method: 'deleteMany', expected: true },
  ])('returns isTriggered=$expected for the custom method $method', ({ method, expected }) => {
    const customRule = { ...rule, methods: ['deleteMany'] };
    const expression = createExpression(method, 'User', deleteArgument);
    const result = warnCascadeDelete(expression, customRule, {}, dmmf);

    expect(result.isTriggered).toBe(expected);

    if (result.isTriggered) {
      expect(result.nodeToHighlight.getText()).toBe('prisma.user.deleteMany');
    }
  });

  it.each([null, 'MissingModel', 'user'])(
    'ignores a query without schema metadata for model %s',
    (model) => {
      const expression = createExpression('delete', model, deleteArgument);
      const result = warnCascadeDelete(expression, rule, {}, dmmf);

      expect(result.isTriggered).toBe(false);
    },
  );

  it.each([
    { name: 'an empty schema', models: [] },
    { name: 'a schema missing the referenced model', models: [postModel] },
  ])('ignores $name', ({ models }) => {
    const schema = createSchema(models);
    const expression = createExpression('delete', 'User', deleteArgument);
    const result = warnCascadeDelete(expression, rule, {}, schema);

    expect(result.isTriggered).toBe(false);
  });

  it('allows deleting a model without dependent relations', () => {
    const schema = createSchema([userModel]);
    const expression = createExpression('delete', 'User', deleteArgument);
    const result = warnCascadeDelete(expression, rule, {}, schema);

    expect(result.isTriggered).toBe(false);
  });

  it('does not treat deleting a child as deleting its parent', () => {
    const expression = createExpression('delete', 'Post', deleteArgument);
    const result = warnCascadeDelete(expression, rule, {}, dmmf);

    expect(result.isTriggered).toBe(false);
  });

  it.each([
    { name: 'no explicit action', options: {} },
    { name: 'Restrict', options: { relationOnDelete: 'Restrict' } },
    { name: 'NoAction', options: { relationOnDelete: 'NoAction' } },
    { name: 'SetNull', options: { relationOnDelete: 'SetNull', isRequired: false } },
    { name: 'SetDefault', options: { relationOnDelete: 'SetDefault' } },
    { name: 'only onUpdate: Cascade', options: { relationOnUpdate: 'Cascade' } },
  ])('allows a relation with $name', ({ options }) => {
    const schema = createSchema([
      userModel,
      createModel('Post', [createRelation('author', 'User', options)]),
    ]);

    const expression = createExpression('delete', 'User', deleteArgument);
    const result = warnCascadeDelete(expression, rule, {}, schema);

    expect(result.isTriggered).toBe(false);
  });

  it('ignores a cascade between unrelated models', () => {
    const schema = createSchema([
      userModel,
      createModel('Project'),
      createModel('Post', [createRelation('project', 'Project', { relationOnDelete: 'Cascade' })]),
    ]);

    const expression = createExpression('delete', 'User', deleteArgument);
    const result = warnCascadeDelete(expression, rule, {}, schema);

    expect(result.isTriggered).toBe(false);
  });

  it('finds a cascade after unrelated models and relations', () => {
    const schema = createSchema([
      userModel,
      createModel('Project'),
      createModel('Post', [
        createRelation('project', 'Project', { relationOnDelete: 'Cascade' }),
        createRelation('reviewer', 'User', { relationOnDelete: 'Restrict' }),
        createRelation('author', 'User', { relationOnDelete: 'Cascade' }),
      ]),
    ]);

    const expression = createExpression('delete', 'User', deleteArgument);
    const result = warnCascadeDelete(expression, rule, {}, schema);

    expect(result.isTriggered).toBe(true);

    if (result.isTriggered) {
      expect(result.nodeToHighlight.getText()).toBe('prisma.user.delete');
    }
  });

  it('reports a cascade through an optional relation', () => {
    const schema = createSchema([
      userModel,
      createModel('Post', [
        createRelation('author', 'User', { isRequired: false, relationOnDelete: 'Cascade' }),
      ]),
    ]);

    const expression = createExpression('delete', 'User', deleteArgument);
    const result = warnCascadeDelete(expression, rule, {}, schema);

    expect(result.isTriggered).toBe(true);

    if (result.isTriggered) {
      expect(result.nodeToHighlight.getText()).toBe('prisma.user.delete');
    }
  });

  it.each([
    { model: 'User', expected: true },
    { model: 'Profile', expected: false },
  ])(
    'returns isTriggered=$expected for deleting $model in a one-to-one relation',
    ({ model, expected }) => {
      const schema = createSchema([
        createModel('User', [
          createRelation('profile', 'Profile', {
            isRequired: false,
            relationFromFields: [],
            relationToFields: [],
          }),
        ]),
        createModel('Profile', [createRelation('user', 'User', { relationOnDelete: 'Cascade' })]),
      ]);

      const expression = createExpression('delete', model, deleteArgument);
      const result = warnCascadeDelete(expression, rule, {}, schema);

      expect(result.isTriggered).toBe(expected);

      if (result.isTriggered) {
        expect(result.nodeToHighlight.getText()).toBe('prisma.user.delete');
      }
    },
  );

  it('reports a cascade through a compound foreign key', () => {
    const schema = createSchema([
      userModel,
      createModel('Post', [
        createRelation('author', 'User', {
          relationFromFields: ['tenantId', 'authorId'],
          relationToFields: ['tenantId', 'id'],
          relationOnDelete: 'Cascade',
        }),
      ]),
    ]);

    const expression = createExpression('delete', 'User', deleteArgument);
    const result = warnCascadeDelete(expression, rule, {}, schema);

    expect(result.isTriggered).toBe(true);

    if (result.isTriggered) {
      expect(result.nodeToHighlight.getText()).toBe('prisma.user.delete');
    }
  });

  it('reports a cascading self-relation', () => {
    const schema = createSchema([
      createModel('User', [createRelation('manager', 'User', { relationOnDelete: 'Cascade' })]),
    ]);

    const expression = createExpression('delete', 'User', deleteArgument);
    const result = warnCascadeDelete(expression, rule, {}, schema);

    expect(result.isTriggered).toBe(true);

    if (result.isTriggered) {
      expect(result.nodeToHighlight.getText()).toBe('prisma.user.delete');
    }
  });

  it.each([
    { model: 'User', expected: true, highlight: 'prisma.user.delete' },
    { model: 'Post', expected: true, highlight: 'prisma.post.delete' },
    { model: 'Comment', expected: false },
  ])(
    'returns isTriggered=$expected for $model in a cascade chain',
    ({ model, expected, highlight }) => {
      const schema = createSchema([
        userModel,
        postModel,
        createModel('Comment', [createRelation('post', 'Post', { relationOnDelete: 'Cascade' })]),
      ]);

      const expression = createExpression('delete', model, deleteArgument);
      const result = warnCascadeDelete(expression, rule, {}, schema);

      expect(result.isTriggered).toBe(expected);

      if (result.isTriggered) {
        expect(result.nodeToHighlight.getText()).toBe(highlight);
      }
    },
  );

  it('does not follow a cascade beyond a non-cascading relation', () => {
    const schema = createSchema([
      userModel,
      createModel('Post', [createRelation('author', 'User', { relationOnDelete: 'Restrict' })]),
      createModel('Comment', [createRelation('post', 'Post', { relationOnDelete: 'Cascade' })]),
    ]);

    const expression = createExpression('delete', 'User', deleteArgument);
    const result = warnCascadeDelete(expression, rule, {}, schema);

    expect(result.isTriggered).toBe(false);
  });

  it.each(['', 'options', '{ where: { id: 1 } }'])(
    'reports a cascade regardless of the query argument: %j',
    (argument) => {
      const expression = createExpression('deleteMany', 'User', argument);
      const result = warnCascadeDelete(expression, rule, {}, dmmf);

      expect(result.isTriggered).toBe(true);

      if (result.isTriggered) {
        expect(result.nodeToHighlight.getText()).toBe('prisma.user.deleteMany');
      }
    },
  );
});
