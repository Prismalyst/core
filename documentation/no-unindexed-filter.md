# `no-unindexed-filter`

Report top-level `where` keys that do not appear in an index for the queried model. This can help
identify filters that need a closer performance review.

## Rule details

- **Methods:** [CRUD methods](../README.md#core-behavior). Aggregate methods such as `count` are not in
  the shipped registration.
- **Requires schema:** Yes, including the DMMF `datamodel.indexes` metadata.
- **Options:** None.

For a nonempty object-valued `where`, the rule compares every top-level key against every index
field for the exact model name. Primary-key, unique, and normal index entries can all supply matching
fields. Any position in a compound index counts as a match.

If any keys are unmatched, the rule highlights the first one in filter order. It falls back to the
first query argument if no property node is available. Missing arguments, missing or `undefined`
`where`, non-object `where`, and empty filters are ignored.

## Example schema

```prisma
model User {
  id         Int      @id
  email      String   @unique
  name       String
  tenantId   Int
  externalId String
  createdAt  DateTime

  @@index([createdAt])
  @@index([tenantId, externalId])
}
```

## Examples

### Reported

```ts
await prisma.user.findMany({ where: { name: 'Alice' }, take: 20 });

// email is indexed, but name is not; name is highlighted.
await prisma.user.findMany({
  where: { email: 'alice@example.com', name: 'Alice' },
  take: 20,
});

// Current behavior treats AND itself as an unindexed key.
await prisma.user.findMany({ where: { AND: [{ id: 1 }] }, take: 20 });
```

### Not reported

```ts
await prisma.user.findMany({ where: { id: 1 }, take: 20 });
await prisma.user.findMany({ where: { email: 'alice@example.com' }, take: 20 });
await prisma.user.findMany({ where: { tenantId: 1, externalId: 'alice' }, take: 20 });

// A trailing compound-index field also passes the current name check.
await prisma.user.findMany({ where: { externalId: 'alice' }, take: 20 });
```

## Limits

This rule compares field names, rather than database query plans. It does not check compound-index
prefixes, index types, filter operators, or whether an index will actually be used. For example,
`email: { contains: '@example.com' }` passes because `email` is indexed.

Logical operators (`AND`, `OR`, and `NOT`), relation filters, and compound selector names are not
expanded. They can be reported as unmatched top-level keys even when their inner fields are indexed.
Field and model names are case-sensitive.

Without a DMMF document, the rule returns no report. With a document but no matching model indexes,
all filter keys are unmatched; an unknown model is not automatically exempt. The check uses
`datamodel.indexes`, rather than independently reconstructing indexes from model field flags.

## References

- [Implementation](../src/rules/list/no-unindexed-filter.ts)
- [Unit tests](../src/tests/unit/rules/no-unindexed-filter.spec.ts)
- [Shipped registration](../src/rules/rules-list.ts)
- [All rules](../README.md#rules)
