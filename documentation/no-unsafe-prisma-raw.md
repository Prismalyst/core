# `no-unsafe-prisma-raw`

Report `Prisma.raw` arguments that cannot be resolved to a string. Dynamic SQL fragments can bypass
the value parameterization provided by `Prisma.sql`.

## Rule details

- **Methods:** `raw` on the recognized Prisma SQL helper.
- **Requires schema:** No.
- **Options:** None.

The rule allows resolved strings, including empty strings and templates without substitutions. It
reports interpolated templates, unresolved values, and other defined non-string values. The first
argument is highlighted.

## Examples

### Reported

```ts
Prisma.raw(`SELECT * FROM "User" WHERE id = ${id}`);
Prisma.raw(userSuppliedSql);
Prisma.raw({});
```

Here `userSuppliedSql` is a runtime string whose value the parser cannot resolve.

### Not reported

```ts
Prisma.raw('SELECT 1');
Prisma.raw(`SELECT 1`);
Prisma.raw('');

// Parameterize values through Prisma.sql instead of building a raw fragment.
await prisma.$queryRaw(Prisma.sql`SELECT * FROM "User" WHERE id = ${id}`);
```

## Limits

A string resolved from a declaration can pass; the argument does not have to be an inline literal.
The rule does not inspect the content of an accepted string. Calls with no argument or an explicitly
`undefined` argument are ignored, even though Prisma's types may reject them. Other SQL helpers are
not included in this rule's shipped method list.

## References

- [Implementation](../src/rules/list/no-unsafe-prisma-raw.ts)
- [Unit tests](../src/tests/unit/rules/no-unsafe-prisma-raw.spec.ts)
- [All rules](README.md)
