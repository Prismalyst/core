# `unstable-pagination`

Require a unique order when a read query supplies both `take` and `orderBy`. Adding a unique
tie-breaker makes the ordering of records with otherwise equal sort values predictable.

## Rule details

- **Methods:** [Read methods](README.md#core-behavior).
- **Requires schema:** Yes.
- **Options:** None.

The rule checks queries with a defined `take` and a nonempty object or array of objects in `orderBy`.
It gathers the top-level ordered fields and accepts an order containing at least one complete key:

- A required `@id` field.
- A required `@unique` field.
- Every field of a compound unique key, with all fields required.
- Every field of a compound primary key, with all fields required.

Fields in a compound key can appear in any order and can use different sort directions. A nullable
unique field is insufficient on its own. When no complete required key is present, the `orderBy`
property is highlighted.

## Example schema

```prisma
model User {
  id           Int      @id
  email        String   @unique
  optionalCode String?  @unique
  createdAt    DateTime
  tenantId     Int
  externalId   String

  @@unique([tenantId, externalId])
}
```

## Examples

### Reported

```ts
await prisma.user.findMany({ take: 20, orderBy: { createdAt: 'desc' } });
await prisma.user.findMany({ take: 20, orderBy: { optionalCode: 'asc' } });

// Only part of the compound unique key is present.
await prisma.user.findMany({ take: 20, orderBy: { tenantId: 'asc' } });
```

### Not reported

```ts
await prisma.user.findMany({ take: 20, orderBy: { id: 'asc' } });
await prisma.user.findMany({ take: 20, orderBy: { email: 'asc' } });

await prisma.user.findMany({
  take: 20,
  orderBy: [{ createdAt: 'desc' }, { id: 'asc' }],
});

await prisma.user.findMany({
  take: 20,
  orderBy: [{ tenantId: 'asc' }, { externalId: 'desc' }],
});
```

## Limits

The rule does not require an `orderBy` or a `take`. Queries missing either, and empty orderings, are
ignored. A query using only `skip` or `cursor` without `take` is outside its scope. Unknown models or
missing DMMF metadata also produce no report.

The rule checks the set of top-level ordered field names. It does not recursively prove uniqueness
through relation ordering or validate sort directions. It also does not validate that `take` is a
number; it only requires a parsed value other than `undefined`.

A unique order does not prevent records from changing between requests. See [`max-take`](max-take.md)
for page size checks and [`no-deep-offset-pagination`](no-deep-offset-pagination.md) for offset limits.

## References

- [Implementation](../src/rules/list/unstable-pagination.ts)
- [Unit tests](../src/tests/unit/rules/unstable-pagination.spec.ts)
- [All rules](README.md)
