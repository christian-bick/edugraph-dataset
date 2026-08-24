# Improve generation and validation performance

## Goals and complexity model

The generation and validation architecture must satisfy these rules:

1. Every generation and validation task must scale linearly.
2. Every generation and validation task must be processable as a delta of content changes.
3. External changes, including ontology and standards-source changes, must be processed as deltas. During development, an external change must be ignored when a reliable delta cannot be determined.

Rule 1 always applies. Rules 2 and 3 must at least apply during development.

Here, linear means `O(input records + dependency edges + necessary output)`. A diagnostic that deliberately emits every rejected target/module combination can have quadratic output. Such exhaustive reporting must be an explicit diagnostic mode and must not determine the complexity of production generation or validation.

## Implementation status

| Rule | Current status |
| --- | --- |
| Always linear | Primary matching, coverage, generation, VQA, semantic-diff, and affected-closure paths carry linear implementations and work counters; release-wide checks remain deliberately linear in complete input. |
| Content-delta processing | Implemented for clean runs and existing generator/view source changes. Immutable exact-pair shards, persisted file-to-node ownership, partial model loading, matching postings, VQA misses, explorer asset reuse, and pointer publication bound ordinary development work to the authored change closure. Capability or repository-structure changes conservatively fall back to one complete linear rebuild. |
| External-delta processing | Standards use stable record diffs; ontology uses entity, relation, definition, and project-usage closures. Unreviewed or unverifiable updates remain pinned and are rejected before work. |

## Baseline diagnosis

The measurements and defects below describe the repository before this plan was implemented. The
dominant release delay was not image rendering or Gemini validation. A sparse matching problem was
repeatedly reconstructed as a dense problem, and identical coverage work was repeated across
workflows.

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

### Dataset invalidation follows an explicit dependency graph

Phase 4 replaced the aggregate dataset source hash with direct graph edges. Generated coverage
files, favicons, and unrelated public files are not renderer inputs. Generator and view entry files
own the local code, styles, and public assets reachable through their actual import closure;
checklists participate only in validation nodes. A request-local source index memoizes discovery
and file digests across overlapping model dependencies, so each source byte is read once per plan.

The automatic boundary is deliberately authored-model based. Targets, generator/view capability
specs and schemas, generator/view implementation import closures, used records from the exact pinned ontology,
checklists, the dedicated VQA system prompt, and canonical environment identities participate.
Build, matching, planning, cache, validation, workflow, and unrelated toolchain implementation code
does not. When machinery can affect graph construction or matching, development uses explicit
`--rebuild-graph`; it reconstructs the complete graph and compares it with the previous graph.
`--reset-graph` is the distinct full-baseline operation for hidden changes that require every pixel
to be regenerated. Releases always reconstruct and compare the complete graph. A model file imported by a generator or view remains an
automatic dependency even when it lives under a shared library directory.

### Matching, generation, and VQA share one delta graph

Dataset manifest schema 8 and planner epoch 5 make matching and validation policy explicit layers
of the same graph that schedules generated artifacts and validation. Its causal spine is:

```text
target capability + generator capability + view capability + matching policy
    -> compatible module pair
    -> successful target match tuple
    -> generation pair
    -> image
image + checklist + ontology definitions + validation policy
    -> VQA record
```

Capability nodes contain only matching-relevant labels, constraints, problem types, and ontology
ancestor closure. Target prose and implementation source live in separate downstream nodes, so
they cannot cause matching churn. The graph persists successful matches, not every rejected
target/pair combination. It also persists target-label and target-to-successful-pair postings as
derivable acceleration metadata. Label/type postings provide the discovery mechanism:
changed targets traverse the complete compatible-pair index, while changed or new pairs traverse
the relevant targets. Removed pairs simply make their old tuples unreachable. Matching machinery
is not hashed as model content; `--rebuild-graph` bypasses incremental matching shortcuts, runs one
complete indexed match, then executes only graph differences. A deliberately new full baseline uses
`--reset-graph`.

The `input_hash` of each VQA node is the exact existing validation cache key derived from the image
digest, view checklists, claimed labels, ontology definitions, and `validation-policy:vqa`. That
policy node hashes the dedicated authored system-prompt text. Response-schema and pass/fail code
are validation machinery. `--rebuild-graph` reconstructs graph state, while VQA `--force`
independently requests fresh judgments when evaluator behavior changes despite stable keys.
Cache lookup, active-key
selection, pruning, and strict audit consume this identity. JSONL records remain the persisted
evaluation results, but no longer decide staleness independently. Every graph build derives the
key from those inputs, with operation-local memoization for repeated checklist and ontology contexts;
a proven-clean development observation skips graph construction altogether. Unit tests compare clean and
delta matching, cover new and removed pairs, bound changed-pair work linearly, require the graph
key to reproduce the prompt-policy context key, and prove that checklist- or policy-only changes
reach VQA without reaching image generation.

