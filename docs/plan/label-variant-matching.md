# Label-variant matching and constrained generation

Status: implementation started on `feat/label-variant-matching`. The choice contracts and metadata planner are implemented as independently tested foundations; production matching, persistence, and generation have not switched to them yet. Agreed design recorded on 2026-09-24 against `7be53701b7d7d2e1128d42f323fc4074c1a09bb9`.

## Implementation checkpoint

- Baseline: 105 generators, 188 views, 211 type-compatible pairs; 830 CCSS tuples cover all 681 normalized targets, and 692 test tuples cover all 559 targets.
- Every catalog schema now declares inspectable choices. Factory metadata covers exact alternatives, predicates, aggregates, conjunctions, and empty defaults. Eleven custom resolvers declare their alternatives, defaults, and contextual label reads explicitly.
- `normalizeSchemaChoices` never calls value resolvers. `resolveSchemaChoices` binds accepted labels per field and permits only declared semantic reads of other local selections or the original target. Context is never completed with a view's selections inside a generator.
- The compatibility query facade separates original target, generator, and view scopes. Named dependencies restrict queries; independent domains remain factored and correlated domains retain complete accepted assignments. Plans and selection receipts have versioned canonical identities and validation helpers.
- Catalogs record matching source identities from each spec's local import closure, including imported helpers. These identities are available for the pending graph integration; they are not yet used to authorize persisted plan reuse.
- Measurement integration tests exercise constrained schema resolution and real generator calls over 64 seeds per supported case. Production measurement specs retain their existing behavior until the authoritative matching-to-generation handover is installed.
- All existing CCSS/test tuples normalize without an empty domain. This is a domain check, not proof that every generator dependency has been migrated.

The next milestone must carry mandatory plans through fresh and reused matching, generation, rendering, and replay before enabling production predicates. The generator guard inventory includes statistical graphs, fraction arithmetic/comparison, operation properties, place-value profiles, shape configurations, counting, currency, and time. Numeric sampling failures and defensive type/range assertions remain implementation concerns.

## Objective and agreed decisions

Match a target to a generator/view pair only when at least one jointly valid selection of schema labels exists. Carry the permitted selections into generation, which may randomize within that space. Compatibility remains based on declared types, mappings, and labels, without generating or inspecting payloads.

- Keep strict, complete payload-family compatibility and one-directional capability coverage as the first matching stage.
- Add optional, pure compatibility predicates to specs. Generator rules describe their own configuration dependencies; view rules describe compatibility using shared semantic labels.
- Expose original target labels and the selected generator/view labels to view predicates. Do not expose another module's parameter names, implementation, concrete configuration values, or identifier as a dispatch mechanism.
- Keep parameter-to-label bindings private to the planner/resolver. Preserve correlations between choices rather than replacing a joint relation with independent allowed-value lists.
- Never weaken an explicit target request. A broad or unspecified request may be completed by selecting compatible declared alternatives.
- Keep original target requests separate from selected capabilities. A fallback must not satisfy a policy requiring the target to request something explicitly.
- **Confirmed sampling decision:** retain today's sample count and train/validation allocation per target/generator/view tuple. Select an admissible variant for each draw; do not automatically create a sample for every variant.
- Use one compatibility evaluator. Migrate `requiredLabels` and `rejectedLabels` through equivalent target predicates, then remove the old fields after all consumers and validators have adopted the new contract.

No further product decision is blocking this plan. API names and serialized representations below are implementation proposals, not existing APIs.

## Starting point and concrete regressions

The producer/view migration has 105 generators, 188 views, and 211 type-compatible pairs. Its matching checkpoint contains 830 CCSS tuples and 692 test tuples. Preserve these as comparison baselines, not as immutable counts if a newly enforced dependency exposes another invalid route. Every difference needs a named cause and target-coverage review.

Relevant existing behavior:

