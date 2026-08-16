# Implementation Rules — General

Module layout, discovery, and shared-code placement for both generators and views.

**Applies to:** `src/generators/`, `src/visuals/`
**Read with:** [implementation-generator.md](implementation-generator.md), [implementation-view.md](implementation-view.md)
**Verify with:** `npm run check:types`, `npm run check`

---

## Rules

### IMPL-1 — Content requires a matched generator-view path

The pipeline produces samples only for a matched `(target, generator, view)` tuple. Adding
content therefore requires both roles to be covered, but it does **not** require creating
both directories: a new generator may reuse compatible views, a new view may reuse
compatible generators, and an existing pair may only need capability extensions.

### IMPL-2 — One category level; a leaf module is a directory with a `spec.ts`

Generators and views are organized into a **1-level category sub-directory structure**
(e.g. `src/generators/arithmetic/arithmetic-ops-pairs`,
`src/visuals/views/operations/operations-vertical`).

A directory is a **leaf module if and only if it contains a `spec.ts` file**.

Top-level single-purpose modules (such as `ordering` or `time`) reside directly at the top
level of `src/generators/` or `src/visuals/views/`.

### IMPL-3 — Leaf directory names keep their full module prefix

Leaf module directory names retain their full module prefix — `arithmetic-ops-pairs`, not
`ops-pairs`; `operations-vertical`, not `vertical`.

Module discovery is performed dynamically up to 1 level deep via `findLeafModules` in
`src/lib/module-resolver.ts`.

### IMPL-4 — Module file inventory

| Generator module            | View module                  |
|-----------------------------|------------------------------|
| `generator.ts`              | `view.html`                  |
| `spec.ts`                   | `view.tsx`                   |
| `generator.test.ts`         | `spec.ts`                    |
| `spec.test.ts`              | `checklist.md`               |

Rules for each: [implementation-generator.md](implementation-generator.md) /
[implementation-view.md](implementation-view.md) for code and tests,
[spec-generator.md](spec-generator.md) / [spec-view.md](spec-view.md) for `spec.ts`,
and [checklist-view.md](checklist-view.md) for the view `checklist.md`.

### IMPL-5 — Where shared code goes

- **Parent category `helpers.ts`** — shared mathematical helpers or data structures common
  to sibling generator modules within a category go in `src/generators/<category>/helpers.ts`
  and are imported relatively (`import { ... } from '../helpers.ts'`). The same applies to
  shared visual helpers and sub-components at the view category level (e.g.
  `src/visuals/views/operations/helpers.ts`).
- **`src/visuals/components/`** — reusable shared React elements across *all* view
  categories (such as `TenFrame.tsx`).
- **`src/visuals/helpers/`** — shared layout rendering calculations across *all* view
  categories (such as `counting-helpers.ts`).

### IMPL-6 — Scaffolding a new module

1. Identify which role is actually missing from the intended matched path.
2. Create only the required generator and/or view leaf directory.
3. When creating a view, add a link to it in `src/index.html` for browser preview.
4. When reusing a counterpart, verify the shared problem type and payload contract rather
   than duplicating the module.

Note the relative import depth of any `lib`/`helpers` import must match the sub-directory
level the module actually sits at ([IMPL-G2](implementation-generator.md#impl-g2--validate-configuration-strictly),
[IMPL-V2](implementation-view.md#impl-v2--validate-the-payload-strictly)).

### IMPL-7 — Extend before you create; extend only when changes are surgical, otherwise create

Given a gap to close, prefer in this order:

1. **Extend an existing generator** when the capability remains in the same task family and
   preserves backward compatibility of its payload. Add the required parameters to the
   `spec.ts` schema and handling in `generator.ts`
   ([IMPL-G6](implementation-generator.md#impl-g6--a-payload-contract-change-is-a-two-module-change)).
2. **Extend an existing view** when its existing visual layout can adopt the capability
   through modest, configurable layout changes. Add the layout properties to its `spec.ts`
   schema and `view.tsx`, and declare physical capacity limits in `rejectedLabels`
   ([SPEC-V4](spec-view.md#spec-v4--expand-rejection-boundaries-with-deductadmitting)).
3. **Always create a new generator or view** when the capability genuinely expands the
   supported ontological space into new and unrelated families, crosses the stable payload
   boundary described by
   [IMPL-G7](implementation-generator.md#impl-g7--extend-capabilities-within-a-stable-payload-contract),
   or would result in large independent implementation branches.

An extension is surgical when it adds bounded configuration and handling within the
module's existing responsibility while keeping existing payload consumers and renderings
compatible. Large independent branches are separate module responsibilities hidden inside
one implementation and should be split accordingly.

**Why:** every new module multiplies the matching surface, and every new view adds a visual
contract that must be maintained. Conversely, forcing an unrelated task family, incompatible
payload, or effectively separate implementation into an existing module obscures ownership
and makes that module harder to reason about and adopt safely.

### IMPL-8 — Establish the shared problem contract before parallel role implementation

When a change creates or materially extends both a generator and a consuming view, define
the shared problem payload first. Add the concrete problem type or discriminated union and
its `ViewTypeMap` entry, then require `npm run check:types` to pass before generator and view
implementation proceed independently.

The contract phase must settle required fields, discriminants, mathematical invariants, and
which view ids consume the shape. Generator and view work may proceed in parallel only after
that boundary is stable. Completion still requires an integrated typecheck, matching audit,
generation, and render verification; isolated role checks are not evidence that the shared
path works.

---

## Audit

- [ ] **IMPL-1** — the change delivers a matched generator-view path and reuses a compatible existing role where possible.
- [ ] **IMPL-2** — the module sits at most one category level deep, and every leaf directory contains a `spec.ts`.
- [ ] **IMPL-3** — the directory name carries the full module prefix.
- [ ] **IMPL-4** — all files of the module's inventory exist.
- [ ] **IMPL-5** — shared code sits at the correct level: category `helpers.ts` for siblings, `src/visuals/components/` or `src/visuals/helpers/` for cross-category reuse.
- [ ] **IMPL-6** — only genuinely missing roles were scaffolded; a new renderer is linked from `src/index.html`; relative import depths match.
- [ ] **IMPL-7** — an extension stays within the same task family, preserves payload compatibility, and requires only surgical configurable changes; unrelated ontology families, stable payload-boundary crossings, and large independent code branches use a new module.
- [ ] **IMPL-8** — a new or materially changed shared payload and its `ViewTypeMap` entry typecheck before generator/view work diverges; integrated matching, generation, and rendering verify the completed path.
