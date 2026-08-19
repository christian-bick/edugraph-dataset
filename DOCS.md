# EduGraph Content: Technical Documentation

This document provides a comprehensive technical overview of the EduGraph Content ML Dataset Generator. It is designed to guide developers and AI agents in understanding the system architecture, script orchestration, and the process for adding new educational content modules.

> **Authoring rules live in [`docs/`](docs/README.md)** — the reference library covering generator/view specifications and implementations, the visual checklist contract for views, and competency target specs. This document covers architecture, scripts and workflows, and links into that library rather than restating it.

## 1. Architecture Overview

### Label-Driven Generation
The core philosophy of this system is **Label-Driven Generation**. Pedagogical labels (derived from the EduGraph ontology, e.g., `Scope.IntegersWithZero`, `Area.Addition`) strictly dictate the mathematical properties and cognitive task represented by each artifact. The system does not generate a problem and *then* label it; it receives label constraints and produces a task whose mathematics satisfies them and whose visible or necessary textual clues make them reasonably defendable to a classifier.

### The Three Pillars
The architecture is divided into three distinct layers:
1.  **The Brain (`src/generators/`)**: Handles the abstract mathematical logic, permutation definition, and label constraint satisfaction. It has no knowledge of how a problem is visualized.
2.  **The Body (`src/visuals/`)**: HTML/CSS/TS renderers that run in the browser. It is organized into `views/` (individual exercise layouts), `components/` (shared UI elements), and `helpers/` (shared layout/math algorithms).
3.  **The Heart (`src/scripts/`)**: Node.js scripts orchestrating Playwright (headless browser). These scripts unite the Brain and the Body, generating problems, injecting them into the renderers, taking screenshots, and compiling the metadata.

## 2. Core Concepts & Types

### `AbstractProblem` & `ProblemStub`
Defined in `src/types/ml-engine.ts`, these types represent the JSON structure of a math problem.
*   **`ProblemStub`**: The raw output of a Generator (`{ id, data }`).
*   **`AbstractProblem`**: The fully realized object injected into the dataset, containing the `ProblemStub`, the `type`, and the resolved array of `tags` (labels).

### `RenderPayload` & `ViewTypeMap`
The data contract passed from the Playwright orchestrator into the browser's `window.renderView(payload)`. It contains:
*   `problem`: The `AbstractProblem`.
*   `viewId`: The string identifier of the view.
*   `labels`: Raw pedagogical tags (used by the HOC wrapper, not the pure view).
*   `isSolutionView`: A boolean instructing the renderer to display the problem with or without the solution filled in.
*   `seed`: The deterministic render seed derived from the sample identity. Views must draw **all** of their entropy from it — see `IMPL-V6` in [docs/implementation-view.md](docs/implementation-view.md). `problem.id` is present on the payload but is dead: no view reads it (see *Sample Identity & Determinism* below).

To ensure end-to-end type safety between problem generators (which run in Node.js) and the React views (which run in the browser headlessly), the system utilizes:
1. **`ViewTypeMap`** (defined in [problems.ts](src/types/problems.ts)): A central contract mapping visual view identifiers to their expected mathematical data structure. A shared view may accept a small structurally distinguishable union: `operations-vertical` and `operations-boxes` use `ArithmeticPairProblem | ArithmeticTripleProblem`, then narrow through the presence of `num3` and validate the corresponding fields.
2. **`ViewRenderPayload<TViewId>`** (defined in [ml-engine.ts](src/types/ml-engine.ts)): A utility type that automatically resolves to the correct type-safe `RenderPayload` for a specific view ID, eliminating the need for manual type assertions (`as ...`) within the view components.

