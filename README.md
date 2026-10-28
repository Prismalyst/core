# Prismalyst Core

Internal analysis engine and shared TypeScript contracts for the
[Prismalyst ESLint plugin](https://github.com/Prismalyst/eslint-plugin).

The core identifies Prisma calls and client construction through the TypeScript compiler API,
extracts their arguments and context, and evaluates rules. Analysis does not execute Prisma queries
or require a database connection.

## Responsibilities

| Core                                                        | ESLint plugin                                                        |
| ----------------------------------------------------------- | -------------------------------------------------------------------- |
| Recognize Prisma expressions using type information.        | Obtain the TypeScript program from ESLint parser services.           |
| Parse arguments, source locations, and expression context.  | Map between TypeScript and ESLint AST nodes.                         |
| Define rule behavior, option types, and registration.       | Define messages, severity, option validation, defaults, and presets. |
| Return whether a rule triggers and which node to highlight. | Load schema metadata and report diagnostics through ESLint.          |

The package exports ESM, CommonJS, and TypeScript declarations from `dist`. Changes to exported
contracts must be coordinated with the plugin.

## Development setup

Use **Node.js 24** and **npm** to match [CI](.github/workflows/ci.yml). Run these commands from
`prismalyst-core`:

```sh
npm ci
npm run prisma:v7:generate
```

The generation step creates the ignored test client in `src/tests/schemas/v7/generated/prisma`.
Repeat it after changing the [test schema](src/tests/schemas/v7/schema.prisma). Tests analyze source
fixtures and use in-memory schema metadata; database setup and migrations are not required.

The declared TypeScript peer range is `>=5.0.0 <7`. The current development dependency is TypeScript
6, and the AST fixtures cover Prisma 7. The peer range alone does not establish compatibility with
every Prisma generator or TypeScript version.

## Checks and commands

Run the same checks as CI before submitting a change:

```sh
npm run lint
npm run typecheck
npm run test:ci
npm run build
```

`typecheck` checks production source; `tsconfig.json` excludes the tests. The build emits declarations
and ESM files through TypeScript, then creates the CommonJS entry with Rollup.

| Command                                   | Purpose                                                  |
| ----------------------------------------- | -------------------------------------------------------- |
| `npm run test:watch`                      | Run Vitest in watch mode.                                |
| `npm run test:ci -- src/tests/unit/rules` | Run rule unit tests.                                     |
| `npm run test:ci -- src/tests/ast/v7`     | Run Prisma expression and parser fixture tests.          |
| `npm run watch`                           | Recompile TypeScript on source changes.                  |
| `npm run pack:check`                      | Preview the package contents without creating a tarball. |

## Project structure

```text
src/
  ast/                Prisma expression detection, conversion, and parsing helpers
  constants/          Shared Prisma method groups
  rules/
    list/             Rule implementations
    types/            Rule names and their option types
    utils/            Shared rule helpers
    rules-list.ts     Rule registration and dispatch metadata
  tests/
    unit/             Isolated rule and utility tests
    ast/v7/           Type-aware tests backed by TypeScript fixtures
    schemas/v7/       Prisma schema and generated test client
  types/              AST, Prisma expression, and rule contracts
  index.ts            Package exports
documentation/        One Markdown page per rule
```

## Core API

The public entry point is [`src/index.ts`](src/index.ts).

| Export                                               | Purpose                                                                          |
| ---------------------------------------------------- | -------------------------------------------------------------------------------- |
| `createAstUtils(ts, checker)`                        | Create node and Prisma helpers for a TypeScript analysis context.                |
| `isPrismaExpression(node, program, astUtils)`        | Identify a supported Prisma call or client construction.                         |
| `convertToPrismaExpression(node, program, astUtils)` | Extract arguments, locations, method, model, and context from a recognized node. |
| `getProperty(argument, path)`                        | Read a nested parsed value while preserving its source node.                     |
| `RULES_LIST`                                         | Access registered rules, their functions, and dispatch metadata.                 |
| `ParsedValue`                                        | Type for a parsed value and its source nodes.                                    |
| `OptionsByRuleName`                                  | Type mapping rule names to their option objects.                                 |
| `RegisteredRule`                                     | Type linking a registered rule name to its function and options.                 |

### Example: evaluating one rule

This fragment assumes `program` is the host's `ts.Program` and `node` comes from that program's AST
traversal. Create `astUtils` once per analysis context and reuse it while visiting nodes.

```ts
import {
  RULES_LIST,
  convertToPrismaExpression,
  createAstUtils,
  isPrismaExpression,
} from '@prismalyst/core';
import * as ts from 'typescript';

const astUtils = createAstUtils(ts, program.getTypeChecker());
const rule = RULES_LIST.find((candidate) => candidate.name === 'max-take');

if (
  rule?.name === 'max-take' &&
  ts.isCallExpression(node) &&
  isPrismaExpression(node, program, astUtils)
) {
  const expression = convertToPrismaExpression(node, program, astUtils);
  const result = rule.function(expression, rule, { max: 100 });

  if (result.isTriggered) {
    console.log(rule.name, result.nodeToHighlight.getText());
  }
}
```

Call `convertToPrismaExpression` only after recognition. For general rule dispatch, use each rule's
`astType`, `methods`, and `requireSchema` metadata. Match `callExpression` rules to call nodes and
`newExpression` rules to construction nodes.

Rules return `{ isTriggered: false }` or `{ isTriggered: true, nodeToHighlight }`. The host turns the
reported TypeScript node into its own diagnostic. The core does not supply diagnostic messages or
autofixes.

Pass the complete option object as the third argument to a rule function, or `{}` for a rule without
options. The core provides no option defaults or runtime validation. Schema-dependent rules accept
Prisma's Data Model Meta Format (DMMF) document as the fourth argument and return no report when it is
absent. Schema discovery and loading belong to the host integration.

## Rules

Each page documents the shipped behavior, reported and accepted examples, options, schema
requirements, and known limits.

| Rule                                                                            | Purpose                                                          | Requires schema |
| ------------------------------------------------------------------------------- | ---------------------------------------------------------------- | --------------- |
| [limit-relation-loading](documentation/limit-relation-loading.md)               | Require a separate `take` for each loaded list relation.         | Yes             |
| [max-take](documentation/max-take.md)                                           | Require `take` and enforce its upper bound on `findMany`.        | No              |
| [no-deep-offset-pagination](documentation/no-deep-offset-pagination.md)         | Keep `skip` within a configured range.                           | No              |
| [no-disconnect-in-request-flow](documentation/no-disconnect-in-request-flow.md) | Restrict `$disconnect` to explicitly allowed files.              | No              |
| [no-dynamic-raw-query](documentation/no-dynamic-raw-query.md)                   | Report interpolated templates passed to unsafe raw SQL methods.  | No              |
| [no-floating-prisma-promise](documentation/no-floating-prisma-promise.md)       | Report Prisma promises without a recognized await or return.     | No              |
| [no-prisma-client-in-function](documentation/no-prisma-client-in-function.md)   | Restrict client creation inside functions and methods.           | No              |
| [no-query-in-loop](documentation/no-query-in-loop.md)                           | Report Prisma calls inside loops and selected array callbacks.   | No              |
| [no-root-client-in-transaction](documentation/no-root-client-in-transaction.md) | Require the transaction client inside interactive transactions.  | No              |
| [no-unindexed-filter](documentation/no-unindexed-filter.md)                     | Check top-level filter keys against schema indexes.              | Yes             |
| [no-unsafe-prisma-raw](documentation/no-unsafe-prisma-raw.md)                   | Restrict `Prisma.raw` arguments to resolved strings.             | No              |
| [no-unsafe-raw-sql](documentation/no-unsafe-raw-sql.md)                         | Report all calls to unsafe raw SQL methods.                      | No              |
| [require-where-delete-many](documentation/require-where-delete-many.md)         | Require a nonempty `where` for `deleteMany`.                     | No              |
| [require-where-update-many](documentation/require-where-update-many.md)         | Require a nonempty `where` for `updateMany`.                     | No              |
| [unstable-pagination](documentation/unstable-pagination.md)                     | Require a unique ordering when `take` and `orderBy` are present. | Yes             |
| [warn-cascade-delete](documentation/warn-cascade-delete.md)                     | Warn when deleting a model with incoming cascade relations.      | Yes             |

Examples in the rule pages are TypeScript fragments. They assume a configured `prisma` client,
generated Prisma exports where used, and models with the shown fields. `clientOptions` represents
the application's client construction options. “Not reported” refers only to that page's rule;
another rule or Prisma's types may still reject the code.

### Adding or changing a rule

1. Implement the behavior in `src/rules/list/<rule-name>.ts`. Keep parsing helpers in `src/ast` and
   shared rule helpers in `src/rules/utils`.
2. Add the rule's option contract in `src/rules/types/rules-options.types.ts`, including an entry for
   rules with no options.
3. Register the rule in `src/rules/rules-list.ts` with its name, AST type, methods, and schema
   requirement. Add shared method names to `src/constants` if needed.
4. Add focused tests in `src/tests/unit/rules`. Cover reports, accepted cases, method filtering,
   options, and the highlighted node. For parser changes, add or update a fixture and its tests in
   `src/tests/ast/v7`.
5. Write or update `documentation/<rule-name>.md` and this rule table. Describe current behavior and
   limits, and link the implementation and tests.
6. Coordinate the plugin changes: messages, option schemas and defaults in `src/rules/rules.map.ts`,
   preset entries in `src/config/create-configs.ts`, and integration tests in the plugin repository.

## Core behavior

Method groups come from
[`prisma-methods.constants.ts`](src/constants/prisma-methods.constants.ts):

- **CRUD methods:** `create`, `createMany`, `createManyAndReturn`, `findUnique`, `findUniqueOrThrow`,
  `findFirst`, `findFirstOrThrow`, `findMany`, `update`, `updateMany`, `updateManyAndReturn`, `upsert`,
  `delete`, and `deleteMany`.
- **Read methods:** `findUnique`, `findUniqueOrThrow`, `findFirst`, `findFirstOrThrow`, and `findMany`.
- **All registered Prisma methods:** CRUD methods plus `count`, `aggregate`, `groupBy`, `$queryRaw`,
  `$executeRaw`, `$queryRawUnsafe`, `$executeRawUnsafe`, `$transaction`, `raw`, `sql`, `join`, `empty`,
  `$db`, `$connect`, and `$disconnect`.

Recognition depends on declarations from generated Prisma files. The current detection checks for
`.prisma/client` or `generated/prisma` in declaration paths. Model resolution also depends on generated
files under a `prisma/models` directory. Custom output layouts can therefore affect detection.

The core handles TypeScript call and construction expressions. Tagged template expressions are not
recognized directly. Parsed values can come from syntax, declarations, or types, and can remain
unknown. Individual rules decide how to handle those values; analysis does not prove runtime query
safety or database performance.

## License

[MIT](LICENSE).
