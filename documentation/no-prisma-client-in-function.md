# `no-prisma-client-in-function`

Report Prisma client construction inside functions and methods, with explicit exceptions. Reusing a
configured client avoids creating a new client for each request or service call.

## Rule details

- **Expressions:** `new` expressions already identified as construction of a generated Prisma class.
- **Requires schema:** No.
- **Reports:** client creation inside functions, anonymous functions, arrow functions, and class
  methods, unless an exception applies.
- **Allows:** module-scope construction, class constructors, ignored files, allowed function
  declarations, and test files when enabled.

The client construction expression is highlighted. The rule does not check constructor names itself;
the caller must first identify the expression as Prisma-related.

## Options

| Property                | Type       | Required | Meaning                                                            |
| ----------------------- | ---------- | -------- | ------------------------------------------------------------------ |
| `ignoredFiles`          | `string[]` | Yes      | Allow files whose path contains any listed string.                 |
| `allowedFunctionsNames` | `string[]` | Yes      | Allow enclosing function declarations with an exact matching name. |
| `allowInTests`          | `boolean`  | Yes      | Allow paths containing `.test.` or `.spec.`.                       |

Example core options, used below:

```ts
const options = {
  ignoredFiles: ['scripts/setup.ts'],
  allowedFunctionsNames: ['main', 'seed'],
  allowInTests: true,
};
```

The core supplies no defaults. `ignoredFiles` uses case-sensitive substring matching, rather than
globs or regular expressions. An ignored file is allowed even if `allowInTests` is `false`.

`allowedFunctionsNames` matches the nearest enclosing function declaration. It does not match prefixes
such as `seedUsers` when only `seed` is listed. Variable names for arrow functions or function
expressions, and class method names, are not matched by this option.

## Examples

### Reported

```ts
function getUsers() {
  const prisma = new PrismaClient(clientOptions);
  return prisma.user.findMany({ take: 20 });
}

const createClient = () => new PrismaClient(clientOptions);

class UsersService {
  createClient() {
    return new PrismaClient(clientOptions);
  }
}
```

### Not reported

```ts
// Reuse a module-scope client.
const prisma = new PrismaClient(clientOptions);

function getUsers() {
  return prisma.user.findMany({ take: 20 });
}

// Explicitly allowed by the example options.
function seed() {
  return new PrismaClient(clientOptions);
}
```

Construction inside a class constructor is also exempt. With the example options, construction in
`users.test.ts`, `users.spec.ts`, or a path containing `scripts/setup.ts` is allowed.

## Limits

The rule does not identify HTTP requests or count client instances. It applies to any function-like
scope recognized by the parser. A directory named `tests` alone does not enable the test exemption;
the path must contain `.test.` or `.spec.`. Constructor and file exemptions do not prove that client
lifetime is managed correctly.

## References

- [Implementation](../src/rules/list/no-prisma-client-in-function.ts)
- [Unit tests](../src/tests/unit/rules/no-prisma-client-in-function.spec.ts)
- [Function-name detection](../src/ast/utils/create-node-utils.ts)
- [All rules](README.md)
