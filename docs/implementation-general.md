# Implementation Rules — General

Module layout, discovery, and shared-code placement for both generators and views.

**Applies to:** `src/generators/`, `src/visuals/`
**Read with:** [implementation-generator.md](implementation-generator.md), [implementation-view.md](implementation-view.md)
**Verify with:** `npm run check:types`, `npm run check`

---

## Rules

### IMPL-1 — Content is added in pairs

Adding content means creating two interconnected directories: a **Generator** (the abstract
math) and a **Renderer/View** (the visual body). Neither is useful alone — the pipeline
only produces samples for a matched `(target, generator, view)` tuple.

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
| `checklist.md`              | `spec.ts`                    |
| `generator.test.ts`         | `checklist.md`               |
| `spec.test.ts`              |                              |

Rules for each: [implementation-generator.md](implementation-generator.md) /
[implementation-view.md](implementation-view.md) for code and tests,
[spec-generator.md](spec-generator.md) / [spec-view.md](spec-view.md) for `spec.ts`,
[checklist-generator.md](checklist-generator.md) / [checklist-view.md](checklist-view.md)
for `checklist.md`.

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

1. Create the generator directory under `src/generators/` (e.g. `src/generators/fractions`).
2. Create the corresponding renderer directory under `src/visuals/views/` (e.g.
   `src/visuals/views/fractions-pie`).
3. Add a link to the new renderer in `src/index.html` for easy browser preview.

Note the relative import depth of any `lib`/`helpers` import must match the sub-directory
level the module actually sits at ([IMPL-G2](implementation-generator.md#impl-g2--validate-configuration-strictly),
[IMPL-V2](implementation-view.md#impl-v2--validate-the-payload-strictly)).

### IMPL-7 — Extend before you create; create only to extend the ontological space

Given a gap to close, prefer in this order:

1. **Extend an existing generator** — add parameters to the `spec.ts` schema and handling in
   `generator.ts`. Keep problem payload contracts stable where possible
   ([IMPL-G6](implementation-generator.md#impl-g6--a-payload-contract-change-is-a-two-module-change)).
2. **Extend an existing view** — add layout properties to the `spec.ts` schema and
   `view.tsx`, and declare physical capacity limits in `rejectedLabels`
   ([SPEC-V4](spec-view.md#spec-v4--expand-rejection-boundaries-with-deductadmitting)). Keep
   existing renderings stable where possible.
3. **Create a new leaf module** — **only when extending the supported ontological space**,
   not to avoid touching an existing module.

**Why:** every new module multiplies the matching surface and adds a checklist that has to
be maintained. A new module that renders labels an existing module already covers competes
with it for the same targets.

---

## Audit

- [ ] **IMPL-1** — the change delivers both a generator and a view path for the targets it claims.
- [ ] **IMPL-2** — the module sits at most one category level deep, and every leaf directory contains a `spec.ts`.
- [ ] **IMPL-3** — the directory name carries the full module prefix.
- [ ] **IMPL-4** — all files of the module's inventory exist.
- [ ] **IMPL-5** — shared code sits at the correct level: category `helpers.ts` for siblings, `src/visuals/components/` or `src/visuals/helpers/` for cross-category reuse.
- [ ] **IMPL-6** — a new renderer is linked from `src/index.html`; relative import depths match the directory level.
- [ ] **IMPL-7** — a newly created module genuinely extends the supported ontological space; otherwise an existing module was extended instead.
