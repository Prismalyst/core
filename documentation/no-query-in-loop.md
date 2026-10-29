# `no-query-in-loop`

Report Prisma calls inside loops. Repeating a database call for each item can create an N+1 query
pattern; use a bulk operation or fetch the needed records together where possible.

## Rule details

- **Methods:** [All registered Prisma methods](../README.md#core-behavior).
- **Requires schema:** No.
- **Options:** None.

The rule reports a call when the parser marks it as being inside a loop. This includes `for`,
`for...of`, `for...in`, `while`, and `do...while`, plus inline callbacks passed to methods named `map`,
`filter`, and `reduce`. The whole Prisma call is highlighted. Awaiting a query does not exempt it.

## Examples

### Reported

```ts
for (const userId of userIds) {
  await prisma.post.findMany({ where: { authorId: userId }, take: 20 });
}

await Promise.all(userIds.map((userId) => prisma.user.findUnique({ where: { id: userId } })));
```

### Not reported

```ts
const users = await prisma.user.findMany({
  where: { id: { in: userIds } },
  take: 100,
});

await prisma.user.updateMany({
  where: { id: { in: userIds } },
  data: { active: false },
});
```

## Limits

Loop detection stops at a function boundary unless that function is an inline callback to `map`,
`filter`, or `reduce`. It does not follow calls into other functions or recognize every iteration API,
such as `forEach`. Callback detection uses the method name, without proving that the receiver is an
array.

The registered method list also contains transaction, connection, and SQL helper calls. The rule
does not distinguish their cost or prove that a reported call causes an N+1 query pattern. Running
per-item queries concurrently with `Promise.all` still produces a report for a recognized callback.

## References

- [Implementation](../src/rules/list/no-query-in-loop.ts)
- [Unit tests](../src/tests/unit/rules/no-query-in-loop.spec.ts)
- [Loop detection](../src/ast/utils/create-node-utils.ts)
- [Scope tests](../src/tests/ast/v7/scope.spec.ts)
- [All rules](../README.md#rules)
