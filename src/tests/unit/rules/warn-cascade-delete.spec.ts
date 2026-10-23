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
  it.each(rule.methods)('reports an incoming cascade for %s', (method) => {
    expect(
      warnCascadeDelete(createExpression(method, 'User', deleteArgument), rule, {}, dmmf)
        .isTriggered,
    ).toBe(true);
  });

  it.each(['findMany', 'create', 'update', 'updateMany', 'upsert', 'count'])(
    'ignores the unsupported method %s even when cascade relations exist',
    (method) => {
      expect(
        warnCascadeDelete(createExpression(method, 'User', deleteArgument), rule, {}, dmmf),
      ).toEqual({
        isTriggered: false,
      });
    },
  );

  it('uses the configured methods', () => {
    const customRule = { ...rule, methods: ['deleteMany'] };

    expect(
      warnCascadeDelete(createExpression('delete', 'User', deleteArgument), customRule, {}, dmmf),
    ).toEqual({
      isTriggered: false,
    });
    expect(
      warnCascadeDelete(
        createExpression('deleteMany', 'User', deleteArgument),
        customRule,
        {},
        dmmf,
      ).isTriggered,
    ).toBe(true);
  });

  it.each([null, 'MissingModel', 'user'])(
    'ignores a query without schema metadata for model %s',
    (model) => {
      expect(
        warnCascadeDelete(createExpression('delete', model, deleteArgument), rule, {}, dmmf),
      ).toEqual({
        isTriggered: false,
      });
    },
  );

  it.each([
    { name: 'an empty schema', models: [] },
    { name: 'a schema missing the referenced model', models: [postModel] },
  ])('ignores $name', ({ models }) => {
    expect(
      warnCascadeDelete(
        createExpression('delete', 'User', deleteArgument),
        rule,
        {},
        createSchema(models),
      ),
    ).toEqual({
      isTriggered: false,
    });
  });

  it('allows deleting a model without dependent relations', () => {
    expect(
      warnCascadeDelete(
        createExpression('delete', 'User', deleteArgument),
        rule,
        {},
        createSchema([userModel]),
      ),
    ).toEqual({
      isTriggered: false,
    });
  });

  it('does not treat deleting a child as deleting its parent', () => {
    expect(
      warnCascadeDelete(createExpression('delete', 'Post', deleteArgument), rule, {}, dmmf),
    ).toEqual({
      isTriggered: false,
    });
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

    expect(
      warnCascadeDelete(createExpression('delete', 'User', deleteArgument), rule, {}, schema),
    ).toEqual({
      isTriggered: false,
    });
  });

  it('ignores a cascade between unrelated models', () => {
    const schema = createSchema([
      userModel,
      createModel('Project'),
      createModel('Post', [createRelation('project', 'Project', { relationOnDelete: 'Cascade' })]),
    ]);

    expect(
      warnCascadeDelete(createExpression('delete', 'User', deleteArgument), rule, {}, schema),
    ).toEqual({
      isTriggered: false,
    });
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

    expect(
      warnCascadeDelete(createExpression('delete', 'User', deleteArgument), rule, {}, schema)
        .isTriggered,
    ).toBe(true);
  });

  it('reports a cascade through an optional relation', () => {
    const schema = createSchema([
      userModel,
      createModel('Post', [
        createRelation('author', 'User', { isRequired: false, relationOnDelete: 'Cascade' }),
      ]),
    ]);

    expect(
      warnCascadeDelete(createExpression('delete', 'User', deleteArgument), rule, {}, schema)
        .isTriggered,
    ).toBe(true);
  });

  it('reports a one-to-one cascade only when deleting the referenced model', () => {
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

    expect(
      warnCascadeDelete(createExpression('delete', 'User', deleteArgument), rule, {}, schema)
        .isTriggered,
    ).toBe(true);
    expect(
      warnCascadeDelete(createExpression('delete', 'Profile', deleteArgument), rule, {}, schema),
    ).toEqual({
      isTriggered: false,
    });
  });

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

    expect(
      warnCascadeDelete(createExpression('delete', 'User', deleteArgument), rule, {}, schema)
        .isTriggered,
    ).toBe(true);
  });

  it('reports a cascading self-relation', () => {
    const schema = createSchema([
      createModel('User', [createRelation('manager', 'User', { relationOnDelete: 'Cascade' })]),
    ]);

    expect(
      warnCascadeDelete(createExpression('delete', 'User', deleteArgument), rule, {}, schema)
        .isTriggered,
    ).toBe(true);
  });

  it.each([
    { model: 'User', expected: true },
    { model: 'Post', expected: true },
    { model: 'Comment', expected: false },
  ])('returns violation=$expected for $model in a cascade chain', ({ model, expected }) => {
    const schema = createSchema([
      userModel,
      postModel,
      createModel('Comment', [createRelation('post', 'Post', { relationOnDelete: 'Cascade' })]),
    ]);

    expect(
      warnCascadeDelete(createExpression('delete', model, deleteArgument), rule, {}, schema)
        .isTriggered,
    ).toBe(expected);
  });

  it('does not follow a cascade beyond a non-cascading relation', () => {
    const schema = createSchema([
      userModel,
      createModel('Post', [createRelation('author', 'User', { relationOnDelete: 'Restrict' })]),
      createModel('Comment', [createRelation('post', 'Post', { relationOnDelete: 'Cascade' })]),
    ]);

    expect(
      warnCascadeDelete(createExpression('delete', 'User', deleteArgument), rule, {}, schema),
    ).toEqual({
      isTriggered: false,
    });
  });

  it.each(['', 'options', '{ where: { id: 1 } }'])(
    'reports a cascade regardless of the query argument: %j',
    (argument) => {
      expect(
        warnCascadeDelete(createExpression('deleteMany', 'User', argument), rule, {}, dmmf)
          .isTriggered,
      ).toBe(true);
    },
  );

  it.each(rule.methods)('highlights the method expression for %s', (method) => {
    const expression = createExpression(method, 'User', deleteArgument);
    const result = warnCascadeDelete(expression, rule, {}, dmmf);

    expect(result.isTriggered).toBe(true);
    expect(result.nodeToHighlight).toBe(expression.node.expression);
    expect(result.nodeToHighlight?.getText()).toBe(`prisma.user.${method}`);
  });
});
