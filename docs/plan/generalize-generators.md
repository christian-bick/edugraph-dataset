# Generalize generator modules conservatively

**Status:** Complete. The exact `measurement-unit-scale` duplication was consolidated; the other
reviewed families remain separate.

## Purpose

Identify generator modules that can be consolidated with minimal changes to their canonical
contracts and implementations. The objective is a smaller, more standardized generator catalog,
but module count is subordinate to truthful mathematical boundaries.

This plan applies the existing rules rather than introducing a preference for large generators:

- `IMPL-G7`: merge only when payload meaning and structure remain stable;
- `IMPL-7`: extend an implementation only when the change is surgical and coherent;
- `SPEC-4`: preserve exact capabilities instead of broadening a generator to make a merge fit;
- `IMPL-G8`: keep every merged payload Ability-neutral;
- `IMPL-G6`: adopt every consuming view when a payload contract changes.

Shared helpers are valuable, but helper reuse alone is not generator generalization. Two modules
remain correctly separate when they instantiate different mathematical objects or relations, even
if they use the same random, numeric, geometric, or formatting utilities.

## Decision test

A consolidation is accepted only when all of the following are true.

1. Both modules instantiate the same canonical mathematical object or one is a strict, coherent
   case already represented by the other.
2. The surviving contract does not acquire unrelated optional fields, parallel task payloads, or
   a large discriminant dispatch merely to host both implementations.
3. The surviving spec continues to claim only capabilities established by every applicable
   generated payload or by an exact schema resolution.
4. Generator configuration still resolves deterministically from target labels without raw label
   inspection in implementation code.
5. Every consuming view remains total for its declared problem type, and task identity remains
   fingerprint-visible where a view resolves a semantic choice.
6. Production target coverage is unchanged. A reduction in redundant generator/view tuples is
   allowed only when the removed tuple contributes no distinct mathematical realization.
7. The result removes an implementation boundary. Extracting common code while retaining both
   truthful modules is classified as helper reuse, not a partial consolidation.

Structural similarity, a shared target, a shared view, or a common schema parameter is only a
candidate signal. None is sufficient evidence by itself.

## Historical baseline

The first CCSS audit after the label and payload migration found:

| Measure | Pre-consolidation value |
| --- | ---: |
| Production targets | 653 |
| Generator modules | 81 |
| View modules | 178 |
| Type-compatible generator/view pairs | 195 |
| Matched target/generator/view tuples | 795 |
| Generator schema parameters | 185 |
| View schema parameters | 26 |

All 81 generators currently name distinct top-level problem types. Eighty participate in at least
one CCSS tuple; `ordering` is retained only outside current CCSS production coverage. Unique type
names do not prove unique mathematics: a union may already contain the exact contract of another
generator.

The candidate scan compares recursive payload structure, schema dimensions, matched targets,
matched views, and implementation size. It is deliberately a ranking aid, not a validation gate.
Semantic review against the rules above determines every disposition.

## Findings

### Consolidate: `measurement-unit-scale` into `measurement-conversion`

This is the one proven exact redundancy.

`measurement-conversion` already contains the `GenericUnitScaleRelationProblem` branch:

```ts
{
    task: 'generic-unit-scale';
    largeUnitCount: number;
    smallUnitCount: number;
    unitsPerLarge: number;
}
```

Its resolver selects that branch for `Area.UnitScaleRelation + Scope.LengthMeasurement`, and its
generator produces the same bounded counts and invariant as `measurement-unit-scale`. Its
derivation view also renders the same equal-length partition relation.

The CCSS target `2.MD.A.2-unit-scale-relation~d6d46d16` therefore has two current tuples:

```text
measurement-conversion × measure-conversion-derivation
measurement-unit-scale × measure-unit-scale-relation
```

The accepted migration retains both visual treatments but gives them one generator. The narrow
`measure-unit-scale-relation` view consumes the existing generic union member with an exact
applicability contract. It rejects `Area.MeasuringWithUnits` because its abstract equal-length
partitions cannot display concrete unit identities; concrete conversion targets remain with
`measure-conversion-derivation`. The second view is visual diversity; it is not a reason to retain
a second generator.

**Risk:** low. The expected matching delta replaces the standalone generator id in one tuple,
without changing the tuple count, visual treatments, or target coverage.

### Keep separate: counting classification

`counting-classify-count` and `counting-classify-sort` build the same categorized collection. The
sort module adds a selected `least` or `most` relation and its calculated category answer. Their
generation code duplicates category initialization and random distribution.

A shared canonical model would be mechanically plausible:

```ts
{
    categories: Record<CategoryId, number>;
    numObjects: number;
}
```

with a uniqueness invariant for the least and most categories. That abstraction does not justify a
merge by itself. Counting category members and selecting an extremum are distinct mathematical
problems; the latter owns `Area.NumericOrder` and a `Scope.Least` or `Scope.Most` relation. Merging
them would either move that mathematical relation into the view or introduce parallel generator
tasks. The accepted disposition is therefore to keep both generators and share only a category
distribution helper if repeated implementation work later warrants one.

