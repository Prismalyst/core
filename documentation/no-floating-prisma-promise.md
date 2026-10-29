# `no-floating-prisma-promise`

Report Prisma promises without a recognized await or return. Leaving a query promise unhandled can
prevent the intended operation from completing or leave failures unobserved.

## Rule details

- **Methods:** [All registered Prisma methods](../README.md#core-behavior), when the call returns a
  promise-like value.
- **Requires schema:** No.
- **Options:** None.

The parser identifies promise-like values by the presence of a `then` property. It treats a call as
floating when its immediate parent is neither an `await` expression nor a `return` statement. The rule
reports that call unless the expression context also identifies an enclosing `await` expression.
The whole Prisma call is highlighted.

## Examples

### Reported

```ts
prisma.user.findMany();

// Assignment alone is not recognized as handling the promise.
const users = prisma.user.findMany();

// Passing the promise to another function is not enough.
consume(prisma.user.findMany());

// This Promise.all is not awaited.
Promise.all([prisma.user.findMany(), prisma.post.findMany()]);
```

### Not reported

```ts
const users = await prisma.user.findMany();

function loadUsers() {
  return prisma.user.findMany();
}

await Promise.all([prisma.user.findMany(), prisma.post.findMany()]);
```

## Limits

The current check uses syntax and expression context, rather than tracking how a promise is used
later. A promise assigned now and awaited later can still be reported at its creation. A `.then()` or
`.catch()` chain without an enclosing `await` is not recognized as handling the inner Prisma call.
Returning a container or chain also does not make the inner call a direct return.

The enclosing-await check is broad: it can suppress a report when an ancestor is an `await`, without
proving that this particular promise is handled. Non-promise SQL helpers are not reported merely
because they are called without `await`.

## References

- [Implementation](../src/rules/list/no-floating-prisma-promise.ts)
- [Unit tests](../src/tests/unit/rules/no-floating-prisma-promise.spec.ts)
- [Promise detection](../src/ast/utils/create-prisma-utils.ts)
- [Expression-context tests](../src/tests/ast/v7/expression-context.spec.ts)
- [All rules](../README.md#rules)
