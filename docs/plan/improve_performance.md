# Improve generation and validation performance

## Goals and complexity model

The generation and validation architecture must satisfy these rules:

1. Every generation and validation task must scale linearly.
2. Every generation and validation task must be processable as a delta of content changes.
3. External changes, including ontology and standards-source changes, must be processed as deltas. During development, an external change must be ignored when a reliable delta cannot be determined.

Rule 1 always applies. Rules 2 and 3 must at least apply during development.

Here, linear means `O(input records + dependency edges + necessary output)`. A diagnostic that deliberately emits every rejected target/module combination can have quadratic output. Such exhaustive reporting must be an explicit diagnostic mode and must not determine the complexity of production generation or validation.

## Current verdict

| Rule | Current status |
| --- | --- |
| Always linear | Failed |
| Content-delta processing | Partially present, but failed system-wide |
| External-delta processing | Failed, except for the VQA definition-level cache key |

The dominant release delay is not image rendering or Gemini validation. A sparse matching problem is repeatedly reconstructed as a dense problem, and identical coverage work is repeated across workflows.

## Release measurements

For source commit `5489ebca38b05225d03996a728f16f577d0f2912`, the same core standards-coverage computation ran three times:

| Execution | Coverage time |
| --- | ---: |
| Main deployment | 35m 44s |
| Release snapshot | 28m 06s |
| Post-release deployment | 35m 58s |
| **Total duplicate coverage work** | **99m 48s** |

For comparison:

- Canonical generation of 1,958 images took 5m 26s.
- The strict VQA audit took 8s.
- Release quality gates took 59s.

The release workflow creates a release coverage snapshot and then triggers the deployment workflow, which creates preview coverage again. The validated main push had already invoked the same deployment workflow for the exact source commit.

## Primary matching defect

The current catalogs contain:

- 653 active targets;
- 79 generators;
- 162 views;
- 180 type-compatible generator/view pairs;
- 806 matched target/generator/view tuples.

Building the compatible-pair index takes approximately 3.15s locally. Matching all 653 targets after a single index construction takes approximately 4.79s.

Standards coverage instead calls `matchTargets([target], generators, views)` separately for every target. Every `matchTargets` invocation reconstructs the compatible generator/view pair index. Every generator/view compatibility check also rereads and reparses `src/types/problems.ts`.

One coverage run therefore performs approximately:

```text
653 targets x 79 generators x 162 views
= 8,357,094 problems.ts reads/parses
```

The predicted duration from repeated index construction is approximately 34 minutes, matching the observed CI duration. Reusing the existing pair index and matching all targets once should reduce the immediate coverage stage to single-digit seconds, before further asymptotic improvements.

## Additional structural failures

### Matching creates a dense rejection matrix

`matchTargets` evaluates every target against every compatible generator/view pair and constructs a rejection object for every failed combination. The measured result is:

- 806 matches;
- 116,734 rejected compatible triples.

Production callers that need only matches or a Boolean answer still pay for all rejection objects. Production matching must use capability indices to find candidates and return only required output. Exhaustive rejection explanations must be opt-in.

### Standards association is superlinear

For every standards leaf, coverage filters all targets. For every target considered during that filter, it linearly searches the full leaf-ID list. With generator probing removed, processing the current 467 leaves still takes approximately 1.04s.

Coverage must build target-to-standard and standard-to-target maps once and reuse them.

### Scoped generation copies the complete dataset

A scoped generation begins by recursively copying the existing dataset into a staging directory and then replacing the selected scope.

The current CCSS dataset contains:

- 2,086 files;
- 58.3 MB.

A one-view change therefore processes the complete dataset filesystem. The manifest already records generator/view hashes, but it detects stale results after generation rather than selecting the affected pairs before execution.

### VQA external calls are delta-aware, but local bookkeeping is not

The Gemini validation key correctly incorporates the image, relevant checklists, claimed labels, and their ontology definitions. An unrelated ontology-definition change does not invalidate a sample. This is the strongest existing example of the desired dependency-aware design.

However, dataset validation repeatedly constructs `VqaCacheManager` instances per sample. Each construction rereads and reparses the complete cache file for that generator module.

Measured amplification:

- physical VQA cache: 3.86 MB and 1,943 entries;
- data reread per complete lookup pass: 304.9 MB;
- cache entries parsed per pass: 151,771;
- validation performs multiple lookup and reporting passes.