**Environment Separation & Mapping:**
Because the Node orchestrator and generator configurations do not statically import the React view files (which are dynamically bundled by Vite and loaded headlessly inside Playwright via URLs), TypeScript cannot automatically inspect `window.renderView` in the browser code from the Node side. `ViewTypeMap` serves as a shared bridge, allowing the compiler to statically verify that generators specify view names compatible with the data structures the views expect to render.

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
*   **Every generated standard has a freshness manifest.** `manifest.json` records each matched `(generator, view)` pair's generation-input hash, aggregate output-content hash, sample counts, and renderer-environment identity. The input hash covers the relevant target labels, ontology dependency, generator/view sources, and shared generation/rendering sources. The content hash aggregates both per-sample `content_fingerprint` and `task_fingerprint` values: the former detects changed mathematical payloads, while the latter also detects changed resolved view configurations. The input hash detects further changes such as view code that can alter pixels without altering either identity. VQA `checklist.md` files are deliberately excluded: checklist changes invalidate the separate VQA validation-context cache but do not make rendered dataset content stale. Every public generation path uses the canonical renderer identity, including scoped development runs.
*   **The union dataset (`out/dataset/`) is derived**, built by `npm run merge:dataset` from every non-isolated standard in precedence order. It is the released artifact; treat it as a build output, never as a source of truth — the merge replaces it wholesale. Its public rows are compact projections containing only `file_name`, `tags`, and `solution`; operational identity remains in the source standard datasets.
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

The consequence: a code change only invalidates the samples whose identity inputs it actually touches. `problem.id` carries the sample key for reference but has **no functional role** — do not derive anything from it.

## 3. Script Reference

### Standards Explorer
`src/index.html` is the root Vite entry for the Common Core coverage explorer. The prior
`src/standards-explorer.html` entry remains as a compatible direct URL. The renderer/view
directory previously at the root is preserved at `src/modules.html`. The React application
lives under `src/standards-explorer/`, uses Zustand for
its navigation and selection state, and reads the `preview` coverage routes at runtime.
In a production build, those routes contain the deployed-main snapshot under
`public/coverage/preview/`. The internal `preview` channel denotes coverage for the exact
deployed `main` revision; it is not a user-selectable preview mode. The snapshot contains
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
materialized. Production hosts do not
render the switch and always resolve images through the release-pinned Hugging Face URL.

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
Preview from an exact main SHA, downloads Latest from the repository's explicitly marked
latest GitHub Release, builds the Vite application, and deploys it. The release stores the
three immutable coverage files plus `asset-index.json` as individual assets, so deployment needs no historical
checkout and the browser makes no cross-origin request. The workflow can also be started
independently with `workflow_dispatch`. It uses the same Workload Identity Federation
provider and Firebase service account as the sibling `edugraph-editor` project; no
persistent Firebase token is stored in GitHub.

GitHub Actions keeps validation and publication separate. Pushes to `main` run the
build, complete test suite, and repository checks through the local `quality-gates`
composite action. A version tag repeats those gates, generates CCSS in the pinned
canonical container, runs the strict read-only cache audit, merges the release dataset,
generates and validates the released asset index and release coverage snapshot, publishes the dataset to Hugging
Face, creates or updates the matching GitHub Release with that snapshot, explicitly marks
it Latest, and only then dispatches the explorer deployment workflow on `main`. A
successful main validation also calls that reusable workflow with the validated commit
SHA. Keeping deployment in a branch-context run satisfies the Google Workload Identity
provider's branch trust condition without allowing release-tag refs.
Release asset-index validation loads the normalized CCSS production targets and fails if
any exact target permutation has no associated released sample. This is the publication
gate behind the explorer's `Ready` to `Released` transition; successful module matching
alone is insufficient.
The release workflow's manual trigger accepts an existing `release_tag` and repeats the
same full gate and publication path; use it to retry or backfill a tag rather than
constructing Release assets by hand.
Live Gemini VQA is a local development operation and never runs in either workflow.
All host-side workflows use Node.js 24 LTS, matching the local `.nvmrc` and the
`package.json` engine constraint. Production deployments are serialized through the
`coverage-explorer-production` concurrency group. Canonical generation still executes inside its pinned
Playwright image, so changing the host runtime does not change the renderer identity.

