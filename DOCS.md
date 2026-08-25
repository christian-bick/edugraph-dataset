# EduGraph Content: Technical Documentation

This document provides a comprehensive technical overview of the EduGraph Content ML Dataset Generator. It is designed to guide developers and AI agents in understanding the system architecture, script orchestration, and the process for adding new educational content modules.

> **Authoring rules live in [`docs/`](docs/README.md)** — the reference library covering generator/view specifications and implementations, the visual checklist contract for views, and competency target specs. This document covers architecture, scripts and workflows, and links into that library rather than restating it.

## 1. Architecture Overview

### Label-Driven Generation
The core philosophy of this system is **Label-Driven Generation**. Pedagogical labels (derived from the EduGraph ontology, e.g., `Scope.IntegersWithZero`, `Area.Addition`) strictly dictate the mathematical properties and cognitive task represented by each artifact. The system does not generate a problem and *then* label it; it receives label constraints and produces a task whose mathematics satisfies them and whose visible or necessary textual clues make them reasonably defendable to a classifier.

### The Three Pillars
The architecture is divided into three distinct layers:
1.  **The Brain (`src/generators/`)**: Instantiates canonical mathematical problems from resolved typed configuration. It has no knowledge of how a problem is visualized or what learner action a view will request.
2.  **The Body (`src/visuals/`)**: HTML/CSS/TS renderers that run in the browser. It is organized into `views/` (individual exercise layouts), `components/` (shared UI elements), and `helpers/` (shared layout/math algorithms).
3.  **The Heart (`src/scripts/`)**: Node.js scripts orchestrating Playwright (headless browser). These scripts unite the Brain and the Body, generating problems, injecting them into the renderers, taking screenshots, and compiling the metadata.

## 2. Core Concepts & Types

### `AbstractProblem` & `ProblemStub`
Defined in `src/types/ml-engine.ts`, these types represent the JSON structure of a math problem.
*   **`ProblemStub`**: The data-only output of a Generator (`{ data }`).
*   **`AbstractProblem`**: The fully realized object injected into the dataset (`{ type, data, labels }`). Its ontology labels are resolved by orchestration, never authored by `generator.ts`.

### `RenderPayload` & `ViewTypeMap`
The data contract passed from the Playwright orchestrator into the browser's `window.renderView(payload)`. It contains:
*   `problem`: The `AbstractProblem`; `problem.labels` is the complete observable capability set resolved from the matched generator/view pair.
*   `viewId`: The string identifier of the view.
*   `targetLabels`: Standard target claims used only by the HOC wrapper to resolve view configuration, not emitted as artifact labels and not inspected by the pure view.
*   `isSolutionView`: A boolean instructing the renderer to display the problem with or without the solution filled in.
*   `seed`: The deterministic render seed derived from the sample identity. Views must draw **all** of their entropy from it — see `IMPL-V6` in [docs/implementation-view.md](docs/implementation-view.md).

To ensure end-to-end type safety between problem generators (which run in Node.js) and the React views (which run in the browser headlessly), the system utilizes:
1. **`ViewTypeMap`** (defined in [problems.ts](src/types/problems.ts)): A central contract mapping visual view identifiers to their expected mathematical data structure. A shared view may accept a small structurally distinguishable union: `operations-vertical` and `operations-boxes` use `ArithmeticPairProblem | ArithmeticTripleProblem`, then narrow through the presence of `num3` and validate the corresponding fields.
2. **`ViewRenderPayload<TViewId>`** (defined in [ml-engine.ts](src/types/ml-engine.ts)): A utility type that automatically resolves to the correct type-safe `RenderPayload` for a specific view ID, eliminating the need for manual type assertions (`as ...`) within the view components.

**Environment Separation & Mapping:**
Because the Node orchestrator and generator configurations do not statically import the React view files (which are dynamically bundled by Vite and loaded headlessly inside Playwright via URLs), TypeScript cannot automatically inspect `window.renderView` in the browser code from the Node side. `ViewTypeMap` serves as a shared bridge, allowing the compiler to statically verify that generators specify view names compatible with the data structures the views expect to render.

### Capability Ownership and Task Projection

The clean conceptual model for target claims, dimension-neutral label declarations, capability
ownership, applicability, canonical payloads, projections, and dataset identities lives in
[docs/label-architecture.md](docs/label-architecture.md). The authoring references indexed by
[docs/README.md](docs/README.md) are normative and carry the stable rule IDs.

Operationally, matching resolves a target against a compatible generator/view pair, the generator
creates the canonical mathematical payload, and the view projects it into an observable task. Use
the architecture document's review order whenever a match, payload, or rendered artifact appears
wrong; do not reconstruct these contracts from historical plans or workflow prose.

### Ontology Scale Resolution
Concrete distance presentation is resolved at the view boundary. `resolveDistanceScale` in
`src/lib/ontology.ts` maps the concrete centimeter, meter, inch, foot, or abstract segment
label to both its scale and its metric, imperial, or abstract ontology family. A compatible
generator can therefore emit scale-neutral mathematical choices while the consuming view
owns unit text, reference objects, and display proportions. Family-only labels remain
ambiguous and are not silently converted into a concrete unit.

### Specs and the Union Dataset

A **spec module** (`src/spec/<module>/`) is one education standard's competency targets — `ccss` today, further standards later. Standards overlap heavily, so each one added contributes an increasingly small delta.

*   **Each standard owns a dataset folder.** `npm run generate:dataset -- --spec=ccss` canonically writes to `out/dataset-ccss/`, with its VQA cache in `cache/vqa-validation/dataset-ccss/`. Regenerating one standard never touches another's samples, and generation never depends on a host Vite server.
*   **Every generated standard has a complete dependency manifest.** `manifest.json` persists a versioned, planner-epoch-bound graph from matching and validation policy, target/generator/view capabilities, compatible module pairs, and successful match tuples through generator/view generation pairs, shards, images, VQA records, asset-index records, and coverage records. Capability nodes depend on the relevant ontology entities and ancestor relations; module implementation nodes remain separate so an output-only code edit does not cause rematching. Each generation-pair entry separates render nodes (pair, image, shard) from validation nodes (VQA), alongside its effective input hash, aggregate content/task hash, sample counts, and renderer identity. A definition-only ontology change can therefore invalidate VQA without scheduling pixel generation. Direct edges explain every invalidation; image nodes record byte digests and sizes, and each VQA node's input hash is the exact expected cache key. `checklist.md` and the dedicated VQA validation policy participate only in VQA-node dependencies, while the canonical standards tree, generated explorer files, favicons, and unrelated public files are absent from dataset dependencies. Shared render code and the public icon library remain explicit inputs. The icon library is indexed once as individual asset records: a literal `/icons/...` reference creates one source edge, while a template reference creates conservative edges to all matching records. Runtime asset choice stays in the view, but changing one icon reaches only views whose literal or template collection can select it. A request-local source index discovers and digests overlapping generator/view dependencies once.
*   **Dependency changes are planned before scoped rendering.** The planner compares content hashes and direct edges, then follows reverse edges from both the previous and current graph so removals and rewiring cannot strand stale dependents. It emits an affected-only topological schedule, reusable content-addressed outputs, compact causal predecessor links, and structured linear-work counts. A planner-epoch change is a clean miss. If an explicit generator/view scope omits an affected pair, generation stops before Chromium starts and reports the first causal path instead of silently widening the operation or publishing stale siblings.
*   **Development no-op detection is an acceleration index, not cache identity.** The manifest stores the Git base, dirty paths, hashes of graph-relevant files, renderer identity, and exact ontology provenance. The host generation wrapper checks an unscoped `--affected` request before starting Docker; live validation performs the same check before loading catalogs. Both reuse the persisted graph when candidate bytes and these explicit identities are unchanged. The canonical container runs only read-only Git observation commands through the existing workspace mount so its final manifest can record this observation. When reconstruction proves that only the observation changed, generation transactionally publishes that metadata without rendering; the next run can therefore be a true no-op even after an output-neutral edit or commit. Git commits never enter artifact keys. New module/spec/checklist/asset files, relevant ignored files, unavailable history, or any ambiguous observation force normal graph reconstruction. Strict release audit never uses this shortcut.
*   **Ontology semantics are record-addressed in the dependency graph.** The exact installed `edugraph-ts` package is the current ontology source; there is no second accepted semantic snapshot. A change to its locked provenance authoritatively reconstructs the complete graph. Targets, generators, and views depend on the transitive `partOf` closure of only their labels; VQA records additionally depend on definitions of the labels they claim. Comparing those newly built entity, relation, and definition nodes with the previous graph keeps downstream execution semantic and local: an unrelated ontology record is reusable, while a definition-only change can reach VQA without reaching pixels. Unversioned package mutations are not development inputs; canonical work uses the exact lock provenance. CCSS membership is authored in `src/spec/ccss/`; the canonical standards tree under `public/coverage/` documents that coverage in the explorer and is not a dataset-generation input.
*   **The union dataset (`out/dataset/`) is derived**, built by `npm run merge:dataset` from every non-isolated standard in precedence order. It is the released artifact; treat it as a build output, never as a source of truth — the merge replaces it wholesale. Its public rows are compact projections containing only `file_name`, `labels`, and `solution`; operational identity remains in the source standard datasets.
*   **The merge deduplicates identical tasks across standards.** The first standard in merge order keeps the exercise and later ones report it as duplicate overlap. Same-split dedup is scoped per view by `task_fingerprint`, the hash of problem data plus the deterministically resolved view configuration. The validation split separately excludes any `content_fingerprint` already in train, even when its configured task differs, so mathematical payloads cannot leak across the split boundary. Generation applies the same two rules within a standard (scoped per module, since a view has only one generator). Question and solution are independent draws of one exercise, so exercises are kept or dropped whole. Operational target associations from a dropped exercise transfer only to a retained sample with the same task fingerprint; a data-only validation collision is excluded but cannot represent the other task. The public row and image remain singular, while the asset index can expose a reused sample under every exact target label set it actually evidences.
*   **Isolated specs never merge.** `test` declares `isolated = true` in `src/spec/test/_module.ts`; it is a fast prototyping, debugging, smoke-test and retained-regression workspace, not a second curriculum or exhaustive capability matrix. Every generator keeps at least one generatable target-view path there. Files prefixed with `_` describe the module rather than contributing targets, so the target loaders skip them.
*   **Merge precedence** is ascending `unionOrder` (default 100), ties broken by name. Declare a higher `unionOrder` when adding a standard so established ones keep their samples and the newcomer contributes only its delta.

