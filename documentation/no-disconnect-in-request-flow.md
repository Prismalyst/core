# `no-disconnect-in-request-flow`

Report `$disconnect` calls outside explicitly allowed files. Keep disconnection in the application's
lifecycle handling instead of repeating it after each request.

## Rule details

- **Methods:** `$disconnect`.
- **Requires schema:** No.
- **Reports:** every matching call unless its file is exempt.
- **Allows:** ignored files and test files when enabled.

The whole `$disconnect` call is highlighted. Despite its name, the rule does not detect whether a
call is part of a request: module-scope calls and shutdown callbacks are also checked.

## Options

| Property       | Type       | Required | Meaning                                            |
| -------------- | ---------- | -------- | -------------------------------------------------- |
| `ignoredFiles` | `string[]` | Yes      | Allow files whose path contains any listed string. |
| `allowInTests` | `boolean`  | Yes      | Allow paths containing `.test.` or `.spec.`.       |

Example core options, used below:

```ts
const options = {
  ignoredFiles: ['scripts/shutdown.ts'],
  allowInTests: true,
};
```

The core supplies no defaults. Path matching uses case-sensitive substrings, rather than globs or
regular expressions. An ignored file is allowed even if `allowInTests` is `false`. A directory named
`tests` alone does not enable the test exemption.

## Examples

### Reported

```ts
// src/users.service.ts
async function getUsers() {
  try {
    return await prisma.user.findMany({ take: 20 });
  } finally {
    await prisma.$disconnect();
  }
}
```

```ts
// src/lifecycle.ts: a shutdown callback is not automatically exempt.
async function shutdown() {
  await prisma.$disconnect();
}
```

### Not reported

```ts
// scripts/shutdown.ts: allowed by ignoredFiles in the example options.
await prisma.$disconnect();
```

```ts
// src/users.spec.ts: allowed because allowInTests is true.
afterAll(async () => {
  await prisma.$disconnect();
});
```

## Limits

The rule uses method and filename checks only. It does not inspect function names, lifecycle hooks,
or framework request handlers. Place legitimate shutdown calls in a narrowly scoped ignored file.
Using a broad substring such as `src` would exempt every matching file.

## References

- [Implementation](../src/rules/list/no-disconnect-in-request-flow.ts)
- [Unit tests](../src/tests/unit/rules/no-disconnect-in-request-flow.spec.ts)
- [All rules](../README.md#rules)