### `src/scripts/map-standards.ts`
* **Execution**: `npm run generate:standards-explorer -- [--output-dir=<path>] [--channel=latest|preview] [--source-ref=<ref>] [--source-sha=<sha>]` (alias: `npm run map:standards`)
* **Function**: Regenerates the standards tree, dataset coverage metadata, and authored-package
  task backlog consumed by the standards explorer, plus the snapshot manifest. Implementation
  and ontology tasks are grouped by stable package id. It shares the coverage builder with
  the local refresh script so development and deployment semantics cannot drift. The default output is
  `public/coverage/preview/` for an explicit manual snapshot; release and deployment
  workflows pass explicit output directories and source identity. Normal local preview
  does not run this command.

### `src/scripts/refresh-local-explorer.ts`
* **Execution**: Invoked by the local explorer's **Refresh local data** action.
* **Function**: Builds working-tree coverage, replays the union asset selection, and copies
  the selected PNGs into a complete versioned snapshot under
  `temp/standards-explorer-preview/`. Vite serves only the newest completed snapshot; it
  neither watches nor streams from `out/`. Reloading the explorer therefore performs no
  dataset reads, and canonical generation can atomically replace a standard dataset while
  an older snapshot remains open in the browser. Refresh retains the newest two completed
  snapshots and best-effort removes older versions after open response streams have closed.

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
  requested-label containment, and on-disk image presence. With `--spec`, it additionally
  requires exact asset evidence for every normalized production target permutation. Defaults
  to the local public index and `out/dataset`; release passes its temporary index with
  `--spec=ccss` so a target cannot remain `Ready` after publication.

#### `src/scripts/generate-dataset.ts`
The container-internal pipeline orchestrator.
*   **Execution**: The canonical wrapper invokes `npm run generate:dataset:internal`; direct host execution is rejected. The public command is `npm run generate:dataset -- --spec=<spec_module> [--generator=<generator_name>] [--view=<view_id>] [--training-only] [--concurrency=<positive_integer>]`.
*   **Function**: Loads targets and catalogs via `src/lib/generation.ts`, computes the matched `(target, generator, view)` tuples, generates one question and one solution sample per tuple with structural seeds, and renders them headlessly through the Vite server owned by the same Docker container.
*   **Capture bounds**: Playwright screenshots the shared `#view` mount point. Its common stylesheet shrink-wraps ordinary content with `width: fit-content` and caps it at the canonical viewport with `max-width: 100vw`; only views whose outermost element explicitly requests viewport width retain a full-width canvas. See `IMPL-V10` in `docs/implementation-view.md`.
*   **Renderer preflight and failure collection**: Before opening an output transaction, the pipeline visits only the views matched by the selected scope, verifies a successful document response and the `window.renderView` hook, and rejects page errors or genuine local-resource failures. Preflight uses at most four workers; rendering uses a bounded worker pool (8 by default, configurable with `--concurrency`). A sample-level render or `ViewValidationError` is recorded while sibling samples and modules continue, then the run reports every failed sample, exits non-zero, and rolls back the staged transaction. Diagnostic error cards are never accepted as dataset artifacts.
*   **Splits**: Train samples are generated for every tuple; validation samples for the ~25% of tuples selected by `isValTuple`. Both use the same identity-based seeding with the split as a key component. Audit the result with `report:splits` — a tuple whose content space is too small to yield a draw disjoint from train produces no validation sample, which that report surfaces.
*   **Split dependency direction (invariant)**: **train generation never depends on validation generation; validation always depends on train.** Train is generated first into its own fingerprint index, and the val pass only reads that index. The asymmetry is required, not incidental: train is the primary artifact and must be reproducible on its own, while validation cannot be disjoint from train without being constrained by it. Verify with `npm run generate:dataset -- --spec=test` followed by `npm run generate:dataset -- --spec=test --training-only` — the train split must come out byte-identical. The practical consequence is that a generator change shifts train content, which can change which validation draws survive dedup; `report:churn` classifies that as an *attempt shift* and it is expected, not a determinism regression.
*   **Dedup**: Task fingerprints per (module, split, view), covering **both modes** — a question never repeats a solution's configured task or vice versa. Validation additionally rejects every mathematical content fingerprint already in train. A collision triggers a deterministic retry on the next attempt; the winning attempt is recorded. If every question attempt collides, the target is associated only with an existing physical sample carrying the same task fingerprint; a train content collision with a different task can exclude a validation draw but cannot represent it. A solution that exhausts its retries falls back to the question's task shown solved. The module scope keeps `--generator=X` reproducing exactly what a full run produces for that module, and costs nothing because no view is rendered by more than one generator.
*   **Metadata**: Each standard image row records its operational identity: `sample_key`, `spec`, `target_id`, optional additional `target_associations`, `generator`, `view`, `mode`, `instance`, `attempt`, `seed`, `content_fingerprint`, `task_fingerprint`, plus `tags`. The association list preserves exact competency provenance when several targets share one physical task. The generator's problem data and resolved view config are used to compute the fingerprints but are not duplicated into metadata. Generators no longer author a separate descriptive id; structural sample identity remains separate from content and task equivalence.
*   **`--training-only` Flag**: If specified, skips validation sample generation, rendering, and metadata writing.
*   **Output**: `out/dataset-<spec>/` — every spec owns its folder (see *Specs and the Union Dataset*). The released `out/dataset/` is produced by `merge-dataset.ts`, not by this script.
*   **Transactional output**: Generation writes to a sibling staging directory and atomically swaps it into place only after all selected modules render, root metadata is rebuilt, and `manifest.json` is updated. Any preflight, generation, or render failure removes the staging directory and preserves the previous live dataset.
*   **Scoped replacement**: An unfiltered run replaces the whole standard dataset. `--generator=X` replaces that generator's rows and images in both splits. Adding `--view=Y`, or using a view-only scope, replaces only matching rows/images and preserves every sibling view and unrelated generator copied into the transaction. Scoped manifest updates follow the same pair-level boundary.

