# Spec Rules — Generator

Rules specific to a generator's `spec.ts`: the bridge from pedagogy to abstract math.

**Applies to:** `src/generators/[<category>/]<module>/spec.ts`
**Read with:** [spec-general.md](spec-general.md) — all `SPEC-n` rules apply here too.
**Verify with:** `npm run check:generator-view-specs`, `npm run check`

---

## Rules

### SPEC-G1 — Export contract

A generator `spec.ts` exports three things:

| Export            | Role                                                                                     |
|-------------------|------------------------------------------------------------------------------------------|
| `spec: GeneratorSpec` | Broad matching capabilities.                                                          |
| `GeneratorSchema` | Maps ontology labels to the typed `config` object using functional resolvers.             |
| `Config`          | The extracted type of the schema.                                                         |

### SPEC-G2 — The schema maps to abstract mathematical configuration only

Map ontology labels **only** to abstract mathematical configuration. Typical parameters:

| Parameter        | Typically resolved via                            |
|------------------|---------------------------------------------------|
| `range`          | `resolveRangeFromLabels` (`src/lib/ontology.ts`)  |
| `requireZero`    | `hasLabel(Scope.NumbersWithZero)`                 |
| `requireNegative` | `hasLabel(Scope.NumbersWithNegatives)`           |
| `useDecimals`    | `hasLabel(Scope.NumbersWithDecimals)`             |
| `attribute`, `relation` | `selectExactMatch`                         |

For a family adopted into canonical range labeling, the resolved numeric profile also describes
the witnesses that make its bounds tightest: the maximum exceeds the previous upper threshold,
and the minimum is below the next lower threshold. Resolve those correlated claims before drawing
values. A separate mathematical source-domain cap can be stricter than the inclusive ontology bound
(for example, two-digit values ending at 99 under upper 100); it does not redefine that descriptor.
Keep the chosen profile feasible with every other admitted mathematical constraint. See the
[approved range contracts](plan/canonical-range-labeling.md#approved-contracts-and-remaining-rollout)
for the rollout boundary and endpoint policy.

Numeric ranges describe the values represented by numerals. Digit glyphs and place-value
components used to represent a number do not introduce independent quantities: reading,
writing, tracing or representing 321 as three hundreds, two tens and one unit uses 321 for
its range. Include other quantities when the exercise assesses them independently; do not
extract additional range quantities merely from a numeral's digits or decomposition.

The schema must contain **zero** visual or presentation parameters — no `isReverse`,
`layoutStyle`, `themeColor`, or comparable flag. Anything describing how a problem is laid
out, styled, or interacted with belongs in the view spec ([spec-view.md](spec-view.md)).

**Why:** the generator has no knowledge of how a problem is visualized. A visual flag in a
generator schema also breaks [SPEC-8](spec-general.md#spec-8--no-duplicate-parameterization-across-the-generatorview-pair)
for every view that legitimately needs that flag.

#### Examples

Visual representation — whether a number appears in a ten frame or as a digit — is the
view's decision:

```typescript
// 🛑 Bad — visual representation flag in a generator schema
export const CountingSchema = {
    showTenFrame: [ [Scope.TenFrame], hasLabel(Scope.TenFrame) ],
    range: [ ... ]
};

// 🟢 Good — strictly mathematical parameters
export const CountingSchema = {
    range: [ ... ]
};
```

Shape *styling* is visual; which shape the problem is *about* is mathematical:

```typescript
// 🛑 Bad — styling belongs to the view
export const ShapeIdentitySchema = {
    useColor: [ [Scope.ColoredShapes], hasLabel(Scope.ColoredShapes) ],
    shapeType: [ [Scope.Triangle, Scope.Square], selectExactMatch ]
};

// 🟢 Good — strictly mathematical shape properties
export const ShapeIdentitySchema = {
    shapeType: [ [Scope.Triangle, Scope.Square], selectExactMatch ]
};
```

### SPEC-G3 — Declare the Area and Scope capabilities the math produces

The generator spec declares the **specific labels and scopes it produces mathematically**,
subject to [SPEC-1](spec-general.md#spec-1--matching-is-one-directional-capability-must-be-equal-or-more-specific)
through [SPEC-4](spec-general.md#spec-4--never-declare-a-capability-broader-than-the-module-can-deliver):
declare the most specific label that is *actually true* of the output, never an ancestor of
it, and never a leaf the module does not really satisfy.

For binary arithmetic, `Scope.MultiplesOf10` requires **both primary operands** to be
integer multiples of ten. Include an operand that the learner must determine: `10 + [] = 20`
qualifies because the missing operand is 10; `34 + 20` and `10 + [] = 21` do not qualify.
A divisible result, a zero digit or a derived place-value component does not establish this
operand claim. Keep any narrower native operand pool separate from the semantic condition.

Generator specs contain no `Ability` labels. Abilities depend on the final observable task,
so they are exclusively owned by views ([SPEC-V5](spec-view.md#spec-v5--abilities-are-exclusively-view-owned)).
When an apparent Ability choice changes operands, unknowns, wording, hints, or requested
reasoning, the generator instead emits the canonical mathematical relation and the view
constructs that task projection.

Declare label-expressible configuration dependencies as generator-owned `compatibility` rules.
For example, measurement data declares that `SingleFrameOfReference` requires `FractionNumbers`.
The planner eliminates invalid combinations before generation and constrains unspecified choices;
it does not inspect generated data. Keep numeric feasibility, concrete operand sampling, and
defensive type/range validation in the implementation. Retain existing configuration guards as
assertions of the declared contract, with tests that every admitted variant satisfies them.

---

## Audit

- [ ] **SPEC-G1** — `spec`, `GeneratorSchema` and `Config` are all exported, with `Config` extracted from the schema.
- [ ] **SPEC-G2** — every schema parameter is a mathematical property; no `isReverse`, `layoutStyle`, `themeColor`, `useColor`, `showTenFrame`, or comparable presentation flag.
- [ ] **SPEC-G3** — declared Area/Scope labels are the most specific true claims about the math produced; a binary `MultiplesOf10` claim holds for both primary operands, including a necessary unknown operand.
- [ ] **SPEC-G3** — neither `generalLabels` nor any generator schema parameter contains an Ability.
- [ ] All general rules in [spec-general.md](spec-general.md#audit) pass.