### Clean development runs reuse the persisted graph

Dataset manifests carry a non-authoritative development observation containing the Git base,
dirty paths, exact authored-input file hashes, file-to-node ownership, renderer identity, and
exact locked ontology provenance. Unscoped affected generation and live validation ask Git for
only candidate changed paths. If every relevant candidate remains byte-identical, generation exits
before canonical container startup or catalog/graph construction, and live VQA reuses the persisted
graph while still auditing or updating the physical VQA cache. For an existing generator/view
source change, the persisted graph is patched at the changed source nodes, reverse closure selects
exact pairs, only those model modules load, and unchanged capability hashes admit the persisted
matching postings. Every affected execution subgraph is rebuilt and merged onto the already patched
observed graph, while only render-affected pairs regenerate pixels. This publishes mixed rendering
and validation-only deltas atomically instead of requiring a later full-graph reconciliation.

Git identity never participates in an artifact key. The observation is only a safe acceleration
index over the content-addressed graph. New discovery files, capability changes, relevant ignored
files, missing Git history, changed environment identities, and any ambiguity fail closed to
complete linear graph planning. Machinery changes are visible diagnostics, not automatic
invalidation roots. Strict release audit always reconstructs and verifies the complete graph in
linear time.

### External standards files are conversion inputs, not build inputs

The explorer consumes the Git-tracked canonical tree at `public/coverage/ccss-tree.json`. Dataset
generation consumes only the authored target specs under `src/spec/`. Routine development, CI,
coverage, validation, and release tasks therefore never download or cache raw external standards.

The explicit `update:standards-source` operation may fetch `standards.jsonl` and
`domain_groups.json` from a named immutable revision, but only to build and review a candidate
canonical tree. It compares the candidate by stable standard ID and replaces the tracked tree only
with `--apply`. Transport provenance cannot invalidate dataset content because it is outside the
dataset dependency graph; the tracked converted bytes provide the reproducible explorer input.

### Ontology invalidation is global

The manifest records only the complete `edugraph-ts` dependency version. An ontology package update can consequently invalidate every generator/view pair, regardless of which entities changed.

Each generated pair must instead depend on the closure of ontology entities it actually uses: target labels, generator and view capability labels, relevant ancestor relations, and any definitions used by validation. If that closure cannot be compared during development, the external update must not trigger global invalidation.

### Static checks have separate development and release entry points

`npm run check` remains the complete repository/release gate. Development uses
`npm run check:affected`, which maps Git or explicit changed files to incremental TypeScript,
related Vitest tests, contract/label/documentation/generator-coverage validators, and affected
production specs. The plan prints its causal files and supports `--plan-only`; it never silently
turns a scoped request into a full check. Module discovery and generator/view catalogs are cached
for the life of an operation, and multi-spec matching validation shares one catalog load.

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
10. Load each VQA module cache once, resolve and hash each checklist once, calculate each active
    validation key once from immutable identities, and read image bytes only for misses/forced
    evaluation or the independent release integrity pass.
11. Build VQA reports from the in-memory validation state rather than rescanning files and caches.
12. Remove the remaining known input-sized rescans, repeated discovery, `shift()` queues, and
   non-linear ordering operations from active generation and validation paths.

This phase fixes the immediate release bottleneck and the other known Gate A violations. Each
change must preserve existing matching and validation results exactly.

**Status: in progress.** The first implementation pass now covers the measured standards-coverage
and VQA amplification paths: operation-local counters, cached type parsing and ontology ancestry,
type/capability pair indices, batched target matching, indexed standard association, explicit
diagnostic rejection output, prepared single-pass VQA state, and one cache load per module. The
current CCSS coverage run completes locally in about 2.1 seconds and reports one problem-type file
read, one generator discovery, one compatible-pair index build, 180 compatible pairs, and 894 final
capability checks for 665 loaded source targets (653 unique after production normalization).
Production tuples are integration-tested against exhaustive
diagnostic matching, and counter-bound tests exercise growing target and validation-context inputs.