The resulting behavior is approximately `O(sum(module sample count squared))`. Validation must load one cache manager per module, cache checklist resolution, read each image only when required, and traverse the dataset once.

### Local explorer snapshots copy every asset

Every local explorer refresh rebuilds the full asset index and coverage, then copies every selected PNG into a new immutable snapshot.

The current preview snapshot store contains:

- 3,664 files;
- 112.9 MB.

Immutable snapshots should remain, but unchanged assets must be reused through content-addressed storage or filesystem links.

### Manifest invalidation is broader than the dependency graph

The dataset manifest's global source hash includes the entire `public` directory. Generated coverage files can therefore invalidate dataset rendering even though they are not renderer dependencies.

Generator/view source files and shared dependencies are also rewalked and reread for each pair rather than using memoized file hashes and an explicit dependency graph.

### External standards inputs are mutable and untracked

The standards mapper downloads `standards.jsonl` and `domain_groups.json` from mutable `raw/main` URLs.

Consequences:

- fresh CI silently consumes the latest external state;
- local development retains whatever files happen to exist;
- neither path records the upstream revision or content digest;
- a release is not reproducible solely from its repository tag.

External standards sources must be pinned by revision and digest. Updating them must be an explicit operation that compares the previous and new snapshots by standard ID. During development, the current pinned snapshot must remain active when old/new provenance or a reliable diff is unavailable.

### Ontology invalidation is global

The manifest records only the complete `edugraph-ts` dependency version. An ontology package update can consequently invalidate every generator/view pair, regardless of which entities changed.

Each generated pair must instead depend on the closure of ontology entities it actually uses: target labels, generator and view capability labels, relevant ancestor relations, and any definitions used by validation. If that closure cannot be compared during development, the external update must not trigger global invalidation.

### Static checks are full-repository operations

The main quality gate runs the full TypeScript check, test suite, generator/view validation, label validation, documentation validation, standards-spec validation, and reports. Existing command-line scopes are manual filters, not an automatic changed-file dependency plan.

Incremental TypeScript state, affected-test selection, cached module catalogs, and explicit validator dependency sets are required for development deltas.

## Implementation plan

### Acceptance gates

The gates define mandatory system properties, not implementation order. A delivery phase may
advance more than one gate, but no workflow is complete while a gate that applies to it remains
open.

#### Gate A: full-work processing is linear

Every complete generation and validation workflow must process
`O(input records + dependency edges + necessary output)`. Catalogs, source files, caches, and
indices are loaded or constructed once per operation. Production matching returns only requested
results; exhaustive rejection explanations are an explicit diagnostic output whose cost is
reported separately.

Known superlinear behavior in an active workflow is a release-blocking defect. This includes
repeated input-sized `find()` calls inside input-sized loops, array `shift()` work queues, repeated
filesystem discovery, and comparison sorting of growing inputs. Deterministic order must be
preserved during indexed construction or produced through a bounded-domain linear strategy.

#### Gate B: development processing is content-delta proportional

A development workflow must process
`O(changed inputs + affected dependency closure + necessary output)`. A one-generator or one-view
change must not read, copy, regenerate, or revalidate the complete dataset. A release may validate
the complete repository, but that complete pass must still satisfy Gate A.

#### Gate C: development processing is external-delta proportional

Standards and ontology updates must have explicit provenance and a reliable record-, entity-, and
relation-level delta. Development schedules only the affected closure. If a reliable delta cannot
be established, the workflow retains the pinned input, ignores the external update, and reports
why it was ignored.

#### Gate D: identical work is reusable and publication is atomic

Artifacts are keyed by every input that can affect them. Identical input keys reuse immutable
results across local workflows, validation, release publication, and deployment. A failed affected
operation leaves the previously published manifest intact.

### Delivery phases

The phases below are dependency ordered. Items within one phase may be implemented independently
when they do not share code, but a later phase must not be used to postpone a gate required by an
earlier active workflow.

#### Phase 1: linearize the current pipelines

1. Add structured work counters for type-graph parses, catalog loads, source and cache bytes read,
   compatibility checks, candidate checks, rejection records, files copied, and emitted records.
2. Add performance regression tests that assert work-counter bounds as target, pair, cache, and
   standards input sizes grow.
