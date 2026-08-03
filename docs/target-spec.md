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

Every file under `src/spec/<module>/` communicates through five fixed export names. Each is
read by a different consumer, by name — there is no scanning or filtering:

| Export                | Type                  | Read by                                   | Meaning                                                                 |
|-----------------------|-----------------------|-------------------------------------------|-------------------------------------------------------------------------|
| `spec`                | `CompetencyTarget[]`  | `loadTargets` → the generation pipeline   | Permutations with **both** a matching generator and a compatible view.  |
| `implementationTodos` | `CompetencyTarget[]`  | `loadSpecTodos` → coverage report only    | Expressible in the ontology, but missing generator/view capability.     |
| `ontologyTodos`       | `OntologyTodo[]`      | `loadSpecTodos` → coverage report only    | Not expressible: the ontology lacks the `Area`/`Scope`/`Ability`.       |
| `beyondScope`         | `BeyondScopeEntry[]`  | `loadSpecTodos` → coverage report only    | Intentionally not addressable in the dataset's declared medium.        |
| `equivalentTargets`   | `TargetEquivalence[]` | `loadSpecEquivalences` → the validator    | Definitions that are intentionally indistinguishable ([TSPEC-8](#tspec-8--definitions-must-be-distinct-unless-the-identity-is-declared)). |

`loadTargets` reads `spec` and nothing else. A todo target or `beyondScope` declaration can
therefore **never** enter the pipeline, regardless of whether it would happen to resemble a
generator/view capability.

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
- `.applyLabelVariants([...])` — takes alternative **label groups** for one dimension.
  Labels within one group are conjunctive; the method forms the Cartesian product of the
  current permutations with those groups. Successive calls multiply orthogonal dimensions
  such as number ranges, zero inclusion, shapes and relations.
- `toTargets('<CCSS-id>-<slug>', builder)` from `src/lib/dataset-permutation-builder.ts` —
  maps the builder to targets. For todo entries, pass the third argument: a description of
  what generator or view functionality is missing.

Build permutations programmatically rather than writing static arrays by hand — this
applies to the `test` module too.

For example:

```typescript
builder
    .addLabels([Shared])
    .applyLabelVariants([[A, B], [C]])
    .applyLabelVariants([[X], [Y]]);
```

produces `current permutations × {A AND B, C} × {X, Y}`: four final permutations.

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
sibling `implementationTodos` / `ontologyTodos` exports, or in `beyondScope` when the
required evidence cannot exist in the dataset's declared medium — kept in the same file alongside
`spec` so agents can work through gaps in context.

**Why:** a stretched label produces a sample that is mislabeled. The dataset's whole value
is that labels are mathematically provable claims about the image.

### TSPEC-7 — Categorize each competency into exactly one export

| Addressable in the dataset medium? | Can the ontology express it? | Does a generator + view pair match it? | Goes to               |
|------------------------------------|------------------------------|----------------------------------------|-----------------------|
| No                                 | —                            | —                                      | `beyondScope`         |
| Yes                                | Yes                          | Yes                                    | `spec`                |
| Yes                                | Yes                          | No                                     | `implementationTodos` |
| Yes                                | No                           | —                                      | `ontologyTodos`       |

`ontologyTodos` entries are objects: `{ standardId, title, description }`.
`beyondScope` entries use the same descriptive shape. They are intentional exclusions, not
backlog items. A leaf standard may have one competency in `beyondScope` and a different
competency in `spec`, but each individual competency still belongs to exactly one export.

Confirm the middle column empirically with `npm run show:matching -- --spec=<module>` rather
than by inspection. Audit the complete matched-pair set: the intended path must be present,
and every additional generator-view match must also be a genuine realization of the target.

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

### TSPEC-10 — Union membership is declared, not hardcoded

Every spec module is one education standard that contributes to the **union dataset**
(`out/dataset/`), unless it declares otherwise in a `_module.ts` file:

```typescript
export const isolated = true;    // never merges into the union
export const unionOrder = 200;   // merge precedence; lower merges first
```

Files prefixed with `_` describe the module rather than contributing targets, so the
target-bearing loaders skip them — a `_module.ts` must **not** export `spec`.

- **`isolated`** — only `src/spec/test/` sets this. An isolated spec exists to exercise
  generators and views, and its samples never reach released data.
- **`unionOrder`** — defaults to 100, ties broken by module name. When adding a standard,
  declare a **higher** value than the established ones, so they keep their samples and the
  newcomer contributes only its delta.

**Why:** standards overlap heavily. Precedence decides which standard keeps a shared
exercise, so leaving it implicit would let adding one standard silently reshuffle another's
contribution.

### TSPEC-12 — `test` is an isolated prototyping and regression spec

The `test` module is a fast workspace for prototyping, debugging, smoke generation and
retained cached regressions. It is not a second curriculum and need not reproduce every
capability permutation from the real standards.

Keep existing useful targets when they continue to provide regression value. Every
generator module must nevertheless match at least one `test` target together with at least
one compatible view and produce a sample through that tuple, so each generator has a cheap
end-to-end path. Durable mathematical and label-resolution coverage remains in the
module's `generator.test.ts` and
`spec.test.ts`; final matching is verified against the real standard spec.

### TSPEC-9 — Validation

`npm run check:standards-spec -- --spec=<module>` always runs every check: target ID
uniqueness (the sole gatekeeper — `loadTargets` itself is permissive), label set
normalization, intra-target permutation uniqueness, and definition distinctness.

For `--spec=test`, it also verifies that every generator has at least one matched
generator-view path whose bounded probe can produce a sample.

Follow with `npm run check -- --spec=<module>` for the repository-wide checks.

---

## Audit

- [ ] **TSPEC-1** — the file exports only the five contract names, each with its correct type.
- [ ] **TSPEC-2** — `spec` has no alias export; every live target is reachable through `spec` alone.
- [ ] **TSPEC-3** — one builder per competency, derived from leaf standards, not one per standard.
- [ ] **TSPEC-4** — permutations are built with `addLabels`/`applyLabelVariants` and mapped via `toTargets`; no hand-written target arrays.
- [ ] **TSPEC-5** — no id is hand-written or position-derived; every id came out of `toTargets`.
- [ ] **TSPEC-6** — no label is broader, narrower, or otherwise adjusted to make a target match; gaps are parked with a TODO or a todo export.
- [ ] **TSPEC-7** — every competency sits in exactly one of the four disposition arrays, with matching confirmed via `npm run show:matching` for addressable competencies.
- [ ] **TSPEC-8** — no two definitions share an identical permutation set unless declared in `equivalentTargets` with a reason.
- [ ] **TSPEC-9** — `npm run check:standards-spec -- --spec=<module>` and `npm run check -- --spec=<module>` pass.
- [ ] **TSPEC-10** — a new standard declares a `unionOrder` above the established ones; only `test` is `isolated`; no `_module.ts` exports `spec`.
- [ ] **TSPEC-12** — `test` remains a focused prototyping/regression spec and provides at least one generatable target-view path per generator.