Phase 1 remains open for a counter-guided audit of the other active generation and validation
commands and removal of any remaining input-sized nested scans or non-linear ordering work. The
strict VQA audit must also be rerun after the canonical dataset freshness manifest is regenerated;
the existing dataset correctly becomes stale when these shared generation sources change.

#### Phase 2: establish stable input identity

1. Track the canonical standards tree used by coverage and identify it by content digest.
2. Record the exact canonical-tree and ontology provenance consumed by every coverage artifact.
3. Define the complete immutable key for core coverage from repository content and semantic inputs,
   without using a commit hash as content identity.
4. Identify ontology changes by exact locked provenance; unversioned mutations are outside the
   development input contract.
5. Remove generated coverage outputs and other unrelated files from dataset-render invalidation.

This phase establishes the correctness prerequisite for safe reuse. A cache hit is valid only when
the complete authored input identity is known; release workflows may still choose a linear rebuild
when sharing the cache would make its boundary more complex than the work it avoids.

**Status: complete.** Coverage producers read only the tracked canonical tree and record its exact
SHA-256 digest and byte length. Coverage manifest schema 4 with input schema 5 records repository
ref/SHA as projection provenance, semantic coverage-source content identity as a core input, canonical-tree
identity, exact ontology package resolution, the used ontology semantic hash, coverage selection
inputs, and the optional local asset-index digest. Validation reconstructs the key and fails closed.
Dataset rendering is independent of the canonical standards tree, generated coverage, and unrelated
public files. The public icon library is indexed as record-addressed SVG and raster assets: literal
references depend on one record, while template references depend on every matching record that the
view can select at runtime. This gives dynamic asset selection the same reconstruct-and-compare
semantics as ontology records without making asset choice graph machinery. Coverage-source identity
is restricted to target specs, generator/view capability
specs plus their reachable local model imports, and extracted generator/view problem-type declarations;
renderer and generator implementation bodies are excluded, and coverage does not execute a sample
generator merely to establish a semantic match. Coverage machinery is intentionally excluded and
uses explicit `--rebuild-graph`. Its shared model catalogs do not import generator
classes or view renderers.

#### Phase 3: compute and publish core coverage once

1. Publish an immutable core coverage artifact under its complete input key.
2. Reuse that artifact between main validation, release publication, and deployment.
3. Treat `latest` and `preview` metadata as projections over the same core artifact when their
   source inputs are identical.
4. Prevent workflows from recomputing an artifact that already exists for the complete input key.

**Status: complete for local reuse; deliberately not shared between CI workflows.** Core identity now excludes channel, human-readable source ref, source SHA,
package-version projection, and generation timestamp while retaining semantic coverage-source content, canonical
standards-tree, used ontology semantics, selection, and asset inputs.
The timestamp-free standards tree and coverage payload are atomically published under
`temp/coverage-core/<core_input_key>/` with a completion manifest containing their byte length and
SHA-256 digest. A selection-addressed observation under `.observations/` records the last successful
Git candidate baseline and per-file semantic identities. It distinguishes generator problem-type
declarations from generator bodies, so an implementation-only edit can prove a local hit before
catalog loading while a type, capability, target, standards-tree, ontology-provenance, selection,
or asset-input change reconstructs the complete identity. The observation is atomically refreshed
only after successful core resolution and never participates in the semantic key. A corrupt,
partial, ambiguous, or missing observation fails closed into the complete linear path. Validation,
deployment, and release invoke `--rebuild-graph`; Preview and Latest differ only in projection metadata.

#### Phase 4: introduce the dependency and delta foundation — complete

Represent matching, generation, and validation as a graph containing at least:

- source files and shared renderer dependencies;
- generator modules;
- view modules;
- target, generator, and view matching capabilities;
- type-compatible generator/view module pairs;
- successful target/module-pair match tuples;
- generator/view generation pairs and competency targets;
- ontology entities and relevant relations;
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

