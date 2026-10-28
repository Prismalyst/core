# `require-where-delete-many`

Require a nonempty `where` filter on `deleteMany` to help prevent accidental deletion of every record.

## Rule details

- **Methods:** `deleteMany`.
- **Requires schema:** No.
- **Options:** None.

The rule reports a missing argument, an argument without `where`, an explicitly `undefined` `where`,
or an empty `where` object. A nonempty filter, including one with nested operators, is accepted.

It highlights the whole call when arguments are absent, the argument when `where` is absent, and the
`where` value when it is empty or `undefined`.

## Examples

### Reported

```ts
await prisma.user.deleteMany();
await prisma.user.deleteMany(undefined);
await prisma.user.deleteMany({});
await prisma.user.deleteMany({ where: undefined });
await prisma.user.deleteMany({ where: {} });
```

### Not reported

```ts
await prisma.user.deleteMany({ where: { id: 1 } });
await prisma.user.deleteMany({ where: { id: { in: [1, 2] } } });
await prisma.user.deleteMany({ where: { active: false } });
```

## Limits

The rule checks the presence and parsed shape of `where`. It does not prove that the filter narrows
the result set. For example, `{ where: { id: undefined } }` is nonempty and is not reported by this
check, even though its runtime meaning can be unsafe.

Invalid `where` values such as `null` or numbers are not reported here; Prisma's types are expected
to reject them. A non-object first argument is reported because no `where` property can be found.
The rule does not inspect nested deletes inside other operations.

See [`warn-cascade-delete`](warn-cascade-delete.md) for deletions that may affect related records.

## References

- [Implementation](../src/rules/list/require-where-delete-many.ts)
- [Unit tests](../src/tests/unit/rules/require-where-delete-many.spec.ts)
- [All rules](README.md)
