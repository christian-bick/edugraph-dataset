# EduGraph Content: Technical Documentation

This document provides a comprehensive technical overview of the EduGraph Content ML Dataset Generator. It is designed to guide developers and AI agents in understanding the system architecture, script orchestration, and the process for adding new educational content modules.

> **Authoring rules live in [`docs/`](docs/README.md)** — the reference library covering `spec.ts`, `checklist.md`, and module implementation for generators and views, plus competency target specs. This document covers architecture, scripts and workflows, and links into that library rather than restating it.

## 1. Architecture Overview

### Label-Driven Generation
The core philosophy of this system is **Label-Driven Generation**. Pedagogical labels (derived from the EduGraph ontology, e.g., `Scope.IntegersWithZero`, `Area.Addition`) strictly dictate the mathematical properties of the generated problems. The system does not generate a problem and *then* label it; rather, it receives a set of constraints (labels) and acts as a constraint satisfier to generate a math problem that mathematically proves those labels.

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
1. **`ViewTypeMap`** (defined in [problems.ts](src/types/problems.ts)): A central contract mapping visual view identifiers (like `'operations-vertical'`) to their expected mathematical data structure (like `ArithmeticStandardProblem`).
2. **`ViewRenderPayload<TViewId>`** (defined in [ml-engine.ts](src/types/ml-engine.ts)): A utility type that automatically resolves to the correct type-safe `RenderPayload` for a specific view ID, eliminating the need for manual type assertions (`as ...`) within the view components.

**Environment Separation & Mapping:**
Because the Node orchestrator and generator configurations do not statically import the React view files (which are dynamically bundled by Vite and loaded headlessly inside Playwright via URLs), TypeScript cannot automatically inspect `window.renderView` in the browser code from the Node side. `ViewTypeMap` serves as a shared bridge, allowing the compiler to statically verify that generators specify view names compatible with the data structures the views expect to render.

### Specs and the Union Dataset

A **spec module** (`src/spec/<module>/`) is one education standard's competency targets — `ccss` today, further standards later. Standards overlap heavily, so each one added contributes an increasingly small delta.

*   **Each standard owns a dataset folder.** `npm run generate:dataset -- --spec=ccss` writes to `out/dataset-ccss/`, with its VQA cache in `cache/vqa-validation/dataset-ccss/`. Regenerating one standard never touches another's samples.
*   **The union dataset (`out/dataset/`) is derived**, built by `npm run merge:dataset` from every non-isolated standard in precedence order. It is the released artifact; treat it as a build output, never as a source of truth — the merge replaces it wholesale.
*   **The merge deduplicates identical content across standards.** The first standard in merge order keeps the exercise and later ones report it as duplicate overlap. Dedup is scoped per (split, view) by content fingerprint, with the validation split additionally excluding content already in train — the same rules generation applies within a single standard (where the scope is per module, since a view has only one generator), extended across them. Question and solution are independent draws of one exercise, so exercises are kept or dropped whole.
*   **Isolated specs never merge.** `test` declares `isolated = true` in `src/spec/test/_module.ts`; it exists to exercise generators and views in a fast, small slice. Files prefixed with `_` describe the module rather than contributing targets, so the target loaders skip them.
*   **Merge precedence** is ascending `unionOrder` (default 100), ties broken by name. Declare a higher `unionOrder` when adding a standard so established ones keep their samples and the newcomer contributes only its delta.

This works because sample identity is content-derived: `target.id` embeds the standard's own id prefix, so keys never collide across standards, and val-split membership is a pure function of `target.id`, so a target lands in the same split regardless of what else was generated.

**Known limitation — equivalent competencies are only collapsed within a spec module.** The shrinking delta comes from target-level deduplication before generation, not from the merge: `deduplicateTargetPermutations` (via `normalizeAndValidateSpec`) reduces identical label sets to one representative target, which `check:standards-spec` reports as cluster warnings. That does not span spec modules, and the merge cannot compensate — a second standard's equivalent targets carry different ids, hence different seeds and different content, so content-fingerprint dedup catches only coincidental collisions. When a second standard lands, extend target-level dedup across the union rather than deduplicating or validating afterwards.

### Sample Identity & Determinism
Every dataset sample has a **structural identity**: the tuple `(target.id, generatorId, viewId, split, mode, instanceIdx)`, canonicalized as a *sample key* (e.g. `test-writing~fe4336da#writing#numbers-write-standard#train#question#inst:0`). Everything entropy-related is a pure function of this identity, implemented in `src/lib/generation.ts`:

