# `no-root-client-in-transaction`

Require the transaction client for Prisma calls inside an interactive transaction. A root-client
query inside the callback may execute outside that transaction.

## Rule details

- **Methods:** [All registered Prisma methods](README.md#core-behavior), except the SQL helpers `raw`,
  `sql`, `join`, and `empty`.
- **Requires schema:** No.
- **Options:** None.

A call is reported only when its context says it is inside an interactive transaction and its
receiver is identified as a root Prisma client. Transaction-client calls, unknown client types, and
calls in sequential transactions are not reported. The whole offending call is highlighted.

## Examples

### Reported

```ts
await prisma.$transaction(async (tx) => {
  await tx.user.update({ where: { id }, data: { active: true } });
  await prisma.post.deleteMany({ where: { authorId: id } });
});
```

### Not reported

```ts
await prisma.$transaction(async (tx) => {
  await tx.user.update({ where: { id }, data: { active: true } });
  await tx.post.deleteMany({ where: { authorId: id } });
});

await prisma.$transaction([
  prisma.user.update({ where: { id }, data: { active: true } }),
  prisma.post.deleteMany({ where: { authorId: id } }),
]);

await prisma.user.findMany({ take: 20 });
```

## Limits

Detection depends on the parser recognizing both the transaction callback and the receiver's client
type. The current parser recognizes inline arrow functions and function expressions as interactive
transaction callbacks, and array literals as sequential transaction arguments. It does not trace
arbitrary helper functions to prove which transaction they use.

## References

- [Implementation](../src/rules/list/no-root-client-in-transaction.ts)
- [Unit tests](../src/tests/unit/rules/no-root-client-in-transaction.spec.ts)
- [Transaction detection](../src/ast/utils/create-prisma-utils.ts)
- [Transaction parser tests](../src/tests/ast/v7/transactions.spec.ts)
- [All rules](README.md)