#### `src/scripts/generate-dataset-container.ts`
The only public dataset-generation entry point.
*   **Execution**: `npm run generate:dataset -- --spec=<spec_module> [--generator=<generator_name>] [--view=<view_id>] [--training-only] [--concurrency=<positive_integer>]`.
*   **Function**: Runs the internal generator and its own Vite server in the immutable Playwright Linux/AMD64 image declared by `src/lib/render-environment.ts`. The renderer binds only inside the container on dedicated port `4173` with `strictPort`; no host server or host port participates. The repository is mounted and copied into the container filesystem before startup so Windows bind-mount latency does not slow module discovery; only transactional `out/` writes flow back to the host. The npm download cache is mounted, while Linux `node_modules` lives in a separate Docker volume keyed by the package lock and renderer digest. A warm run therefore skips `npm ci`; changing either input creates a fresh dependency volume automatically.
*   **Workflow boundary**: Full, scoped, development, VQA, CI, and release generation all use this wrapper. Host Vite remains available only for interactive view replay and the standards explorer; it is never a dataset-generation prerequisite.
*   **Assets and settings**: Inter and Roboto Mono are pinned local package assets. Browser locale, timezone, viewport, scale, media preferences, Playwright version, platform, and image digest are explicit. No host font or remote font request participates in canonical pixels.

### `src/scripts/merge-dataset.ts`
*   **Execution**: `npm run merge:dataset`
*   **Function**: Builds the union dataset at `out/dataset/` from every non-isolated spec's folder, in `unionOrder` precedence (see *Specs and the Union Dataset*). Deduplicates exercises across standards per (split, view) by task fingerprint — keeping question and solution together, since they are independent draws of one exercise — and excludes from validation any mathematical content already merged into train. Target associations from duplicate exercises are attached to the retained operational row only when the task fingerprint matches. The released `metadata.jsonl` projects each retained internal row to `file_name`, `tags`, and `solution`, so this extra provenance does not widen the public training schema. Reports each standard's offered / merged / duplicate counts, which is the delta a newly added standard actually contributes. Requires every union spec to have been generated first; the union is replaced wholesale on each run.