Target IDs are unique within their own spec module. Sample keys and filenames are interpreted
inside that spec's dataset folder, while metadata records the originating `spec`. The union
does not require globally unique target prefixes: it reads each generated standard
separately, preserves its metadata, and selects contributions by task fingerprint and
merge precedence.

**Known limitation — equivalent competencies are only collapsed within a spec module.** Target-level deduplication before generation (`deduplicateTargetPermutations` via `normalizeAndValidateSpec`) reduces identical label sets to one representative only within that standard. Separate standards still generate independently; the union sees their rendered tasks rather than their target equivalence and removes only exercises whose task fingerprints actually coincide. Cross-standard competency equivalence would therefore require a separate union-level target normalization design.

### Sample Identity & Determinism
Within one spec dataset, every sample has a **structural identity**: the tuple `(target.id, generatorId, viewId, split, mode, instanceIdx)`, canonicalized as a *sample key* (e.g. `test-writing~fe4336da#writing#numbers-write-standard#train#question#inst:0`). Everything entropy-related is a pure function of this identity, implemented in `src/lib/generation.ts`:

*   **Generation seed**: `computeSampleSeed(sampleKey, attempt)`. The `attempt` counter is a retry salt — when a generator returns `null` or produces a duplicate task (or validation-leaking content), the pipeline retries with the next attempt, which deterministically yields a different draw. The *winning* attempt is recorded in metadata and the VQA cache, so any sample can be replayed in isolation.
*   **Render seed**: passed to the browser as `payload.seed`. The `withConfig` wrapper calls `setSeed(payload.seed)` before resolving the view config, and views derive all visual randomness from it.
*   **Filenames**: `computeSampleFilename(identity)` — stable and unique by construction, so filenames never shift when unrelated samples change.
*   **Content fingerprint**: `computeContentFingerprint(problem.data)` — an order-independent identity for the mathematical payload, used to prevent train/validation leakage.
*   **Task fingerprint**: `computeTaskFingerprint(problem.data, resolvedViewConfig)` — an order-independent identity for what the selected view actually asks. It governs same-split reuse and target associations, so equal generator data with different view parameters remains distinct. The pipeline resolves the config with the sample's render seed and the same labels before rendering; `withConfig` repeats that deterministic resolution in the browser.
*   **Val split membership**: `isValTuple(target.id, generatorId, viewId, ratio)` — a pure function of the matched tuple, so val membership survives unrelated reorderings. Allocation is per tuple, not per target: targets differ by an order of magnitude in how many tuples they match, so target-level allocation produced a split far below the requested ratio and left most views with no validation samples at all.

The consequence: a code change only invalidates the samples whose identity inputs it actually touches. Sample identity remains pipeline metadata and is not part of the generator payload.

## 3. Script Reference

### Standards Explorer
`src/index.html` is the root Vite entry for the Common Core coverage explorer.
`src/standards-explorer.html` is a compatible direct URL, and `src/modules.html` hosts the
renderer/view directory. The React application
lives under `src/standards-explorer/`, uses Zustand for
its navigation and selection state. Production defaults to the `latest` coverage routes,
which contain the snapshot published with the latest dataset release, and exposes a
Release / Preview selector. Preview reads the deployed-main snapshot under
`public/coverage/preview/` and is addressable with `?view=preview`; Release omits the query
parameter and reads `public/coverage/latest/`. Each snapshot contains
`ccss-tree.json`, `ccss-coverage.json`, and `coverage-manifest.json`; the manifest records
the schema version, channel, source ref and SHA, generation time, and ontology version.
Run `npm run dev` and open `/` for local working-tree development; open `/modules.html`
for direct renderer previews.
Vite intercepts the three preview routes and serves them from the newest completed local
snapshot. **Refresh local data** explicitly builds working-tree coverage, the local asset
index, and a copy of every selected PNG under `temp/standards-explorer-preview/<id>/`.
The refresh endpoint streams newline-delimited progress events to the explorer so the status
panel reports each build stage while the immutable snapshot is being prepared.
Snapshots are versioned and become visible only after their manifest is written, so a
failed refresh leaves the previous one intact. Reloads and source edits do not rebuild or
invalidate data implicitly. Vite neither watches nor streams from `out/`, preventing the
explorer from retaining Windows handles across atomic dataset swaps.

Released sample thumbnails are intentionally separate from those coverage views. The
explorer always loads `/dataset/asset-index.json` as its publication baseline; the development server
always proxies that path to the deployed explorer. The index groups every retained public
row by its requested target label set; question and solution rows remain independent
samples. Each released image URL is constructed from the index's Hugging Face repository,
immutable release revision, split, and file path.

On `localhost` and `127.0.0.1`, a Released / Local selector changes only the active sample
image source. Local sets `assets=local` and loads `/dataset/local-asset-index.json` from the
same immutable snapshot. Its image route serves the copied snapshot PNGs, so ordinary
browsing never reads generated standard datasets and local preview does not require a
merged union. Refresh again after target, generator, view, ontology, or dataset changes;
the explorer shows an explicit loading state while coverage, the index, and images are
materialized. Production hosts do not render the image-source switch and always resolve
images through the release-pinned Hugging Face URL. Their separate Release / Preview
selector changes the complete coverage snapshot while retaining that published asset index.
Release therefore reports the internally consistent published state; Preview compares the
deployed `main` competencies with the same released evidence to expose next-release readiness.

