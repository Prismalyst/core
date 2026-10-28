# `limit-relation-loading`

Require a separate `take` on each list relation loaded through `include` or `select`. A top-level
limit bounds parent records, but does not bound how many related records are loaded for each parent.

## Rule details

- **Methods:** [CRUD methods](README.md#core-behavior).
- **Requires schema:** Yes.
- **Options:** None.

The rule follows object-valued `include` and `select` selections using model relation metadata. For
each list relation selected with `true` or an options object, it requires a `take` whose parsed value
is not `undefined`. `posts: true`, `posts: {}`, and `posts: { take: undefined }` are reported.

Nested selections are checked recursively, including selections reached through a single-record
relation. Each loaded list needs its own `take`. The first violating relation field found is
highlighted, such as `posts` or `comments`.

## Example schema

```prisma
model User {
  id    Int    @id
  posts Post[]
}

model Post {
  id       Int       @id
  authorId Int
  author   User      @relation(fields: [authorId], references: [id])
  comments Comment[]
}

model Comment {
  id     Int  @id
  postId Int
  post   Post @relation(fields: [postId], references: [id])
}
```

## Examples

### Reported

```ts
await prisma.user.findMany({ take: 20, include: { posts: true } });
await prisma.user.findMany({ take: 20, select: { posts: {} } });
await prisma.user.findMany({ take: 20, include: { posts: { take: undefined } } });

// Bounding posts does not bound their comments.
await prisma.user.findMany({
  take: 20,
  include: { posts: { take: 10, include: { comments: true } } },
});
```

### Not reported

```ts
await prisma.user.findMany({ take: 20, include: { posts: { take: 10 } } });

await prisma.user.findMany({
  take: 20,
  include: { posts: { take: 10, include: { comments: { take: 5 } } } },
});

// A single-record relation does not need take.
await prisma.post.findMany({ take: 20, include: { author: true } });

// Counting a relation does not load its records.
await prisma.user.findMany({ take: 20, select: { _count: { select: { posts: true } } } });
```

## Limits

The rule checks whether `take` is defined, rather than validating its type or size. Zero, negative
numbers, and unresolved runtime values for `take` pass this check. There is no configurable maximum
for nested relations. [`max-take`](max-take.md) limits only the top-level `findMany` value.

Disabled relations, scalar fields and scalar lists, relation counts, and `where` relation filters are
ignored. Unknown selections or relation options that cannot be resolved to an inspectable object are
also skipped. Object fields targeting composite types rather than models are not checked.

One-to-many and many-to-many lists are covered. Single-record relations need no limit themselves,
but any nested list selection below them is still checked. Missing DMMF metadata or an unknown model
produces no report.

## References

- [Implementation](../src/rules/list/limit-relation-loading.ts)
- [Unit tests](../src/tests/unit/rules/limit-relation-loading.spec.ts)
- [All rules](README.md)
