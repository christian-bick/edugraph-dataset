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
| `spec: ViewSpec` | Matching capabilities.                     |
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

### SPEC-V5 — Declare only view-owned labels

The view spec declares labels that decide visual mode, layout, or interaction. An
ability that instead changes the generated mathematics belongs to the generator and must
not be redeclared by the view ([SPEC-8](spec-general.md#spec-8--no-duplicate-parameterization-across-the-generatorview-pair)).

---

## Audit

- [ ] **SPEC-V1** — `spec`, `ViewSchema` and `ViewConfig` are all exported, with `ViewConfig` extracted from the schema.
- [ ] **SPEC-V2** — every schema parameter is visual/layout; no `range`, `requireZero`, `useDecimals`, `shapeType`, or comparable math parameter.
- [ ] **SPEC-V3** — every entry in `rejectedLabels` names a case the layout physically cannot render, not a competency the view merely does not want.
- [ ] **SPEC-V4** — rejection boundaries use `...deductAdmitting(...)`; `deductCompatible` appears nowhere in the rejection list.
- [ ] **SPEC-V5** — view-owned labels are declared positively in `generalLabels` or as parameters, are directly evidenced by the rendered task, are not listed in `rejectedLabels`, and do not redeclare generator-owned labels.
- [ ] All general rules in [spec-general.md](spec-general.md#audit) pass.