The released index remains loaded in both modes, but status evidence follows the selected
asset source. A dataset-covered leaf is `Released` only when every implemented competency
permutation has an exact canonical label-set match with at least one sample in the active
index; otherwise it is `Ready`. Released mode therefore reports actual publication state,
while Local mode previews whether the immutable working-tree snapshot satisfies the same
asset-evidence invariant before publication.

The production explorer is hosted by Firebase Hosting at the `edugraph-coverage` site
in the `edugraph-438718` project. `.firebaserc` maps the local hosting target,
`firebase.json` serves the root `dist/index.html` directly and requires revalidation for
the mutable coverage JSON and released asset index routes, and
`.github/workflows/deploy.yaml` is a reusable workflow that regenerates and validates
Preview from an exact main SHA, resolves the repository's explicitly marked latest GitHub
Release once, and downloads both Latest coverage and its matching asset index from that tag
before building and deploying the Vite application. The release stores the
three immutable coverage files plus `asset-index.json` as individual assets, so deployment needs no historical
checkout and the browser makes no cross-origin request. The workflow can also be started
independently with `workflow_dispatch`. It uses the same Workload Identity Federation
provider and Firebase service account as the sibling `edugraph-editor` project; no
persistent Firebase token is stored in GitHub.

GitHub Actions keeps validation and publication separate. Pushes to `main` run the
build, complete test suite, and repository checks through the local `quality-gates`
composite action. Main validation also reconstructs and validates an immutable coverage core in
job-local temporary storage. Coverage cores and development observations are not shared between
jobs or workflows through `actions/cache`; validation, deployment, and release each perform their
own authoritative reconstruction from the checked-out sources. The `setup-node` npm cache only
accelerates dependency installation. A version tag repeats those gates, generates CCSS in the pinned
canonical container, runs the strict read-only cache audit, merges the release dataset,
generates and validates the released asset index and release coverage snapshot, publishes the dataset to Hugging
Face, creates or updates the matching GitHub Release with that snapshot, explicitly marks
it Latest, and only then dispatches the explorer deployment workflow on `main`. A
successful main validation also calls that reusable workflow with the validated commit
SHA. Keeping deployment in a branch-context run satisfies the Google Workload Identity
provider's branch trust condition without allowing release-tag refs.
Release asset-index validation loads the normalized CCSS production targets and fails if
any exact target permutation has no associated released sample. Run the same validation
locally against the merged artifact before creating a tag; the release workflow repeats it
before publication. This is the publication gate behind the explorer's `Ready` to
`Released` transition. Earlier standards-spec validation proves every active target has a
compatible generator/view path, while the asset index additionally proves that the exact
target survived generation, deduplication, splitting, and merge.
The release workflow's manual trigger accepts an existing `release_tag` and repeats the
same full gate and publication path; use it to retry or backfill a tag rather than
constructing Release assets by hand.
Live Gemini VQA is a local development operation and never runs in either workflow.
All host-side workflows use Node.js 24 LTS, matching the local `.nvmrc` and the
`package.json` engine constraint. Production deployments are serialized through the
`coverage-explorer-production` concurrency group. Canonical generation still executes inside its pinned
Playwright image, so changing the host runtime does not change the renderer identity.

### `src/scripts/map-standards.ts`
* **Execution**: `npm run generate:standards-explorer -- [--output-dir=<path>] [--channel=latest|preview] [--source-ref=<ref>] [--source-sha=<sha>] [--rebuild-graph]` (alias: `npm run map:standards`)
* **Function**: Reads the tracked canonical standards tree, regenerates dataset coverage metadata and authored-package
  task backlog consumed by the standards explorer, plus the snapshot manifest. Implementation
  and ontology tasks are grouped by stable package id. It shares the coverage builder with
  the local refresh script so development and deployment semantics cannot drift. The default output is
  `public/coverage/preview/` for an explicit manual snapshot; release and deployment
  workflows pass explicit output directories and source identity. Normal local preview
  does not run this command. One run loads the type graph and module catalogs once, builds one
  compatible generator/view index, matches all unresolved targets in one batch, and associates
  targets with standards through a shared prefix index. The final structured work-counter line
  reports physical source reads, index builds, posting traversal, candidate checks, and standard
  lookup work for complexity regression diagnosis.
  Before those catalogs are loaded, local development consults a selection-addressed observation
  under `temp/coverage-core/.observations/`. Git identifies only candidate paths since the last
  successful operation; recorded content hashes and extracted problem-type records then prove
  whether the semantic coverage inputs are unchanged. A proven-clean observation resolves the
  immutable core key without catalog loading. New structure, changed semantic records, changed
  standards or ontology provenance, missing history, or ambiguous observation reconstructs the
  complete linear identity.
* **Input identity**: Routine coverage reads `public/coverage/ccss-tree.json` and records its exact
  path, byte length, and SHA-256 digest; it performs no network access and retains no raw standards
  cache. Coverage derives the used ontology closure directly from the exact installed package.
  Coverage manifest schema 4 contains input
  schema 5: the canonical tree identity, exact `edugraph-ts` package provenance, the used ontology
  semantic hash, repository ref/SHA/content digest, selection options, and optional asset-index
  digest. Repository content here is the exact authored semantic coverage source set: CCSS target
  specs, generator/view capability specs plus their reachable local model
  imports, and the extracted generator/view problem-type declarations. Renderer bodies and
  unrelated implementation files do not churn the core. Coverage, matching, cache, and workflow
  machinery are outside this key and require explicit `--rebuild-graph` after behavioral changes.
  Coverage uses the shared model catalog, which
  never imports generator classes or view renderers and never executes a generator as a probe. The
  `core_input_key` uses this content digest rather than the Git commit and excludes
  projection metadata—the channel, human-readable source ref, source SHA, package version, and
  generation timestamp. Equivalent content from `main` and a release tag therefore resolves to one
  core. During development, `validate:coverage` uses the same observation proof before loading
  catalogs. `--rebuild-graph` reconstructs the expected key from the current checkout; CI,
  deployment, and release validation always pass it. Both modes fail closed on any missing, stale,
  internally inconsistent, or unverifiable identity.
* **Immutable core and projections**: `src/lib/coverage-core.ts` stores the standards tree and
  timestamp-free coverage data under `temp/coverage-core/<core_input_key>/`. A completion manifest
  records the exact core byte length and SHA-256 digest; readers verify both before reuse, and an
  incomplete or corrupt entry fails rather than being silently overwritten. `latest` and `preview`
  output directories contain projections that add only channel, source-ref, and generation-time
  metadata. The core key uses the semantic hash of the ontology closure actually referenced by
  CCSS rather than the package version; an unrelated entity update reuses the core, while the
  projection still records the current ontology version. On a local hit the mapper performs no
  generator/view discovery or target matching. The observation is an untracked acceleration index,
  never part of the core key and only published after a successful operation. CI, release, and
  deployment pass `--rebuild-graph`: the full coverage computation remains the authoritative gate.

### `src/scripts/refresh-local-explorer.ts`
* **Execution**: Invoked by the local explorer's **Refresh local data** action.
* **Function**: Builds working-tree coverage, replays the union asset selection, and copies
  the selected PNGs into a complete versioned snapshot under
  `temp/standards-explorer-preview/`. Vite serves only the newest completed snapshot; it
  neither watches nor streams from `out/`. Reloading the explorer therefore performs no
  dataset reads, and canonical generation can atomically replace a standard dataset while
  an older snapshot remains open in the browser. Refresh retains the newest two completed
  snapshots and best-effort removes older versions after open response streams have closed.
  It reads the same tracked canonical standards tree as release/deployment coverage,
  includes the selected local asset-index digest in the coverage input identity, and reuses the
  same immutable core store when that complete input is unchanged. PNGs are admitted once into
  the content-addressed `.assets/` pool and hard-linked into later snapshots (with a copy fallback
  when links are unavailable), so an unchanged refresh writes no duplicate image bytes. The result
  record reports blob writes, reuses, links, and bytes written.