### `src/scripts/generate-coverage-report.ts`
*   **Execution**: `npm run report:coverage -- --spec=<spec_module|union>`
*   **Function**: Scans all `metadata.jsonl` files in the selected dataset and outputs a markdown report (`out/dataset-<spec>/coverage-report.md`) detailing absolute frequencies of individual labels and the percentage breakdown of unique label combinations. Pass `--spec=union` for the released dataset's coverage — the deduplicated merge across all standards, which is usually the number that matters.

### `src/scripts/validate-dataset.ts`
*   **Execution**: live mode: `npm run validate:dataset -- --spec=<spec_module> [--generator=X] [--view=Y] [--force] [--concurrency=<positive_integer>] [--log-prompts] [--report-only] [--report=<path>]`; strict audit: `npm run audit:dataset -- --spec=<spec_module>`
*   **Dataset selection**: every script that reads a dataset takes `--spec=<module>` and nothing else, resolved by `resolveDatasetDir` in `src/lib/dataset-paths.ts` (`--spec=ccss` → `out/dataset-ccss/`). The reserved `--spec=union` addresses the merged `out/dataset/`, and is accepted only by `report:coverage` — validation and churn are per standard, and reject it with an explanation. `--spec` is required; there is no default.
*   **Function**: An automated Visual QA pipeline. Normal mode uses the Gemini API via `src/lib/vqa-evaluator.ts` to analyze canonical Q/A image pairs against exactly two visual contracts: the central view checklist and the selected leaf view's required checklist. Evaluator role and response mechanics are sent through the SDK's system instruction; the user content contains only the mode, ontology labels, a generic `## View-specific checklist` heading with the heading-free leaf criteria, and the global checklist under its own H2. Validation runs per standard — `--spec=test` targets the small `out/dataset-test/` slice for fast iteration. Normal mode rejects native renderer identities so a Windows or host-specific render cannot enter the committed cache.
*   **Freshness gate**: Before inspecting or spending API calls on VQA, validation recomputes the manifest entries for the selected scope and fails if entries are missing, inputs are stale, aggregate content/task fingerprint hashes differ, or sample counts drifted. Regenerate the reported generator/view scope first. A legacy dataset without `manifest.json` must be regenerated once.
*   **Splits**: **Both `train` and `validation` are validated.** Validation images ship in the released dataset and are subject to the same checklists, so exempting them would let unchecked images reach consumers. Images are located by reading the split back out of the `sample_key` (`SPLIT_DIRS` in `src/lib/generation.ts`) — `file_name` is relative to its split root and does not encode the split, so **the same tuple's train and validation images share a filename**; every human-facing path is qualified with its split. The report breaks results down per split.
*   **Caching**: Results are cached in `cache/vqa-validation/<dataset>/<module>.jsonl`, keyed by `sha256(image bytes : validation-context hash)`. The validation context combines the applicable checklist hash with the sorted ontology labels and their definitions, so changing an image, checklist, label claim, or definition re-validates exactly the affected samples. The evaluator system instruction, response schema, and model identifier are deliberately excluded from this hash; changing any of them requires a deliberate full live validation with `--force`. Each cache entry also records the component hashes and the sample's full identity (`sample_key`, `attempt`, `seed`, …) for debugging and churn analysis. Failures in every generated timestamped report include a ready-to-run `test:sample` command.
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
*   **Function**: Prints the matched `(generator, view)` pairs for the same normalized and deduplicated targets used by production generation. Every semantic match is reported; a cheap sample probe is shown as a separate success/failure status and never removes the tuple. Pass `--raw` to inspect every source target definition before overlap deduplication. The shared `matchTargets` predicate remains the authority in both modes.

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