| Location | Current behavior | Required adoption |
|---|---|---|
| [matching.ts](../../src/lib/matching.ts) | Returns target/generator/view tuples; checks target requirements and exclusions | Return an authoritative admissible-label plan for each admitted tuple |
| [model-catalog.ts](../../src/lib/model-catalog.ts) | Loads specs and schemas without generator or renderer implementations | Load normalized choice declarations and pure rules; retain that separation |
| [schema.ts](../../src/types/schema.ts), [utils.ts](../../src/lib/utils.ts) | Resolver markers, supported labels, fallback bundles, and seeded completion | Describe legal label selections and support resolution constrained by a plan |
| [generation.ts](../../src/lib/generation.ts), [generation-orchestration.ts](../../src/lib/generation-orchestration.ts) | Generate from target labels and seed; resolve view capabilities separately | Select and retain compatible generator/view choices together |
| [withConfig.tsx](../../src/visuals/views/withConfig.tsx) | Browser independently resolves view configuration from original target labels | Consume the same accepted view selection and resolution receipt as the orchestrator |
| [dependency-planner.ts](../../src/lib/dependency-planner.ts), [dataset-manifest.ts](../../src/lib/dataset-manifest.ts) | Persist successful pair references; reused match nodes only establish `matched: true` | Persist plans and include their inputs and content in incremental reuse |
| [test-sample.ts](../../src/scripts/test-sample.ts), [test-target.ts](../../src/scripts/test-target.ts) | Reproduce samples through the existing target/seed path | Use the same plan-aware resolution and replay path as production |

The first adoption is `measurement-data` with `measurement-line-plot`. Current configuration completion can choose integer or fractional measurements when number kind is omitted. A 64-seed diagnostic produced 31 integer and 33 fractional choices. With `SingleFrameOfReference`, the integer choices hit the generator's existing guard; with unit-step plotting, fractional choices produce subdivisions incompatible with that view. Current CCSS matches for the line-plot pair explicitly specify number kind; those probes are supplemental regression targets.

## Public compatibility contract

A candidate contains three separate semantic sets:

```ts
type CandidateLabels = Readonly<{
    targetLabels: readonly string[];     // Original request
    generatorLabels: readonly string[];  // Invariants + this candidate's selections
    viewLabels: readonly string[];       // Invariants + this candidate's selections
}>;
```

The generator's rule context contains its own candidate labels and, only when needed, original target constraints consistent with generator ownership. It does not receive view labels or select learner actions. View rules can inspect all three sets. Empty local selections contribute no capability; they are not an assertion of an opposite label.

Use named rules containing a stable rule ID, a boolean predicate, an optional dependency declaration, and a diagnostic description. This supports a single authored lambda or several small conjunctive rules without opaque rejection messages. No rule means no additional constraint; `false` rejects a candidate. A thrown exception, invalid return value, or malformed declaration is a contract error, not an ordinary unsupported candidate.

Rules must be deterministic and side-effect free: no PRNG, clock, I/O, payload access, generator invocation, or mutable global state. Keep boolean results separate from structured planner diagnostics.

For example, after generator-local validity is enforced, the view rule is conceptually:

```ts
!has(viewLabels, Scope.StepsOf1)
    || has(generatorLabels, Scope.IntegerNumbers)
```

Here `has` means equality or `specializes` through the existing ontology helper. Do not silently replace that relation with `partOf` or `implies`. Other ontology operations must be explicit and included in semantic dependency tracking. This is a rule of this accepted measurement family, not a global ontology assertion that every sequence with step size one consists of integers.

Target helpers reproduce the old checks exactly: every required label has an equal/more-specific label in the original target; no rejected boundary has an equal/more-specific target label. Preserve ownership rules, including the existing distinction between requesting an Ability and excluding Abilities. Predicate inputs are restrictions, not newly provided capabilities.

## Choice declarations and normalization

Introduce a normalized label-choice representation alongside existing value resolvers. Do not infer legal alternatives by generating samples, guessing arbitrary function behavior, or executing random resolution repeatedly. Extend known resolver factories with explicit declaration metadata; custom cases must declare their label-selection behavior.