### `src/scripts/generate-asset-index.ts`
* **Execution**: `npm run generate:asset-index -- --revision=<release_tag_or_commit> --output=<path> [--repository=<owner/dataset>]`
* **Function**: Independently replays the union selection over the operational metadata of
  every non-isolated spec, resolves each retained row back to its requested target labels,
  and writes the released dataset asset index. The output contains every retained question
  and solution row as an independent sample; it does not pair modes or cap visual variants.
  A retained physical sample may appear in multiple label-set groups when generation or
  union deduplication recorded that it evidences multiple exact target permutations.
  This is a release/CI operation; local development uses the explicit explorer snapshot instead.
  Release automation writes `temp/release-assets/asset-index.json`. The revision is
  required and rejects `main`, ensuring browser URLs remain release-pinned.

### `src/scripts/validate-asset-index.ts`
* **Execution**: `npm run validate:asset-index -- [--index=<path>] [--dataset-dir=<path>] [--spec=<spec_module>]`
* **Function**: Validates the asset-index schema and release revision, canonical label-set
  grouping, independent sample modes, exact correspondence with the merged public metadata,
  ontology-aware requested-label coverage (each published capability may be equal to or more
  specific than the requested claim), and on-disk image presence. With `--spec`, it additionally
  requires exact asset evidence for every normalized production target permutation. Defaults
  to the local public index and `out/dataset`; release passes its temporary index with
  `--spec=ccss` so a target cannot remain `Ready` after publication.

#### `src/scripts/generate-dataset.ts`
The container-internal pipeline orchestrator.
*   **Execution**: The canonical wrapper invokes `npm run generate:dataset:internal`; direct host execution is rejected. The public command is `npm run generate:dataset -- --spec=<spec_module> [--generator=<generator_name>] [--view=<view_id>] [--affected] [--rebuild-graph] [--reset-graph] [--training-only] [--concurrency=<positive_integer>]`. `--rebuild-graph` and `--reset-graph` are mutually exclusive, full-only, and cannot be combined with `--affected`, module/view filters, or `--training-only`.
*   **Function**: Loads targets and catalogs, builds the type-compatible module-pair index once, and resolves matched `(target, generator, view)` tuples through `src/lib/matching.ts`. An affected run first consults the persisted file-to-node ownership index. A clean authored-input delta exits before container startup; an existing generator/view source change patches recorded source nodes, finds exact affected pairs through reverse edges, loads only their modules, and reuses persisted successful matches when selected capability hashes are unchanged. The partial publication rebuilds every affected execution subgraph, including validation-only dependents, while scheduling pixels only for render-affected pairs. Capability changes, newly discovered structure, or ambiguous state fall back to the complete linear planner so new matches cannot be missed. `--rebuild-graph` bypasses all such shortcuts, performs complete indexed matching and graph construction, compares that authoritative graph with the previous graph, and executes only the changed render closure. A locked ontology-provenance change invokes the same behavior automatically. `--reset-graph` alone discards the previous graph and regenerates every pair to establish a new baseline. Validation-only graph changes are published transactionally without starting Chromium. The resulting tuple set is shared by train generation, validation generation, preflight, and manifest construction. Before scoped rendering, the pipeline rejects a scope that omits affected pairs. It then generates one question and one solution sample per tuple with structural seeds and renders them headlessly through the Vite server owned by the same Docker container. The final structured work-counter line exposes catalog, type-index, matching, and source-index work.
*   **Capture bounds**: Playwright screenshots the shared `#view` mount point. Its common stylesheet shrink-wraps ordinary content with `width: fit-content` and caps it at the canonical viewport with `max-width: 100vw`; only views whose outermost element explicitly requests viewport width retain a full-width canvas. See `IMPL-V10` in `docs/implementation-view.md`.
*   **Renderer preflight and failure collection**: Before opening an output transaction, the pipeline visits only the views matched by the selected scope, verifies a successful document response and the `window.renderView` hook, and rejects page errors or genuine local-resource failures. Preflight uses at most four workers; rendering uses a bounded worker pool (8 by default, configurable with `--concurrency`). A sample-level render or `ViewValidationError` is recorded while sibling samples and modules continue, then the run reports every failed sample, exits non-zero, and rolls back the staged transaction. Diagnostic error cards are never accepted as dataset artifacts.
*   **Splits**: Train samples are generated for every tuple; validation samples for the ~25% of tuples selected by `isValTuple`. Both use the same identity-based seeding with the split as a key component. Audit the result with `report:splits` — a tuple whose content space is too small to yield a draw disjoint from train produces no validation sample, which that report surfaces.
*   **Split dependency direction (invariant)**: **train generation never depends on validation generation; validation always depends on train.** Train is generated first into its own fingerprint index, and the val pass only reads that index. The asymmetry is required, not incidental: train is the primary artifact and must be reproducible on its own, while validation cannot be disjoint from train without being constrained by it. Verify with `npm run generate:dataset -- --spec=test` followed by `npm run generate:dataset -- --spec=test --training-only` — the train split must come out byte-identical. The practical consequence is that a generator change shifts train content, which can change which validation draws survive dedup; `report:churn` classifies that as an *attempt shift* and it is expected, not a determinism regression.
*   **Dedup**: Task fingerprints per (module, split, view), covering **both modes** — a question never repeats a solution's configured task or vice versa. Validation additionally rejects every mathematical content fingerprint already in train. A collision triggers a deterministic retry on the next attempt; the winning attempt is recorded. If every question attempt collides, the target is associated only with an existing physical sample carrying the same task fingerprint; a train content collision with a different task can exclude a validation draw but cannot represent it. A solution that exhausts its retries falls back to the question's task shown solved. The module scope keeps `--generator=X` reproducing exactly what a full run produces for that module, and costs nothing because no view is rendered by more than one generator.
*   **Metadata**: Each standard image row records its operational identity: `sample_key`, `spec`, `target_id`, optional additional `target_associations`, `generator`, `view`, `mode`, `instance`, `attempt`, `seed`, `content_fingerprint`, `task_fingerprint`, plus `labels`. The association list preserves exact competency provenance when several targets share one physical task. The generator's problem data and resolved view config are used to compute the fingerprints but are not duplicated into metadata. Generators do not author a separate descriptive id or ontology annotations; structural sample identity remains separate from content and task equivalence.
*   **`--training-only` Flag**: If specified, skips validation sample generation, rendering, and metadata writing.
*   **Output**: `out/dataset-<spec>/current.json` is the small atomic pointer for every standard dataset. Immutable pair/split shards and complete generation manifests live beside it under `out/.dataset-store/dataset-<spec>/`. Readers use `src/lib/dataset-store.ts`; they do not assume physical split trees. The released, materialized `out/dataset/` is produced by `merge-dataset.ts`, not by this script.
*   **Transactional output**: Rendering uses a private staging directory. Each changed `(generator, view, split)` unit is admitted under its content hash, a complete immutable generation manifest is written after all shards verify, and publication atomically replaces only the pointer directory. Any planning, preflight, generation, or render failure removes private state and preserves the previous pointer. A dataset without the current pointer format is unsupported and must be replaced by one unfiltered full generation before scoped shard replacement.
*   **Scoped and affected replacement**: `--generator=X` replaces that generator's rows in both splits. Adding `--view=Y` narrows the cartesian scope. `--affected` derives exact generator/view execution units from the persisted dependency graph and writes only those shards; a clean plan exits before Chromium, while missing trusted delta state explicitly requires one full baseline. Exact pair selection prevents a changed view of one generator from replacing sibling pair shards. Every explicit scope is accepted only when it contains the complete affected closure; otherwise the diagnostic identifies the first causal path outside it.