### `src/scripts/validate-docs.ts`
*   **Execution**: `npm run check:docs`
*   **Function**: Validates the wiring of the reference library in [`docs/`](docs/README.md) using `src/lib/docs-validator.ts`. Errors on: a cited rule ID that no reference defines, a rule ID defined twice, a link or anchor that does not resolve, a reference to a missing `docs/` file, a `DOCS.md § n` citation for a section that no longer exists, and a reference file without an `## Audit` section (the review skills navigate to it by heading). Warns on: a rule missing from its own file's Audit section, a reference file not linked from the index, and machine-specific `file://` links. Scans `docs/`, `DOCS.md`, `AGENTS.md`, `README.md` and every `.agents/skills/*/SKILL.md`.

### `src/scripts/validate-generator-view-specs.ts`
*   **Execution**: `npm run check:generator-view-specs`
*   **Function**: An automated generator and view spec validation script. It checks companion `spec.ts` files across both generators and views, flagging (1) overlapping General Labels / parameter queries, and (2) duplicate parameterizations where a view re-specifies variables already computed by its matching generator. Output goes to the console; redirect it to `temp/` if you need to keep it.

### `src/scripts/validate-standards-spec.ts`
*   **Execution**: `npm run check:standards-spec -- --spec=<spec_module>`
*   **Function**: Validates competency target standard specs (e.g. `test`, `ccss`) using `normalizeAndValidateSpec` from `src/lib/spec-validator.ts`. All checks always run: target ID uniqueness (the sole gatekeeper — `loadTargets` itself is permissive), label set normalization, intra-target permutation uniqueness, and definition distinctness — no two target definitions may define an identical *set* of permutations, since such definitions are indistinguishable by the ontology. Definitions that merely *overlap* in some permutations are legitimate (related standards across grades); overlapping permutations are deduplicated to one representative target and reported as warnings, not errors. For `--spec=test`, validation additionally requires a matched target/view tuple that can produce a sample for every generator module.

### Type Checking (`npm run check:types`)
*   **Execution**: `npm run check:types` (or `npx tsc --noEmit`)
*   **Function**: Runs the TypeScript compiler in non-emitting mode (`tsc --noEmit`) to find and report type errors across all generators, renderers, scripts, schemas, and test suites.

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
- **Case B: No Matching Generator:** If the target matches no generator, you must create a new generator module under `src/generators/` (see Scaffolding & Implementation below).
- **Case C: No Matching View:** If the target matches no view, you must create a new view layout under `src/visuals/views/` (see Scaffolding & Implementation below).
- **Case D: Matches Exist but Lacks Capabilities:** If matching modules exist but do not support the target's specific labels, you must extend their `spec.ts` (supportedLabels/constraints) and logic to support them.

### Step 4: Scaffolding (If Needed)
Follow `IMPL-6` and `IMPL-7` in [docs/implementation-general.md](docs/implementation-general.md) — including the rule that a new leaf module is created only when it extends the supported ontological space, rather than to avoid touching an existing one.

### Step 5: Declaring Capabilities (`spec.ts`)
Create or update the `spec.ts` files for both your generator and visual view, per [docs/spec-generator.md](docs/spec-generator.md) and [docs/spec-view.md](docs/spec-view.md), with the shared rules in [docs/spec-general.md](docs/spec-general.md).

The decisions that most often go wrong are declaring the most specific label that is actually true (`SPEC-2`, `SPEC-3`), ensuring view-owned abilities are elicited by the rendered task (`SPEC-V5`), and expressing physical limits as rejection boundaries rather than competency filters (`SPEC-V3`, `SPEC-V4`).

### Step 6: Implementation
Implement `generator.ts` per [docs/implementation-generator.md](docs/implementation-generator.md) and `view.tsx` per [docs/implementation-view.md](docs/implementation-view.md).

The rule that breaks things silently is `IMPL-V6`: every randomized visual decision must derive from `payload.seed`. Any other entropy source invalidates the VQA cache without failing a check.

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
1. Run `npm run check` (or `npm run check:types`, `npm run check:generator-view-specs`, `npm run check:standards-spec`) to verify type safety, spec constraints, label usage, and target standard specs.
2. Run `npm run show:matching -- --spec=ccss` to confirm the real standard bindings; use `--spec=test` for the isolated smoke path and `--raw` only for source-definition diagnosis.
3. Canonically regenerate and validate the affected real-standard generator/view scope. A passing `test` sample does not prove the production task or labels:
   ```bash
   npm run generate:dataset -- --spec=ccss --generator=X --view=Y
   npm run validate:dataset -- --spec=ccss --generator=X --view=Y
   npm run report:churn -- --spec=ccss
   ```