| Schema form | Normalization policy |
|---|---|
| Direct label alternatives | Named singleton alternatives, constrained by the target and existing specialization rules |
| Exact resolver | Its declared singleton/bundle alternatives, including explicit empty defaults where truthful |
| Predicate resolver | Explicit enabled/disabled selection behavior; preserve target-driven absence semantics rather than assuming both states are freely selectable |
| Aggregate resolver | Preserve the jointly selected label set; do not treat its members as competing singleton alternatives |
| Compositional resolver | Preserve the target's conjunction and declared completion rules; range bounds remain symbolic label constraints, not enumerated numeric values |
| Ontology-neutral resolver | Outside label compatibility; its variation must not invalidate a registered variant |

Supported labels, fallback bundles, legal selections, and preference rules are related but not interchangeable. In particular, today's third tuple element declares fallback bundles; it is not automatically a complete enumeration of every valid explicit conjunction. Inventory custom resolvers before deciding which adapters can be automatic. Preserve declared absence defaults and current specificity preferences among feasible completions; do not silently turn every absence into random completion.

Represent each alternative with a stable content identity and its emitted label bundle. Parameter bindings remain module-local. A completed selection must resolve to a concrete configuration and the same declared labels, or fail as a schema contract defect. Audit resolvers that inspect context outside their own field, such as measurement unit defaults, and make those reads explicit so selection and value resolution agree.

The target is immutable. Pass field-bound selections to resolution; do not implement the handover by appending every selected generator and view label to the original target array. That would change explicit-request semantics, leak choices across owners, and reopen completion behavior.

## Planning and generation handover

The shared matching operation should perform these steps:

1. Use the existing payload-family and positive-capability index to find candidate pairs.
2. Build target-consistent label-choice domains from the generator and view schemas.
3. Apply generator-local validity, view-local rules, and pair compatibility predicates.
4. Require the selected positive capabilities to jointly cover every target claim. Coverage of the broad supported-label union is only a preliminary candidate test.
5. If no assignment remains, return unsupported with its rule/domain reason. Otherwise return a canonical, serializable generation plan.

The plan contains the target/pair identity, contract version, source/ontology input identity, label-choice bindings, retained joint constraints, and a content hash. It contains no functions or generated data. Store independent choices separately from correlated groups. An initial implementation may use accepted tables for small connected groups; it must not flatten every field into one global Cartesian product or lose correlations through independent projections.

For each existing sample slot and retry attempt:

1. Select an admissible joint assignment deterministically from the recorded plan.
2. Resolve generator and view configurations under those selections and verify their resolved-label contract.
3. Generate mathematical data from the resolved generator configuration.
4. Record the selection receipt, effective seeds, selected variant identity, and plan identity.
5. Render using the accepted view configuration. Rendering must not select a different fallback.

Prefer resolving both concrete configurations in the orchestrator and delivering the prepared view configuration to `withConfig`. Keep the schema/receipt checks at that wrapper boundary. Preserve the PRNG continuation needed by seeded presentation logic; merely replacing browser resolution with `setSeed` would otherwise change its subsequent draws. Adopt a deterministic receipt/substream design and test it explicitly. Do not add a parallel unconstrained browser fallback for missing new-plan data.

Keep ordinary mathematical sampling, deduplication, and bounded retries. Retries may choose another admitted assignment, but must never escape the plan. An unsupported configuration must not be discovered by calling `generate` and interpreting `null` or an exception as a compatibility test.

Question and solution currently make separate draws; preserve that behavior. If solution generation reuses the question's result, also reuse its selection, view configuration, and effective random-state provenance. A recorded solution must replay the draw it actually used, even when the originating key was the question key.

## Identity, persistence, and incremental behavior

With the confirmed sampling policy, retain the six-part structural sample key and current tuple-based split allocation. A chosen variant is provenance within that sample slot, rather than an additional automatically sampled slot.

