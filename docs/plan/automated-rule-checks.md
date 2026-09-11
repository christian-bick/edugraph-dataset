# Automated rule checks — dataset

Implementation inventory after label consolidation. This plan links existing rules; it does not
add new ontology semantics or change matching policy. Status was checked against source at
`8d5c332`, not inferred from old migration reports. No new checks are implemented by this document.

The ontology owns descriptor structure and eligibility. Its
[check inventory](https://github.com/christian-bick/edugraph-ontology/blob/main/docs/plan/automated-rule-checks.md)
covers the source graph and generated clients. This repository validates declarations, resolution,
composition, and dataset artifacts against its complete, pinned ontology package.

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
| D1. Known, eligible labels | Validate every target, `generalLabels`, schema-supported and fallback label, requirement, rejection, and resolved annotation against the complete pinned descriptor set. Reject organizational labels with constituent children; allow leaves and specialization families. See SPEC-3 and ontology ONT-E7. | **Missing eligibility gate; partial identity checks.** Enum typechecking catches named references, but schemas accept strings and `check-labels.ts` is not a complete identifier validator. Add one shared descriptor/eligibility index and cover declarations even when nothing currently matches them. |
| D2. Target structure | Check target IDs, normalized permutations, definition collisions, declared equivalences, valid TODO packages, and production targets containing at least one Area and Ability. Scope remains optional; no primary label or upper limit. See TSPEC-1, TSPEC-5, TSPEC-8, TSPEC-14. | **Partial.** `spec-validator.ts` checks IDs/permutations; stale equivalences are warnings. TODO loaders validate package structure. Cardinality is only in the opt-in `audit:label-architecture --strict`, not the ordinary standards gate. Integrate the deterministic predicates without upgrading semantic equivalence judgments into automatic proof. Preserve the current equivalence mechanism pending the [deferred review](#deferred-review-intra-standard-equivalences). |
| D3. Inverse target coverage | Every normalized active target exported through `spec` has a compatible generator/view tuple. Every generator retains a generatable active `test` path. See TSPEC-1, TSPEC-9, TSPEC-12. | **Partial integration.** `check:standards-spec` checks both; `check-all.ts` calls normalization and the test-path probe but omits `findTargetsWithoutMatch`. The quality-gates action calls `npm run check`, so the commands are not equivalent. Share one implementation across dedicated, full, affected, and CI entry points. Never apply the match requirement to `implementationTodos`, `ontologyTodos`, or `beyondScope`. |
| D4. Positive ownership | Reject generator Abilities, redundant invariant specialization ancestors, schema/general overlap, and overlapping positive ownership across a compatible pair. Keep label mechanics dimension-neutral. See SPEC-2, SPEC-7, SPEC-8, SPEC-11, SPEC-G3, SPEC-V5. | **Partial.** The spec gate covers the main cases; the architecture audit checks all positive cross-role combinations. The spec gate's generator-general/view-schema check is Area-specific. Reuse the dimension-neutral overlap predicate for all declaration combinations rather than maintaining different checks. Alternative schema choices are not an invariant conjunction and must not be rejected merely for containing related alternatives. |
| D5. Applicability consistency | Requirements are target preconditions, supported by each compatible pair, and do not contribute output labels. Rejections veto matches and never contain Abilities. Detect impossible required/rejected combinations. See SPEC-V3, SPEC-V7, SPEC-V8. | **Gate plus gap.** `spec-contracts.ts` checks pair support, missing compatible generators, exact required/rejected collisions, and rejected Abilities. Extend collision detection to specialization: requiring Square while rejecting Rectangle is impossible. Requiring Rectangle while rejecting Square is not automatically impossible. Proving a rejection boundary is complete remains review. |
| D6. Matching semantics | Conjunctive coverage uses equality or `specializes` only, never `partOf`, reverse inheritance, or progression. Direct, indexed, and delta matching agree, including additions and removals. See SPEC-1. | **Runtime plus regressions.** `matching.ts`, `ontology.test.ts`, and `matching.test.ts` cover these behaviors. Retain focused positive/negative fixtures and extend command-parity tests; do not duplicate the production matcher in a second validation engine. |
| D7. Payload compatibility | A generator's possible output types must fit the view's declared input family; missing or unrecognized mappings must not silently admit a pair. See IMPL-8 and SPEC-V6. | **Partial; adoption required.** `matching.ts` accepts unknown types and permits a union producer to feed a member-only view when any `requiredLabels` exist. That is not proof of the output discriminant. Inventory these cases now; tighten the gate only with the consumer adoption in the [payload-family plan](payload-family-matching.md). Positive micro-filter semantics remain a separate design decision. |

The D3 input is the normalized, deduplicated active `spec` export, not every declaration loaded
from a standards file. TODO packages can have their own structural validation without being
required to match. Proposed entity names in `ontologyTodos` are not references to existing labels
for D1. Require regression fixtures where an unmatched active target fails, the same unmatched
competency in `implementationTodos` does not, and ontology TODOs and beyond-scope entries do not
enter the match-coverage set. An isolated `test` module still checks its active targets.

## Resolution and implementation boundaries

| Item | Algorithmic check | Current coverage and remaining work |
| --- | --- | --- |
| D8. Resolver contracts | Non-empty label support; explicit exact/predicate/aggregate/compositional semantics; declared fallback sets contain only supported labels and resolve; function-only choices are `ontologyNeutral`. Verify deterministic resolution and complete recorded fallback labels. See SPEC-6. | **Gate plus regressions.** `utils.ts`, `resolvers.ts`, and the spec gate cover contract markers and fallback execution. A marker does not prove arbitrary custom code obeys its meaning. Keep focused resolver contract tests, including competing exact choices, conjunctions, absence defaults, and reorderings; do not enumerate a label power set. |
| D9. Correct deduction placement | Capability expansion belongs in schemas; rejection expansion uses `deductAdmitting`; invariant claims do not come from `deductCompatible`. See SPEC-10 and SPEC-V4. | **Partial.** `spec-source-contracts.ts` detects `deductCompatible` inside `generalLabels`. Extend source analysis to the other prohibited placements and imported aliases. Resolve helper ownership rather than banning functions by coincidental spelling. |
| D10. Resolved labels and target coverage | Output labels equal generator/view invariant labels plus their resolved schema labels. Target, required, and rejected labels are not copied into that set. Every actual resolved draw must still satisfy every target claim through specialization. See SPEC-1, SPEC-6, IMPL-G3. | **Partial.** `resolvePairCapabilities` constructs the set and has regressions. The generation path lacks a general post-resolution target-coverage assertion; asset-index validation checks coverage later. Add the early guard before rendering and verify deduplicated target associations too. On failure, report the missing claim; never repair it by copying target labels. |
| D11. Implementation isolation | Generator/view code and their implementation helpers do not inspect raw target/problem label bags, import spec decisions into rendering, or emit generator-authored annotations. See IMPL-G1, IMPL-G3, IMPL-V1, IMPL-V9. | **Partial.** Types restrict `ProblemStub` to data; the optional architecture audit uses text patterns for raw label access and IRIs. Add syntax/symbol-aware checks for aliases, destructuring, and reachable helpers. Exclude schema resolvers and framework configuration boundaries. A resolved enum-valued config is valid; banning every ontology import or enum occurrence would be wrong. |
| D12. Module and validation structure | Check required module files/exports, view type mappings, checklist presence and heading-free form, configuration/payload validation, and known unseeded entropy calls. See IMPL-2, IMPL-4, IMPL-G2, IMPL-V1–V4, IMPL-V6, CHK-V6. | **Partial.** Typechecking, module tests, loaders, and render failures cover parts of this. Add explicit inventory checks and narrowly justified source checks. Recognize validation in shared entry helpers; mere presence of a function name is not proof it executes first. Keep uncertain data-flow findings advisory. Do not ban seeded randomness inside generators or views. |

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
The existing spec gate still has nested label comparisons and per-view generator scans; the
[performance contract](improve_performance.md#performance-contract) is a requirement to verify,
not a claim that every old validation loop already satisfies it.

Full checks must be linear in source/graph input plus necessary results. Shared indexes should
avoid repeated file reads, all-module Cartesian scans, all-pairs ancestry tables, and repeated
closure walks per occurrence. Emit compact conflict witnesses instead of every redundant path.
Record work counters and test growth, including wide and deep structures.

Development checks should use affected declarations, pairs, and annotations. Eligibility has an
important extra dependency: adding an unused child with `partOf X` changes whether X can label
content. An index of only the labels' upward ancestors will miss that change. Track each referenced
descriptor's child-role summary against the complete pinned ontology; additions, removals, and
reparenting must invalidate the old and new parents' users. Unrelated ontology changes should not
invalidate them. Reuse the current graph with explicit new dependencies, not another cache.

When an external delta cannot be established, retain the known pinned input and report the update
as unassessed during development. An explicitly adopted new version must be checked authoritatively;
never certify it using stale eligibility. Release checks remain complete and offline with respect
to the installed ontology. See the performance contract for rebuild and reset boundaries.

## Implementation order and acceptance

- [ ] **First:** implement ontology eligibility facts, D1, D2 cardinality, D3 command parity, and
  D10 post-resolution coverage. These close direct paths to invalid or missing annotations.
- [ ] **Next:** unify D4/D5 ownership and applicability checks, then D8/D9 resolver/source contracts
  and D11/D12 implementation checks. Reuse existing tested predicates; retain their current gates.
- [ ] **Alongside every batch:** add positive and negative fixtures, stable rule-linked diagnostics,
  full-versus-affected equivalence, and linear-work tests. Wire the same mandatory rules into full,
  affected, and CI commands. Do not make optional heuristic signals fail by accident.
- [ ] **With payload adoption:** complete D7 and its direct/indexed matching regressions. Do not
  silently change required/rejected semantics as part of adding a validator.
- [ ] **At completion:** demonstrate failures through public commands, retain D13–D16, and update
  reference documents to state exactly which portions are enforced. Rules with semantic remainder
  must not be labeled wholly automatic.

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
