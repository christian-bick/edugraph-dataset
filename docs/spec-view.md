# Spec Rules — View

Rules specific to a view's `spec.ts`: matching capabilities, visual configuration, and
rejection boundaries.

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

Map ontology labels **only** to presentation configuration that leaves the learner action
unchanged:

- `arrangement`, `showTenFrame` — layout formats, styling modes, button configurations.

The schema must contain **zero** abstract mathematical parameters — no `range`,
`useDecimals`, `requireZero`, or mathematical operation selectors; those belong to the
generator ([spec-generator.md](spec-generator.md)).

It also must not use an Ability to select the task identity. Reading, constructing,
classifying, completing, inverting, and explaining are different learner actions and use
separate leaf views under [SPEC-V6](#spec-v6--an-ability-driven-task-identity-is-a-leaf-view).

An Ability may appear in a view schema when it changes only observable support or another
presentational property while preserving one coherent learner action. The configuration must
remain valid for every compatible payload, resolve deterministically from the target, and fit one
view checklist. Treat every Ability schema parameter as a review signal: it often indicates that
one view is dispatching between parallel task implementations even though the parameter itself is
not a violation.

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
// 🛑 Bad — one schema switches between two learner actions
export const ClockViewSchema = {
    taskMode: [[Ability.VisualReception, Ability.VisualArticulation], resolveTaskMode]
};

// 🟢 Good — each leaf owns one task; shared rendering stays outside the specs
export const clockReadingSpec: ViewSpec = {
    viewId: 'clock-reading',
    generalLabels: [Ability.VisualReception]
};

export const clockDrawingSpec: ViewSpec = {
    viewId: 'clock-drawing',
    generalLabels: [Ability.VisualArticulation]
};
```

### SPEC-V3 — `rejectedLabels` declares complete exclusion boundaries

View specs use `rejectedLabels` to veto otherwise matching target contexts that the view's
contract cannot accept. Every entry must describe a real, stable, and complete exclusion
boundary. **Stable** means that the reason follows from the view contract rather than today's
target or generator catalog. **Complete** means that the declaration covers the whole invalid
region instead of enumerating only failures currently known to occur.

Use it when the invalid side can be stated completely: for example, when a target range exceeds
the view's rendering capacity, when a representation is not defined for zero, negative, or
decimal values, or when the view accepts every compatible family except an explicitly rejected
one. `...deductAdmitting([Scope.NumbersLarger20])`, for example, rejects the complete boundary of
every target range that admits values beyond 20.

An exact rejection is truthful only when the view accepts every other compatible case. When the
view accepts only a positively enumerable subset — for example, exactly step sizes 10 and 100 —
use `requiredLabels`, a narrower payload type, or separate leaf views. Do not blacklist only the
alternatives known today, because a later ontology member would pass the incomplete boundary.

Never put an Ability in `rejectedLabels`, use the list to work around matching direction, or add
an exclusion merely to suppress an inconvenient failure. Positive capabilities remain in
`generalLabels` or the schema ([SPEC-1](spec-general.md#spec-1--matching-is-one-directional-capability-must-be-equal-or-more-specific));
an explicit target precondition belongs in `requiredLabels` when it can be stated directly
([SPEC-V7](#spec-v7--requiredlabels-declares-target-preconditions)).

### SPEC-V4 — Expand rejection boundaries with `deductAdmitting`

Use `...deductAdmitting([<boundary>])` in the rejected list to logically expand a rejection
boundary — e.g. `...deductAdmitting([Scope.NumbersLarger10])` rejects every scope admitting
numbers beyond the view's supported capacity of 10.

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
When a presentation distinction refines the same generator-owned Area, it is a Scope rather
than a descendant Area; a view-owned Area must contribute an independent knowledge domain
([SPEC-11](spec-general.md#spec-11--area-changes-task-nature-scope-changes-task-context)).
View ownership of the Ability does not narrow the artifact's truth requirement: the final
projection must preserve observable evidence for every generator-owned label in the matched
target ([IMPL-V11](implementation-view.md#impl-v11--preserve-the-whole-matched-claim)).

### SPEC-V6 — An Ability-driven task identity is a leaf view

When an Ability changes the observable task itself — for example which equation part is
unknown, whether the learner classifies or completes a relation, or whether an explanation
is requested — represent each identity as a separate leaf view. Declare its Ability as an
invariant `generalLabels` capability; do not resolve the Ability through a schema parameter.

A view must not implement such identities as large, mutually exclusive code branches behind one
configuration. Differences in instructions, requested response, unknown placement, reasoning
request, or question/solution behavior are parallel task behaviors and require leaves. Small,
composable branches for support or presentation within the same task remain valid. Ability
parameterization is a warning sign for this review, not an automatic reason to split.

Each leaf must use the narrowest payload type it actually accepts in `ViewTypeMap`. When a
single canonical generator intentionally returns a discriminated mathematical family, use
`requiredLabels` under [SPEC-V7](#spec-v7--requiredlabels-declares-target-preconditions) and
strictly validate the expected discriminant. Declare only the most specific Ability required
by the task: a specialization already satisfies targets asking for its ancestor.

Pure presentation parameters that do not change task identity remain valid schema
configuration under [SPEC-V2](#spec-v2--the-schema-maps-to-visual-configuration-only).

When sibling leaves share the same capability set and differ only by an invariant Ability
conjunction, require that Ability through dimension-neutral `requiredLabels` under
[SPEC-V8](#spec-v8--requiredlabels-does-not-parameterize-the-view) to prevent the stronger task
from matching a target that did not request it.

### SPEC-V7 — `requiredLabels` declares target preconditions

Use `requiredLabels` when a leaf view may participate only if the target explicitly requests a
label. Every listed label must be present in the target, or be an ancestor of a more specific
target label, before the tuple can match. The property is dimension-neutral: the same mechanism
applies to Area, Scope, and Ability labels.

A requirement is not a capability. The compatible generator/view pair must still provide a label
equal to or more specific than every required label. The provider may be the generator, the view,
or both; `npm run check:generator-view-specs` verifies pair support without assigning ownership by
dimension. A required label cannot also appear in `rejectedLabels`.

Use the property for positive payload-family applicability when static typing cannot express the
boundary, and for an invariant stronger sibling claim that should participate only when explicitly
requested by the target. Prefer a narrower `ViewTypeMap` payload whenever it expresses the same
boundary. Use `rejectedLabels` for complete exclusion boundaries, not as an incomplete substitute
for a positive precondition.

### SPEC-V8 — `requiredLabels` does not parameterize the view

A required label controls matching participation only. It must not change configuration, branch
rendering, or make a capability conditionally true. If the required label is supplied by the view,
that capability remains invariant in `generalLabels` or the schema under the ordinary capability
rules.

For example, a stronger sibling that always exhibits `Ability.Formalization` may both declare the
Ability in `generalLabels` and require it in `requiredLabels`. This says that the view always makes
Formalization true but participates only when the target explicitly asks for it. Do not create a
dimension-specific requirement property for this case. The leaf wrapper still fixes one local
task mode, and the implementation never inspects requirements or raw target labels.

---

## Audit

- [ ] **SPEC-V1** — `spec`, `ViewSchema` and `ViewConfig` are all exported, with `ViewConfig` extracted from the schema.
- [ ] **SPEC-V2** — every schema parameter is presentational and preserves learner action; no mathematical parameter or Ability-driven task selector appears, and each Ability parameter has been reviewed as a possible parallel-task branch.
- [ ] **SPEC-V3** — every `rejectedLabels` declaration is a real, stable, and complete exclusion boundary; exact exclusions admit every other compatible case, and no entry is an Ability, an incomplete blacklist, a matching workaround, or failure suppression.
- [ ] **SPEC-V4** — rejection boundaries use `...deductAdmitting(...)`; `deductCompatible` appears nowhere in the rejection list.
- [ ] **SPEC-V5** — every Ability is declared by a view, directly evidenced by its rendered task, absent from all generators, and not parameterized when it changes task identity.
- [ ] **SPEC-V6** — every Ability that changes observable task identity is invariant on a separate, narrowly typed leaf view rather than implemented through parallel configuration branches; only its most specific required Ability is declared.
- [ ] **SPEC-V7** — every `requiredLabels` entry is a necessary dimension-neutral target precondition, is supported by every compatible generator/view pair, is not rejected, and yields to a narrower payload type when static typing expresses the same boundary.
- [ ] **SPEC-V8** — `requiredLabels` controls matching participation only; a view-supplied requirement remains an invariant capability and never drives configuration or rendering behavior.
- [ ] **SPEC-11** — every view-owned Area is independent of compatible generator Areas; presentation-driven refinement uses Scope.
- [ ] All general rules in [spec-general.md](spec-general.md#audit) pass.
