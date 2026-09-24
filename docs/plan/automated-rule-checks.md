# Automated rule checks — dataset

Implementation plan for the remaining approved checks after label consolidation. Source, public
entry points, and focused regressions were reviewed on 2026-09-23 against dataset `07c57d6`, after
fetching current remote history. This plan links existing rules; it does not add ontology semantics.

D1–D5 and D8–D12 now have the deterministic gates and regressions specified below. D6 and
D13–D15 retain their existing runtime checks. D7's payload-family adoption and fail-closed type
matching are implemented; its positive micro-filter decision and D16's documentation discovery
remain open. Semantic truth and uncertain
control-flow cases remain review work rather than invented static proof.

The ontology owns descriptor structure and eligibility. Its
[check inventory](https://github.com/christian-bick/edugraph-ontology/blob/main/docs/plan/automated-rule-checks.md)
covers the source graph and generated clients. This repository validates declarations, resolution,
composition, and dataset artifacts against its complete, pinned ontology package.

## Verified baseline

| Change | Evidence | Consequence for this plan |
| --- | --- | --- |
| `6ddf887` adopts ontology v0.26.0 and implements D1, D2 cardinality, D3, and D10 | `label-contracts.ts`, `standards-validation.ts`, `external-semantics.ts`, and the generation guards | No ontology release or v0.26.0 adoption task remains. |
| `b7001cf` implements D4 | `spec-ownership.ts` is shared by the spec gate and architecture audit, using the compatible-pair index | Keep the indexed ownership checks and their public-command fixtures. |
| `07c57d6` implements D5 | `spec-contracts.ts` supplies specialization-aware requirement/rejection checks to both callers | Keep applicability checks; payload type safety remains a separate D7 concern. |
| Shared ontology validation is adopted in the editor | Its package pin is v0.26.0; `ontology-assessment.ts` uses the shared assessment APIs and `authoring-constraints.ts` uses O3b/O6 | Editor adoption is complete for this plan. Label eligibility is a content-annotation policy, not a validity requirement for every editor entity. |
| Ontology v0.27.0 is published | [Release notes](https://github.com/christian-bick/edugraph-ontology/blob/v0.27.0/docs/releases/v0.27.0.md): Python snapshot APIs and shared relation contracts; authored Turtle unchanged from v0.26.0 | A package update is independent maintenance, not a prerequisite for these checks. |

Verification in this review:

- `npm run check:types` passed.
- Thirteen focused suites passed, totaling 202 tests: label and standards contracts, ownership,
  applicability, their public spec-command fixtures, ontology semantic deltas, development planning,
  matching, architecture audit, source contracts, resolvers, configuration, and generation helpers.
- `npm run check:standards-spec -- --spec=ccss,test` passed: 693 authored CCSS targets normalize to
  681 active targets; the isolated test spec has 559. Existing equivalence/overlap warnings remain.
- Catalog inspection found 87 generators, 184 views, and 202 compatible pairs. No current module
  lacks a parsed payload mapping or required file, and no leaf checklist contains headings.
- Six union-to-member pairs remain, all from `arithmetic-patterns`; their exact inventory is in the
  [payload-family plan](payload-family-matching.md#verified-pair-inventory).

This review did not regenerate images, change cache entries, or establish release readiness.
Functional tests verify the existing contracts; semantic truth still needs mathematical review
and rendered evidence.

## Reading the inventory

- **Gate:** a current command or runtime path fails for the stated condition.
- **Partial:** some enforcement exists, but its input coverage or entry-point integration is incomplete.
- **Regression:** tests exercise the behavior; they are not a validator of every authored module.
- **Missing:** no permanent check was found for the stated condition.

The numbers below identify work items, not new normative rule IDs. Each implementation diagnostic
should cite the relevant existing rule and identify the file, field, label, pair, or sample.

## Declarations and matching

| Item | Algorithmic check | Current coverage and remaining work |
| --- | --- | --- |
| D1. Known, eligible labels | Validate every target, `generalLabels`, schema-supported and fallback label, requirement, rejection, and resolved annotation against the complete pinned descriptor set. Reject organizational labels with constituent children; allow leaves and specialization families. See SPEC-3 and ontology ONT-E7. | **Gate.** `label-contracts.ts` delegates known/eligible checks to `edugraph-ts` v0.26.0's bundled context and adds dataset diagnostics. The same context supplies constituent-child facts for dependency identity. Module validation covers general, schema-supported, fallback, required and rejected labels even for unmatched modules. Shared standards validation checks active and implementation-TODO labels; generation checks resolved annotations. Proposed ontology-TODO names are excluded. |
| D2. Target structure | Check target IDs, normalized permutations, definition collisions, declared equivalences, valid TODO packages, and production targets containing at least one Area and Ability. Scope remains optional; no primary label or upper limit. See TSPEC-1, TSPEC-5, TSPEC-8, TSPEC-14. | **Gate for deterministic structure.** `spec-validator.ts` checks IDs/permutations; stale equivalences are warnings. TODO loaders validate package structure. Area/Ability cardinality is enforced by the shared standards gate; Scope remains optional. No additional cardinality implementation remains. Semantic equivalence judgments remain review, not automatic proof. Preserve the current mechanism pending the [deferred review](#deferred-review-intra-standard-equivalences). |
| D3. Inverse target coverage | Every normalized active target exported through `spec` has a compatible generator/view tuple. Every generator retains a generatable active `test` path. See TSPEC-1, TSPEC-9, TSPEC-12. | **Gate.** Dedicated, full, affected and CI checks call `standards-validation.ts`. Affected matching reuses a graph only with current version and ontology provenance. `check-affected` compares each changed generator's declared output type against its Git baseline: a change or uncertain parse schedules pair and active CCSS/test coverage; proven implementation-only edits retain the cheap route. TODO and beyond-scope records never enter inverse coverage. |
| D4. Positive ownership | Reject generator Abilities, redundant invariant specialization ancestors, schema/general overlap, and overlapping positive ownership across a compatible pair. Keep label mechanics dimension-neutral. See SPEC-2, SPEC-7, SPEC-8, SPEC-11, SPEC-G3, SPEC-V5. | **Gate for declaration conflicts.** `spec-ownership.ts` supplies the same indexed checks, rule-linked diagnostics and declaration witnesses to the spec gate and architecture audit. Every module is checked, including unmatched ones; cross-role checks use all four invariant/schema combinations on the existing compatible-pair index. Full, affected and CI commands share the spec gate. Related schema alternatives and structural ancestry alone remain valid. Whether a capability is mathematically true or belongs in Area versus Scope remains semantic review. |
| D5. Applicability consistency | Requirements are target preconditions, supported by each compatible pair, and do not contribute output labels. Rejections veto matches and never contain Abilities. Detect impossible required/rejected combinations. See SPEC-V3, SPEC-V7, SPEC-V8. | **Gate for algorithmic consistency.** `spec-contracts.ts` supplies shared diagnostics to the spec gate and architecture audit for pair support, missing compatible generators, rejected Abilities, and equality/specialization contradictions. Requiring Square while rejecting Rectangle fails, with both full IRIs; requiring Rectangle while rejecting Square remains valid. Support checks reuse the production compatible-pair index and its capability closures. Unmatched views are checked too. The existing matcher and resolved-label construction preserve participation-only requirements and target-context rejections. Proving a rejection boundary is complete remains review. |
| D6. Matching semantics | Conjunctive coverage uses equality or `specializes` only, never `partOf`, reverse inheritance, or progression. Direct, indexed, and delta matching agree, including additions and removals. See SPEC-1. | **Runtime plus regressions.** `matching.ts`, `ontology.test.ts`, and `matching.test.ts` cover these behaviors. Retain focused positive/negative fixtures and extend command-parity tests; do not duplicate the production matcher in a second validation engine. |
| D7. Payload compatibility | A generator's possible output types must fit the view's declared input family; missing or unrecognized mappings must not silently admit a pair. See IMPL-8 and SPEC-V6. | **Type gate implemented.** Unknown/missing types fail closed; complete producer unions must fit accepted view families. Arithmetic, shape and fraction consumers are adopted, with direct/indexed/delta regressions and no active-target loss. Positive micro-filter policy remains open, with reproduced whole/fractional/fallback cases in the [payload-family plan](payload-family-matching.md#positive-micro-filter-decision). |

The D3 input is the normalized, deduplicated active `spec` export, not every declaration loaded
from a standards file. TODO packages can have their own structural validation without being
required to match. Proposed entity names in `ontologyTodos` are not references to existing labels
for D1. Require regression fixtures where an unmatched active target fails, the same unmatched
competency in `implementationTodos` does not, and ontology TODOs and beyond-scope entries do not
enter the match-coverage set. An isolated `test` module still checks its active targets.

## Resolution and implementation boundaries

| Item | Algorithmic check | Current coverage and remaining work |
| --- | --- | --- |
| D8. Resolver contracts | Non-empty label support; explicit exact/predicate/aggregate/compositional semantics; declared fallback sets contain only supported labels and resolve; function-only choices are `ontologyNeutral`. Verify deterministic resolution and complete recorded fallback labels. See SPEC-6. | **Gate plus regressions.** Existing runtime markers, fallbacks and ambiguity checks remain. The shared source index now rejects inline and prematurely executed schema resolvers while admitting references and known curried factories. Untraceable calls produce a review diagnostic, not a guessed failure. Mathematical truth of custom resolver code remains review. |
| D9. Correct deduction placement | Capability expansion belongs in schemas; rejection expansion uses `deductAdmitting`; invariant claims do not come from `deductCompatible`. See SPEC-10 and SPEC-V4. | **Gate.** `spec-source-contracts.ts` traces package root/subpath imports, namespace and renamed imports, constant initializers and simple local re-exports to the operator's origin. It checks schemas, invariants, requirements and rejections without treating an unrelated same-named method as the operator. The spec gate and architecture audit share the findings. |
| D10. Resolved labels and target coverage | Output labels equal generator/view invariant labels plus their resolved schema labels. Target, required, and rejected labels are not copied into that set. Every actual resolved draw must still satisfy every target claim through specialization. See SPEC-1, SPEC-6, IMPL-G3. | **Runtime gate plus orchestration regressions.** `generation-orchestration.ts` guards actual draws before task fingerprints or rendering and guards duplicate-target associations. Tests exercise first-question rejection, solution-error propagation instead of fallback, and valid duplicate association. The pipeline still uses the original guard, not a second matching algorithm. |
| D11. Implementation isolation | Generator/view code and their implementation helpers do not inspect raw target/problem label bags, import spec decisions into rendering, or emit generator-authored annotations. See IMPL-G1, IMPL-G3, IMPL-V1, IMPL-V9. | **Gate.** Syntax-aware checks follow lexical aliases, destructuring, bracket access, spec imports and reachable local implementation helpers; the architecture audit reuses that scanner. The full spec gate checks all discovered modules, while the affected command checks changed implementation files and their owners. Schema/framework boundaries, type-only imports and resolved enum-valued config remain valid. |
| D12. Module and validation structure | Check required module files/exports, view type mappings, checklist presence and heading-free form, configuration/payload validation, and known unseeded entropy calls. See IMPL-2, IMPL-4, IMPL-G2, IMPL-V1–V4, IMPL-V6, CHK-V6. | **Deterministic inventory/source gate.** Required files, exports, generator orphans, view mappings, checklist form and `withConfig` wrappers are checked for every leaf. Unseeded entropy calls fail. Nonempty generator schemas require validation at entry; a missing reachable call fails, while uncertain ordering/shared-helper cases are review signals. The check does not pretend to prove every view's payload-field validation order; that still needs runtime tests and review. |

## Runtime and artifact safeguards to retain

| Item | Check and current coverage |
| --- | --- |
| D13. Canonical rendering | **Runtime gate:** preflight, resource readiness, and sample failure collection prevent diagnostic cards from becoming artifacts. Failures roll back staged output and produce a nonzero exit after collecting sibling failures. Preserve regressions for both modes. This tests generated samples, not every possible configuration. See IMPL-V2, IMPL-V3, IMPL-V7. |
| D14. Identity and provenance | **Runtime plus regressions:** sample seeds/attempts, data-only content fingerprints, data-plus-view-config task fingerprints, deterministic replay, and task-identical target associations remain distinct. Retain tests for config-only changes, duplicate tasks, and train/validation separation. See [sample identity](../../DOCS.md#sample-identity--determinism). |
| D15. Dataset and release integrity | **Gates:** split audit, graph freshness, exact passing VQA-cache coverage, image digests, public metadata, and exact target-to-asset evidence. Retain their full release integration. Offline cache validation proves that the expected judgment exists; it does not independently prove its semantic correctness. See [final verification](../../DOCS.md#step-8-final-verification). |
| D16. Documentation wiring | **Partial gate:** `check:docs` validates local links, anchors, rule IDs, and reference structure for top-level references, root consumers, and skills. Its collector does not scan nested plans. Extend document discovery with distinct rule-reference and plan roles, so plans are checked without requiring an Audit section. Remote Markdown failures remain advisory. See [documentation validation](../../DOCS.md#srcscriptsvalidate-docsts). |

## Execution and complexity

Reuse the catalog, parsed type graph, compatible-pair index, and dependency planner. Centralize
rule predicates and diagnostic results, not a second matching or invalidation implementation.
Ownership checks reuse referenced ancestry and module indexes across compatible-pair edges instead
of comparing every pair of labels. Applicability groups the existing pair index once and checks
requirements against its existing capability sets; contradiction checks look up required-label
ancestry in a rejection set. Both expose work counters and growth tests under the
[performance contract](improve_performance.md#performance-contract).

Full checks must be linear in source/graph input plus necessary results. Shared indexes should
avoid repeated file reads, all-module Cartesian scans, all-pairs ancestry tables, and repeated
closure walks per occurrence. Emit compact conflict witnesses instead of every redundant path.
Retain the existing work counters and performance regressions when changing these paths.

Development checks already reuse delta matching for affected standards; declaration eligibility
performs a full linear scan of each selected catalog/spec. There is no separate validation-result
cache. `external-semantics.ts` includes each descriptor's constituent-child summary in its identity:
adding an unused child with `partOf X` invalidates X's users. Regression tests cover this incoming
dependency, reparenting, and unrelated changes. Reuse that mechanism in new checks.

**Decision, 2026-09-23:** no additional ontology complexity-testing or incremental-validation
project is required. Practical usage has demonstrated sufficient performance. This plan does not
schedule finer declaration caching or a new benchmark suite; keep existing dataset performance
contracts and delta behavior while adding the remaining checks.

When an external delta cannot be established, retain the known pinned input and report the update
as unassessed during development. An explicitly adopted new version must be checked authoritatively;
never certify it using stale eligibility. Release checks remain complete and offline with respect
to the installed ontology. See the performance contract for rebuild and reset boundaries.

## Implementation sequence

All batches below are approved in principle. Use a separate tested commit for each numbered check
or migrated payload module. A shared source-analysis helper may have its own preparatory commit.
Do not mix code or documentation commits with generated VQA-cache changes.

### 1. Close gate scheduling and integration coverage — complete

- [x] **D3 scheduling:** inspect output-contract changes in existing generator implementations
  using the existing type/source machinery. A change from one declared `ProblemGenerator<T>` output
  to another must schedule module compatibility checks and active CCSS/test coverage. Preserve the
  cheap route for proven implementation-only edits; use the full standards gate when classification
  is uncertain. Current `development-plan.ts` deliberately schedules no standards checks for any
  existing generator implementation edit, and its test currently asserts that behavior.
- [x] **D3 command regressions:** exercise dedicated/full/affected entry-point wiring with an
  unmatched active target, the same labels in an implementation TODO, and a changed payload type.
  Reuse `validateStandardContracts`; ontology TODOs and beyond-scope entries remain outside matching.
- [x] **D10 pipeline regression:** inject a missing resolved claim and verify failure before
  rendering, propagation through question retry and solution fallback, and the duplicate-target
  association path. Use a small fixture through the existing generation orchestration. No live VQA
  or full image generation is needed to test rejection of invalid labels.

Acceptance: the existing positive standards fixtures still pass; invalid active targets and draws
fail through the relevant public paths with SPEC-1/SPEC-3/TSPEC diagnostics. These are additions to
existing enforcement, not a reimplementation of D1–D5 or D10.

### 2. Complete deduction and resolver source checks — complete

- [x] **D9:** extend `spec-source-contracts.ts` with a reusable TypeScript source/symbol index.
  Follow named and namespace imports, public package subpaths, simple aliases/re-exports, and
  constant initializers to their real origin. Connect shared constants to their consuming spec
  field. Check both deduction helpers against schemas, invariants, requirements, and rejections
  under SPEC-10/SPEC-V4. Avoid an arbitrary JavaScript execution or theorem-proving engine.
- [x] **D8 source form:** on the same source index, check the mechanical portion of SPEC-6:
  resolver references and valid factory results are distinguished from inline implementations or
  prematurely executed resolvers. Reuse the existing runtime marker and fallback checks. A marker
  cannot certify the mathematical meaning of custom resolver code.
- [x] Wire deterministic findings into `validateSpecs`, the architecture audit, and affected
  routing. Shared-helper changes reach their owning modules through the existing import graph.

Acceptance fixtures must include the reproduced failures: a renamed import from
`edugraph-ts/generated`, an intermediate constant feeding `generalLabels`, and `deductCompatible`
feeding `rejectedLabels`. A local object's unrelated `deductCompatible` method must pass. Keep
valid schema expansion, rejection expansion, curried factories, and imported resolvers passing.
Unresolved dynamic source patterns receive a review diagnostic, not a guessed hard failure.

### 3. Enforce implementation boundaries and module structure — complete

- [x] **D11:** reuse the source index to detect raw target/problem-label reads through aliases,
  destructuring, bracket access, and reachable implementation helpers. Detect spec-dependent task
  decisions in shared rendering code and generator-authored output labels. Exclude the legitimate
  schema/framework boundary; resolved enum-valued configuration, type-only imports, and generator
  schema registration remain valid. Do not reject all ontology imports.
- [x] **D12 inventory:** explicitly validate required files and exports, view ID/type mapping,
  and checklist presence/heading-free form for every discovered leaf. Missing schemas must not
  silently become empty schemas. Use the catalog/type graph and report orphan or unrecognized
  mappings; current production mappings and file inventory are complete.
- [x] **D12 implementation checks:** detect known unseeded entropy and provable missing validation
  at module entry. Recognize shared validation helpers. A function name or import alone cannot
  prove that validation runs first; uncertain control-flow cases stay advisory. Seeded instance
  randomness remains allowed in generators and views.

Acceptance: invalid fixtures fail without requiring an active target; valid shared renderers and
mathematical helpers pass. Each diagnostic names its rule, file, location, and module owner.
Existing payload-name and Ability-parameter warning signals remain semantic review hints.

### Review after batches 1–3 (2026-09-23)

The checks remain separated by the contract they prove. `standards-validation.ts` still owns
inverse target coverage; `development-plan.ts` and `check-affected.ts` only schedule it. A
cached TypeScript source-symbol index supports D8/D9 and memoizes shared-constant deduction
traces across fields. D11's syntax scanner and D12's module inventory are independent library
checks called by the existing spec gate. The
architecture audit reuses the same source findings rather than maintaining a second regex
implementation. `generation-orchestration.ts` makes D10's existing runtime guard testable
without browser startup. No new matcher or ontology traversal was introduced.

The full gate scans discovered source files and necessary module-to-helper ownership edges.
The affected implementation command scans changed implementation files; direct entry edits
load only their modules, while shared-helper edits resolve their owners through the source
graph. Unknown output types deliberately schedule the full standards gate. Static source
tracing is bounded: dynamic calls are review signals, not claims of mathematical proof.
Validation ordering in indirect view components remains a semantic/runtime review boundary.

Local green-path timing on Windows, warm workspace, `npm run check -- --spec=ccss,test`:

| Phase | Final run (seconds) |
| --- | ---: |
| TypeScript | 3.61 |
| Generator/view spec, inventory and implementation gate | 5.83 |
| Label usage | 2.34 |
| Documentation | 2.04 |
| Active standards | 1.27 |
| Generated split integrity | 4.85 |
| Parent startup/coordination | 2.68 |
| **Total** | **22.62** |

Three preceding warm runs totaled 22.36, 23.76 and 23.37 seconds (median 23.37).
The one pre-change baseline was 25.28 seconds; a single baseline cannot prove a speedup,
but the added checks did not create an end-to-end regression in this environment. The
spec-audit phase is now the largest static phase; the independent split-integrity phase is
next. A scoped single-generator implementation check took 2.79 seconds including command
startup. These are wall-clock observations, not asymptotic proofs or release benchmarks.

### 4. Complete payload-family compatibility

- [x] **D7 contract adoption:** follow the [payload-family plan](payload-family-matching.md).
  Start with `arithmetic-patterns`, whose six concrete union/member pairs use the exception;
  then review `shape-build-shape` and `fraction-equivalence`, whose broad accepted types can
  conceal partial implementations. Prefer precise mathematical generator outputs and reusable
  rendering components. Keep each module migration in its own tested commit.
- [x] Reject missing/unrecognized production type mappings and remove the presence-only
  `requiredLabels` union-member exception once its consumers have been adopted. Correct both
  `type-parser.ts` and the direct/indexed matching paths. A view accepting a union must support
  every member the generator can emit.
- [ ] Define positive micro-filters using `measurement-line-plot` as the concrete case. Settle
  what is guaranteed over all resolved outputs, including broad targets and fallbacks. Target
  participation alone does not prove payload safety. Do not add pair-conditional capabilities or
  configuration-dependent output routing to retain an overly broad generator.
- [x] Adopt the type-compatibility behavior in SPEC-V3/V6/V7 and IMPL-V9, including their existing advice
  about guarding union members with requirements. Update skill references when their workflow
  changes. The current rules remain in force until their replacement is implemented.

The three producer-family migrations and strict type matching are implemented. All 681 active
CCSS targets remain covered; the complete comparison has 15 added and 14 removed tuples, consisting
of registration moves and one newly supported hexagon drawing. The positive micro-filter policy
remains a separate review decision, with concrete whole/fractional/fallback evidence in the
[payload-family plan](payload-family-matching.md#positive-micro-filter-decision).

Verification completed on 2026-09-24: all 47 new Gemini evaluations pass, strict offline audit
confirms exact passing coverage for all 1,944 CCSS images, and split integrity is clean. Churn is
confined to the intended classification-caption correction and family/view registration changes.
The [verification checkpoint](payload-family-matching.md#verification-checkpoint--completed-2026-09-24)
records the complete evidence; no new upload or cache work remains for these migrations.

Acceptance: direct, indexed, and delta matching agree; no active target is silently lost; a new
incompatible union member cannot reach a narrower view. Rebuild the generation graph after matching
machinery changes, regenerate the affected canonical content, inspect question/solution evidence,
and complete the relevant VQA and cache checks. Review any identity/seed churn from generator splits.

### 5. Complete documentation discovery and close the plan

- [ ] **D16:** discover nested Markdown plans and skill reference documents. Give references and
  plans distinct roles in `docs-validator.ts`; validate plan links/anchors/rule citations without
  requiring a normative Audit section. Keep remote document fetch failures advisory. Include a
  fixture proving a broken nested-plan link fails through `check:docs`.
- [ ] Update each affected rule's verification guidance and `DOCS.md` command coverage after its
  check exists. Skills should reference the authoritative rules and applicable commands rather
  than copy policy. Keep conceptual rules that require review explicitly identified as such.
- [ ] Run the complete local/CI gate once all batches are implemented, including existing
  D13–D15 safeguards. For source-check-only changes, do not regenerate or revalidate images merely
  because a new lint gate exists. Preserve semantic equivalences pending their separate review.

D16 is independent and may be implemented earlier. Ontology publication and editor adoption do not
block any batch. A v0.27.0 dependency update can be a separate maintenance commit, with its normal
semantic-delta verification; it does not replace these dataset checks.

## Separate ontology consolidation

The following remain open in ontology remote `main` at `bd68e4e` (v0.27.0). Keep their semantic
changes separate from the deterministic dataset checks above; their authoritative plan is
[ontology consolidation](https://github.com/christian-bick/edugraph-ontology/blob/main/docs/plan/ontology-consolidation.md).

1. **Measurement definitions:** review `MetricDistanceScale` and its unit children, propose the
   shared family wording, and verify that concrete unit definitions remain distinct. Publish the
   definition correction, then adopt it through the dataset's existing ontology/VQA delta path.
2. **Numeric boundaries:** inventory lower/upper-bound families and tabulate exact endpoints and
   contradiction pairs. Decide which quantities the bounds describe and whether endpoints are
   inclusive; then align definitions, relations, shared deduction behavior, and consumer range
   resolution. Test boundary cases before publishing or changing dataset configurations.
3. **Progression:** audit authored assertions first, then specify source/destination propagation
   separately using justified examples and counterexamples. Existing cycle checks stay in place.
   Do not infer capability substitution through `partOf` or introduce progression inference merely
   because a traversal helper exists.

No dedicated ontology performance or incremental-validation work is scheduled.

## Review and experiments, not deterministic gates

Whether an Area or Scope is correctly chosen, a payload is mathematically neutral, a view preserves
every witness, or a fallback's labels are actually true requires semantic review and mathematical
tests or VQA. Names such as `question` and Ability schema parameters can prompt review, but cannot
prove a violation. Precalculated mathematical results and resolved ontology enums remain valid.

The [synthetic regression experiment](payload-family-matching.md#optional-synthetic-regression-experiment)
may probe declared choices beyond active targets. It is optional, bounded, and not proof of universal
render totality or a replacement for standards coverage and VQA. Keep content judgment separate
from deterministic validation of its inputs, cache, and coverage.

## Deferred review: intra-standard equivalences

**Decision, 2026-09-11:** retain `equivalentTargets`, its four populated CCSS declarations, and
the current validation behavior unchanged. Do not remove or reinterpret them while implementing
D2. Cross-standard equivalence remains a separate possible future concern.

The quick review compared the declared target pairs, their normalized label sets, matching
generator/view paths, relevant view checklists, and official CCSS wording. All four pairs have
identical label permutations and matching paths; none is a stale declaration. This verifies
implementation identity, not equivalence of the complete source standards.

| Declaration | Finding |
| --- | --- |
| `1.OA.C.6-subtraction-make-ten` / `2.OA.B.2-subtraction-make-ten` in [Grade 1](../../src/spec/ccss/grade-01.ts) | Strong shared-strategy justification: both select make-ten subtraction within 20 with `ProcedureUnderstanding` (one permutation each). Grade 2 explicitly refers back to Grade 1's strategy list, but their fluency expectations differ. See [Grade 2 OA](https://www.thecorestandards.org/Math/Content/2/OA/). |
| `1.OA.B.4-unknown-addend-strategy` / `1.OA.C.6-subtraction-think-addition` in [Grade 1](../../src/spec/ccss/grade-01.ts) | Defensible shared competency: both select `SubtractionThinkAddition` with `ProcedureUnderstanding` (one permutation each). Understanding the unknown-addend relationship and applying it overlap, but should not be assumed interchangeable beyond this selected task. See [Grade 1 OA](https://www.thecorestandards.org/Math/Content/1/OA/). |
| `2.NBT.B.7-concrete-regrouping` / `3.NBT.A.2-place-value-partitioning` in [Grade 2](../../src/spec/ccss/grade-02.ts) | Defensible shared representation: concrete place-value regrouping within 1000, for addition and subtraction (two permutations each). Grade 2 requires models/drawings and connecting strategies to writing; Grade 3 allows a broader range of strategies and algorithms. The shared model is not the complete requirement of either standard. See [Grade 2 NBT](https://www.thecorestandards.org/Math/Content/2/NBT/) and [Grade 3 NBT](https://www.thecorestandards.org/Math/Content/3/NBT/). |
| `2.NBT.B.7-written-add-subtract` / `3.NBT.A.2-add-subtract-within-1000` in [Grade 3](../../src/spec/ccss/grade-03.ts) | Weakest justification: both select generic addition/subtraction within 1000 with `ProcedureExecution` (two permutations each). Ordinary matched views show an equation with a missing result; that alone does not establish Grade 2's model-to-written connection or Grade 3's strategy/algorithm expectations. Other targets address these distinctions. See the same Grade 2/3 NBT sources. |

The wording of
[TSPEC-8](../target-spec.md#tspec-8--definitions-must-be-distinct-exact-semantic-identities-must-be-declared)
requires equivalence of complete source leaf competencies and rejects merely identical supported
slices. The declarations instead justify shared selected competencies or manifestations. This
is a semantic-contract question, not something identical hashes or matching pairs can decide.

- [ ] Clarify whether a declaration identifies the same extracted competency occurring in two
  standards or claims equivalence of complete source leaf competencies; reconcile TSPEC-8 and
  the declarations only after that decision. Do not manufacture label differences to avoid a collision.
- [ ] Review the fourth pair's coverage role alongside Grade 2's model-to-written target and
  Grade 3's strategy/algorithm targets. Distinguish legitimate shared computation evidence from
  insufficient evidence for a standard's additional requirements before proposing any target change.

These reviews are deferred and do not block the independent algorithmic checks. No conclusion here
authorizes weakening distinctness validation, deleting targets, or changing generated artifacts.