### Defer: related models that require contract redesign

These pairs have real common structure, but they do not satisfy the minimal-change criterion.

| Modules | Why they are not a surgical merge |
| --- | --- |
| `counting-inc-dec` / `counting-sequence` | Both describe progressions, but one models a state transition with place-value witnesses while the other models a finite sequence and additionally supports steps of five. A common recurrence contract would require adopting all three consuming views. |
| `place-value-expanded` / `writing` | Both start from an integer and use whole-number place values, but expanded form establishes a sum relation while writing establishes notation. A neutral integer-source generator would shift Area ownership and change seven views. |
| `place-value-bundles` / `place-value-teen` | Bundle counts, decimal digits, and teen decomposition currently use superficially similar fields with different meanings. They need a clarified place-value composition contract before any merge is safe. |

These remain research candidates after the surgical work, not current migration tasks.

### Keep separate; share helpers only where useful

| Modules | Counter-evidence to merging |
| --- | --- |
| `measurement-mass-volume` / `measurement-mass-volume-estimation` | Actual measurement and reference-based estimation are different mathematical relations. Identical schema dimensions do not make their payloads interchangeable. |
| `arithmetic-equation-judgment` / `arithmetic-estimation` | Equation truth and rounded-operand estimation have different invariants and evidence. |
| `fraction-comparison` / `fraction-equivalence` | Ordering two fractions and proving an equivalence are different relations despite shared fraction values. |
| `shape-build-shape` / `shape-identity` | A construction specification and a naming/identity relation have different canonical witnesses. |
| `measurement-attribute` / `measurement-compare` | Identifying an attribute and comparing two magnitudes are different mathematical tasks. |
| `arithmetic-ops-pairs` / `arithmetic-ops-triples` / `arithmetic-ops-four` | Arity changes the canonical operation structure. Their shared typed-union views already implement the intended `IMPL-G7` pattern. |
| `shape-equal-square-partition` / `shape-unit-square-grid` / `shape-rectangle-area` | Equal parts, unit-area coverage, and rectangle area were intentionally separated because count, area, rows, and physical dimensions are not interchangeable facts. |

Matched-target overlap also does not imply redundancy. The current overlaps between arithmetic
estimation and two-step word problems, scalar arithmetic and number arrays, environmental and
abstract shape naming, geometric primitives and attribute classification, and measurable
attributes and tool selection represent genuinely different evidence for the same competency.

## Completed outcome and future reviews

`measurement-conversion` now owns the generic unit-scale relation, the duplicate
`measurement-unit-scale` generator is gone, and both visual treatments remain available. Counting
classification and every other reviewed family retain separate canonical generators for the
reasons recorded above.

The current CCSS architecture audit reports 80 generators, 182 views, 199 compatible pairs, and
790 matched target/generator/view tuples. The historical consolidation itself preserved the 795
tuples recorded at its cutoff; later ontology-relation adoption changed that catalog independently.

Future helper extraction is independent of consolidation and requires an actual repeated
invariant. Future consolidation candidates must be discovered from the current catalogs and pass
the decision test in this document; historical similarity rankings are not a standing migration
queue, and there is no target generator count.

## Validation gates per batch

Every consolidation must pass:

1. scoped generator, resolver, view-helper, and renderer tests;
2. `npm run check:types`;
3. `npm run check:generator-view-specs`;
4. an exact before/after matching diff for both CCSS and the affected test spec;
5. exact `test:target` probes for every affected production target;
6. `npm run test:coverage`;
7. `npm run check:docs` and `git diff --check`.

Target coverage must remain constant. Tuple reduction is reviewed explicitly rather than treated as
a regression automatically. Any new tuple is also reviewed as a semantic claim, not accepted only
because generation succeeds.

## Reuse of the incremental graph

The existing model catalogs and dataset dependency graph are reusable for this audit's factual
inventory:

- generator, view, target, compatible-pair, and successful-tuple nodes;
- capability and schema hashes;
- current generator/view consumers;
- the affected closure of a proposed consolidation;
- exact before/after matching and artifact deltas.

Graph reuse is valid only when ontology, matching policy, capability hashes, target postings, and
compatible-pair topology match the current repository. The first audit correctly performed a fresh
indexed match because the persisted graph's matching-policy identity differed. Falling back to the
indexed matcher remains linear and must not be replaced with an all-pairs scan.

The graph does not encode recursive TypeScript payload structure or semantic equivalence. A
generalization report may add deterministic structural signatures from the current problem types
and source catalogs, then join them to graph consumers. Similarity scores stay advisory: deciding
that two mathematical contracts mean the same thing remains a reviewed design decision.

## Completion criteria

This phase is complete because:

- the proven unit-scale duplicate has one canonical generator path;
- counting classification remains separated as two mathematical problem families;
- every surfaced high-similarity pair has a documented consolidate, defer, helper-only, or keep
  disposition;
- CCSS target coverage remains complete;
- no surviving merge introduces large parallel behaviors, broadened capabilities, or
  presentation-owned fields into a generator payload.