#### `src/scripts/generate-dataset-container.ts`
The only public dataset-generation entry point.
*   **Execution**: `npm run generate:dataset -- --spec=<spec_module> [--generator=<generator_name>] [--view=<view_id>] [--affected] [--rebuild-graph] [--reset-graph] [--training-only] [--concurrency=<positive_integer>]`.
*   **Function**: Runs the internal generator and its own Vite server in the immutable Playwright Linux/AMD64 image declared by `src/lib/render-environment.ts`. The renderer binds only inside the container on dedicated port `4173` with `strictPort`; no host server or host port participates. The repository is mounted and copied into the container filesystem before startup so Windows bind-mount latency does not slow module discovery; only transactional `out/` writes flow back to the host. The npm download cache is mounted, while Linux `node_modules` lives in a separate Docker volume keyed by the package lock and renderer digest. A warm run therefore skips `npm ci`; changing either input creates a fresh dependency volume automatically.
*   **Workflow boundary**: Full, scoped, development, VQA, CI, and release generation all use this wrapper. Host Vite remains available only for interactive view replay and the standards explorer; it is never a dataset-generation prerequisite.
*   **Assets and settings**: Inter and Roboto Mono are pinned local package assets. Browser locale, timezone, viewport, scale, media preferences, Playwright version, platform, and image digest are explicit. No host font or remote font request participates in canonical pixels.

### `src/scripts/merge-dataset.ts`
*   **Execution**: `npm run merge:dataset`
*   **Function**: Builds the union dataset at `out/dataset/` from every non-isolated spec's manifest-backed snapshot, in `unionOrder` precedence (see *Specs and the Union Dataset*). Deduplicates exercises across standards per (split, view) by task fingerprint — keeping question and solution together, since they are independent draws of one exercise — and excludes from validation any mathematical content already merged into train. Target associations from duplicate exercises are attached to the retained operational row only when the task fingerprint matches. The released `metadata.jsonl` projects each retained internal row to `file_name`, `labels`, and `solution`, so this extra provenance does not widen the public training schema. Reports each standard's offered / merged / duplicate counts, which is the delta a newly added standard actually contributes. Requires every union spec to have been generated first; the public union is deliberately materialized and replaced wholesale in one linear release operation.

### `src/scripts/generate-coverage-report.ts`
*   **Execution**: `npm run report:coverage -- --spec=<spec_module|union>`
*   **Function**: Reads the selected logical snapshot once and outputs a markdown report detailing absolute frequencies of individual labels and unique label combinations. Standard reports live at `out/reports/dataset-<spec>/coverage-report.md`, outside the atomic pointer. `--spec=union` analyzes the materialized release union and writes `out/dataset/coverage-report.md` for publication.

### `src/scripts/validate-dataset.ts`
*   **Execution**: live mode: `npm run validate:dataset -- --spec=<spec_module> [--generator=X] [--view=Y] [--rebuild-graph] [--force] [--concurrency=<positive_integer>] [--log-prompts] [--report-only] [--report=<path>]`; strict audit: `npm run audit:dataset -- --spec=<spec_module>`
*   **Dataset selection**: every script that reads a dataset takes `--spec=<module>` and nothing else, resolved by `resolveDatasetDir` in `src/lib/dataset-paths.ts` (`--spec=ccss` → `out/dataset-ccss/`). The reserved `--spec=union` addresses the merged `out/dataset/`, and is accepted only by `report:coverage` — validation and churn are per standard, and reject it with an explanation. `--spec` is required; there is no default.
*   **Function**: An automated Visual QA pipeline. Normal mode uses the Gemini API via `src/lib/vqa-evaluator.ts` to analyze canonical Q/A image pairs against exactly two visual contracts: the central view checklist and the selected leaf view's required checklist. The evaluator role is authored in `src/validation/vqa/system-instruction.md`; response-schema and pass/fail semantics live in `src/lib/vqa-policy.ts`. The user content contains only the mode, ontology labels, a generic `## View-specific checklist` heading with the heading-free leaf criteria, and the global checklist under its own H2. Validation runs per standard — `--spec=test` targets the small `out/dataset-test/` slice for fast iteration. Normal mode rejects native renderer identities so a Windows or host-specific render cannot enter the committed cache.
*   **Freshness gate**: Before inspecting or spending API calls on VQA, validation verifies the selected pair entries, metadata counts, content/task fingerprints, authored source and ontology inputs, direct edges, immutable shard image identities, and graph-owned VQA cache keys. A proven-clean unscoped development run reuses the persisted graph through the file-to-node observation; otherwise validation reconstructs the unified graph with canonical renderer identity and fails with the first causal affected path when it is stale. A missing manifest, incomplete graph, old schema, old planner epoch, or ambiguous observation is a fail-closed graph-rebuild miss. Strict audit and explicit `--rebuild-graph` always reconstruct the complete graph, then the audit separately reads every live image once and verifies its stored byte digest.
*   **Splits**: **Both `train` and `validation` are validated.** Validation images ship in the released dataset and are subject to the same checklists, so exempting them would let unchecked images reach consumers. Images are located by reading the split back out of the `sample_key` (`SPLIT_DIRS` in `src/lib/generation.ts`) — `file_name` is relative to its split root and does not encode the split, so **the same tuple's train and validation images share a filename**; every human-facing path is qualified with its split. The report breaks results down per split.
*   **Caching**: Evaluation results remain stored in `cache/vqa-validation/<dataset>/<module>.jsonl`, but cache validity is owned by the dependency graph. Every `vqa:<sample_key>` node carries the exact established key derived from image bytes and authored validation context, and depends directly on its image, `validation-policy:vqa`, applicable checklist sources, claimed ontology entities, and their definitions. Validation lookup, strict expected-set audit, pruning, and reporting all consume that graph key; the JSONL cache is output storage, not a second invalidation system. The validation context combines the applicable checklist hash with the sorted ontology labels and their definitions. The validation-policy node hashes the dedicated system-prompt text. Checklists, definitions, labels, images, and the system prompt therefore invalidate affected records automatically. Response-schema code, pass/fail implementation, model selection, and validation-pipeline code are machinery rather than authored graph inputs. The engineer or agent requests authoritative reconstruction with `--rebuild-graph` when such machinery can alter graph construction. `--force` remains independent: it requests new Gemini judgments for selected samples even when their graph keys are unchanged. Each cache entry also records the component hashes and the sample's full identity (`sample_key`, `attempt`, `seed`, …) for debugging and churn analysis. Failures in every generated timestamped report include a ready-to-run `test:sample` command.
*   **Single-pass validation state**: Every graph construction derives each expected cache key directly from immutable image identity and the authored validation context; operation-local memoization shares checklist and label-definition work across samples with the same context. A proven-clean development observation skips graph construction entirely. After freshness succeeds, validation loads one `VqaCacheManager` per generator and resolves full prompts only for live cache misses or forced evaluations; an invariant verifies that the resolved prompt context reproduces the graph key exactly. PNG bytes are opened only for those evaluations or the independent full-integrity audit. Pruning, classification, live updates, normalization, and reporting reuse the graph-owned identities. Audit reads each physical cache file and each live image once. Structured counters separate graph-key derivation, VQA miss bytes, and dataset-integrity bytes.
*   **Request concurrency**: Live validation uses up to 10 parallel requests by default. `--concurrency=<positive_integer>` lowers or raises that bound to fit provider rate limits. `--log-prompts` always uses one request at a time so the diagnostic output stays readable. Neither setting affects cache keys or evaluator behavior.
*   **Prompt diagnostics**: `--log-prompts` prints the system instruction, user prompt, and image path immediately before every live request. The flag does not affect cache keys or evaluator behavior.
*   **Gate semantics**: Normal validation updates cache records and reports; it exits non-zero for failing or uncached selected samples. Strict `--audit` is full-dataset-only, read-only, and never calls Gemini: it requires both splits, canonical renderer identities, exact metadata/image correspondence, and an exact set of passing cache keys. Missing, failing, stale, duplicate, malformed, orphaned, or obsolete-module records fail the audit. `--report-only` is the explicit diagnostic escape hatch.
*   **Report paths**: Every normal validation writes a new immutable report under `temp/validation-reports/dataset-<spec>/`. Names contain an ISO timestamp and the scope, such as `2026-08-16T12-34-56-789Z__full.md` or `2026-08-16T12-34-56-789Z__generator=writing__view=numbers-write-standard.md`. Reports survive dataset regeneration because they are outside transactional `out/`; the command prints the exact path. `--report=<path>` remains an explicit override. Strict audit writes no report.
*   **Pruning**: Normal validation auto-prunes stale entries and obsolete module files only when the run covers the whole dataset. A run narrowed by `--generator`/`--view`, or one against a dataset generated with `--training-only`, skips pruning and says so. Strict audit never prunes; stale state is a release-blocking finding.