- Add `generation_plan_hash`, a selected variant/choice receipt, and replay information to operational metadata. Include resolved view configuration in existing task identity; keep public merged metadata focused on the current public fields.
- Derive variant identities from canonical selected-label/binding content, not enumeration order, timestamps, or callback text. Distinguish plan content identity from the source-input identity used to decide whether to recompute it.
- Persist plans, not just target-to-pair references, in the dependency graph/matching index. Incremental reuse must reconstruct the complete plan-bearing tuple. Missing or unsupported plan versions require authoritative rebuilding; never manufacture an unconstrained plan from an old `matched: true` record.
- Hash rule declarations, callback source and imported dependencies, schema selection/default contracts, and the ontology entities/relations actually used. `Function.toString()` alone is insufficient for closures and imported helpers.
- Update module capability hashes, match-node hashes, generation-pair entry hashes, source fast paths, audit readers, and plan serialization together. A callback-only edit must invalidate affected matches, including discovery of newly admitted targets; renderer-only edits should not require reevaluating compatibility.
- Integrate with the existing graph and atomic immutable-store publication. Define explicit matching-policy, graph, manifest, and pipeline migrations as needed; do not create a second cache-invalidation system.
- `test:sample`, target debugging, VQA reproduction, and cache diagnostics must resolve/validate the recorded plan version. Stale metadata must explain the mismatch rather than replay a different configuration silently.
- Deduplication retains target associations and their plan/selection provenance. A task-identical artifact may represent another target only when its actual capabilities satisfy that target's plan. Do not merge mutually incompatible selected labels into a fictitious jointly realized variant.

Preserve existing draw behavior for unconstrained routes where possible. Any intentional change to seeded output must be documented in the churn comparison; unchanged logical sample keys alone do not prove pixel identity. Full and scoped runs must select the same variant for the same slot, plan, and attempt.

## Dependency-scoped evaluation and performance

Correctness comes first: absent a dependency declaration, evaluate against the complete relevant candidate label sets. The optimization must never change the result.

For optimized rules, declare dependencies by semantic scope and label, not by a foreign parameter name. The planner maps these to contributing schema fields, including descendants relevant to ontology queries. Generator-local constraints and resolver-context dependencies extend the connected group transitively.

Use a restricted ontology-query facade for optimized callbacks so undeclared queries can be rejected. Returning an unrestricted raw array would allow arbitrary inspection that bypasses the declared read set. The semantic inputs remain the three label scopes. Full-scope rules can use a conservative path; broad production dependencies must be reviewed before enabling optimization.

Evaluate each distinct dependency projection once and reuse the result for equivalent assignments. Retain independent fields symbolically. Preserve selection priorities and the intended distribution over admissible assignments; choosing compressed groups uniformly can bias generation when groups represent different numbers of completions.

Arbitrary predicates over many choices can require combinatorial work. Do not claim that dependency declarations alone guarantee linear scaling. Follow [the performance contract](improve_performance.md): measure work counters for choice normalization, dependency groups, predicate evaluations, plan size, and cache reuse. Establish a bounded supported rule/domain profile from the production inventory. A scope exceeding that profile must receive an explicit design/validation diagnostic, never truncation, random probing, or an unconstrained match. Escalate a requirement for large unrestricted predicates as a new decision rather than silently relaxing the performance contract.

## Implementation sequence and completion gates

### 1. Inventory, baselines, and contract types

Files: `src/types/schema.ts`, `src/types/generator-spec.ts`, `src/types/view-spec.ts`, `src/lib/model-catalog.ts`; new focused compatibility/plan type modules if useful.

- Inventory all schema forms, custom/default resolvers, current required/rejected declarations, and runtime guards that reveal label-expressible configuration dependencies.
- Capture CCSS/test matching, seeded representative draws, existing coverage, and work-counter baselines.
- Define pure named rules, label scopes, legal-choice declarations, serializable plans, and receipts. Type generator/view contexts to preserve ownership.
- Add declaration validation and malformed-domain diagnostics before wiring the planner into production.