*   **Generation seed**: `computeSampleSeed(sampleKey, attempt)`. The `attempt` counter is a retry salt — when a generator returns `null` or produces duplicate content, the pipeline retries with the next attempt, which deterministically yields a different draw. The *winning* attempt is recorded in metadata and the VQA cache, so any sample can be replayed in isolation.
*   **Render seed**: passed to the browser as `payload.seed`. The `withConfig` wrapper calls `setSeed(payload.seed)` before resolving the view config, and views derive all visual randomness from it.
*   **Filenames**: `computeSampleFilename(identity)` — stable and unique by construction, so filenames never shift when unrelated samples change.
*   **Content fingerprint**: `computeContentFingerprint(problem.data)` — an order-independent hash used for dedup instead of generator-authored id strings.
*   **Val split membership**: `isValTuple(target.id, generatorId, viewId, ratio)` — a pure function of the matched tuple, so val membership survives unrelated reorderings. Allocation is per tuple, not per target: targets differ by an order of magnitude in how many tuples they match, so target-level allocation produced a split far below the requested ratio and left most views with no validation samples at all.

The consequence: a code change only invalidates the samples whose identity inputs it actually touches. `problem.id` carries the sample key for reference but has **no functional role** — do not derive anything from it.

## 3. Script Reference

#### `src/scripts/generate-dataset.ts`
The primary pipeline orchestrator.
*   **Execution**: `npm run generate:dataset -- --spec=<spec_module> [--generator=<generator_name>] [--view=<view_id>] [--training-only]`
*   **Function**: Loads targets and catalogs via `src/lib/generation.ts`, computes the matched `(target, generator, view)` tuples, generates one question and one solution sample per tuple with structural seeds, and renders them headlessly via Playwright (requires the vite dev server, `npm run dev`).
*   **Splits**: Train samples are generated for every tuple; validation samples for the ~25% of tuples selected by `isValTuple`. Both use the same identity-based seeding with the split as a key component. Audit the result with `report:splits` — a tuple whose content space is too small to yield a draw disjoint from train produces no validation sample, which that report surfaces.
*   **Split dependency direction (invariant)**: **train generation never depends on validation generation; validation always depends on train.** Train is generated first into its own fingerprint index, and the val pass only reads that index. The asymmetry is required, not incidental: train is the primary artifact and must be reproducible on its own, while validation cannot be disjoint from train without being constrained by it. Verify with `generate:dataset --spec=test` followed by `generate:dataset --spec=test --training-only` — the train split must come out byte-identical. The practical consequence is that a generator change shifts train content, which can change which validation draws survive dedup; `report:churn` classifies that as an *attempt shift* and it is expected, not a determinism regression.
*   **Dedup**: Content fingerprints per (module, split, view), covering **both modes** — every drawn content item is claimed for its view, so a question never repeats a solution's content or vice versa, and no val draw repeats content already in train. A collision triggers a deterministic retry on the next attempt; the winning attempt is recorded. A solution that exhausts its retries falls back to the question's content shown solved. The module scope keeps `--generator=X` reproducing exactly what a full run produces for that module, and costs nothing because no view is rendered by more than one generator.
*   **Metadata**: Each image row records its full identity: `sample_key`, `spec`, `target_id`, `generator`, `view`, `mode`, `instance`, `attempt`, `seed`, `content_fingerprint`, plus `tags` and `parameters` (the full problem data — generators no longer author a separate descriptive id; identity is entirely structural).
*   **`--training-only` Flag**: If specified, skips validation sample generation, rendering, and metadata writing.
*   **Output**: `out/dataset-<spec>/` — every spec owns its folder (see *Specs and the Union Dataset*). The released `out/dataset/` is produced by `merge-dataset.ts`, not by this script.
*   **Clearing Logic**: Scoped to the spec's own folder. If no module is specified, it wipes `out/dataset-<spec>/`. If a specific module is provided, it clears only `out/dataset-<spec>/train/<module>` and `.../validation/<module>`.

### `src/scripts/merge-dataset.ts`
*   **Execution**: `npm run merge:dataset`
*   **Function**: Builds the union dataset at `out/dataset/` from every non-isolated spec's folder, in `unionOrder` precedence (see *Specs and the Union Dataset*). Deduplicates exercises across standards per (split, view) by content fingerprint — keeping question and solution together, since they are independent draws of one exercise — and excludes from validation any content already merged into train. Reports each standard's offered / merged / duplicate counts, which is the delta a newly added standard actually contributes. Requires every union spec to have been generated first; the union is replaced wholesale on each run.

