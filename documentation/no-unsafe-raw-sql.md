# `no-unsafe-raw-sql`

Report every use of Prisma's unsafe raw SQL methods. Prefer a parameterized query through `$queryRaw`
or `$executeRaw`.

## Rule details

- **Methods:** `$queryRawUnsafe` and `$executeRawUnsafe`.
- **Requires schema:** No.
- **Options:** None.

Every matching call is reported, regardless of its SQL text or arguments. This includes static SQL
and calls that pass parameters separately. The rule highlights the whole call.

## Examples

### Reported

```ts
await prisma.$queryRawUnsafe('SELECT 1');
await prisma.$executeRawUnsafe('DELETE FROM "User" WHERE id = $1', id);
await prisma.$queryRawUnsafe(`SELECT * FROM "User" WHERE id = ${id}`);
```

### Not reported

```ts
await prisma.$queryRaw(Prisma.sql`SELECT * FROM "User" WHERE id = ${id}`);
await prisma.$executeRaw(Prisma.sql`UPDATE "User" SET active = false WHERE id = ${id}`);
await prisma.user.findMany({ where: { id }, take: 1 });
```

## Limits

This is an API restriction, rather than an analysis of SQL content. A report does not mean that SQL
injection is proven. The rule also does not inspect unsafe fragments passed through other APIs.

[`no-dynamic-raw-query`](no-dynamic-raw-query.md) checks a narrower pattern: interpolated templates
passed as the first argument to these methods. [`no-unsafe-prisma-raw`](no-unsafe-prisma-raw.md) checks
dynamic `Prisma.raw` fragments.

## References

- [Implementation](../src/rules/list/no-unsafe-raw-sql.ts)
- [Unit tests](../src/tests/unit/rules/no-unsafe-raw-sql.spec.ts)
- [All rules](README.md)
