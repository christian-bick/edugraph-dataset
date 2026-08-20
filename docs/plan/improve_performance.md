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

### Priority 0: eliminate the release bottleneck

1. Parse the problem-type graph once.
2. Load generator and view catalogs once.
3. Build the compatible generator/view pair index once.
4. Match all targets once and retain target-to-match and target-to-generator maps.
5. Make standards coverage consume those maps rather than invoking matching per target.
6. Build target-to-standard and standard-to-target maps once.
7. Add performance tests that fail if catalog or type parsing occurs inside target/pair loops.

This phase fixes the immediate algorithmic defect. It must preserve existing matching results exactly.

### Priority 0: compute coverage once per source commit

1. Publish an immutable core coverage artifact keyed by source commit and external-input digests.
2. Reuse that artifact between main validation, release publication, and deployment.
3. Treat `latest` and `preview` metadata as projections over the same core artifact when their source inputs are identical.
4. Prevent workflows from recomputing an artifact that already exists for the complete input key.

### Priority 1: introduce a dependency and delta planner

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

The existing per-pair manifest should become an execution plan rather than only a stale-result detector.

### Priority 1: make matching output-sensitive

1. Build inverted indices for problem type and ontology capability labels.
2. Derive candidate generator/view pairs by set intersection instead of testing every compatible pair.
3. Separate production matching from diagnostic explanation.
4. Return matches or existence results without constructing rejection records.
5. Allow explicit diagnostic commands to request rejection explanations and report their output-sensitive complexity.

### Priority 1: make VQA validation a single-pass delta

1. Load each module cache once.
2. Resolve and hash each checklist once.
3. Read each required image once.
4. Calculate the active validation key once per sample.
5. Evaluate only cache misses or explicitly forced samples.
6. Build reports from the in-memory validation state instead of rescanning files and caches.

### Priority 1: replace whole-dataset staging

1. Store generated outputs as immutable generator/view or finer-grained shards.
2. Reuse unchanged shards by content hash.
3. Stage only changed shards and manifests.
4. Publish by atomically replacing a manifest pointer rather than copying the entire dataset.
5. Apply the same content-addressed reuse to local explorer snapshots.

### Priority 2: make external updates explicit and reproducible

1. Pin standards sources by immutable upstream revision and content digest.
2. Add an explicit standards-update command that produces an ID-level diff.
3. Record the exact standards-source provenance in coverage artifacts.
4. Compute ontology dependency hashes from used entity closures.
5. Add an explicit ontology-update diff keyed by entity and relation.
6. During development, ignore an external update when its delta cannot be established and report why it was ignored.

### Priority 2: incremental static validation

1. Enable incremental TypeScript compilation state.
2. Map changed files to affected tests and validators.
3. Cache module discovery, parsed specs, type compatibility, and ontology ancestry.
4. Run repository-wide checks for release verification while preserving linear processing.
5. Run only the affected closure during development.

### Priority 2: remove remaining avoidable superlinear operations

Replace array `shift()` work queues, repeated linear `find()` calls, repeated filesystem discovery, and redundant sorting where they occur in input-sized loops. Where deterministic sorting is required, account for its `O(n log n)` behavior explicitly or preserve canonical order during indexed construction.

## Validation criteria

The work is complete when the following properties hold:

1. One full target-matching pass builds every catalog and type index once.
2. Coverage time grows linearly with targets, standards, dependency edges, and emitted records.
3. Coverage for an unchanged source/input key is reused across workflows.
4. A one-generator or one-view development change reads, generates, validates, and republishes only its affected closure.
5. An unrelated ontology entity change causes no generation or VQA churn.
6. An ontology or standards update without a reliable diff is ignored during development with an explicit diagnostic.
7. A scoped generation does not copy the complete dataset.
8. VQA cache bytes read remain proportional to the physical cache size, not to cache size multiplied by sample count.
9. Local explorer refresh reuses unchanged image bytes.
10. Full release validation remains deterministic and reproducible from repository and external-source digests.

## Architectural assessment

No generator/view redesign is required to begin this work. The repository already has the essential primitives:

- scoped generation commands;
- per-generator/view manifest entries;
- immutable explorer snapshots;
- content-derived VQA validation keys.

The missing layer is a shared, persistent dependency graph and delta scheduler. These primitives should be consolidated around that layer rather than replaced independently.
