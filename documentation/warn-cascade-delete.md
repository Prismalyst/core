# `warn-cascade-delete`

Warn when deleting a model that other records reference through an explicit `onDelete: Cascade`
relation. A targeted delete can also remove dependent records.

## Rule details

- **Methods:** `delete` and `deleteMany`.
- **Requires schema:** Yes.
- **Options:** None.

The rule first requires a known target model. It then searches all models for an object relation
field that points to that target, declares `relationOnDelete: 'Cascade'`, and owns at least one foreign
key field (`relationFromFields` is nonempty).

This is an incoming relation check: when `Post.author` references `User` with cascading deletion,
deleting a `User` is reported. Deleting a `Post` is not reported for that relation alone. The method
access, such as `prisma.user.delete`, is highlighted.

## Example schema

```prisma
model User {
  id    Int    @id
  posts Post[]
}

model Post {
  id       Int  @id
  authorId Int
  author   User @relation(fields: [authorId], references: [id], onDelete: Cascade)
}
```

## Examples

### Reported

```ts
await prisma.user.delete({ where: { id: 1 } });
await prisma.user.deleteMany({ where: { id: { in: [1, 2] } } });
```

### Not reported

```ts
// Post has no incoming cascade relation in the example schema.
await prisma.post.delete({ where: { id: 1 } });

// This rule checks deletions only.
await prisma.user.update({ where: { id: 1 }, data: { id: 2 } });
```

## Limits

The rule does not inspect `where` or query the database for dependents. A filter does not suppress
the warning, and a report does not prove that dependent records currently exist. Review whether the
cascade is intended before changing either the query or the schema.

Optional relations, compound foreign keys, and self-relations are covered when their metadata meets
the conditions above. Relations using `Restrict`, `NoAction`, `SetNull`, `SetDefault`, only
`onUpdate: Cascade`, or no explicit cascade action do not trigger this rule. Relations without owned
foreign key fields are ignored.

The rule checks direct incoming cascade edges. It does not calculate the full deletion chain, inspect
nested deletes in other operations, or infer database actions absent from the supplied schema. Missing
schema metadata or an unknown target model produces no report.

Use [`require-where-delete-many`](require-where-delete-many.md) to also guard against missing filters.

## References

- [Implementation](../src/rules/list/warn-cascade-delete.ts)
- [Unit tests](../src/tests/unit/rules/warn-cascade-delete.spec.ts)
- [All rules](../README.md#rules)