Implemented in `src/lib/dependency-planner.ts`, `src/lib/content-identity.ts`, and
`src/lib/dataset-manifest.ts`. The graph uses a closed node-kind contract for sources, modules,
pairs, targets, ontology entities and relations, shards, images, VQA, asset-index, and coverage
records. Matching capability and successful-tuple nodes precede generation pairs, and VQA-node
input hashes are the cache identities used by validation. Delta planning compares node content and direct edges, combines previous and current
reverse edges, records removals, produces an affected-only topological schedule, exposes reusable
content-addressed outputs, and stores compact causal predecessors. Planner work counters and
synthetic growth tests enforce linear construction and traversal; clean-versus-incremental output
equivalence and reverse closure are tested for every node kind. Unsupported planner epochs fail
closed. Dataset generation computes scoped plans before launching Chromium, rejects omitted
affected pairs, and publishes the complete graph and execution plan last inside the atomically
promoted dataset transaction. Phase 5 remains responsible for replacing copied mutable dataset
trees with immutable reusable shards and applying automatic affected-only execution to the other
development workflows.

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

**Status: complete for the supported authored-source fast path.** Standard datasets now publish a tiny atomic `current.json` pointer over
immutable content-addressed `(generator, view, split)` shards and complete generation manifests.
Scoped publication stages and writes only selected shards; `--affected` derives exact pair units
from the dependency graph, exits before Chromium on a clean plan, and visibly requires one full
baseline when trusted delta state is unavailable. Every dataset consumer used by merge, split and
coverage reports, asset indexing, VQA, and the repository check reads the logical manifest-backed
snapshot, while the released union remains a deliberate linear materialization.

The graph constructs VQA cache keys from immutable shard identities, exact validation context, and
the validation-policy node;
cache lookup, pruning, and audit read those keys rather than applying an independent staleness
algorithm. PNG bytes open only for cache misses, forced evaluations, or the separate full audit
integrity pass. A graph rebuild derives keys from immutable inputs with repeated validation contexts
memoized within that operation; a proven-clean development observation reuses the complete persisted
graph. Persisted target-label, target-to-match, and file-to-model-node postings bound existing
generator/view source edits to relevant pairs. The selected model modules are loaded and every
affected execution subgraph is merged into the observed complete graph, while only render-affected
pairs regenerate pixels; a capability or structure change
falls back to a complete linear build. A conservative Git-assisted observation proves exact clean
development no-ops without making Git identity authoritative. Local explorer snapshots
admit each PNG once to a content-addressed pool and hard-link unchanged assets into later
snapshots. TypeScript uses ignored incremental state; `check:affected` selects related tests and
validators with explicit reasons. Module discovery and catalogs join the existing type-graph and
ontology-ancestry caches. Store, planner, snapshot, catalog, and changed-file tests cover exact-pair
replacement, obsolete-layout replacement requirements, immutable reuse, corruption detection, and bounded
classification work.

Target/spec structure changes and capability changes remain conservative full-plan boundaries.
Target-file ownership postings are a future refinement if spec growth makes the current full
fallback material; they are not required to keep ordinary generator/view implementation work
steady. Release-wide graph construction remains the mandatory linear verification path.

The label-architecture audit also consumes this foundation. It reuses persisted successful tuples
when current capability nodes and pair topology match, then joins current catalog declaration
metadata and one-pass source signals without expanding the graph schema. Stale or absent graph
state falls back to one fresh indexed match rather than an exhaustive rejection matrix.

#### Phase 6: isolate standards conversion and process ontology updates as semantic deltas

1. Add an explicit standards-update command that compares a named immutable source revision with
   the tracked canonical tree and produces an ID-level diff.
2. Reconstruct ontology entity, relation, and definition nodes from the exact pinned package when
   its locked provenance changes.
3. Compute ontology dependency hashes from the closure of entities and relations actually used by
   each generated pair and validation record.
4. Schedule only the targets, pairs, artifacts, and validations reached from changed ontology
   records; standards conversion never schedules dataset work.
5. Ignore unversioned external mutations during development; canonical installs enforce the lock.

**Status: complete.** `update:standards-source` compares a candidate immutable CCSS revision with
the tracked explorer tree by stable standard ID and atomically replaces that tree only with
`--apply`; no raw-source lock, snapshot, or dataset dependency exists.
The pinned ontology package is the single current semantic source. Its exact lock provenance
triggers authoritative graph reconstruction; no checked-in duplicate semantic baseline or
acceptance command is maintained.