Gate: the full catalog can be described without importing generator or renderer implementations; every opaque or unsupported choice has an explicit disposition, not an invented alternative.

### 2. Normalize domains and build a reference planner

Files: `src/lib/resolvers.ts`, `src/lib/utils.ts`, `src/lib/ontology.ts`; new `src/lib/schema-choices.ts` and `src/lib/compatibility.ts` with adjacent tests (provisional names).

- Implement deterministic choice normalization and target-preserving completion.
- Implement generator/view rule evaluation and a simple exhaustive reference evaluator for small finite test fixtures.
- Build canonical plans retaining valid joint assignments and selected-label coverage.
- Keep normalization, predicate evaluation, sampling, and value resolution as separately testable functions.

Gate: exact, predicate, aggregate, compositional, and empty/default cases are covered; reordering declarations does not change plan meaning; planning consumes no randomness.

### 3. Integrate all matching paths and persisted plans

Files: `src/lib/matching.ts`, `src/lib/model-catalog.ts`, `src/lib/dependency-planner.ts`, `src/lib/dataset-manifest.ts`, `src/lib/external-semantics.ts`, `src/lib/label-architecture-audit.ts`, `src/lib/matching-diff.ts`.

- Route direct, indexed, diagnostic, unmatched-target, and delta matching through the same planner.
- Add rule/domain rejection reasons and plan-aware matching reports.
- Persist and invalidate plans using their complete source and ontology dependencies.
- Use temporary adapters for required/rejected fields so this stage preserves existing target-policy behavior.

Gate: full/indexed/delta/reloaded-cache paths produce identical plans; callback-only, imported-helper, schema-default, and ontology-relation edits invalidate the right inputs; negative-to-positive match changes are discovered.

### 4. Enforce plans through generation, rendering, and replay

Files: `src/lib/generation.ts`, `src/lib/generation-orchestration.ts`, `src/types/ml-engine.ts`, `src/visuals/views/withConfig.tsx`, `src/scripts/generate-dataset.ts`, `src/scripts/test-sample.ts`, `src/scripts/test-target.ts`, metadata/merge/asset/VQA readers.

- Add constrained resolution and plan sampling while preserving the confirmed sample-count policy.
- Pass prepared view configuration and deterministic replay information across the browser boundary.
- Carry receipts through retries, solution fallback, deduplication, and associated-target handling.
- Version persistent formats and define the migration/rebuild path before enabling production use.

Gate: no production or debugging route can bypass its plan; full and scoped generation agree; exact recorded draws replay in both modes; split protection and target associations remain valid.

### 5. Adopt measurement as the first complete vertical slice

Files: `src/generators/statistics/measurement-data/spec.ts`, `src/visuals/views/data/measurement-line-plot/spec.ts`, their schema/generator tests, and shared matching/generation integration tests.

- Declare the generator rule `SingleFrameOfReference => FractionNumbers`.
- Declare the line-plot rule `view StepsOf1 => generator IntegerNumbers` within the existing accepted family.
- Register whole-unit completion for an underspecified unit-step target; reject explicit fraction/unit-step and single-frame/unit-step contradictions.
- Keep implementation guards as assertions of the declared contract, not as routing logic.
- Inspect every existing consumer of `measurement-data`; a view-specific restriction must not constrain another consumer's valid fractional choices.

Gate: the previously reproduced invalid fallback choices are unreachable across seeds and retries; existing CCSS routes remain covered; canonical test/CCSS generation and scoped visual validation succeed, with unrelated inherited findings tracked separately.

### 6. Migrate policies and remaining dependencies

Files: remaining generator/view `spec.ts` declarations, `src/lib/label-contracts.ts`, spec validation/audit tools, and matching reports.

