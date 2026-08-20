# Implementation Rules — View

Rules for `view.html` and `view.tsx`: the visual body, rendered headlessly under Playwright.

**Applies to:** `src/visuals/views/[<category>/]<view>/view.html`, `view.tsx`
**Read with:** [implementation-general.md](implementation-general.md), [spec-view.md](spec-view.md)
**Verify with:** `npm run check:types`, `npm run test:sample`, `npm run report:churn`

---

## Rules

### IMPL-V1 — Structure: a pure core inside `withConfig`

- **`view.html`** — the base HTML template containing a mount point for React.
- **`view.tsx`** — exports the React component wrapped in `withConfig(ViewSchema, Component)`.

The core component itself (`<Name>Core`) is a **pure stateless function** taking
`{ config, payload }`. It does not parse labels — the ontology has already been resolved
into `config` by the schema ([SPEC-V1](spec-view.md#spec-v1--export-contract)).

### IMPL-V2 — Validate the payload strictly

Import `validateProblemData` from `../../../helpers/validation.ts` — with the correct
relative depth matching the sub-directory structure — and call it at the **beginning** of
the view component, with the specific list of required fields accessed from `problem.data`.

### IMPL-V3 — Fail into the error boundary, never into a hang

If validation or range checks fail — e.g. coordinates or dimensions exceed visual limits —
the view must throw a `ViewValidationError`.

**Why:** this is caught by the `ErrorBoundary` in the `withConfig` wrapper, which displays a
standardized diagnostic card during interactive development. Canonical generation detects
that card as a failed render, continues collecting failures from the remaining samples, and
exits non-zero without promoting the staged dataset. It prevents browser crashes, hangs,
and invalid diagnostic cards from becoming dataset artifacts.

### IMPL-V4 — No silent fallbacks

Must not use local silent fallbacks such as `data.shape || 'circle'` or
`config.arrangement || 'scattered'`.

Consume resolved configuration parameters directly from the `config` prop, and
`problem.data` directly, relying on `withConfig` to guarantee they resolve to non-null and
correctly-typed values.

### IMPL-V5 — Question and Solution preserve the task while serving different roles

- `isSolutionView: false` withholds the answer and must not reveal it through duplicate
  text, answer styling, or another equivalent visual cue.
- `isSolutionView: true` reveals the answer and keeps enough context to identify what was
  solved.
- Instructions may appear in either mode only when that image would otherwise be
  ambiguous. Prefer stable geometry between modes, but do not retain unnecessary text just
  to make their pixels identical.

Mode-dependent expectations are asserted by the view's minimal checklist
([CHK-V6](checklist-view.md#chk-v6--keep-one-minimal-observable-contract-per-view)).

### IMPL-V6 — All entropy comes from `payload.seed`

Derive **all** randomized visual decisions from `payload.seed` — icon choices, scatter
positions, shuffles, rotations. Either use the seed directly (`payload.seed % ICONS.length`)
or pass it into a helper that calls `setSeed(seed)` before drawing. The `withConfig` wrapper
seeds the global PRNG from `payload.seed` before config resolution.

Never derive anything from:

- `Math.random()` or an unseeded `random()` call;
- `problem.id` — it is present on the payload but **dead**: no view reads it, and nothing
  may be derived from it.

**Why:** any other entropy source breaks render determinism and invalidates the VQA cache.
Under the concurrent worker pool, unseeded randomness makes renders order-dependent and
poisons the cache non-deterministically.

### IMPL-V7 — No timing-dependent pixels

The render harness disables CSS transitions/animations and waits for fonts and images
before screenshotting, because pages are reused across renders — otherwise mid-transition
captures and image-cache warmth would make pixels depend on render order.

Do not rely on animation states in views, and keep any new async resource (font, image)
loadable: a broken image URL now fails the render wait instead of silently screenshotting a
blank box.

### IMPL-V8 — Needing a new payload field is a two-module change

A view renders `problem.data`; it never invents or derives the mathematics it is missing
([SPEC-8](spec-general.md#spec-8--no-duplicate-parameterization-across-the-generatorview-pair)).
When a view needs data the payload does not carry:

1. Find the producing generators and inspect rejection reasons:
   `npm run show:matching -- --spec=<real-standard>` for the actual producers. Use
   `--spec=test` for the isolated smoke path and add `--raw` only when diagnosing
   pre-deduplication source definitions.
2. Adopt each matched generator to supply the required field
   ([IMPL-G6](implementation-generator.md#impl-g6--a-payload-contract-change-is-a-two-module-change)).

Scope tests to the module during iteration:

```bash
npm run test -- src/visuals/views/[<category>/]<view>/
```

### IMPL-V9 — Related task identities share parent-level rendering code

When [SPEC-V6](spec-view.md#spec-v6--an-ability-driven-task-identity-is-a-leaf-view)
creates multiple leaf views, keep each leaf's `spec.ts`, `checklist.md`, `view.html`, and
thin `withConfig` wrapper in its own directory. Place their reusable renderer, helpers,
and tests directly in the category parent directory with descriptive filenames; a
`components/` subdirectory is not required.

The leaf wrapper fixes the task mode passed to the shared renderer. The shared renderer
must not inspect ontology labels or import one leaf's spec to recover that decision.
When [SPEC-V7](spec-view.md#spec-v7--requiredlabels-scopes-payload-applicability) scopes a
leaf to one member of a canonical discriminated family, the wrapper also fixes the expected
discriminant and the shared renderer fails strictly if the payload does not match it.

### IMPL-V10 — The screenshot root shrink-wraps content up to the viewport

The render harness screenshots `#view`, whose shared stylesheet uses `width: fit-content`
and `max-width: 100vw`. A normal view's outermost rendered element must therefore expose a
natural width through its content, an explicit width, or an intrinsic layout. The captured
PNG contracts to that width instead of retaining transparent space across the canonical
viewport.

Views that intentionally require the full canvas must make that decision visible by giving
their outermost element a viewport width such as `width: 100vw`. Do not make ordinary view
roots full-width merely to center a smaller fixed-width card; center within the card or its
intrinsically sized wrapper instead.

### IMPL-V11 — Preserve the whole matched claim

The final screenshot must provide observable evidence for every target label satisfied by the
generator/view pair, not only for the Ability contributed by the leaf view. Project the
generator's canonical payload without discarding the structures that witness its Area and Scope
claims.

Do not flatten a law-bearing relation until the law is no longer visible, replace a measurable
or countable object with a text badge naming it, omit a graph scale, or hide a premise needed to
defend the target. Text that merely asserts an object or property is not a substitute for the
visual or mathematical evidence when that evidence is what the target claims.

Evidence follows ownership. The generator contract supplies every canonical mathematical
witness; the view preserves those witnesses while making its Ability observable. When a
witness is absent from the payload, follow
[IMPL-V8](#impl-v8--needing-a-new-payload-field-is-a-two-module-change). When the payload
contains it but the screenshot does not, correct the view. Use `rejectedLabels` only for an
irreducible physical rendering boundary.

---

## Audit

- [ ] **IMPL-V1** — the exported component is wrapped in `withConfig`; the core is stateless and parses no labels.
- [ ] **IMPL-V2** — `validateProblemData` is imported at the correct relative depth and called first, listing every required `problem.data` field.
- [ ] **IMPL-V3** — every validation and range-check failure throws `ViewValidationError` rather than rendering degraded output.
- [ ] **IMPL-V4** — no `||` fallback, default parameter, or optional-chaining default stands in for a resolved `config` or `problem.data` value.
- [ ] **IMPL-V5** — Question Mode withholds the answer, Solution Mode reveals it with identifiable context, and each mode includes only instructions necessary for standalone understanding.
- [ ] **IMPL-V6** — grep the view for `Math.random`, unseeded `random(`, and `problem.id`: all three must be absent. Every visual random decision traces back to `payload.seed`.
- [ ] **IMPL-V7** — no reliance on animation state; every async resource the view loads resolves.
- [ ] **IMPL-V8** — no mathematics is derived inside the view to compensate for a missing payload field; the producing generator supplies it.
- [ ] **IMPL-V9** — sibling leaf identities use thin wrappers around parent-level shared rendering code, and the shared code receives a fixed task mode rather than parsing labels or importing a leaf spec.
- [ ] **IMPL-V10** — the outermost rendered element has a natural width; only an intentionally full-canvas view requests viewport width, so `#view` screenshots contain no accidental transparent remainder.
- [ ] **IMPL-V11** — every leaf projection preserves observable evidence for all generator-owned labels in the matched target; it neither flattens structured witnesses nor substitutes labels or names for the claimed objects and relations.
- [ ] `npm run report:churn -- --spec=test` shows churn only in the views actually touched.