Dataset manifest schema 8 and planner epoch 5 replace aggregate ontology invalidation with semantic
nodes. Target, generator, and view matching depends on entity identity and the used ancestor
relations. Successful target/pair tuples connect this matching layer directly to generation;
VQA depends separately on exact claimed definitions and uses its graph input hash as the cache key.
Render and validation nodes are distinct, so a definition-only change schedules VQA
without rendering. Raw `edugraph-ts` package state is excluded from the non-ontology runtime key.
Coverage cores similarly key ontology input by the CCSS usage hash and project the current package
version, allowing an unrelated entity change to reuse the existing computation. Generation and
validation compare exact ontology provenance with the manifest, reconstruct complete graph and
matching state when it changes, and then schedule only the changed semantic closure. Coverage
derives its usage closure directly from the same pinned package.

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
| Partial or concurrent publication | High | A process crash or competing writer exposes a manifest that references missing, truncated, or mixed-generation blobs. Developers see intermittent failures; a release may become irreproducible. | Write immutable blobs under content hashes, verify them before admission, publish the complete manifest last through atomic replacement, coordinate writers per namespace, and let readers use only completed immutable generations. | Phases 4 and 5 |
| Corrupted or missing cache blob | High | One damaged entry causes repeated failures or encourages an engineer to delete the complete cache, creating a miss storm. | Verify stored digests on admission and before release use; quarantine and rebuild only the affected entry or shard; retain enough manifest provenance to identify all dependents; provide targeted eviction rather than requiring directory deletion. | Phases 4 and 5 |
| Machinery behavior changed without an explicit rebuild | High | Automatic keys intentionally exclude build, matching, validation, cache, workflow, and unrelated toolchain code. Reusing a graph after one of those changes can conceal a changed algorithm. | The graph does not detect machinery edits. The engineer or agent chooses `--rebuild-graph` to reconstruct and compare graph/matching state, or `--reset-graph` when hidden behavior requires a deliberately new full pixel baseline. Release generation, coverage, and audit always reconstruct. Validation-semantics changes additionally require `--force` when existing images need fresh judgments. Skills document this manual boundary. | Phases 4 and 5 |
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

1. Reconstruct the complete dependency graph and coverage core from tagged authored model content,
   the exact pinned ontology, the tracked canonical standards tree where coverage uses it, and
   the canonical renderer environment. Release correctness never depends on a development
   observation or a cross-workflow coverage cache.
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
7. Machinery paths are outside automatic observation. The engineer or agent determines whether a
   machinery edit can change graph construction (`--rebuild-graph`) or requires a deliberately new
   pixel baseline (`--reset-graph`). For evaluator behavior, `--force` independently requests new
   Gemini results for unchanged keys.

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
5. Coverage for an unchanged complete input key is reusable locally; release and CI rebuild it in
   linear time instead of maintaining a machinery-sensitive cross-workflow cache.
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
14. Incremental and clean dependency plans select equivalent outputs for representative authored
    graph-input changes.
15. Cache-key, matching, dependency-planner, validation, and workflow machinery is absent from
    automatic change detection; project documentation and skills require an explicit complete graph
    rebuild before reuse whenever an engineer or agent determines that behavior may have changed.
16. Development diagnostics identify the causal dependency path for a cache miss or invalidation,
    and a corrupt entry can be repaired without clearing an unrelated cache domain.
17. Concurrent or interrupted writers cannot expose an incomplete generation to readers.
18. Incremental matching returns the same ordered successful tuples as a clean indexed match;
    unchanged inputs perform no capability checks, while changed or new pairs can discover new
    matches without a persisted rejection matrix.
19. Every graph VQA key equals the cache key recomputed from its exact image, checklist/ontology
    context, and authored system-prompt policy;
    validation lookup, pruning, and audit accept no independently derived staleness identity.
20. A clean unscoped development run performs no catalog load, capability check, graph rebuild,
    render, or prompt-context reconstruction. An existing generator/view source delta loads and
    rebuilds only its affected model closure; structural, capability, or ambiguous candidates fall
    back to the complete authoritative graph without a false hit.

## Architectural assessment

No generator/view redesign is required to begin this work. The repository already has the essential primitives:

- scoped generation commands;
- per-generator/view manifest entries;
- immutable explorer snapshots;
- content-derived VQA validation keys.

Phase 4 supplies the shared, persistent dependency graph and delta scheduler, including the
matching-capability, successful-tuple, validation-policy, and persistent-posting layers. Phase 5 places
mutable dataset and explorer outputs behind immutable stores and applies affected-only execution
to rendering, graph-owned VQA cache selection, tests, type checking, and validators. Existing
generator/view source changes use incremental module loading and pair-subgraph merging; capability
and structural changes retain a conservative linear fallback. Phase 6 replaces
aggregate external identities with reliable record/entity/relation deltas. Future performance work
should extend the shared planner and its persisted graph rather than introduce an independent
invalidation system.