- Translate every existing required/rejected declaration into shared target-predicate helpers with identical ontology direction and conjunction semantics.
- Add the other label-expressible generator dependencies and view compatibility rules found in the inventory, one reviewed family at a time.
- Update label eligibility, role ownership, ontology usage, and diagnostics for rule declarations and dependencies.
- Remove legacy fields and compatibility adapters only after the complete catalog and all tools have adopted the unified mechanism.

Gate: policy-only migration preserves matching; dependency-related differences are explicitly explained; no production declaration or consumer retains a competing required/rejected evaluation path.

### 7. Add dependency projection and establish performance bounds

Files: compatibility planner/query facade, `src/lib/work-counters.ts`, indexed/delta matching tests, performance fixtures.

- Optimize connected dependency groups and repeated projections against the tested reference evaluator.
- Enforce dependency declarations and the supported scope profile.
- Verify independent alternatives do not multiply predicate work and cached plans avoid reevaluation.

Gate: optimized and reference plans are semantically identical; measured growth satisfies the accepted bounded performance contract; no global Cartesian expansion enters the production path.

### 8. Final verification, documentation, and rollout

- Update `docs/label-architecture.md`, `docs/spec-general.md`, role-specific spec rules, implementation guidance, `DOCS.md`, and workflow references. Retire or revise affected stable rule IDs without renumbering unrelated rules.
- Run `npm run check:types`, `npm run test:coverage`, `npm run test:integration`, `npm run check -- --spec=ccss,test`, and documentation checks.
- Compare complete CCSS/test routes and plans; validate the supported catalog, not only the measurement example.
- Run canonical Docker generation for test and CCSS with the deliberate graph/format migration, then real-standard VQA and `npm run report:churn -- --spec=ccss`.
- Verify a no-op run, an isolated rule edit, an imported-rule-helper edit, an unrelated renderer edit, and an ontology change through the existing affected workflow.
- Preserve the previous published dataset until the new graph and artifacts validate. Record intentional identity/content changes and remaining implementation defects separately.

Gate: each emitted sample records a valid plan/selection, replays deterministically, and remains inside the declared compatible label space. No payload-based eligibility mechanism has been added.

## Required regression matrix

| Case | Expected behavior |
|---|---|
| Unit steps + explicit integers | Admit whole-unit variant |
| Unit steps + omitted number kind | Admit only whole-unit completion |
| Unit steps + explicit fractions | Unsupported; never rewrite the request |
| Single frame + omitted number kind | Admit fractional completion only |
| Single frame + explicit integers | Unsupported before generation |
| Single frame + unit steps | No valid joint assignment |
| No unit-step restriction | Retain valid whole/fractional choices and generator dependencies |
| Required target label absent but selected as fallback | Still fails the original target-participation policy |
| Rejected target descendant | Preserve existing ontology-aware rejection |
| One-sided predicate disabled | Empty field selection; no fabricated opposite capability |
| Two labels selecting the same value | Do not invent a conjunction unless the schema declares it |
| Bounds/aggregate labels | Preserve joint selections and explicit target constraints |
| Unrelated random choices | Remain seeded and independent of compatibility decisions |
| Rule exception or undeclared optimized query | Contract diagnostic; no ordinary unsupported result or permissive fallback |
| Plan serialize/reload, reordered declarations | Same admissible space and stable content identity |
| Retry, solution reuse, task dedup, sample replay | Retain the actual selected assignment and provenance |
| Legacy persisted match lacking a plan | Explicit migration/rebuild, never unconstrained generation |

## Scope and remaining questions

This plan implements label-expressible configuration compatibility and its authoritative handover. It does not prove arbitrary implementation mathematics correct, repair unrelated rendering defects, change the ontology's global relations, or reverse the completed payload-family splits. Tests and implementation review continue to establish that each declared capability is truthful.

The sampling policy is resolved. Other implementation choices have recommended defaults above. Raise a new question only if the inventory reveals a necessary dependency that cannot be expressed with existing eligible labels/shared contracts, or if a required rule exceeds the bounded performance profile. Do not respond to either by adding payload inspection, exposing generator parameter names to views, or silently discarding requested target coverage.
