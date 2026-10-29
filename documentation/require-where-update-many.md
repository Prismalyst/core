# `require-where-update-many`

Require a nonempty `where` filter on `updateMany` to help prevent accidental updates to every record.

## Rule details

- **Methods:** `updateMany`.
- **Requires schema:** No.
- **Options:** None.

For an object argument, the rule reports a missing `where`, an explicitly `undefined` `where`, or an
empty `where` object. A nonempty filter, including one with nested operators, is accepted.

It highlights the argument when `where` is missing, or the offending `where` value when possible.

## Examples

### Reported

```ts
await prisma.user.updateMany({ data: { active: false } });
await prisma.user.updateMany({ data: { active: false }, where: undefined });
await prisma.user.updateMany({ data: { active: false }, where: {} });
```

### Not reported

```ts
await prisma.user.updateMany({
  data: { active: false },
  where: { id: 1 },
});

await prisma.user.updateMany({
  data: { active: false },
  where: { id: { in: [1, 2] } },
});
```

## Limits

Missing, `undefined`, or non-object query arguments are ignored because Prisma's types are expected
to reject them. This differs from [`require-where-delete-many`](require-where-delete-many.md), which
also reports calls with no arguments.

The rule does not validate `data` or prove that a nonempty filter narrows the result set. A filter
such as `{ id: undefined }` passes this shape check. Invalid `where` values such as `null` or numbers
are left to Prisma's types. Nested updates and `updateManyAndReturn` are outside the shipped method
list.

## References

- [Implementation](../src/rules/list/require-where-update-many.ts)
- [Unit tests](../src/tests/unit/rules/require-where-update-many.spec.ts)
- [All rules](../README.md#rules)
