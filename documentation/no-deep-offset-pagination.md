# `no-deep-offset-pagination`

Report resolved `skip` values outside a configured range on `findMany`. Large offsets can make
pagination expensive; consider a cursor when navigating far into a result set.

## Rule details

- **Methods:** `findMany`.
- **Requires schema:** No.
- **Reports:** a numeric `skip < min` or `skip > max`.
- **Allows:** both boundaries, values between them, missing arguments, and missing or `undefined`
  `skip` values.

The rule highlights the out-of-range value.

## Options

| Property | Type     | Required | Meaning                           |
| -------- | -------- | -------- | --------------------------------- |
| `min`    | `number` | Yes      | Inclusive lower bound for `skip`. |
| `max`    | `number` | Yes      | Inclusive upper bound for `skip`. |

Example core options, used below:

```ts
const options = { min: -1000, max: 1000 };
```

The core supplies no defaults and does not check whether `min <= max`. These bounds describe the
rule's comparison; they do not validate whether a value is supported by the Prisma operation.

## Examples

### Reported

```ts
await prisma.user.findMany({ skip: 1001, take: 20 });
await prisma.user.findMany({ skip: -1001, take: 20 });
```

### Not reported

```ts
await prisma.user.findMany({ skip: 1000, take: 20 });
await prisma.user.findMany({ skip: 0, take: 20 });
await prisma.user.findMany({ take: 20 });
await prisma.user.findMany({ skip: undefined, take: 20 });

await prisma.user.findMany({
  cursor: { id: lastSeenId },
  skip: 1,
  take: 20,
  orderBy: { id: 'asc' },
});
```

## Limits

Unknown or nonnumeric `skip` values are ignored. A cursor does not exempt a query with an out-of-range
`skip`. This rule does not require `take` or a stable ordering; see [`max-take`](max-take.md) and
[`unstable-pagination`](unstable-pagination.md).

## References

- [Implementation](../src/rules/list/no-deep-offset-pagination.ts)
- [Unit tests](../src/tests/unit/rules/no-deep-offset-pagination.spec.ts)
- [All rules](README.md)