### `src/scripts/report-cache-churn.ts`
*   **Execution**: `npm run report:churn -- --spec=<spec_module> [--ref=<git-ref>]`
*   **Function**: Compares the working-tree VQA cache against a git ref (default `HEAD`) by joining entries on their `sample_key`. Reports identities whose image hash changed, classified as *render/code change* (same seed and attempt), *attempt shift* (collision elsewhere or generator behavior change), or *seed scheme change* (should never happen). **Run this after every regeneration**: churn in samples your change should not have affected is a determinism regression.

### `src/scripts/report-splits.ts`
*   **Execution**: `npm run report:splits -- --spec=<spec_module>`
*   **Function**: Audits the train/validation split of a generated standard dataset, using `src/lib/split-report.ts`. Reports **cross-split leakage** (validation mathematical content already present in train for the same view), **within-split redundancy** (one view's configured task shown by two different exercises — a question and its own solution sharing a task is the documented small-space fallback, not redundancy), the **realized val ratio** against the allocator's target, and **per-view / per-label validation coverage**. Leakage and redundancy exit non-zero: they make validation metrics optimistic rather than merely thin. Coverage gaps are warnings, since a view whose content space is too small to split legitimately yields no validation sample. Run it after every standard regeneration — nothing else asserts these properties. The compact released union is not accepted; its source standards are audited before merge, while the merge enforces cross-standard train/validation exclusion.

### `src/scripts/test-sample.ts`
*   **Execution**: `npm run test:sample -- --sample="<sample_key>" --spec=<spec_module> [--no-render] [--no-validate]`
*   **Function**: Replays one exact sample draw from its identity, renders it natively to `out/retest/` (requires `npm run dev`), and compares the image hash against the committed VQA cache. Native replays never update the cache: perform cache-producing VQA by generating the relevant scope canonically and running `validate:dataset`. Pass `--no-validate` to suppress the live-validation check entirely, or `--no-render` to skip image rendering.

### `src/scripts/test-target.ts`
*   **Execution**: `npm run test:target -- --target=<target.id_or_prefix> --spec=<spec_module> [--raw] [--render] [--validate]`
*   **Function**: Inspects one production-normalized competency target end to end: supports full or prefix target IDs (e.g. `--target=test-writing`), which `(generator, view)` tuples it matches (with reasons for rejected pairs), the exact samples the pipeline would produce (keys, seeds, attempts, fingerprints, data), how they relate to the committed VQA cache, and — with `--render` — native debug images in `out/target-test/`. Pass `--raw` to select from source definitions before overlap deduplication. Cache-producing VQA uses canonical scoped generation plus `validate:dataset`, not the native `--validate` path.

### `src/scripts/show-matching-stats.ts`
*   **Execution**: `npm run show:matching -- --spec=<spec_module> [--raw]`
*   **Function**: Prints the matched `(generator, view)` pairs for the same normalized and deduplicated targets used by production generation. Every semantic match is reported; a cheap sample probe is shown as a separate success/failure status and never removes the tuple. Pass `--raw` to inspect every source target definition before overlap deduplication. Production `matchTargets` uses capability postings and returns only matches. This diagnostic command explicitly uses `diagnoseTargetMatches`, which traverses every type-compatible pair so it can also report rejection reasons; the potentially target/pair-sized rejection output never burdens production matching.

### `src/scripts/report-matching-diff.ts`
*   **Execution**: First capture a baseline with `npm run report:matching-diff -- --spec=<spec_module> --plan=<plan_name> --capture-before`; after target edits, rerun without `--capture-before`.
*   **Function**: Stores matching snapshots under `temp/spec-plans/<spec>/<plan>/` and writes `matching-diff.md` listing added/removed targets, moves between `implementationTodo` and active `spec`, and semantic generator-view pairs. Snapshots include production-normalized active targets plus implementation TODOs, so unsupported proposals remain visible. Baselines are protected from accidental replacement unless `--force` is explicit. The report is advisory, but target-spec review must account for every disposition and pair change.

### `src/scripts/analyze-target-distinctness.ts`
*   **Execution**: `npm run analyze:target-distinctness -- --spec=<spec_module> [--plan=<plan_name>]`
*   **Function**: Compares raw active and implementation-TODO definitions and reports identical permutation sets, containment, overlap, and definitions whose nearest permutations differ by only one ontology label. It also shows labels that stably discriminate one definition from the other. With `--plan`, writes `target-distinctness.md` beside the matching snapshots; without it, prints Markdown. This is an advisory review aid, not a validation gate.

### `src/scripts/show-implementation-todos.ts`
*   **Execution**: `npm run show:imp-todos -- [--spec=<spec_module>]`
*   **Function**: Inspects `implementationTodos` across target spec files. Lists each authored implementation definition, its `reuse`/`expand`/`new` generator and view roles, and the referenced target definitions.

### `src/scripts/show-ontology-todos.ts`
*   **Execution**: `npm run show:ont-todos -- [--spec=<spec_module>]`
*   **Function**: Inspects `ontologyTodos` across target spec files. Groups missing ontological concepts, listing standard IDs, missing labels, and detailed descriptions.

### `src/scripts/check-all.ts`
*   **Execution**: `npm run check [-- --spec=<spec_module>]`
*   **Function**: The unified repository check script. Orchestrates TypeScript type checking (`tsc --noEmit`), generator/view spec audits (`validate-generator-view-specs.ts`), label usage audits (`check-labels.ts`), documentation reference validation (`validate-docs.ts`), competency standard spec validations (`normalizeAndValidateSpec`), and dataset split integrity (`report-splits.ts`). If `--spec` is specified, restricts target spec validation to that module; otherwise validates all available specs (`test`, `ccss`). Split integrity runs only for specs whose dataset has been generated, so a fresh clone still passes every static check.

### `src/scripts/check-affected.ts`
*   **Execution**: `npm run check:affected [-- --base=<git-ref>] [--files=<comma-separated-paths>] [--plan-only]`; use `--full` to delegate explicitly to `npm run check`.
*   **Function**: The development delta gate. It combines committed changes from `--base`, working-tree changes, and untracked files; maps each changed root to type checking, Vitest's related-test graph, generator/view contracts, label checks, documentation, scoped generator coverage, and the affected production spec modules; and prints every causal file before executing. A changed `generator.ts` gets a fresh related-test coverage summary and is the only generator subjected to thresholds. Module implementation edits do not trigger unrelated matching checks, while capability/spec and shared matching changes do. Package and lock changes trigger matching/label checks and all production specs; dataset generation independently detects exact ontology provenance and reconstructs the graph. The explorer-only canonical standards tree does not trigger dataset validation; its update command validates the conversion delta directly. All affected production specs are validated in one process against one cached generator/view catalog. A requested full check is never an implicit fallback.

### `src/scripts/update-standards-source.ts`
*   **Execution**: `npm run update:standards-source -- --revision=<40-character-sha> [--source-dir=<path>] [--apply]`.
*   **Function**: Fetches only the named immutable CCSS revision (or reads an explicit offline source directory), converts its raw standards and domain groups into the explorer's canonical format, and compares the result with `public/coverage/ccss-tree.json` by stable standard ID and tree digest. The default is a read-only report with linear work counters. `--apply` atomically replaces the tracked canonical tree. The raw source, its revision, and its transport metadata are updater inputs only; routine generation, validation, and coverage never consume them.

### `src/scripts/validate-docs.ts`
*   **Execution**: `npm run check:docs`
*   **Function**: Validates the wiring of the reference library in [`docs/`](docs/README.md) using `src/lib/docs-validator.ts`. Errors on: a cited rule ID that no reference defines, a rule ID defined twice, a link or anchor that does not resolve, a reference to a missing `docs/` file, a `DOCS.md § n` citation for a section that no longer exists, and a reference file without an `## Audit` section (the review skills navigate to it by heading). Warns on: a rule missing from its own file's Audit section, a reference file not linked from the index, and machine-specific `file://` links. Scans `docs/`, `DOCS.md`, `AGENTS.md`, `README.md` and every `.agents/skills/*/SKILL.md`.

### `src/scripts/validate-generator-view-specs.ts`
*   **Execution**: `npm run check:generator-view-specs`
*   **Function**: Enforces the static generator/view contracts from [docs/spec-general.md](docs/spec-general.md), [docs/spec-generator.md](docs/spec-generator.md), and [docs/spec-view.md](docs/spec-view.md). It rejects redundant or overlapping positive declarations, generator-owned Abilities, cross-pair schema parameter duplication, Abilities in `rejectedLabels`, unsupported pair-level `requiredLabels`, and contradictory required/rejected declarations. Label-bearing mechanisms are dimension-neutral; semantic ownership rules determine which declarations are valid. Output goes to the console; redirect it to `temp/` if you need to keep it.

### `src/scripts/audit-label-architecture.ts`
*   **Execution**: `npm run audit:label-architecture -- --spec=<module> [--output-dir=<path>] [--strict]`
*   **Function**: Writes deterministic `audit.md` and `audit.json` reports containing target dimension cardinalities, every matched target-label provider down to `generalLabels` versus schema parameter, schema dimensions, Ability-parameterization signals, positive cross-role overlaps, raw-label implementation access, learner-action payload-field candidates, applicability/boundary declarations, view-owned Areas, and the exact production tuples affected by each finding. Default output is `temp/label-architecture/<spec>/`. The default is a review report; `--strict` makes every finding classified as a violation fail the command.
*   **Graph reuse**: The audit loads current model catalogs because the dependency graph deliberately stores capability hashes rather than raw declaration metadata. If every current target, generator, view, matching-policy hash, target-label posting, and compatible pair agrees with the generated dataset graph, it reuses the graph's successful match tuples. Otherwise it performs one fresh indexed match. The shared model-source index discovers imported implementation closures, and source heuristics scan each unique reachable generator/view implementation file once; ontology resolution in `withConfig` remains infrastructure rather than an implementation finding. Structured work counters and synthetic growth tests cover the linear tuple-index, capability-closure, provenance, overlap, import-graph, and source-read paths. No graph-schema change or dataset invalidation is required.

### `src/scripts/validate-standards-spec.ts`
*   **Execution**: `npm run check:standards-spec -- --spec=<module>[,<module>...]`
*   **Function**: Validates one or more competency target standard specs using one shared generator/view catalog. All checks always run: target ID uniqueness (the sole gatekeeper — `loadTargets` itself is permissive), label set normalization, intra-target permutation uniqueness, definition distinctness, and inverse matching coverage — every normalized active target must have at least one semantically compatible generator/view path. No two target definitions may define an identical *set* of permutations, since such definitions are indistinguishable by the ontology. Definitions that merely *overlap* in some permutations are legitimate (related standards across grades); overlapping permutations are deduplicated to one representative target and reported as warnings, not errors. For `--spec=test`, validation additionally requires a matched target/view tuple whose bounded probe can produce a sample for every generator module.

### Type Checking (`npm run check:types`)
*   **Execution**: `npm run check:types` (or `npx tsc --noEmit`)
*   **Function**: Runs the TypeScript compiler in non-emitting incremental mode to find and report type errors across all generators, renderers, scripts, schemas, and test suites. Reusable state is written only under ignored `temp/typescript/`; a clean CI/release checkout still performs the complete linear check.

## 4. Module Structure & Authoring Rules

Adding content means creating two interconnected directories: a **Generator** (abstract
math, `src/generators/`) and a **View** (visual renderer, `src/visuals/views/`). Both are
organized into a 1-level category sub-directory structure — e.g.
`src/generators/arithmetic/arithmetic-ops-pairs` and
`src/visuals/views/operations/operations-vertical`.

The rules for authoring each file live in the reference library under
[`docs/`](docs/README.md), which is their single source of truth. Every rule carries a
stable ID — `SPEC-3`, `CHK-V6`, `IMPL-G2` — so skills and reviews cite one rule rather than
a section number.

| Artifact                    | Shared rules                                                | Generator                                                       | View                                                  |
|-----------------------------|-------------------------------------------------------------|-----------------------------------------------------------------|-------------------------------------------------------|
| `spec.ts`                   | [spec-general.md](docs/spec-general.md)                     | [spec-generator.md](docs/spec-generator.md)                     | [spec-view.md](docs/spec-view.md)                     |
| `checklist.md`              | —                                                           | —                                                               | [checklist-view.md](docs/checklist-view.md)           |
| `generator.ts` / `view.tsx` | [implementation-general.md](docs/implementation-general.md) | [implementation-generator.md](docs/implementation-generator.md) | [implementation-view.md](docs/implementation-view.md) |

Competency target specs under `src/spec/` follow [target-spec.md](docs/target-spec.md).

## 5. How to Enrich the Dataset (Step-by-Step Guide)

To add a new mathematical concept or visual style to the dataset, follow this step-by-step workflow:

### Step 1: Define the Pedagogy
Declare the target specifications in the appropriate grade level file in `src/spec/ccss/` (like `kindergarten.ts` or `grade-01.ts`), building permutations with the `DatasetPermutationBuilder`. See `src/spec/ccss/kindergarten.ts` for worked examples.

The export contract, content-hash id semantics, gap dispositions, rule against stretching labels, and requirement that every active label have observable classification evidence (`TSPEC-13`) are specified in [docs/target-spec.md](docs/target-spec.md).

### Step 2: Analyze Matchings
Run `npm run show:matching -- --spec=ccss` to inspect the complete matched-pair set. Confirm both that the intended path exists and that every additional pair is a genuine realization. Use `--raw` only when tracing an overlapping source definition that production deduplicates.

### Step 3: Decide Next Steps
- **Case A: Both Match (100% Match):** If the intended generator-view path matches and every additional match is genuine, the dataset pipeline can generate the target without a new module.
- **Case B: No Matching Generator:** Add a generator capability by extending a coherent existing module or creating a new module according to `IMPL-7`.
- **Case C: No Matching View:** Add a view capability by extending a coherent existing task or creating a new leaf according to `SPEC-V6` and `IMPL-7`.
- **Case D: Matches Exist but Lack Capabilities:** Extend `generalLabels` or a schema only when the module can truthfully support the capability with a surgical change. Otherwise, add the missing role rather than broadening an unrelated contract.

### Step 4: Scaffolding (If Needed)
Follow `IMPL-6` and `IMPL-7` in [docs/implementation-general.md](docs/implementation-general.md). Reuse or extend a module only while its task family, payload boundary, and implementation remain coherent; scaffold a separate role when those boundaries are crossed.

### Step 5: Declaring Capabilities (`spec.ts`)
Create or update the `spec.ts` files for both your generator and visual view, per [docs/spec-generator.md](docs/spec-generator.md) and [docs/spec-view.md](docs/spec-view.md), with the shared rules in [docs/spec-general.md](docs/spec-general.md).

Use [docs/label-architecture.md](docs/label-architecture.md) to assign each target claim and
applicability condition to the correct construct before editing declarations. Then apply the
normative Audit sections of the three spec references; do not infer ownership from a label's
dimension or from an existing match.

### Step 6: Implementation
Implement `generator.ts` per [docs/implementation-generator.md](docs/implementation-generator.md) and `view.tsx` per [docs/implementation-view.md](docs/implementation-view.md).

Use [docs/label-architecture.md](docs/label-architecture.md) for the payload/projection boundary,
then follow the implementation references' Audit sections. If the shared problem contract changes,
adopt both roles under `IMPL-G6` and `IMPL-V8` before treating the change as complete.

The determinism rule that breaks things silently is `IMPL-V6`: every randomized visual decision must derive from `payload.seed`. Any other entropy source invalidates the VQA cache without failing a check.

### Step 7: Tests (`generator.test.ts`)
Write unit tests per `IMPL-G5` in [docs/implementation-generator.md](docs/implementation-generator.md), then run `npm run test` to verify.

`npm run test` is the fast development loop and excludes files named `*.it.test.ts`. Put tests that traverse complete catalogs, load real standard modules, or exercise end-to-end module matching in `*.it.test.ts`; run those with `npm run test:integration`. Use `npm run test:all` as the complete local and CI gate. `npm run test:coverage` also runs the complete suite before checking generator coverage.

### Step 7b: Prototyping and Regression Testing via `test`
Use the isolated `test` spec for fast visual prototyping, debugging, smoke generation and retained cached regressions. It is not a second curriculum or an exhaustive mirror of generator capabilities:
1. **Maintain a Test Path**: Every generator must have at least one minimal test target with a compatible view. Keep existing targets when they remain useful regressions; add more only when they materially help debugging or protect behavior. The module follows the same builder contract as real standards — see [docs/target-spec.md](docs/target-spec.md) (`TSPEC-1`, `TSPEC-4`, `TSPEC-12`).
2. **Run Targeted Dataset Generation**: Generate a smaller slice of the dataset exclusively to a `dataset-test` directory:
   ```bash
   npm run generate:dataset -- --generator=X --view=Y --spec=test
   ```
   This allows you to quickly inspect the generated output under `out/dataset-test/` without running the entire dataset generation pipeline.
3. **Run Targeted Validation**: Run automated Visual QA against your small test output:
   ```bash
   npm run validate:dataset -- --generator=X --view=Y --spec=test
   ```

### Step 8: Final Verification

Follow the review order in [docs/label-architecture.md](docs/label-architecture.md) when assigning
a failure. The operational gates then run from static contracts to the released artifact:

1. **Source and static truth:** run `npm run check` (or its focused type, generator/view-spec,
   label, and standards-spec checks).
2. **Composition truth:** run `npm run show:matching -- --spec=ccss` and confirm every matched
   generator/view pair is semantically valid. Use `--spec=test` for an isolated smoke path and
   `--raw` only for source-definition diagnosis.
3. **Rendered truth:** canonically regenerate and validate the affected real-standard scope.
   Generation proves render totality; VQA proves that the final artifact observably supports
   the complete matched conjunction. A passing `test` sample does not prove production labels:
   ```bash
   npm run generate:dataset -- --spec=ccss --generator=X --view=Y
   npm run validate:dataset -- --spec=ccss --generator=X --view=Y
   ```
4. **Dataset integrity:** run `npm run report:churn -- --spec=ccss` and
   `npm run report:splits -- --spec=ccss`. Determinism and split integrity are independent of
   whether individual images look correct.
5. **Complete gate:** before publishing, run full canonical generation and any required live
   validation, then require `audit:dataset`, `report:splits`, and `check` to pass. Build the
   union with `merge:dataset`, generate the release asset index using the candidate tag, and
   run `validate:asset-index` against `out/dataset`. Tag creation comes only after this exact
   target-to-released-sample proof passes.

## 6. Efficient Development & Debugging Iteration

The pipeline is built so that a code change only invalidates the samples it actually touches, and every sample can be reproduced in isolation. Use these workflows to keep iteration cheap:

### Debugging one target (new targets, matching issues, cache questions)
```bash
npm run test:target -- --target=K.CC.B.5-how-many~<hash> --spec=ccss --render
```
Shows the matched tuples, why near-miss pairs were rejected (`unsupported-label` / `rejected-label` with the offending label), the exact sample keys/seeds/data the pipeline would produce, their status in the VQA cache, and (with `--render` and `npm run dev` running) the rendered images in `out/target-test/`.

### Fixing a failed validation
Every failure in the timestamped report printed by `validate:dataset` includes its sample identity and a ready-to-run command:
```bash
npm run test:sample -- --sample="<sample_key>" --spec=<spec> --no-validate
```
Use this native replay to inspect the exact image and payload and compare its hash with the cache. It never updates the cache. After fixing the defect, canonically regenerate the affected real-standard generator/view scope and run scoped `validate:dataset`; that is the cache-producing verification path.

### Checking cache health after a regeneration
```bash
npm run report:churn -- --spec=test        # compares working tree vs HEAD
```
The report joins old and new cache entries on `sample_key` and flags identities whose image changed. Expected: churn only in the modules/views you touched. **Churn in unrelated samples is a determinism regression** — the classification (render change vs. attempt shift vs. seed scheme change) tells you where to look.

### Checking split integrity after a regeneration
```bash
npm run report:splits -- --spec=test
```
Churn tells you whether the *images* moved; this tells you whether the *split* is still sound. Cross-split leakage and within-split redundancy fail the run — they make validation metrics optimistic. Coverage warnings are informational: a view whose content space is too small to yield a second distinct problem legitimately has no validation sample. Also runs as step 6 of `npm run check` for every spec that has a generated dataset.

### Rules that keep invalidation minimal
- **Batch pixel-affecting changes** (view code and shared components) and regenerate once — every regeneration+validation cycle costs LLM calls for all changed images.
- **Checklist edits do not require rendering**: the VQA context hash covers the central checklist plus the selected leaf checklist. Editing the central checklist re-validates every sample; editing one leaf checklist re-validates only that view.
- **Authored VQA context is automatic; evaluator machinery is explicit**: checklist, ontology-definition, label, image, and system-prompt edits change graph keys. Machinery changes are not detected automatically. After response-schema, pass/fail, model, or validation-pipeline changes that can alter behavior, the engineer or agent rebuilds the graph explicitly and uses `--force` when the same images require fresh Gemini judgments.
- **All view entropy comes from `payload.seed`** (`IMPL-V6`) — breaking this makes renders order-dependent under the concurrent worker pool and poisons the cache non-deterministically.
- **No timing-dependent pixels** (`IMPL-V7`) — pages are reused across renders, so an animation state or an unloadable async resource makes pixels depend on render order.
- **Pin the Playwright/Chromium version**: cache keys are pixel hashes, so a browser upgrade re-rasterizes everything. Treat browser bumps as deliberate full-invalidation events.
- **Spec edits invalidate only what they change** (`TSPEC-5`) — target ids are content hashes of their label set, so editing one permutation regenerates exactly that permutation and leaves every other id, seed and cached sample untouched. (Val-split membership is also id-derived, so a changed permutation may switch splits.)

## 7. Autonomous Agentic Loops & Orchestration Workflows

The repository provides nine project skills under `.agents/skills/`. Each skill's `SKILL.md` is
the authoritative workflow; the reference library in [docs/](docs/README.md) remains authoritative
for authoring rules. Skills load those references and cite stable rule IDs instead of copying their
normative text.

| Command | Workflow |
| --- | --- |
| `/create-spec-from-standard {standardId\|gradeFile}` | Create a reviewed two-pass target plan, then implement the approved standard spec. |
| `/implement-spec [{specModule}]` | Resolve reviewed `implementationTodos` through contract-first module work and production verification. |
| `/update-ontology [{specModule}]` | Turn authored `ontologyTodos` into formal ontology-repository issues. |
| `/fix-spec [{specModule}] [--generator=X] [--view=Y]` | Triage and repair matching, generation, rendering, VQA, and determinism failures for existing matches. |
| `/release-dataset [releaseTag]` | Prepare, validate, publish, monitor, and verify a dataset release. |
| `/update-gen {moduleName}` | Update one generator and adopt every affected consuming view. |
| `/update-view {viewName}` | Update one view and adopt producing generators when its mathematical contract changes. |
| `/review-gen [{moduleName}] [--file=spec\|code]` | Audit generator specs or implementations against the relevant reference Audit sections. |
| `/review-view [{viewName}] [--file=spec\|checklist\|code]` | Audit view specs, checklists, or implementations against the relevant reference Audit sections. |

A skill directory name may differ from its command name; the `name:` field in `SKILL.md`
determines the command. Read the selected skill completely before acting. For cross-role label or
payload decisions, load [docs/label-architecture.md](docs/label-architecture.md); for exact rules,
load the references routed by [docs/README.md](docs/README.md).