3. Parse the problem-type graph once and load generator and view catalogs once.
4. Build the compatible generator/view pair index once.
5. Match all targets once and retain target-to-match and target-to-generator maps.
6. Make standards coverage consume those maps rather than invoking matching per target.
7. Build target-to-standard and standard-to-target maps once.
8. Build inverted indices for problem type and ontology capability labels, then derive candidate
   pairs by set intersection instead of testing every compatible pair.
9. Separate production matching from diagnostic explanation. Matches and existence queries must
   not construct rejection records; explicit diagnostics may request them.
10. Load each VQA module cache once, resolve and hash each checklist once, read each required image
   once, and calculate each active validation key once.
11. Build VQA reports from the in-memory validation state rather than rescanning files and caches.
12. Remove the remaining known input-sized rescans, repeated discovery, `shift()` queues, and
   non-linear ordering operations from active generation and validation paths.

This phase fixes the immediate release bottleneck and the other known Gate A violations. Each
change must preserve existing matching and validation results exactly.

#### Phase 2: establish stable input identity

1. Pin standards sources by immutable upstream revision and content digest.
2. Record the exact standards and ontology provenance consumed by every coverage artifact.
3. Define the complete immutable key for core coverage, including repository source identity and
   all external-input digests.
4. Freeze the current pinned external input during development when a reliable old/new delta is
   unavailable, with an explicit diagnostic instead of global invalidation.
5. Remove generated coverage outputs and other unrelated files from dataset-render invalidation.

This phase establishes the correctness prerequisite for cross-workflow reuse. A cache hit is valid
only when the complete input identity is known.

#### Phase 3: compute and publish core coverage once

1. Publish an immutable core coverage artifact under its complete input key.
2. Reuse that artifact between main validation, release publication, and deployment.
3. Treat `latest` and `preview` metadata as projections over the same core artifact when their
   source inputs are identical.
4. Prevent workflows from recomputing an artifact that already exists for the complete input key.

#### Phase 4: introduce the dependency and delta foundation

Represent generation and validation as a graph containing at least:

- source files and shared renderer dependencies;
- generator modules;
- view modules;
- generator/view pairs;
- competency targets;
- ontology entities and relevant relations;
- external standards records;
- dataset shards, images, VQA records, asset-index records, and coverage records.

The planner must:

1. hash each source input once;
2. identify changed graph nodes;
3. compute the affected dependency closure;
4. schedule only affected work;
5. reuse unchanged content-addressed outputs;
6. atomically publish the new manifest after all affected work succeeds.

The existing per-pair manifest becomes an execution plan rather than only a stale-result detector.
Generator/view source dependencies and shared files are memoized instead of being rediscovered and
reread for every pair.

#### Phase 5: adopt delta execution across development workflows

1. Store generated outputs as immutable generator/view or finer-grained shards.
2. Reuse unchanged shards by content hash and stage only changed shards and manifests.
3. Publish datasets by atomically replacing a manifest pointer rather than copying the complete
   dataset.
4. Apply the same content-addressed reuse, through content storage or filesystem links, to local
   explorer snapshots.
5. Evaluate only VQA cache misses, affected records, or explicitly forced samples.
6. Enable incremental TypeScript compilation state.
7. Map changed files to affected tests and validators.
8. Cache module discovery, parsed specs, type compatibility, and ontology ancestry.
9. Run only the affected closure during development while retaining a linear repository-wide
   release check.

#### Phase 6: process external updates as semantic deltas

1. Add an explicit standards-update command that compares pinned snapshots and produces an
   ID-level diff.
2. Add an explicit ontology-update operation that produces an entity- and relation-level diff.
3. Compute ontology dependency hashes from the closure of entities and relations actually used by
   each generated pair and validation record.
4. Schedule only the targets, pairs, artifacts, and validations reached from the changed external
   records.
5. Retain the Phase 2 ignore-with-diagnostic behavior whenever reliable provenance or a reliable
   delta is unavailable during development.

## Stale-cache risk assessment

Caching introduces two different failure classes:

- A **false hit** reuses an artifact whose effective inputs changed. This is a correctness defect
  and can silently publish mislabeled, visually outdated, or incompletely validated content.
- A **false miss** recomputes an artifact whose effective inputs did not change. This normally
  preserves correctness, but violates the delta rules, slows releases, consumes external validation
  quota, and repeatedly interrupts development.

