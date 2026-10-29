# `max-take`

Require a `take` value on `findMany` and report resolved numbers above the configured maximum. This
helps keep the number of returned records under control.

## Rule details

- **Methods:** `findMany`.
- **Requires schema:** No.
- **Reports:** no argument, no `take`, an explicitly `undefined` `take`, or a numeric `take > max`.
- **Allows:** resolved numbers equal to or below `max`, including zero and negative numbers.

The rule highlights the offending value when possible, the argument when `take` is missing, or the
whole call when there is no argument.

## Options

| Property | Type     | Required | Meaning                                              |
| -------- | -------- | -------- | ---------------------------------------------------- |
| `max`    | `number` | Yes      | Inclusive upper bound for a resolved numeric `take`. |

Example core options, used below:

```ts
const options = { max: 100 };
```

The core supplies no default. Choose a positive maximum appropriate for the application.

## Examples

### Reported

```ts
await prisma.user.findMany();
await prisma.user.findMany({});
await prisma.user.findMany({ where: { active: true } });
await prisma.user.findMany({ take: undefined });
await prisma.user.findMany({ take: 101 });
```

### Not reported

```ts
await prisma.user.findMany({ take: 20 });
await prisma.user.findMany({ take: 100 });
await prisma.user.findMany({ take: 0 });
```

## Limits

Only resolved numeric values are compared. An unknown runtime number is not checked against `max`.
The rule compares the signed value, rather than its absolute value, so negative values do not enforce
an equivalent backward page limit. It does not limit nested relations; use
[`limit-relation-loading`](limit-relation-loading.md) for those.

## References

- [Implementation](../src/rules/list/max-take.ts)
- [Unit tests](../src/tests/unit/rules/max-take.spec.ts)
- [All rules](../README.md#rules)
