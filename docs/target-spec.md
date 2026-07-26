# Target Spec Rules

Rules for authoring competency target specs — the pedagogical input to the whole pipeline.
Unlike generator/view `spec.ts` files, these describe **standards**, not modules, and are
deliberately broad: they state what a competency demands, not how any module satisfies it.

**Applies to:** `src/spec/<module>/*.ts` (`ccss`, `test`)
**Read with:** [spec-general.md](spec-general.md) — targets sit on the broad side of every matching rule there.
**Verify with:** `npm run check:standards-spec -- --spec=<module>`, `npm run check -- --spec=<module>`

---

## Rules

### TSPEC-1 — The export contract

Every file under `src/spec/<module>/` communicates through four fixed export names. Each is
read by a different consumer, by name — there is no scanning or filtering:

| Export                | Type                  | Read by                                   | Meaning                                                                 |
|-----------------------|-----------------------|-------------------------------------------|-------------------------------------------------------------------------|
| `spec`                | `CompetencyTarget[]`  | `loadTargets` → the generation pipeline   | Permutations with **both** a matching generator and a compatible view.  |
| `implementationTodos` | `CompetencyTarget[]`  | `loadSpecTodos` → coverage report only    | Expressible in the ontology, but missing generator/view capability.     |
| `ontologyTodos`       | `OntologyTodo[]`      | `loadSpecTodos` → coverage report only    | Not expressible: the ontology lacks the `Area`/`Scope`/`Ability`.       |
| `equivalentTargets`   | `TargetEquivalence[]` | `loadSpecEquivalences` → the validator    | Definitions that are intentionally indistinguishable ([TSPEC-8](#tspec-8--definitions-must-be-distinct-unless-the-identity-is-declared)). |

`loadTargets` reads `spec` and nothing else. A todo target can therefore **never** enter the
pipeline, regardless of whether its labels would happen to match a generator/view pair.

### TSPEC-2 — `spec` is the only path in; never alias it

Export competency targets as `export const spec: CompetencyTarget[] = [...]` and nothing
else. Do not export additional aliases of `spec` under other names (e.g. a grade-prefixed
const). A target must be reachable via `spec` and nothing else.

**Why:** dead aliases have caused duplicate-target bugs before.

### TSPEC-3 — One builder per competency, worked from the leaf nodes

Work from the **leaf nodes** of the standard tree (`public/coverage/ccss-tree.json`),
traversing Grade → Domain → Cluster → Standard/SubStandard.

A single leaf standard often bundles several competencies — create **one
`DatasetPermutationBuilder` per competency**, not one per standard.

Study `src/spec/ccss/kindergarten.ts` and `grade-01.ts` for the established structure.

### TSPEC-4 — Build permutations programmatically

- `.addLabels([...])` — the label set shared by all permutations of a competency.
- `.applyLabelVariants([...])` — orthogonal dimensions: number ranges,
  `Scope.NumbersWithZero` vs. `Scope.NumbersWithoutZero`, shapes, relations.
- `toTargets('<CCSS-id>-<slug>', builder)` from `src/lib/dataset-permutation-builder.ts` —
  maps the builder to targets. For todo entries, pass the third argument: a description of
  what generator or view functionality is missing.

Build permutations programmatically rather than writing static arrays by hand — this
applies to the `test` module too.

### TSPEC-5 — Target ids are content hashes, not positions

`toTargets` produces ids like `K.CC.B.5-how-many~a3f91c2e`. The suffix after `~` is a
content hash of the permutation's label set (`labelSetHash` in `src/lib/utils.ts`), **not a
position index**.

Consequences:

- Inserting, reordering or removing variants in a builder never touches the ids — or seeds,
  or cached samples — of the other permutations.
- Changing a permutation's labels changes its id and regenerates exactly that permutation.
  This is correct: the competency itself changed.
- Val-split membership is also id-derived, so a changed permutation may switch splits.

### TSPEC-6 — Never stretch labels to force a match

Declare the most specific ontology label that is a *true statement* about what the standard
demands. If a competency cannot be expressed (missing ontology label) or has no
generator/view support, **do not stretch labels or invent label combinations to force a
match**.

Park the gap instead: leave a `// TODO [<CCSS-id>]:` comment describing it, together with a
commented-out reference builder/permutation, and/or collect the parked targets in the
sibling `implementationTodos` / `ontologyTodos` exports — kept in the same file alongside
`spec` so agents can work through gaps in context.

**Why:** a stretched label produces a sample that is mislabeled. The dataset's whole value
is that labels are mathematically provable claims about the image.

### TSPEC-7 — Categorize each competency into exactly one export

| Can the ontology express it? | Does a generator + view pair match it? | Goes to               |
|------------------------------|----------------------------------------|-----------------------|
| Yes                          | Yes                                    | `spec`                |
| Yes                          | No                                     | `implementationTodos` |
| No                           | —                                      | `ontologyTodos`       |

`ontologyTodos` entries are objects: `{ standardId, title, description }`.

Confirm the middle column empirically with `npm run show:matching -- --spec=<module>` rather
than by inspection.

### TSPEC-8 — Definitions must be distinct, unless the identity is declared

No two target definitions may define an identical **set** of permutations — such definitions
are indistinguishable by the ontology, and this is an error.

Definitions that merely *overlap* in some permutations are legitimate (e.g. related
standards across grades). Overlapping permutations are deduplicated to one representative
target and reported as **warnings**, not errors.

When two definitions are *deliberately* identical — e.g. two standards that differ only
above the supported number range — declare it in `equivalentTargets`:

```typescript
export const equivalentTargets: TargetEquivalence[] = [
    { targets: ['<definition-prefix-a>', '<definition-prefix-b>'], reason: '<why the identity is deliberate>' }
];
```

The declaration keeps every standard id visible in the coverage visualization while telling
the validator the identity is intentional. It is cross-checked: an equivalence naming an
unknown definition, or one whose definitions no longer share an identical permutation set,
is reported as stale.

### TSPEC-9 — Validation

`npm run check:standards-spec -- --spec=<module>` always runs every check: target ID
uniqueness (the sole gatekeeper — `loadTargets` itself is permissive), label set
normalization, intra-target permutation uniqueness, and definition distinctness.

Follow with `npm run check -- --spec=<module>` for the repository-wide checks.

---

## Audit

- [ ] **TSPEC-1** — the file exports only the four contract names, each with its correct type.
- [ ] **TSPEC-2** — `spec` has no alias export; every live target is reachable through `spec` alone.
- [ ] **TSPEC-3** — one builder per competency, derived from leaf standards, not one per standard.
- [ ] **TSPEC-4** — permutations are built with `addLabels`/`applyLabelVariants` and mapped via `toTargets`; no hand-written target arrays.
- [ ] **TSPEC-5** — no id is hand-written or position-derived; every id came out of `toTargets`.
- [ ] **TSPEC-6** — no label is broader, narrower, or otherwise adjusted to make a target match; gaps are parked with a TODO or a todo export.
- [ ] **TSPEC-7** — every competency sits in exactly one of the three arrays, with matching confirmed via `npm run show:matching`.
- [ ] **TSPEC-8** — no two definitions share an identical permutation set unless declared in `equivalentTargets` with a reason.
- [ ] **TSPEC-9** — `npm run check:standards-spec -- --spec=<module>` and `npm run check -- --spec=<module>` pass.