4. Before publishing, run full canonical generation and live validation, `audit:dataset`, `report:splits`, `check`, and then `merge:dataset`.

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
- **Evaluator mechanics are explicit full-invalidation changes**: the evaluator system instruction, response schema, and model identifier are intentionally outside the context hash. After changing one, rerun full live validation with `--force` rather than expecting automatic cache misses.
- **All view entropy comes from `payload.seed`** (`IMPL-V6`) — breaking this makes renders order-dependent under the concurrent worker pool and poisons the cache non-deterministically.
- **No timing-dependent pixels** (`IMPL-V7`) — pages are reused across renders, so an animation state or an unloadable async resource makes pixels depend on render order.
- **Pin the Playwright/Chromium version**: cache keys are pixel hashes, so a browser upgrade re-rasterizes everything. Treat browser bumps as deliberate full-invalidation events.
- **Spec edits invalidate only what they change** (`TSPEC-5`) — target ids are content hashes of their label set, so editing one permutation regenerates exactly that permutation and leaves every other id, seed and cached sample untouched. (Val-split membership is also id-derived, so a changed permutation may switch splits.)

## 7. Autonomous Agentic Loops & Orchestration Workflows

To support automated end-to-end dataset development, the repository provides eight **skills** in `.agents/skills/`: four orchestrator loops, two module update skills, and two module review skills. All of them defer to the reference library in [`docs/`](docs/README.md) for authoring rules, citing rule IDs rather than restating them.

Note that a skill's directory name is not always its command name (e.g. `spec-from-standard/` provides `/create-spec-from-standard`); the command is the `name:` field in its `SKILL.md` frontmatter.

### Loop 1: Standard Spec Generation (`/create-spec-from-standard`)
- **Skill**: `.agents/skills/spec-from-standard/SKILL.md`
- **Command**: `/create-spec-from-standard {standardId|gradeFile}`
- **Pass 1 — review plan**: Reads and quotes the relevant standard leaves, captures `matching-before.json`, and writes a disposition, ownership, and design proposal to `temp/spec-plans/<module>/<gradeFile>/plan.md` using [`docs/target-spec-plan-template.md`](docs/target-spec-plan-template.md). It does not edit `src/spec/` and stops for explicit user approval.
- **Pass 2 — approved implementation**: Authors the target file, runs target validation, writes `matching-after.json`, `matching-diff.md`, and `target-distinctness.md`, then runs `npm run check -- --spec=<module>`. Implementation gaps reference stable authored definitions that state generator/view ownership and `reuse`/`expand`/`new` strategy.
- **Boundary**: The skill finishes by presenting the review artifacts and never triggers ontology or implementation follow-up loops automatically.

### Loop 2: Spec Implementation & Error-Free Generation (`/implement-spec`)
- **Skill**: `.agents/skills/implement-spec/SKILL.md`
- **Command**: `/implement-spec [{specModule}]`
- **Function**: Resolves `implementationTodos` step-by-step to achieve 100% error-free problem generation and rendering.
- **Stop boundary**: Proceeds autonomously through reversible implementation work and pauses only for ontology changes, genuine semantic ambiguity, invalidated authored strategies, production declaration changes, or work outside the current todo.
- **Contract-first phase**: Establishes and typechecks a new or materially changed shared problem type and `ViewTypeMap` entry before generator and view work diverge (`IMPL-8`).
- **Delegation & Module Reviews**: Delegates module-level implementation to `/update-gen {moduleName}` and `/update-view {viewName}`, and targeted audits to `/review-gen {moduleName}` and `/review-view {viewName}`.
- **Target Debugging**: Uses `npm run test:target -- --target=<id> --spec=<real-standard> --render` for the target being implemented. The isolated `test` spec remains available for deliberately authored prototypes and retained regressions; `--raw` exposes source definitions before production deduplication.
- **Canonical Scoped Regeneration**: Uses the isolated `test` spec for a small canonical smoke slice when it contains the relevant example, then verifies the promoted target against its real standard. Every dataset render runs through Docker.
- **Commit and continuation**: After each smooth todo, writes an implementation commit without VQA cache files, then a separate cache-only commit when validation changed records. It records both hashes, compacts context, and moves to the next reviewed todo without another prompt.
- **Completion Gate**: Promotes verified targets to `spec`, then runs a final full canonical regeneration, full live VQA validation, strict cache audit, churn and split reports, repository checks, and the union merge for non-isolated specs.