False hits are the higher release risk. False misses and broad invalidations are also treated as
high risk when they make ordinary scoped development behave like a clean rebuild.

### Risk register

| Risk | Severity | Failure and impact | Required measures | Reduced by |
| --- | --- | --- | --- | --- |
| Incomplete cache key | Critical | A source, configuration, external definition, or environment change produces a false hit. A release can contain artifacts that do not correspond to its declared inputs. | Define a versioned input contract per artifact kind; include every semantic and rendering input; store dependency keys and output digests in the artifact manifest; treat missing or unknown fields as an untrusted miss. | Phases 2 and 4 |
| Incorrect affected closure | Critical | A changed node fails to reach a dependent target, pair, image, VQA record, asset index, or coverage record. Development appears fast while retaining stale output, and the same stale output may reach a release. | Make dependencies explicit and directional; test reverse-edge closure for every node kind; compare incremental and clean plans on change fixtures; change the planner epoch and require a clean differential rebuild whenever dependency-planning logic changes. | Phases 4 through 6 |
| Mutable or unverifiable external input | Critical | Standards or ontology content changes under a stable name, or cached output is reused against a different external snapshot. | Pin immutable revisions and content digests; record provenance in manifests; fail a release when provenance cannot be verified. During development, ignoring an update means continuing to consume the previous pinned input—not consuming the new input with old cached artifacts. | Phases 2 and 6 |
| Renderer, toolchain, or worktree identity omitted | Critical | The same source commit produces different pixels or behavior because the container image, browser, fonts, lockfile, renderer configuration, seed contract, or dirty worktree differs. | Include the canonical renderer and toolchain identity in render keys; key development work from file content rather than commit alone; namespace local state by workspace and spec; require a clean source identity and canonical environment for release-trusted artifacts. | Phases 2 and 4 |
| Stale VQA policy | Critical | A cached pass survives a material evaluator-instruction, response-schema, model-policy, ontology-definition, or checklist change. The release audit then proves only compliance with an obsolete validation contract. | Record a versioned validation-policy epoch beside the semantic validation key; require the current epoch at release; force affected revalidation when that epoch or any content-derived validation input changes. A deliberate model or evaluator-policy change must advance the epoch even if it remains outside the content hash. | Phases 2 and 5 |
| Partial or concurrent publication | High | A process crash or competing writer exposes a manifest that references missing, truncated, or mixed-generation blobs. Developers see intermittent failures; a release may become irreproducible. | Write immutable blobs under content hashes, verify them before admission, publish the complete manifest last through atomic replacement, coordinate writers per namespace, and let readers use only completed immutable generations. | Phases 4 and 5 |
| Corrupted or missing cache blob | High | One damaged entry causes repeated failures or encourages an engineer to delete the complete cache, creating a miss storm. | Verify stored digests on admission and before release use; quarantine and rebuild only the affected entry or shard; retain enough manifest provenance to identify all dependents; provide targeted eviction rather than requiring directory deletion. | Phases 4 and 5 |
| Over-broad dependency or key | High for development | An unrelated edit invalidates a complete dataset, ontology, VQA module, or explorer snapshot. Correctness is preserved, but scoped work becomes slow and unpredictable. | Expose the affected closure before execution; explain which changed node and dependency edge caused every miss; reject silent escalation from scoped to global development work unless explicitly forced; use entity-, record-, pair-, and shard-level keys. | Phases 4 through 6 |
| Unbounded obsolete artifacts | Medium | Immutable generations accumulate, obscure which output is active, and consume disk until engineers manually clean broad directories. | Determine reachability from published and intentionally retained manifests, preview garbage collection before deletion, and collect only unreachable content after a retention window. Garbage collection never determines cache validity. | Phase 5 |

### Cache admission contract

Every reusable artifact must carry or be reachable from a manifest containing:

1. artifact kind and cache-schema version;
2. producer and dependency-planner epochs;
3. complete source, configuration, external-input, and canonical-environment keys;
4. direct dependency keys sufficient to explain the affected closure;
5. output content digests and sizes;
6. namespace, spec, and immutable generation identity;
7. an atomic completion marker that is written only after every referenced output is verified.

A cache hit is valid only when the complete expected key matches, the schema and epochs are
supported, the generation is complete, and referenced outputs pass the required integrity checks.
Modification time, file presence, a source commit alone, or a partially matching manifest never
establishes validity.

