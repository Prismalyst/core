# `no-dynamic-raw-query`

Report interpolated template strings used as SQL text in unsafe raw queries. Interpolating values
directly into SQL can allow those values to change the query's structure.

## Rule details

- **Methods:** `$queryRawUnsafe` and `$executeRawUnsafe`.
- **Requires schema:** No.
- **Options:** None.

The rule checks only the first argument. It reports a parsed template expression containing `${...}`
and highlights that argument. Static strings and templates without substitutions are allowed by this
rule.

## Examples

### Reported

```ts
await prisma.$queryRawUnsafe(`SELECT * FROM "User" WHERE id = ${id}`);
await prisma.$executeRawUnsafe(`DELETE FROM "User" WHERE email = '${email}'`);
```

### Not reported

```ts
await prisma.$queryRawUnsafe('SELECT * FROM "User"');
await prisma.$queryRawUnsafe(`SELECT * FROM "User"`);
await prisma.$queryRawUnsafe('SELECT * FROM "User" WHERE id = $1', id);
await prisma.$queryRawUnsafe('SELECT $1', `user-${id}`);

// Prefer the parameterized safe API.
await prisma.$queryRaw(Prisma.sql`SELECT * FROM "User" WHERE id = ${id}`);
```

## Limits

This rule detects parsed template expressions. It does not cover every way to build dynamic SQL,
such as unresolved runtime strings or string concatenation. Missing, `undefined`, and `null` first
arguments do not produce a report here.

The unsafe API examples above are still reported by [`no-unsafe-raw-sql`](no-unsafe-raw-sql.md), which
rejects those methods regardless of how their arguments are built.

## References

- [Implementation](../src/rules/list/no-dynamic-raw-query.ts)
- [Unit tests](../src/tests/unit/rules/no-dynamic-raw-query.spec.ts)
- [All rules](README.md)