### Loop 3: Ontological Todo Resolution (`/update-ontology`)
- **Skill**: `.agents/skills/update-ontology/SKILL.md`
- **Command**: `/update-ontology [{specModule}]`
- **Function**: Groups `ontologyTodos` and creates formal GitHub issues in `christian-bick/edugraph-ontology`.
- **Upfront Prerequisite Checks**:
  1. **Sibling Repository**: Checks presence of `../edugraph-ontology`. If missing, prints clone instructions and aborts.
  2. **GitHub CLI Auth**: Checks `gh auth status`. If missing/unauthenticated, prints `gh auth login` instructions and aborts.
- **Issue Creation**: Formulates structured issue titles, standard contexts, and suggestions for new entities, definitions, and family placement, then submits them via `gh issue create`. It deliberately leaves all other relation design to ontology implementation analysis.

### Loop 4: Failure Resolution (`/fix-spec`)
- **Skill**: `.agents/skills/fix-spec/SKILL.md`
- **Command**: `/fix-spec [{specModule}] [--generator=X] [--view=Y]`
- **Function**: The debugging half of Loop 2, run standalone against a spec whose targets already match. Collects failures from all three sources — matching/generation (`show:matching`), Visual QA (the `Failure TODO List` in the latest timestamped validation report), and determinism (`report:churn`) — triages each to its owning file, and fixes via `/update-gen` and `/update-view`.
- **Boundary**: Creates no modules and resolves no `implementationTodos` — those hand off to `/implement-spec`. It must never silence a failure by weakening a declaration or target. An evidence-backed classification correction is different: when the rendered task contradicts the current ability claim, use `SPEC-2`, `SPEC-V5`, `TSPEC-6`, and `TSPEC-13`, explain the evidence, and obtain user confirmation before changing a view spec or production target.
- **Triage note**: A VQA failure is not proof of a code bug. Inspect the image, ontology definition, generated payload, view spec, and target together. Necessary mathematics belongs to the generator; omitted or muddled visual clues belong to the view; a false task-family ability claim belongs to the view spec or target; and a nonessential leaf criterion belongs to the checklist (`CHK-V6`).

### Module Update Skills
- **`/update-gen {moduleName}`** (`.agents/skills/update-generator/SKILL.md`): Updates one generator module to match its spec — reviews it, updates its tests, adopts consuming views on a payload contract change (`IMPL-G6`), and runs the targeted validation workflow of §6.
- **`/update-view {viewName}`** (`.agents/skills/update-view/SKILL.md`): The same for one view module, adopting producing generators when the view needs a payload field it does not have (`IMPL-V8`).

### Module Review Skills
- **`/review-gen {moduleName}`** (`.agents/skills/review-generator/SKILL.md`): Audits the generator's `spec.ts`, `generator.ts`, and tests against the Audit sections of the generator references.
- **`/review-view {viewName}`** (`.agents/skills/review-view/SKILL.md`): Audits all three view module files (`spec.ts`, `checklist.md`, `view.tsx`) against the Audit sections of the view references.

`/review-gen` accepts `--file=spec|code`; `/review-view` accepts `--file=spec|checklist|code`. Both resolve `{moduleName}` as a leaf module, a category (all leaves beneath it), or — when omitted — every module.