### `src/scripts/generate-coverage-report.ts`
*   **Execution**: `npm run report:coverage -- --spec=<spec_module|union>`
*   **Function**: Scans all `metadata.jsonl` files in the selected dataset and outputs a markdown report (`out/dataset-<spec>/coverage-report.md`) detailing absolute frequencies of individual labels and the percentage breakdown of unique label combinations. Pass `--spec=union` for the released dataset's coverage — the deduplicated merge across all standards, which is usually the number that matters.

### `src/scripts/validate-dataset.ts`
*   **Execution**: `npm run validate:dataset -- --spec=<spec_module> [--generator=X] [--view=Y] [--force]`
*   **Dataset selection**: every script that reads a dataset takes `--spec=<module>` and nothing else, resolved by `resolveDatasetDir` in `src/lib/dataset-paths.ts` (`--spec=ccss` → `out/dataset-ccss/`). The reserved `--spec=union` addresses the merged `out/dataset/`, and is accepted only by `report:coverage` — validation and churn are per standard, and reject it with an explanation. `--spec` is required; there is no default.
*   **Function**: An automated Visual QA pipeline. It uses the Gemini API via `src/lib/vqa-evaluator.ts` to analyze Q/A image pairs from the dataset against rules defined in cascading `checklist.md` files across generator and view module directories. Validation runs per standard — `--spec=test` targets the small `out/dataset-test/` slice for fast iteration.
*   **Splits**: **Both `train` and `validation` are validated.** Validation images ship in the released dataset and are subject to the same checklists, so exempting them would let unchecked images reach consumers. Images are located by reading the split back out of the `sample_key` (`SPLIT_DIRS` in `src/lib/generation.ts`) — `file_name` is relative to its split root and does not encode the split, so **the same tuple's train and validation images share a filename**; every human-facing path is qualified with its split. The report breaks results down per split.
*   **Caching**: Results are cached in `cache/vqa-validation/<dataset>/<module>.jsonl`, keyed by `sha256(image bytes : checklist hash)` — an image is only re-validated when its pixels or its applicable checklists change. Each cache entry also records the sample's full identity (`sample_key`, `attempt`, `seed`, …) for debugging and churn analysis. Failures in the generated `validation-report.md` include a ready-to-run `test:sample` command.
*   **Pruning**: Stale cache entries are auto-pruned, but **only when the run covers the whole dataset**. A run narrowed by `--generator`/`--view`, or one against a dataset generated with `--training-only`, skips pruning and says so: entries outside its scope are not stale, and discarding them would throw away paid-for evaluations.

### `src/scripts/report-cache-churn.ts`
*   **Execution**: `npm run report:churn -- --spec=<spec_module> [--ref=<git-ref>]`
*   **Function**: Compares the working-tree VQA cache against a git ref (default `HEAD`) by joining entries on their `sample_key`. Reports identities whose image hash changed, classified as *render/code change* (same seed and attempt), *attempt shift* (collision elsewhere or generator behavior change), or *seed scheme change* (should never happen). **Run this after every regeneration**: churn in samples your change should not have affected is a determinism regression.