### Release safeguards

Releases fail closed. They never fall back to the newest available or last-known cache entry when
the exact entry is absent or untrusted.

1. Compute the expected input key from the tagged clean source, pinned external inputs, and
   canonical renderer environment.
2. Require every released artifact and VQA record to resolve to that key, the current schema, and
   the current producer, planner, and validation-policy epochs.
3. Verify manifest completeness and all referenced content digests in one linear pass.
4. Recompute the complete dependency plan and confirm that the selected immutable artifacts cover
   it exactly; this validates reuse without regenerating unchanged pixels.
5. After changes to key construction, dependency planning, cache serialization, or canonical
   rendering, perform a clean differential rebuild of the affected artifact domain and compare it
   with incremental output before allowing release reuse.
6. Publish the release manifest only after generation, integrity, coverage, and VQA gates succeed.

These checks remain linear in the release input, dependency graph, and published output. Reuse
eliminates duplicate computation, not verification of the release manifest.

### Development safeguards

Cache behavior must be observable without becoming another investigation task for the engineer.

1. Before substantial work, report the changed roots, affected closure size, estimated reused and
   rebuilt artifacts, and any external update being ignored.
2. For every miss or invalidation, make the causal path available: changed input, traversed
   dependency edge, expected key, and actual key or missing contract field.
3. A scoped command must not silently expand to a global rebuild. It stops with a concise
   diagnostic unless the engineer explicitly requests the broader operation.
4. Corruption recovery invalidates the smallest trustworthy entry or shard. The normal remedy is
   never “delete the cache directory.”
5. Interrupted work leaves completed immutable entries reusable and discards or quarantines only
   incomplete generations.
6. Cache status and cleanup operations use manifests and reachability rather than directory age or
   filename conventions.

Phase 1 counters expose current false misses and amplification. Phase 2 removes the most dangerous
provenance and environment false hits before artifacts are shared across workflows in Phase 3.
Phase 4 introduces the largest new correctness surface—the dependency planner—and therefore carries
the closure tests and epoch controls. Phases 5 and 6 reduce broad invalidation and developer
friction by making artifact and external-input dependencies progressively finer-grained.

## Validation criteria

The work is complete when the following properties hold:

1. Every major workflow emits structured work counters, and regression tests assert counter bounds
   as synthetic input sizes grow. Wall-clock measurements remain supporting evidence, not the
   complexity proof.
2. One full target-matching pass builds every catalog and type index once; candidate work remains
   proportional to traversed index postings, candidate edges, and requested output.
3. Coverage work grows linearly with targets, standards, dependency edges, and emitted records.
4. Production matching creates no rejected-combination records unless diagnostic output explicitly
   requests them.
5. Coverage for an unchanged complete input key is reused across workflows.
6. A one-generator or one-view development change reads, generates, validates, and republishes only
   its affected closure.
7. An unrelated ontology entity change causes no generation or VQA churn.
8. An ontology or standards update without a reliable diff is ignored during development with an
   explicit diagnostic.
9. A scoped generation does not copy the complete dataset.
10. VQA cache bytes read remain proportional to the physical cache size, not to cache size
    multiplied by sample count.
11. Local explorer refresh reuses unchanged image bytes.
12. Full release validation remains deterministic and reproducible from repository and
    external-source digests.
13. A release rejects artifacts with incomplete keys, unsupported epochs, unverifiable provenance,
    incomplete publication state, or mismatching content digests.
14. Incremental and clean dependency plans select equivalent outputs for representative changes to
    every graph-node kind.
15. A change to cache-key or dependency-planner logic cannot reuse artifacts from the previous
    epoch without a successful clean differential comparison.
16. Development diagnostics identify the causal dependency path for a cache miss or invalidation,
    and a corrupt entry can be repaired without clearing an unrelated cache domain.
17. Concurrent or interrupted writers cannot expose an incomplete generation to readers.

## Architectural assessment

No generator/view redesign is required to begin this work. The repository already has the essential primitives:

- scoped generation commands;
- per-generator/view manifest entries;
- immutable explorer snapshots;
- content-derived VQA validation keys.

The missing layer is a shared, persistent dependency graph and delta scheduler. These primitives should be consolidated around that layer rather than replaced independently.
