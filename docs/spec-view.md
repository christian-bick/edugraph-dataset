# Spec Rules — View

Rules specific to a view's `spec.ts`: matching capabilities, visual configuration, and
physical rejection boundaries.

**Applies to:** `src/visuals/views/[<category>/]<view>/spec.ts`
**Read with:** [spec-general.md](spec-general.md) — all `SPEC-n` rules apply here too.
**Verify with:** `npm run check:generator-view-specs`, `npm run check`

---

## Rules

### SPEC-V1 — Export contract

A view `spec.ts` exports three things:

| Export        | Role                                          |
|---------------|-----------------------------------------------|
| `spec: ViewSpec` | Matching capabilities and applicability.   |
| `ViewSchema`  | Maps ontology labels to the visual config.    |
| `ViewConfig`  | The extracted type of the schema.             |

### SPEC-V2 — The schema maps to visual configuration only

Map ontology labels **only** to visual/layout configuration:

- `isReverse` — switches between reception and articulation modes, e.g. reading the hands
  of a clock vs. drawing them.
- `arrangement`, `showTenFrame` — layout formats, styling modes, button configurations.

The schema must contain **zero** abstract mathematical parameters — no `range`,
`useDecimals`, `requireZero`, or mathematical operation selectors; those belong to the
generator ([spec-generator.md](spec-generator.md)).

The view must also rely purely on the generated problem payload (`problem.data`) for
anything the generator already parameterized, rather than querying the ontology itself —
see [SPEC-8](spec-general.md#spec-8--no-duplicate-parameterization-across-the-generatorview-pair).

#### Examples

```typescript
// 🛑 Bad — range is the generator's concern
export const CountingViewSchema = {
    showTenFrame: [ ... ],
    range: [ ... ]
};

// 🟢 Good — strictly visual/representation parameters
export const CountingViewSchema = {
    showTenFrame: [ [Scope.TenFrame], hasLabel(Scope.TenFrame) ],
    arrangement: [Scope.LinearArrangement, Scope.CircularArrangement, Scope.ScatteredArrangement]
};
```

```typescript
// 🛑 Bad — deciding which shapes exist is the generator's concern
export const ShapeIdentityViewSchema = {
    isReverse: [ ... ],
    shapeType: [ ... ]
};

// 🟢 Good — strictly visual rendering parameters
export const ShapeIdentityViewSchema = {
    isReverse: [ ... ]   // does the student read the label, or draw/select the shape?
};
```

### SPEC-V3 — `rejectedLabels` declares physical boundaries, not competency filters

Instead of declaring what a view *can* handle, view specs use `rejectedLabels` to
explicitly list the labels (or label arrays) they *cannot* handle.

Its purpose is to narrow a view to a **subset of the problems its matched generator can
produce** — the cases the view's layout physically cannot render (e.g. rejecting
`Scope.NumbersWithZero`, or using `...deductAdmitting([Scope.NumbersLarger20])` to reject
every target that allows numbers beyond the view's physical rendering capacity).

It is **not** a general competency filter. Do not use it to exclude abilities, and do not
use it to work around the matching direction. What a view *supports* belongs in the
positive `generalLabels`/schema declarations
([SPEC-1](spec-general.md#spec-1--matching-is-one-directional-capability-must-be-equal-or-more-specific)).

### SPEC-V4 — Expand rejection boundaries with `deductAdmitting`

Use `...deductAdmitting([<boundary>])` in the rejected list to logically expand a rejection
boundary — e.g. `...deductAdmitting([Scope.NumbersLarger10])` rejects every scope admitting
numbers beyond the view's physical capacity of 10.

**Never** use `deductCompatible` for rejection lists: it is the dual operator, for
declaring capabilities in schemas ([SPEC-10](spec-general.md#spec-10--capabilities-use-deductcompatible-boundaries-use-deductadmitting)).

### SPEC-V5 — Abilities are exclusively view-owned

Every Ability is decided at the final observable task and therefore belongs exclusively to
a view. A generator emits the canonical mathematical model without selecting an unknown,
blank, prompt direction, hint, requested explanation, or other learner action. The view
declares the most specific Ability its projection makes observable and constructs those
presentation choices from the payload and `payload.seed`.

Area and Scope labels remain owned by the side that determines them. Neither side may
redeclare a label owned by its paired module
([SPEC-8](spec-general.md#spec-8--no-duplicate-parameterization-across-the-generatorview-pair)).

### SPEC-V6 — An Ability-driven task identity is a leaf view

When an Ability changes the observable task itself — for example which equation part is
unknown, whether the learner classifies or completes a relation, or whether an explanation
is requested — represent each identity as a separate leaf view. Declare its Ability as an
invariant `generalLabels` capability; do not resolve the Ability through a schema parameter.

Each leaf must use the narrowest payload type it actually accepts in `ViewTypeMap`. When a
single canonical generator intentionally returns a discriminated mathematical family, use
`requiredLabels` under [SPEC-V7](#spec-v7--requiredlabels-scopes-payload-applicability) and
strictly validate the expected discriminant. Declare only the most specific Ability required
by the task: a specialization already satisfies targets asking for its ancestor.

Pure presentation parameters that do not change task identity remain valid schema
configuration under [SPEC-V2](#spec-v2--the-schema-maps-to-visual-configuration-only).

### SPEC-V7 — `requiredLabels` scopes payload applicability

Use `requiredLabels` when a leaf view is valid only for a mathematical member of a
type-compatible generator family. Every listed label must be present in the target, or be
an ancestor of a more specific target label, before the tuple can match. Required labels are
applicability constraints, not capabilities: the generator must still declare the Area or
Scope that satisfies the target.

Every type-compatible generator must support every required label in the same ontology
direction used by matching. The view must not also provide a required label through
`generalLabels` or its schema, and the same label cannot appear in both `requiredLabels`
and `rejectedLabels`. `npm run check:generator-view-specs` verifies this contract.

Only Area and Scope terms belong here. Never put an Ability in `requiredLabels`; the leaf
must positively own its invariant Ability in `generalLabels`. Prefer a narrower
`ViewTypeMap` payload whenever static typing alone can express the same boundary. Use
`rejectedLabels` for physical rendering limits, not for this positive mathematical context.

---

## Audit

- [ ] **SPEC-V1** — `spec`, `ViewSchema` and `ViewConfig` are all exported, with `ViewConfig` extracted from the schema.
- [ ] **SPEC-V2** — every schema parameter is visual/layout; no `range`, `requireZero`, `useDecimals`, `shapeType`, or comparable math parameter.
- [ ] **SPEC-V3** — every entry in `rejectedLabels` names a case the layout physically cannot render, not a competency the view merely does not want.
- [ ] **SPEC-V4** — rejection boundaries use `...deductAdmitting(...)`; `deductCompatible` appears nowhere in the rejection list.
- [ ] **SPEC-V5** — every Ability is declared by a view, directly evidenced by its rendered task, absent from all generators, and not parameterized when it changes task identity.
- [ ] **SPEC-V6** — every Ability that changes observable task identity is invariant on a separate, narrowly typed leaf view rather than resolved by a schema parameter; only its most specific required Ability is declared.
- [ ] **SPEC-V7** — polymorphic leaf views use non-Ability `requiredLabels` only when a narrower payload type cannot express their mathematical applicability; every compatible generator supplies them, while the view neither supplies nor rejects them.
- [ ] All general rules in [spec-general.md](spec-general.md#audit) pass.