### `src/scripts/report-splits.ts`
*   **Execution**: `npm run report:splits -- --spec=<spec_module|union>`
*   **Function**: Audits the train/validation split of a generated dataset, using `src/lib/split-report.ts`. Reports **cross-split leakage** (validation content already present in train for the same view), **within-split redundancy** (one view's content shown by two different exercises — a question and its own solution sharing content is the documented small-space fallback, not redundancy), the **realized val ratio** against the allocator's target, and **per-view / per-label validation coverage**. Leakage and redundancy exit non-zero: they make validation metrics optimistic rather than merely thin. Coverage gaps are warnings, since a view whose content space is too small to split legitimately yields no validation sample. Run it after every regeneration — nothing else asserts these properties, which is how 14% cross-split leakage and 21 uncovered views went unnoticed before it existed.

### `src/scripts/test-sample.ts`
*   **Execution**: `npm run test:sample -- --sample="<sample_key>" --spec=<spec_module> [--no-render] [--no-validate]`
*   **Function**: Replays one exact sample draw from its identity, renders it to `out/retest/` (requires `npm run dev`), compares the image hash against the committed VQA cache, and performs live Gemini VQA validation by default (when `GEMINI_API_KEY` is present), automatically updating the local VQA cache on pass. Pass `--no-validate` to skip live VQA API calls, or `--no-render` to skip image rendering.

### `src/scripts/test-target.ts`
*   **Execution**: `npm run test:target -- --target=<target.id_or_prefix> --spec=<spec_module> [--render] [--validate]`
*   **Function**: Inspects one competency target end to end: supports full or prefix target IDs (e.g. `--target=test-writing`), which `(generator, view)` tuples it matches (with reasons for rejected pairs), the exact samples the pipeline would produce (keys, seeds, attempts, fingerprints, data), how they relate to the committed VQA cache, and — with `--render` — the actual images in `out/target-test/`. Pass `--validate` to run live Gemini VQA validation on rendered samples.

### `src/scripts/show-matching-stats.ts`
*   **Execution**: `npm run show:matching -- --spec=<spec_module>` (or `npx vite-node src/scripts/show-matching-stats.ts --spec=<spec_module>`)
*   **Function**: Prints the matched `(generator, view)` pairs for every target of a spec, probes actual generation with production sample keys, surfaces generation failures and `rejectedLabels` boundaries, and summarizes per-generator coverage. Shares its matching logic with the pipeline via `src/lib/generation.ts`.

### `src/scripts/show-implementation-todos.ts`
*   **Execution**: `npm run show:imp-todos -- [--spec=<spec_module>]`
*   **Function**: Inspects `implementationTodos` across target spec files. Groups missing capabilities by standard definition prefix and details missing generator or view functionality.

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
*   **Function**: An automated generator and view spec validation script. It checks companion `spec.ts` files across both generators and views, flagging (1) overlapping General Labels / parameter queries, and (2) duplicate parameterizations where a view re-specifies variables already computed by its matching generator. Detailed logs are outputted to `temp/check_output.txt`.

### `src/scripts/validate-standards-spec.ts`
*   **Execution**: `npm run check:standards-spec -- --spec=<spec_module>`
*   **Function**: Validates competency target standard specs (e.g. `test`, `ccss`) using `normalizeAndValidateSpec` from `src/lib/spec-validator.ts`. All checks always run: target ID uniqueness (the sole gatekeeper — `loadTargets` itself is permissive), label set normalization, intra-target permutation uniqueness, and definition distinctness — no two target definitions may define an identical *set* of permutations, since such definitions are indistinguishable by the ontology. Definitions that merely *overlap* in some permutations are legitimate (related standards across grades); overlapping permutations are deduplicated to one representative target and reported as warnings, not errors.

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
stable ID — `SPEC-3`, `CHK-V4`, `IMPL-G2` — so skills and reviews cite one rule rather than
a section number.

| Artifact                    | Shared rules                                                | Generator                                                       | View                                                  |
|-----------------------------|-------------------------------------------------------------|-----------------------------------------------------------------|-------------------------------------------------------|
| `spec.ts`                   | [spec-general.md](docs/spec-general.md)                     | [spec-generator.md](docs/spec-generator.md)                     | [spec-view.md](docs/spec-view.md)                     |
| `checklist.md`              | [checklist-general.md](docs/checklist-general.md)           | [checklist-generator.md](docs/checklist-generator.md)           | [checklist-view.md](docs/checklist-view.md)           |
| `generator.ts` / `view.tsx` | [implementation-general.md](docs/implementation-general.md) | [implementation-generator.md](docs/implementation-generator.md) | [implementation-view.md](docs/implementation-view.md) |

Competency target specs under `src/spec/` follow [target-spec.md](docs/target-spec.md).

## 5. How to Enrich the Dataset (Step-by-Step Guide)

To add a new mathematical concept or visual style to the dataset, follow this step-by-step workflow:

### Step 1: Define the Pedagogy
Declare the target specifications in the appropriate grade level file in `src/spec/ccss/` (like `kindergarten.ts` or `grade-01.ts`), building permutations with the `DatasetPermutationBuilder`. See `src/spec/ccss/kindergarten.ts` for worked examples.

The export contract, the content-hash id semantics, how to categorize gaps into `implementationTodos` / `ontologyTodos`, and the rule against stretching labels to force a match are all specified in [docs/target-spec.md](docs/target-spec.md).

### Step 2: Analyze Matchings
Run `npx vite-node src/scripts/show-matching-stats.ts --spec=ccss` to see if the new targets map to any existing generator or views.

### Step 3: Decide Next Steps
- **Case A: Both Match (100% Match):** If the new targets already map to an existing generator and a compatible view, **nothing else needs to be done**! The dataset pipeline will automatically generate problems and render images for these targets.
- **Case B: No Matching Generator:** If the target matches no generator, you must create a new generator module under `src/generators/` (see Scaffolding & Implementation below).
- **Case C: No Matching View:** If the target matches no view, you must create a new view layout under `src/visuals/views/` (see Scaffolding & Implementation below).
- **Case D: Matches Exist but Lacks Capabilities:** If matching modules exist but do not support the target's specific labels, you must extend their `spec.ts` (supportedLabels/constraints) and logic to support them.

### Step 4: Scaffolding (If Needed)
Follow `IMPL-6` and `IMPL-7` in [docs/implementation-general.md](docs/implementation-general.md) — including the rule that a new leaf module is created only when it extends the supported ontological space, rather than to avoid touching an existing one.

### Step 5: Declaring Capabilities (`spec.ts`)
Create or update the `spec.ts` files for both your generator and visual view, per [docs/spec-generator.md](docs/spec-generator.md) and [docs/spec-view.md](docs/spec-view.md), with the shared rules in [docs/spec-general.md](docs/spec-general.md).

The two decisions that most often go wrong: declaring the most specific label that is *actually true* of your output (`SPEC-2`, `SPEC-3`), and expressing a view's physical limits as rejection boundaries rather than as absent capabilities (`SPEC-V3`, `SPEC-V4`).

### Step 6: Implementation
Implement `generator.ts` per [docs/implementation-generator.md](docs/implementation-generator.md) and `view.tsx` per [docs/implementation-view.md](docs/implementation-view.md).

The rule that breaks things silently is `IMPL-V6`: every randomized visual decision must derive from `payload.seed`. Any other entropy source invalidates the VQA cache without failing a check.

### Step 7: Tests (`generator.test.ts`)
Write unit tests per `IMPL-G5` in [docs/implementation-generator.md](docs/implementation-generator.md), then run `npm run test` to verify.

### Step 7b: Targeted Testing via Test Specs
To visually verify and test both your generator and view modules without overwriting the main dataset, you should use the `test` specs module:
1. **Extend Test Specs**: Add minimal test permutations for your module to the `test` specs directory (`src/spec/test/`). The `test` module follows the same contract as `src/spec/ccss/` — see [docs/target-spec.md](docs/target-spec.md) (`TSPEC-1`, `TSPEC-4`).
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
2. Run `npx vite-node src/scripts/show-matching-stats.ts --spec=ccss` (or `--spec=test`) to confirm that the ontology dynamically binds your targets to your generator and views.
3. Run `npm run generate:dataset -- --spec=ccss --generator=[moduleName]` to test local dataset generation.

## 6. Efficient Development & Debugging Iteration

The pipeline is built so that a code change only invalidates the samples it actually touches, and every sample can be reproduced in isolation. Use these workflows to keep iteration cheap:

### Debugging one target (new targets, matching issues, cache questions)
```bash
npm run test:target -- --target=K.CC.B.5-how-many~<hash> --spec=ccss --render
```
Shows the matched tuples, why near-miss pairs were rejected (`unsupported-label` / `rejected-label` with the offending label), the exact sample keys/seeds/data the pipeline would produce, their status in the VQA cache, and (with `--render` and `npm run dev` running) the rendered images in `out/target-test/`.

### Fixing a failed validation
Every failure in `validation-report.md` includes its sample identity and a ready-to-run command:
```bash
npm run test:sample -- --sample="<sample_key>" --spec=<spec>
```
After changing the generator or view, rerun it: `test:sample` re-renders the image and performs live Gemini VQA validation by default (updating the cache automatically on pass). If you only want an offline pixel/SHA256 check, pass `--no-validate`.

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
- **Batch pixel-affecting changes** (view code, shared components, checklists) and regenerate once — every regeneration+validation cycle costs LLM calls for all changed images.
- **Checklist edits cascade**: the checklist hash covers root + category + leaf `checklist.md` files, so editing a category checklist re-validates the whole category (images are unaffected, but all their cache keys change). Batch shared-checklist edits.
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
- **Function**: Translates educational standard leaf nodes (`public/coverage/ccss-tree.json`) into `DatasetPermutationBuilder` target specs in `src/spec/<module>/<gradeFile>.ts`, categorized across the export contract in [docs/target-spec.md](docs/target-spec.md) (`TSPEC-1`, `TSPEC-7`).
- **Validation**: Runs `npm run check:standards-spec -- --spec=<module>` and `npm run check`. Finishes by presenting matching statistics to the user (allowing manual trigger of follow-up loops).

### Loop 2: Spec Implementation & Error-Free Generation (`/implement-spec`)
- **Skill**: `.agents/skills/implement-spec/SKILL.md`
- **Command**: `/implement-spec [{specModule}]`
- **Function**: Resolves `implementationTodos` step-by-step to achieve 100% error-free problem generation and rendering.
- **Delegation & Module Reviews**: Delegates module-level implementation to `/update-gen {moduleName}` and `/update-view {viewName}`, and targeted audits to `/review-gen {moduleName}` and `/review-view {viewName}`.
- **Isolated Debugging**: Uses `npm run test:target -- --target=<id> --spec=test --render` and `npm run test:sample -- --sample="<sampleKey>" --spec=test` to isolate and fix failing samples.
- **Fast Scoped Regeneration**: Uses `npm run generate:dataset -- --spec=test --generator=<gen> --view=<view> [--training-only]` during iteration.
- **Completion Gate**: Promotes verified targets to `spec`, then runs a final full regeneration (`npm run generate:dataset -- --spec=<spec>`), full VQA validation (`npm run validate:dataset`), VQA cache churn check (`npm run report:churn`), and full checks (`npm run check`). Note that the last two select a dataset *folder*, not a spec — see the dataset folder rule in §3.

### Loop 3: Ontological Todo Resolution (`/update-ontology`)
- **Skill**: `.agents/skills/update-ontology/SKILL.md`
- **Command**: `/update-ontology [{specModule}]`
- **Function**: Groups `ontologyTodos` and creates formal GitHub issues in `christian-bick/edugraph-ontology`.
- **Upfront Prerequisite Checks**:
  1. **Sibling Repository**: Checks presence of `../edugraph-ontology`. If missing, prints clone instructions and aborts.
  2. **GitHub CLI Auth**: Checks `gh auth status`. If missing/unauthenticated, prints `gh auth login` instructions and aborts.
- **Issue Creation**: Formulates structured issue titles, standard contexts, proposed Enum additions, `partOf` taxonomic relations, and TypeScript diffs, submitting them via `gh issue create`.

### Loop 4: Failure Resolution (`/fix-spec`)
- **Skill**: `.agents/skills/fix-spec/SKILL.md`
- **Command**: `/fix-spec [{specModule}] [--generator=X] [--view=Y]`
- **Function**: The debugging half of Loop 2, run standalone against a spec whose targets already match. Collects failures from all three sources — matching/generation (`show:matching`), Visual QA (the `Failure TODO List` in `validation-report.md`), and determinism (`report:churn`) — triages each to its owning file, and fixes via `/update-gen` and `/update-view`.
- **Boundary**: Creates no modules and resolves no `implementationTodos` — those hand off to `/implement-spec`. It must never silence a failure by weakening a `spec.ts` declaration or a competency target (`TSPEC-6`, `SPEC-V3`).
- **Triage note**: A VQA failure is not proof of a code bug. An unscoped prompt-text rule in a leaf checklist (`CHK-V4`) fails views that correctly hide the prompt in Solution Mode; the checklist is verified before the view is changed.

### Module Update Skills
- **`/update-gen {moduleName}`** (`.agents/skills/update-generator/SKILL.md`): Updates one generator module to match its spec — reviews it, updates its tests, adopts consuming views on a payload contract change (`IMPL-G6`), and runs the targeted validation workflow of §6.
- **`/update-view {viewName}`** (`.agents/skills/update-view/SKILL.md`): The same for one view module, adopting producing generators when the view needs a payload field it does not have (`IMPL-V8`).

### Module Review Skills
- **`/review-gen {moduleName}`** (`.agents/skills/review-generator/SKILL.md`): Audits all three generator module files (`spec.ts`, `checklist.md`, `generator.ts`) against the Audit sections of the generator references.
- **`/review-view {viewName}`** (`.agents/skills/review-view/SKILL.md`): Audits all three view module files (`spec.ts`, `checklist.md`, `view.tsx`) against the Audit sections of the view references.

Both accept an optional `--file=spec|checklist|code` filter, and both resolve `{moduleName}` as a leaf module, a category (all leaves beneath it), or — when omitted — every module.

